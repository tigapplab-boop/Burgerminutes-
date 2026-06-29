# Burger Minute — Caisse & Pointage

Application web full-stack de gestion quotidienne d'un fast-food
(**Burger Minute**, Tigzirt, Algérie). Conçue pour être utilisée sur
tablette à la caisse et sur téléphone par le gérant — les données sont
partagées en temps réel via le serveur central.

- **Backend** : Node.js + Express, données stockées dans un fichier JSON
  sur disque (`data/data.json`) — **aucune base de données externe**.
- **Authentification** : session cookie (httpOnly, 30 jours), identifiants
  admin tirés de variables d'environnement.
- **Frontend** : HTML/CSS/JS vanilla, mobile-first, palette fast-food
  (charbon / crème / moutarde / tomate), gros boutons tactiles, lisible
  en plein soleil.
- **Déploiement** : Docker, prévu pour **Coolify** (auto-hébergé sur VPS)
  avec HTTPS automatique via Traefik.

---

## 1. Structure du projet

```
burger-minute/
├── server.js              # Serveur Express : routes API, calculs métier, persistance JSON
├── package.json           # Dépendances (express, express-session)
├── public/
│   ├── index.html         # Écran de connexion + app à 4 onglets
│   ├── css/style.css      # Styles mobile-first, palette fast-food
│   └── js/app.js          # Logique frontend vanilla
├── data/
│   ├── .gitkeep           # Garde le dossier dans git (le fichier data.json ne doit JAMAIS être commité)
│   └── data.json          # Créé automatiquement au premier lancement (ignoré par git et Docker)
├── Dockerfile             # Image Node 20 alpine
├── .dockerignore          # Exclut node_modules et data/*.json du build Docker
├── .gitignore             # Exclut node_modules, .env et data/*.json de git
├── .env.example           # Modèle de variables d'environnement
└── README.md              # Ce fichier
```

---

## 2. Lancer en local (pour tester avant déploiement)

### 2.1 Pré-requis
- Node.js 18 ou plus (testé avec Node 20).

### 2.2 Installation et lancement

```bash
cd burger-minute
npm install

# Variables d'environnement (obligatoires pour l'auth) — déjà créées
# pour vous dans ce projet avec ADMIN_USER=BURGERMINUTE et le mot de
# passe convenu (fichier .env, jamais commité sur Git).

# Démarrage
npm start
# Puis ouvrez http://localhost:8090 dans le navigateur.
```

Au premier démarrage, le fichier `data/data.json` est créé avec des
valeurs par défaut (5 employés, fond de caisse 6000 DA, charges 16000 DA).
Vous pourrez tout modifier dans l'onglet Réglages.

---

## 3. Déploiement sur Coolify (pas-à-pas)

Le destinataire final est un architecte autodidacte en dev — pas un
expert DevOps. Voici toutes les étapes.

### 3.1 Pré-requis côté Coolify
- Un VPS avec **Coolify** installé et fonctionnel (interface web accessible).
- Un nom de domaine (ou sous-domaine) qui pointe vers l'IP du VPS via un
  enregistrement DNS de type **A**.
- Coolify doit avoir **Traefik** activé (c'est le cas par défaut) — il
  gère automatiquement le HTTPS via Let's Encrypt.

### 3.2 Étape 1 — Pousser le code sur GitHub

1. Créez un repo vide sur GitHub, par exemple `burger-minute-caisse`.
   Réglez-le en **privé** si vous ne voulez pas que le code soit public.
2. Sur votre ordinateur, dans le dossier `burger-minute/` :

```bash
git init
git add .
git commit -m "Caisse & Pointage — Burger Minute"
git branch -M main
git remote add origin git@github.com:VOTRE-USER/burger-minute-caisse.git
git push -u origin main
```

> **Important** : le fichier `.env` et `data/data.json` sont exclus par
> `.gitignore` — ils ne partiront jamais sur GitHub. Les secrets restent
> locaux.

### 3.3 Étape 2 — Créer la ressource dans Coolify

1. Dans l'interface Coolify, cliquez sur **+ New Project** (si vous n'en
   avez pas encore) puis entrez dans ce projet.
2. Cliquez sur **+ New Resource** → choisissez **GitHub Repository**
   (ou *Public repository* si le repo est privé, connectez votre compte
   GitHub à Coolify une fois pour toutes via *Source*).
3. Sélectionnez votre repo `burger-minute-caisse`.
4. Coolify détecte automatiquement le `Dockerfile` à la racine et
   propose un build **Dockerfile-based**. Gardez ce mode.
5. **Avant de lancer le build**, configurez les éléments suivants dans
   l'onglet **Configuration** de la ressource :

#### a) Variables d'environnement

Dans la section **Environment Variables**, ajoutez exactement ces 4 variables (valeurs définies pour Burger Minute) :

| Nom | Valeur |
|---|---|
| `ADMIN_USER` | `BURGERMINUTE` |
| `ADMIN_PASSWORD` | `epau2012` |
| `SESSION_SECRET` | `e9f377c172d1c6c8f79976c7aed530f32cf664ee29267ecb5a7bee60dd59a671261ffbf95269e7b4b5a6b859be6d47d5` |
| `PORT` | `8090` |

> Le port `8090` est utilisé (au lieu de `3000`) car le `3000` est déjà
> occupé par un autre service sur ce VPS. C'est le port **interne** du
> conteneur — Coolify/Traefik le proxifient automatiquement, donc ça ne
> change rien pour l'utilisateur final qui accède via le nom de domaine.

Pour changer `ADMIN_PASSWORD` ou régénérer `SESSION_SECRET` plus tard :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Cochez ces variables comme **non-exposées** (elles restent côté serveur,
elles ne partent jamais dans le navigateur).

#### b) Volume persistant (CRITIQUE — sinon données perdues à chaque redéploiement)

Dans la section **Storages** (ou *Persistent Storage* / *Volumes*) :

- Cliquez sur **+ Add Storage** → type **Volume**.
- **Mount path** : `/app/data`  ← chemnin exact, important.
- **Name** : `burger-minute-data` (par exemple).
- Cochez **persistent**.

Sans cette étape, le fichier `data/data.json` serait recréé vide à
chaque redéploiement — toutes vos journées et réglages seraient perdus.

#### c) Port exposé
Coolify détecte le port à exposer depuis le `Dockerfile` (`EXPOSE 8090`).
Vérifiez dans **Ports** que le port interne `8090` est bien exposé
(généralement sur le port 0 pour que Coolify en attribue un aléatoire
en interne — Traefik gère le routage externe). Le port `3000` n'est
volontairement pas utilisé puisqu'il est déjà pris par un autre service
sur ce VPS.

#### d) Déploiement automatique à chaque `git push` (important)

Pour que Coolify redéploie automatiquement sans action manuelle :

1. Dans la ressource Coolify, onglet **Source** (ou **Webhooks** selon
   la version), connectez votre compte GitHub si ce n'est pas déjà fait.
2. Activez l'option **Auto Deploy** (parfois appelée *Automatic
   deployment on push*). Coolify crée alors un webhook côté GitHub.
3. Vérifiez côté GitHub (`Settings → Webhooks` du repo) qu'un webhook
   pointant vers votre instance Coolify est bien présent et marqué actif
   (coche verte).
4. Le `Dockerfile` contient désormais un **HEALTHCHECK** intégré
   (`/api/health`). Coolify s'en sert pour vérifier automatiquement que
   le nouveau conteneur répond correctement avant de basculer le trafic
   vers lui — donc chaque déploiement se fait sans coupure et sans que
   vous ayez à vérifier manuellement que "ça marche".

À partir de maintenant : vous modifiez le code → `git push` → Coolify
build, healthcheck, puis bascule automatiquement. Rien d'autre à faire.

### 3.4 Étape 3 — Domaine et HTTPS

1. Dans la section **Domains** de la ressource Coolify, ajoutez votre
   domaine, par exemple `caisse.burgerminute.dz`.
2. Vérifiez que l'enregistrement DNS de ce sous-domaine pointe bien vers
   l'IP de votre VPS Coolify.
3. Coolify (via Traefik) demande automatiquement un certificat Let's
   Encrypt au premier déploiement — **le HTTPS est activé tout seul**,
   vous n'avez rien à faire.
4. Cliquez sur **Deploy**. Le build dure ~1 minute la première fois
   (téléchargement de l'image Node + `npm install`).

### 3.5 Étape 4 — Première connexion

1. Ouvrez `https://caisse.votredomaine` dans le navigateur.
2. Saisissez `ADMIN_USER` / `ADMIN_PASSWORD` définis en étape 3.3.a.
3. Vous êtes dans l'application. Configurez vos employés dans l'onglet
   **Réglages**, puis commencez à pointer la journée courante dans
   l'onglet **Jour**.

### 3.6 Mises à jour ultérieures

Pour livrer une nouvelle version :
1. Modifiez le code en local.
2. `git push` sur GitHub.
3. Dans Coolify, sur la ressource → bouton **Redeploy** (Coolify peut
   aussi être configuré pour redéployer automatiquement à chaque push —
   option *Auto-deploy* dans les paramètres du webhook GitHub).

Les données (`/app/data/data.json`) survivent aux redéploiements grâce
au volume persistant.

---

## 4. Règles de calcul métier (récapitulatif)

Toutes ces formules sont implémentées dans `server.js` et commentées en
français. Elles sont validées avec le patron et **ne doivent pas être
modifiées sans accord**.

### Recette reconstituée du jour
```
recette = caisseFin − fond + dépenses + Σ(retraits employés)
```

### Bénéfice du jour
```
benefice = recette − dépenses − charges
```
Les `charges` (fixes journalières) **incluent déjà les salaires** — on
ne soustrait pas les salaires une deuxième fois.

### Salaire dû d'un employé pour un jour
- `montant` saisi ce jour-là **si `present = true`**, sinon 0.
- Pré-rempli avec le `rate` par défaut au moment où on coche "présent",
  mais reste modifiable.

### Solde d'un employé sur une période
```
solde = Σ(salaires dus sur la période) − Σ(retraits sur la période)
```
- **positif** → le patron doit de l'argent à l'employé ("à lui verser")
- **négatif** → l'employé a retiré plus qu'il n'a gagné ("il doit")

**Ne jamais utiliser `Math.abs`** — le signe est une information
importante.

### Dette totale envers un fournisseur (solde courant)
```
dette = Σ(amount) de toutes ses transactions
```
- `amount > 0` = nouvel achat à crédit (dette augmente)
- `amount < 0` = remboursement (dette diminue)

### Bénéfice net global sur une période
```
benefice_net = Σ(bénéfice de chaque jour)
             − (dette totale actuelle, tous fournisseurs)
             − Σ(soldes employés sur la période, avec leur signe)
```
Un solde employé négatif (il doit de l'argent) **augmente** le bénéfice
net, car c'est de l'argent à récupérer.

---

## 5. Sauvegarde des données

Le fichier `data/data.json` contient **toutes** les données du commerce.
Pour le sauvegarder régulièrement :

```bash
# Sur le VPS, en SSH :
docker cp $(docker ps -q --filter ancestor=<image-name>):/app/data/data.json ./backup-$(date +%F).json
```

Ou plus simple : connectez-vous en SSH au VPS, allez dans le dossier du
volume Docker (Coolify l'indique dans *Storages*), et copiez
`data.json` ailleurs.

**Conseil** : faites une sauvegarde hebdomadaire, et avant chaque
mise à jour de l'application.

---

## 6. Sécurité

- Le mot de passe admin n'est **jamais** dans le code — il vit dans les
  variables d'environnement Coolify.
- Le cookie de session est `httpOnly` (le JS du navigateur ne peut pas
  le lire) et dure 30 jours.
- Le HTTPS est géré automatiquement par Traefik + Let's Encrypt.
- **Rotations recommandées** : changez `ADMIN_PASSWORD` et
  `SESSION_SECRET` tous les 6 mois (dans Coolify → redéploiement
  automatique). Notez que changer `SESSION_SECRET` déconnecte toutes
  les sessions en cours.

---

## 7. Dépannage

| Problème | Cause probable | Solution |
|---|---|---|
| `ADMIN_PASSWORD non configuré` | Variable d'env manquante dans Coolify | Ajoutez-la dans *Environment Variables* et redéployez |
| Données perdues après redéploiement | Volume persistant non configuré | Ajoutez un volume sur `/app/data` (étape 3.3.b) — mais trop tard pour les anciennes données |
| `502 Bad Gateway` | Build pas encore fini ou port mal exposé | Patientez 1 min, vérifiez l'onglet *Logs* de la ressource Coolify |
| HTTPS non actif | DNS pas encore propagé | Attendez quelques minutes, vérifiez avec `dig caisse.votredomaine` |
| Page blanche après connexion | Erreur JS dans le navigateur | Ouvrez la console (F12), regardez l'erreur |

---

## 8. Licence

Code privé, propriété du gérant de Burger Minute (Tigzirt). Tous droits
réservés.
