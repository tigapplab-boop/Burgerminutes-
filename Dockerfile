/* =========================================================================
   Caisse & Pointage — Burger Minute
   Feuille de style — mobile-first, palette fast-food chaleureuse.
   Charbon / crème / moutarde / tomate. Gros boutons tactiles, lisible
   en plein soleil sur une tablette de caisse.
   ========================================================================= */

:root {
  --charbon: #1f1d1b;
  --charbon-soft: #2b2825;
  --creme: #fff8e7;
  --creme-card: #ffffff;
  --moutarde: #e8a317;
  --moutarde-dark: #c98a0e;
  --tomate: #d64545;
  --tomate-dark: #b53737;
  --vert: #2e8b57;
  --vert-dark: #236b41;
  --gris: #6b6660;
  --gris-clair: #e8e3d8;
  --gris-bordure: #d9d3c4;
  --shadow: 0 2px 8px rgba(31, 29, 27, 0.08);
  --shadow-lg: 0 6px 24px rgba(31, 29, 27, 0.18);
  --radius: 14px;
  --radius-sm: 8px;
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  font-family: var(--font);
  color: var(--charbon);
  background: var(--creme);
  -webkit-tap-highlight-color: transparent;
}

body {
  font-size: 17px;
  line-height: 1.45;
  overscroll-behavior-y: none;
}

button, input, select { font: inherit; color: inherit; }

/* =========================================================================
   Écran de connexion
   ========================================================================= */
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(160deg, #1f1d1b 0%, #3a342c 100%);
}
.login-card {
  width: 100%;
  max-width: 380px;
  background: var(--creme);
  border-radius: 20px;
  padding: 32px 24px;
  box-shadow: var(--shadow-lg);
}
.logo { text-align: center; margin-bottom: 24px; }
.logo-burger { font-size: 56px; line-height: 1; }
.logo h1 {
  font-size: 26px;
  color: var(--charbon);
  margin-top: 8px;
  letter-spacing: -0.5px;
}
.logo-sub { color: var(--gris); font-size: 14px; margin-top: 4px; }

form label {
  display: block;
  margin-bottom: 14px;
}
form label span {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 14px;
  color: var(--charbon-soft);
}
input[type="text"], input[type="password"], input[type="number"], input[type="date"] {
  width: 100%;
  padding: 14px 12px;
  border: 2px solid var(--gris-bordure);
  border-radius: var(--radius-sm);
  background: #fff;
  font-size: 17px;
  transition: border-color 0.15s;
}
input:focus { outline: none; border-color: var(--moutarde); }

/* =========================================================================
   Boutons
   ========================================================================= */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--gris-clair);
  color: var(--charbon);
  font-weight: 600;
  font-size: 17px;
  cursor: pointer;
  transition: background 0.15s, transform 0.05s;
  min-height: 52px;
}
.btn:active { transform: scale(0.98); }
.btn-block { width: 100%; }
.btn-primary { background: var(--moutarde); color: var(--charbon); }
.btn-primary:hover { background: var(--moutarde-dark); }
.btn-secondary { background: var(--gris-clair); color: var(--charbon); }
.btn-danger { background: var(--tomate); color: #fff; }
.btn-danger:hover { background: var(--tomate-dark); }
.btn-tiny {
  padding: 8px 12px;
  font-size: 14px;
  min-height: 36px;
  background: var(--moutarde);
  color: var(--charbon);
}
.btn-ghost {
  background: transparent;
  color: var(--gris);
  text-decoration: underline;
  padding: 6px;
  min-height: 0;
  font-size: 14px;
}

/* =========================================================================
   Application — layout
   ========================================================================= */
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 720px;
  margin: 0 auto;
  background: var(--creme);
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--charbon);
  color: var(--creme);
  position: sticky;
  top: 0;
  z-index: 10;
}
.topbar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 18px;
}
.topbar-burger { font-size: 22px; }
.topbar-user {
  font-size: 13px;
  opacity: 0.75;
}

.main {
  flex: 1;
  padding: 16px;
  padding-bottom: 100px; /* place pour la nav basse */
}
.tab-title {
  font-size: 22px;
  margin-bottom: 12px;
  color: var(--charbon);
}

/* =========================================================================
   Cartes
   ========================================================================= */
.card {
  background: var(--creme-card);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
}
.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--charbon);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--moutarde);
}
.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--moutarde);
}
.card-title-row .card-title { margin: 0; border: none; padding: 0; }
.sub-title {
  font-size: 14px;
  font-weight: 700;
  margin: 16px 0 8px;
  color: var(--charbon-soft);
}

/* =========================================================================
   Champs
   ========================================================================= */
.field {
  display: block;
  margin-bottom: 12px;
}
.field span {
  display: block;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
  color: var(--charbon-soft);
}
.field-half { flex: 1; }
.period-row {
  display: flex;
  gap: 12px;
}
.input-date {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--gris-bordure);
  border-radius: var(--radius-sm);
  background: #fff;
  font-size: 17px;
  margin-bottom: 16px;
}

/* =========================================================================
   Pointage employés (onglet Jour)
   ========================================================================= */
.worker-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid var(--gris-bordure);
  align-items: center;
}
.worker-row:last-child { border-bottom: none; }
.worker-row input[type="checkbox"] {
  width: 28px;
  height: 28px;
  accent-color: var(--moutarde);
  cursor: pointer;
}
.worker-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.worker-name {
  font-weight: 700;
  font-size: 16px;
}
.worker-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.worker-fields label {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: var(--gris);
  gap: 4px;
}
.worker-fields input {
  padding: 10px;
  font-size: 16px;
  border: 2px solid var(--gris-bordure);
  border-radius: var(--radius-sm);
  background: #fff;
}
.worker-fields input:disabled {
  background: var(--gris-clair);
  color: var(--gris);
}

/* =========================================================================
   Résumé (onglet Jour)
   ========================================================================= */
.card-resume { background: var(--charbon); color: var(--creme); }
.card-resume .card-title {
  color: var(--moutarde);
  border-bottom-color: var(--moutarde);
}
.resume-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.resume-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.resume-benefice { grid-column: span 2; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); }
.resume-label { font-size: 12px; opacity: 0.7; }
.resume-value { font-size: 22px; font-weight: 700; }
.resume-benefice .resume-value { font-size: 30px; color: var(--moutarde); }
.resume-value.neg { color: var(--tomate); }

/* =========================================================================
   Historique
   ========================================================================= */
.history-list { display: flex; flex-direction: column; gap: 10px; }
.history-item {
  background: var(--creme-card);
  border-radius: var(--radius);
  padding: 14px 16px;
  box-shadow: var(--shadow);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-left: 4px solid var(--moutarde);
}
.history-item:active { transform: scale(0.99); }
.history-date { font-weight: 700; font-size: 16px; }
.history-meta { font-size: 13px; color: var(--gris); margin-top: 4px; }
.history-amount { font-size: 18px; font-weight: 700; }
.history-amount.neg { color: var(--tomate); }
.history-amount.pos { color: var(--vert); }

/* =========================================================================
   Finances — tableaux
   ========================================================================= */
.table-wrap { overflow-x: auto; }
table.fin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.fin-table th, .fin-table td {
  padding: 10px 8px;
  text-align: right;
  border-bottom: 1px solid var(--gris-bordure);
}
.fin-table th {
  background: var(--gris-clair);
  font-weight: 700;
  text-align: right;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.fin-table td:first-child, .fin-table th:first-child {
  text-align: left;
}
.fin-table tfoot td {
  font-weight: 700;
  background: var(--gris-clair);
}
.fin-table .pos { color: var(--vert); font-weight: 700; }
.fin-table .neg { color: var(--tomate); font-weight: 700; }

/* Liste fournisseurs */
.supplier-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--gris-bordure);
}
.supplier-row:last-child { border-bottom: none; }
.supplier-name { font-weight: 700; }
.supplier-dette { font-weight: 700; }
.supplier-dette.pos { color: var(--tomate); }
.supplier-actions { display: flex; gap: 8px; }

/* Liste transactions */
.tx-list { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.tx-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--gris-clair);
  border-radius: var(--radius-sm);
}
.tx-left { display: flex; flex-direction: column; }
.tx-supplier { font-weight: 700; font-size: 14px; }
.tx-meta { font-size: 12px; color: var(--gris); }
.tx-note { font-size: 12px; color: var(--gris); font-style: italic; margin-top: 2px; }
.tx-amount { font-weight: 700; }
.tx-amount.pos { color: var(--tomate); } /* achat à crédit = dette qui augmente = rouge */
.tx-amount.neg { color: var(--vert); } /* remboursement = vert */

/* Bilan global */
.card-bilan { background: var(--charbon); color: var(--creme); }
.card-bilan .card-title { color: var(--moutarde); border-bottom-color: var(--moutarde); }
.bilan-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.bilan-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bilan-net { grid-column: span 2; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2); }
.bilan-label { font-size: 12px; opacity: 0.75; }
.bilan-value { font-size: 20px; font-weight: 700; }
.bilan-net .bilan-value { font-size: 32px; color: var(--moutarde); }
.bilan-value.neg { color: var(--tomate); }

/* =========================================================================
   Réglages — liste employés
   ========================================================================= */
.wk-row {
  display: grid;
  grid-template-columns: 1fr 120px auto;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--gris-bordure);
  align-items: center;
}
.wk-row:last-child { border-bottom: none; }
.wk-row input {
  padding: 10px;
  border: 2px solid var(--gris-bordure);
  border-radius: var(--radius-sm);
  font-size: 16px;
  background: #fff;
}
.wk-row .btn-tiny { background: var(--tomate); color: #fff; padding: 8px 10px; }

/* =========================================================================
   Navigation basse
   ========================================================================= */
.bottomnav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 720px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: var(--charbon);
  padding: 6px 4px env(safe-area-inset-bottom, 6px);
  z-index: 20;
  box-shadow: 0 -4px 16px rgba(0,0,0,0.12);
}
.nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  background: transparent;
  color: rgba(255, 248, 231, 0.6);
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color 0.15s, background 0.15s;
}
.nav-btn .nav-ico { font-size: 22px; line-height: 1; }
.nav-btn.active { color: var(--moutarde); background: rgba(232, 163, 23, 0.12); }

/* =========================================================================
   Modale générique
   ========================================================================= */
.modal-root {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(31, 29, 27, 0.6);
}
.modal-card {
  position: relative;
  background: var(--creme);
  border-radius: var(--radius);
  padding: 20px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-lg);
}
.modal-title { margin-bottom: 14px; font-size: 18px; }
.modal-body { margin-bottom: 18px; }
.modal-body label {
  display: block;
  margin-bottom: 12px;
}
.modal-body label span {
  display: block;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* =========================================================================
   Toast & messages
   ========================================================================= */
.toast {
  position: fixed;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--charbon);
  color: var(--creme);
  padding: 12px 20px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 14px;
  z-index: 200;
  box-shadow: var(--shadow-lg);
  max-width: 90vw;
  text-align: center;
}
.toast.error { background: var(--tomate); color: #fff; }
.toast.success { background: var(--vert); color: #fff; }

.error-msg {
  color: var(--tomate);
  font-size: 14px;
  margin-top: 10px;
  text-align: center;
}
.status-msg {
  text-align: center;
  font-weight: 600;
  margin-top: 10px;
  padding: 10px;
  border-radius: var(--radius-sm);
}
.status-msg.ok { background: rgba(46, 139, 87, 0.15); color: var(--vert-dark); }
.status-msg.err { background: rgba(214, 69, 69, 0.15); color: var(--tomate-dark); }

.empty {
  text-align: center;
  color: var(--gris);
  font-style: italic;
  padding: 20px;
}

/* =========================================================================
   Responsive desktop (largeur > 720px) — on centre l'app comme un téléphone
   ========================================================================= */
@media (min-width: 1024px) {
  body { background: linear-gradient(160deg, #1f1d1b 0%, #3a342c 100%); }
  .app {
    margin-top: 24px;
    margin-bottom: 24px;
    min-height: calc(100vh - 48px);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }
  .bottomnav { position: sticky; border-radius: 0 0 20px 20px; }
}
