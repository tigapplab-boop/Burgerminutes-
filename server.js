/**
 * server.js — Caisse & Pointage — Burger Minute (Tigzirt, Algérie)
 * --------------------------------------------------------------------------
 * Serveur Express monolithique :
 *   - sert les fichiers statiques du frontend (public/) ;
 *   - gère l'authentification par session cookie (express-session) ;
 *   - expose une API REST JSON (toutes les routes sous /api/*) ;
 *   - persiste l'intégralité des données dans un fichier JSON sur disque
 *     (data/data.json), lu et écrit de façon synchrone pour rester simple
 *     et éviter toute base de données externe.
 *
 * Toutes les parties "métier" (calculs financiers) sont commentées en
 * français pour qu'un non-développeur puisse comprendre et adapter.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// --------------------------------------------------------------------------
// 0. Chargement optionnel d'un fichier .env
// --------------------------------------------------------------------------
// Coolify injecte les variables d'environnement directement dans le
// conteneur — ce bloc ne sert donc à rien (et ne fait rien de mal) dans
// ce cas. Il est utile pour un lancement en local (`npm start`) ou sur
// un VPS sans orchestrateur qui gérerait les variables lui-même.
// Volontairement écrit à la main pour ne pas ajouter de dépendance
// supplémentaire (pas de package `dotenv`).
(function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
})();

const express = require('express');
const session = require('express-session');

// --------------------------------------------------------------------------
// 1. Configuration générale
// --------------------------------------------------------------------------

const PORT = process.env.PORT || 8090;

// Emplacement du fichier de données. Le dossier `data/` est monté comme
// volume persistant dans Coolify/Docker pour ne pas perdre les données à
// chaque redéploiement.
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// Données initiales créées à la première exécution si data.json n'existe pas.
// Les identifiants d'employés et valeurs reflètent la structure demandée.
const DEFAULT_DATA = {
  settings: { fond: 6000, charges: 16000 },
  workers: [
    { id: 1, name: 'Wissem', rate: 1400 },
    { id: 2, name: 'Travailleur 2', rate: 2000 },
    { id: 3, name: 'Travailleur 3', rate: 2000 },
    { id: 4, name: 'Travailleur 4', rate: 2000 },
    { id: 5, name: 'Ami bénévole', rate: 1000 }
  ],
  entries: {},
  suppliers: [],
  supplierTx: []
};

// --------------------------------------------------------------------------
// 2. Persistance JSON (lecture/écriture synchrones)
// --------------------------------------------------------------------------

/** S'assure que le dossier data/ existe, puis crée data.json si manquant. */
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
    console.log('[data] Fichier data.json créé avec les valeurs par défaut.');
  }
}

/** Lit tout le fichier data.json et renvoie l'objet JS correspondant. */
function readData() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('[data] Fichier data.json corrompu — sauvegarde et reset :', e.message);
    const backup = DATA_FILE + '.bak.' + Date.now();
    fs.renameSync(DATA_FILE, backup);
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

/** Écrit l'objet passé en paramètre dans data.json (écriture atomique). */
function writeData(data) {
  // Écriture dans un fichier temporaire puis renommage : évite d'avoir un
  // fichier tronqué en cas de crash en plein milieu de l'écriture.
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

// --------------------------------------------------------------------------
// 3. Calculs métier (règles financières validées avec le patron)
// --------------------------------------------------------------------------

/**
 * Calcule la recette reconstituée d'une journée.
 *
 *   recette = caisseFin − fond + dépenses + Σ(retraits employés du jour)
 *
 * Logique : ce qu'il y a en caisse le soir (caisseFin) moins ce qu'on a
 * mis le matin (fond), plus ce qu'on a payé cash (dépenses — il faut les
 * rembourser au tiroir), plus ce que les employés ont retiré dans la
 * journée (retraits — sortis du tiroir, donc à ajouter pour retrouver le
 * vrai chiffre d'affaires).
 */
function computeRecette(entry, settings) {
  const caisseFin = Number(entry.caisseFin) || 0;
  const fond = Number(settings.fond) || 0;
  const depenses = Number(entry.depenses) || 0;
  const retraits = sumRetraits(entry);
  return caisseFin - fond + depenses + retraits;
}

/**
 * Total des retraits de tous les employés pour une journée donnée.
 */
function sumRetraits(entry) {
  if (!entry || !entry.workers) return 0;
  return Object.values(entry.workers).reduce(
    (acc, w) => acc + (Number(w.retrait) || 0),
    0
  );
}

/**
 * Bénéfice du jour.
 *
 *   benefice = recette − dépenses − charges
 *
 * `charges` = charges fixes journalières (loyer, électricité, etc.) qui
 * INCLUENT déjà les salaires. On ne les soustrait donc pas une deuxième
 * fois via les salaires des employés.
 */
function computeBenefice(entry, settings) {
  const recette = computeRecette(entry, settings);
  const depenses = Number(entry.depenses) || 0;
  const charges = Number(settings.charges) || 0;
  return recette - depenses - charges;
}

/**
 * Salaire dû d'un employé pour une journée donnée.
 *
 *   = montant saisi ce jour-là si présent, sinon 0
 *
 * (Le `montant` est pré-rempli avec le `rate` par défaut au moment où on
 * coche "présent", mais reste modifiable manuellement.)
 */
function computeSalaireDu(workerDay) {
  if (!workerDay || !workerDay.present) return 0;
  return Number(workerDay.montant) || 0;
}

/**
 * Solde d'un employé sur une période (peut être NÉGATIF).
 *
 *   solde = Σ(salaires dus sur la période) − Σ(retraits sur la période)
 *
 * Ne JAMAIS utiliser Math.abs — le signe est important :
 *   - solde > 0 : le patron doit de l'argent à l'employé ("à lui verser")
 *   - solde < 0 : l'employé a retiré plus qu'il n'a gagné ("il doit")
 */
function computeSoldeEmploye(entries, workerId, start, end) {
  let salairesDus = 0;
  let retraits = 0;
  for (const [date, entry] of Object.entries(entries)) {
    if (date < start || date > end) continue;
    const wd = entry.workers && entry.workers[String(workerId)];
    if (!wd) continue;
    salairesDus += computeSalaireDu(wd);
    retraits += Number(wd.retrait) || 0;
  }
  return salairesDus - retraits;
}

/**
 * Dette totale envers un fournisseur (solde courant, non lié à une période).
 *
 *   dette = Σ(amount) de toutes ses transactions
 *
 * amount > 0 : nouvel achat à crédit (la dette augmente)
 * amount < 0 : remboursement (la dette diminue)
 */
function computeDetteFournisseur(supplierTx, supplierId) {
  return supplierTx
    .filter((t) => t.supplierId === supplierId)
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
}

/**
 * Bénéfice net global sur une période (vue "Bilan global").
 *
 *   benefice_net = Σ(bénéfice de chaque jour de la période)
 *                 − (dette totale actuelle, tous fournisseurs confondus)
 *                 − Σ(soldes employés sur la période, avec leur signe)
 *
 * Si un employé a un solde négatif (il doit de l'argent), le terme
 * "− Σ(soldes)" devient "− (somme négative)" = + |somme|, ce qui augmente
 * le bénéfice net (argent à récupérer). C'est pourquoi on garde les signes.
 */
function computeBilanGlobal(entries, settings, supplierTx, workers, start, end) {
  // 1. Bénéfice cumulé sur la période
  let beneficeCumule = 0;
  for (const [date, entry] of Object.entries(entries)) {
    if (date < start || date > end) continue;
    beneficeCumule += computeBenefice(entry, settings);
  }

  // 2. Dette totale tous fournisseurs confondus (solde courant, pas période)
  const detteTotal = supplierTx.reduce(
    (acc, t) => acc + (Number(t.amount) || 0),
    0
  );

  // 3. Somme des soldes employés sur la période (avec signe)
  let sommeSoldes = 0;
  for (const w of workers) {
    sommeSoldes += computeSoldeEmploye(entries, w.id, start, end);
  }

  const beneficeNet = beneficeCumule - detteTotal - sommeSoldes;

  return { beneficeCumule, detteTotal, sommeSoldes, beneficeNet };
}

// --------------------------------------------------------------------------
// 4. Application Express
// --------------------------------------------------------------------------

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Session cookie — secret en variable d'environnement, cookie httpOnly,
// durée 30 jours. En production (Coolify derrière Traefik en HTTPS), on
// truste le proxy pour récupérer le bon schéma.
app.use(
  session({
    name: 'bm.sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
      sameSite: 'lax',
      secure: false // Coolify/Traefik terminent le TLS en amont ; on reste en false pour que le cookie passe en HTTP interne
    }
  })
);

// Fichiers statiques (frontend vanilla).
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint de santé — utilisé par le HEALTHCHECK Docker et par Coolify
// pour savoir automatiquement si le nouveau conteneur est prêt avant de
// basculer le trafic (déploiement automatique sans coupure).
// Volontairement placé AVANT le middleware d'authentification : il ne
// doit jamais exiger de session.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// --------------------------------------------------------------------------
// 5. Middleware d'authentification
// --------------------------------------------------------------------------

/** Toutes les routes /api/* (sauf /api/login, /api/me et /api/health) nécessitent une session. */
function requireAuth(req, res, next) {
  if (req.session && req.session.authed) return next();
  return res.status(401).json({ error: 'Non authentifié' });
}

// On protège toutes les /api/* par défaut, puis on ouvre explicitement
// /api/login, /api/me et /api/health.
app.use('/api', (req, res, next) => {
  const open = ['/api/login', '/api/me', '/api/health'];
  if (open.includes(req.path) || req.path === '/login' || req.path === '/me' || req.path === '/health') {
    return next();
  }
  return requireAuth(req, res, next);
});

// --------------------------------------------------------------------------
// 6. Routes d'authentification
// --------------------------------------------------------------------------

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || '';

  if (!adminPass) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré côté serveur.' });
  }

  // Comparaison simple — le mot de passe n'est pas en clair côté client,
  // le HTTPS (Coolify/Traefik) protège le transport.
  if (username === adminUser && password === adminPass) {
    req.session.authed = true;
    req.session.user = username;
    return res.json({ ok: true, user: username });
  }
  return res.status(401).json({ error: 'Identifiants incorrects' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('bm.sid');
    res.json({ ok: true });
  });
});

app.get('/api/me', (req, res) => {
  res.json({ authed: !!(req.session && req.session.authed), user: req.session && req.session.user });
});

// --------------------------------------------------------------------------
// 7. Routes — Réglages
// --------------------------------------------------------------------------

app.get('/api/settings', (req, res) => {
  const data = readData();
  res.json(data.settings);
});

app.put('/api/settings', (req, res) => {
  const { fond, charges } = req.body || {};
  if (typeof fond !== 'number' || typeof charges !== 'number') {
    return res.status(400).json({ error: 'fond et charges doivent être des nombres' });
  }
  const data = readData();
  data.settings = { fond, charges };
  writeData(data);
  res.json(data.settings);
});

// --------------------------------------------------------------------------
// 8. Routes — Employés (workers)
// --------------------------------------------------------------------------

app.get('/api/workers', (req, res) => {
  res.json(readData().workers);
});

app.post('/api/workers', (req, res) => {
  const { name, rate } = req.body || {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name requis' });
  }
  const data = readData();
  const nextId = data.workers.reduce((m, w) => Math.max(m, w.id), 0) + 1;
  const w = { id: nextId, name: name.trim(), rate: Number(rate) || 0 };
  data.workers.push(w);
  writeData(data);
  res.json(w);
});

app.put('/api/workers/:id', (req, res) => {
  const id = Number(req.params.id);
  const data = readData();
  const w = data.workers.find((x) => x.id === id);
  if (!w) return res.status(404).json({ error: 'Employé introuvable' });
  const { name, rate } = req.body || {};
  if (typeof name === 'string') w.name = name.trim();
  if (typeof rate === 'number') w.rate = rate;
  writeData(data);
  res.json(w);
});

app.delete('/api/workers/:id', (req, res) => {
  const id = Number(req.params.id);
  const data = readData();
  data.workers = data.workers.filter((w) => w.id !== id);
  // On nettoie aussi les entrées de pointage de cet employé dans toutes les journées.
  for (const date of Object.keys(data.entries)) {
    if (data.entries[date].workers && data.entries[date].workers[String(id)]) {
      delete data.entries[date].workers[String(id)];
    }
  }
  writeData(data);
  res.json({ ok: true });
});

// --------------------------------------------------------------------------
// 9. Routes — Entrées journalières (entries)
// --------------------------------------------------------------------------

app.get('/api/entries/:date', (req, res) => {
  const date = req.params.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Format date attendu : YYYY-MM-DD' });
  }
  const data = readData();
  const entry = data.entries[date] || null;
  if (!entry) return res.json(null);
  // On renvoie l'entrée "enrichie" avec recette et bénéfice calculés.
  res.json({
    ...entry,
    _recette: computeRecette(entry, data.settings),
    _benefice: computeBenefice(entry, data.settings)
  });
});

app.put('/api/entries/:date', (req, res) => {
  const date = req.params.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Format date attendu : YYYY-MM-DD' });
  }
  const { caisseFin, depenses, workers } = req.body || {};
  const data = readData();

  // On construit proprement l'entrée à partir du payload reçu.
  const cleanWorkers = {};
  if (workers && typeof workers === 'object') {
    for (const [wid, wd] of Object.entries(workers)) {
      cleanWorkers[String(wid)] = {
        present: !!wd.present,
        montant: Number(wd.montant) || 0,
        retrait: Number(wd.retrait) || 0
      };
    }
  }

  data.entries[date] = {
    caisseFin: Number(caisseFin) || 0,
    depenses: Number(depenses) || 0,
    workers: cleanWorkers
  };
  writeData(data);

  const entry = data.entries[date];
  res.json({
    ...entry,
    _recette: computeRecette(entry, data.settings),
    _benefice: computeBenefice(entry, data.settings)
  });
});

// Variante query : GET /api/entries?start=&end= → { date: entry, ... }
app.get('/api/entries', (req, res) => {
  const { start, end } = req.query;
  const data = readData();
  const out = {};
  const dates = Object.keys(data.entries).sort();
  for (const date of dates) {
    if (start && date < start) continue;
    if (end && date > end) continue;
    const entry = data.entries[date];
    out[date] = {
      ...entry,
      _recette: computeRecette(entry, data.settings),
      _benefice: computeBenefice(entry, data.settings)
    };
  }
  res.json(out);
});

// --------------------------------------------------------------------------
// 10. Routes — Finances (synthèses calculées)
// --------------------------------------------------------------------------

/**
 * GET /api/finance/workers?start=&end=
 * Renvoie un tableau par employé : jours travaillés, salaire dû, retraits, solde.
 */
app.get('/api/finance/workers', (req, res) => {
  const { start, end } = req.query;
  const data = readData();
  const out = data.workers.map((w) => {
    let joursTravailles = 0;
    let salaireDu = 0;
    let retraits = 0;
    for (const [date, entry] of Object.entries(data.entries)) {
      if (start && date < start) continue;
      if (end && date > end) continue;
      const wd = entry.workers && entry.workers[String(w.id)];
      if (!wd) continue;
      if (wd.present) {
        joursTravailles++;
        salaireDu += computeSalaireDu(wd);
      }
      retraits += Number(wd.retrait) || 0;
    }
    return {
      id: w.id,
      name: w.name,
      rate: w.rate,
      joursTravailles,
      salaireDu,
      retraits,
      solde: salaireDu - retraits
    };
  });
  res.json(out);
});

/**
 * GET /api/finance/bilan?start=&end=
 * Renvoie le bilan global sur la période.
 */
app.get('/api/finance/bilan', (req, res) => {
  const { start, end } = req.query;
  const data = readData();
  const today = new Date().toISOString().slice(0, 10);
  const s = start || '0000-01-01';
  const e = end || today;
  const bilan = computeBilanGlobal(data.entries, data.settings, data.supplierTx, data.workers, s, e);
  res.json(bilan);
});

// --------------------------------------------------------------------------
// 11. Routes — Fournisseurs
// --------------------------------------------------------------------------

app.get('/api/suppliers', (req, res) => {
  const data = readData();
  // On renvoie chaque fournisseur avec sa dette courante calculée.
  const out = data.suppliers.map((s) => ({
    ...s,
    dette: computeDetteFournisseur(data.supplierTx, s.id)
  }));
  res.json(out);
});

app.post('/api/suppliers', (req, res) => {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name requis' });
  }
  const data = readData();
  const nextId = data.suppliers.reduce((m, s) => Math.max(m, s.id), 0) + 1;
  const s = { id: nextId, name: name.trim() };
  data.suppliers.push(s);
  writeData(data);
  res.json({ ...s, dette: 0 });
});

app.delete('/api/suppliers/:id', (req, res) => {
  const id = Number(req.params.id);
  const data = readData();
  data.suppliers = data.suppliers.filter((s) => s.id !== id);
  // On supprime aussi toutes ses transactions.
  data.supplierTx = data.supplierTx.filter((t) => t.supplierId !== id);
  writeData(data);
  res.json({ ok: true });
});

// --------------------------------------------------------------------------
// 12. Routes — Transactions fournisseurs
// --------------------------------------------------------------------------

app.get('/api/supplier-tx', (req, res) => {
  const data = readData();
  // On enrichit chaque transaction avec le nom du fournisseur.
  const out = data.supplierTx.map((t) => {
    const sup = data.suppliers.find((s) => s.id === t.supplierId);
    return { ...t, supplierName: sup ? sup.name : '(supprimé)' };
  });
  // Du plus récent au plus ancien.
  out.sort((a, b) => (a.date < b.date ? 1 : -1));
  res.json(out);
});

app.post('/api/supplier-tx', (req, res) => {
  const { supplierId, date, amount, note } = req.body || {};
  if (!supplierId || !date) {
    return res.status(400).json({ error: 'supplierId et date requis' });
  }
  const data = readData();
  if (!data.suppliers.find((s) => s.id === Number(supplierId))) {
    return res.status(400).json({ error: 'Fournisseur introuvable' });
  }
  const nextId = data.supplierTx.reduce((m, t) => Math.max(m, t.id), 0) + 1;
  const t = {
    id: nextId,
    supplierId: Number(supplierId),
    date,
    amount: Number(amount) || 0,
    note: typeof note === 'string' ? note : ''
  };
  data.supplierTx.push(t);
  writeData(data);
  res.json(t);
});

app.delete('/api/supplier-tx/:id', (req, res) => {
  const id = Number(req.params.id);
  const data = readData();
  data.supplierTx = data.supplierTx.filter((t) => t.id !== id);
  writeData(data);
  res.json({ ok: true });
});

// --------------------------------------------------------------------------
// 13. Historique (synthèse des journées enregistrées)
// --------------------------------------------------------------------------

app.get('/api/history', (req, res) => {
  const data = readData();
  const out = Object.keys(data.entries)
    .sort()
    .reverse()
    .map((date) => {
      const entry = data.entries[date];
      return {
        date,
        caisseFin: entry.caisseFin,
        depenses: entry.depenses,
        recette: computeRecette(entry, data.settings),
        benefice: computeBenefice(entry, data.settings),
        retraits: sumRetraits(entry)
      };
    });
  res.json(out);
});

// --------------------------------------------------------------------------
// 14. Démarrage
// --------------------------------------------------------------------------

ensureDataFile();

app.listen(PORT, () => {
  console.log(`Burger Minute — Caisse & Pointage lancé sur le port ${PORT}`);
});
