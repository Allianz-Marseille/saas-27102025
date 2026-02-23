# TODO — Bots IA Allianz Marseille

Référence : [README.md](README.md) (stack technique) et `docs/assets-gemini/` (ressources).

---

## ⚠️ Règle : Collaborateur vs Client

**L'utilisateur des bots est toujours un collaborateur de l'agence.** Les questions de collecte concernent le **client** (prénom/nom du client, date de naissance du client, etc.), jamais l'interlocuteur. Les workflows (`00-workflow-*.md`) doivent formuler les questions explicitement sur le client.

---

## 📋 État du code — Bob (TNS)

### Ce qui existe déjà

| Fichier / module | Rôle | Statut |
|------------------|------|--------|
| `lib/config/agents.ts` | Config BOTS avec `bob` (Expert santé et prévoyance TNS) | ✅ |
| `docs/assets-gemini/registry-bots.md` | Registre : bob → `bob-prevoyance/` | ✅ |
| `docs/assets-gemini/bob-prevoyance/` | Workflow + 15 fiches métier + référentiel 2026 | ✅ |
| `lib/ai/bot-loader.ts` | `getBotContext("bob")` charge le contexte complet | ✅ |
| `app/api/chat/route.ts` | API chat avec botId, Vision, streaming | ✅ |
| `components/chat/bot-chat.tsx` | Interface chat (message, attachments, quick replies) | ✅ |
| `app/commun/agents-ia/bob/page.tsx` | Page Bob avec fil d'Ariane et BotChat | ✅ |
| `app/commun/agents-ia/page.tsx` | Page « Mes agents IA » — Bob est **déjà affiché et cliquable** | ⚠️ |
| `app/admin/test-bots/page.tsx` | Page « Test des Bots » — **vide** (titre uniquement) | ⚠️ |
| `app/admin/layout.tsx` | Route `/admin/*` protégée `allowedRoles: ["ADMINISTRATEUR"]` | ✅ |

### Problème actuel

- Bob est accessible à **tous les utilisateurs** via « Mes agents IA » → `/commun/agents-ia/bob`.
- La page « Test des Bots » est **vide** et ne permet pas d’accéder à Bob.
- Objectif : Bob doit être **uniquement** accessible depuis « Test des Bots » (admin) tant qu’il est en phase de validation.

---

## 🔧 Étapes pour coder Bob (TNS) — Phase test puis production

### Phase 1 — Bob uniquement dans « Test des Bots » (admin)

| # | Étape | Fichiers concernés | Description |
|---|-------|--------------------|-------------|
| 1 | **Ajouter `inTestMode` à la config** | `lib/config/agents.ts` | Ajouter `inTestMode?: boolean` dans `BotConfig`. Bob : `inTestMode: true`. |
| 2 | **Filtrer Bob de « Mes agents IA »** | `app/commun/agents-ia/page.tsx` | Ne pas afficher Bob (ou le marquer « en test » sans lien) si `inTestMode === true`. |
| 3 | **Protéger la route Bob** | `app/commun/agents-ia/bob/page.tsx` | Envelopper la page avec `RouteGuard allowedRoles={["ADMINISTRATEUR"]}` lorsque `inTestMode === true`. |
| 4 | **Créer la page Test des Bots** | `app/admin/test-bots/page.tsx` | Lister les bots en test (ex. Bob). Afficher une carte cliquable vers `/commun/agents-ia/bob` ou intégrer le chat directement. |
| 5 | **Option : route dédiée admin** | `app/admin/test-bots/bob/page.tsx` | (Alternatif) Créer une page admin dédiée pour Bob sous `/admin/test-bots/bob` et réutiliser `BotChat` — évite de toucher à `/commun/agents-ia/bob`. |

### Phase 2 — Basculer Bob en production

| # | Étape | Fichiers concernés | Description |
|---|-------|--------------------|-------------|
| 6 | **Désactiver le mode test** | `lib/config/agents.ts` | Mettre `inTestMode: false` (ou supprimer) pour Bob. |
| 7 | **Réafficher Bob sur « Mes agents IA »** | Automatique si étape 1–2 correcte | Bob sera à nouveau listé avec lien vers `/commun/agents-ia/bob`. |
| 8 | **Retirer la restriction admin** | `app/commun/agents-ia/bob/page.tsx` | Supprimer le `RouteGuard` si Bob n’est plus en test. |

### Recommandation d’implémentation

**Option A (simple)**  
- `lib/config/agents.ts` : `bob.inTestMode = true`.
- `app/commun/agents-ia/page.tsx` : filtrer `agents` pour exclure Bob si `getBotConfig("bob")?.inTestMode`.
- `app/commun/agents-ia/bob/page.tsx` : ajouter `RouteGuard allowedRoles={["ADMINISTRATEUR"]}`.
- `app/admin/test-bots/page.tsx` : afficher une carte « Bob (TNS) » avec lien vers `/commun/agents-ia/bob`.

**Option B (séparation nette)**  
- Créer `app/admin/test-bots/bob/page.tsx` : page admin qui réutilise `BotChat` avec `botId="bob"`.
- Page Test des Bots : lien vers `/admin/test-bots/bob`.
- Ne pas modifier `/commun/agents-ia/bob` : laisser Bob masqué de « Mes agents IA » via `inTestMode` jusqu’à la bascule.

### Checklist Bob (TNS) — Phase test

- [ ] Ajouter `inTestMode: true` dans `lib/config/agents.ts` pour Bob
- [ ] Filtrer Bob de « Mes agents IA » tant que `inTestMode`
- [ ] Créer la page « Test des Bots » avec carte Bob (lien vers chat)
- [ ] Restreindre l’accès à Bob aux admins (RouteGuard ou page sous `/admin/test-bots/bob`)
- [ ] Tester le flux complet : admin → Test des Bots → Bob → chat + Vision

### Checklist Bob (TNS) — Bascule production

- [ ] Mettre `inTestMode: false` pour Bob
- [ ] Vérifier que Bob apparaît sur « Mes agents IA »
- [ ] Retirer la restriction admin sur Bob si applicable

---

## ✅ Déjà en place

| Élément | Statut |
|--------|--------|
| Architecture multi-agents (registre + bot-loader + route chat) | ✅ |
| Bob prévoyance : workflow, 15 fiches métier, référentiel 2026 | ✅ |
| Référentiel global `01-referentiel-social-plafonds-2026.md` | ✅ |
| Vision Gemini (images Lagon / Liasses via attachments) | ✅ |
| Streaming des réponses | ✅ |
| `GEMINI_API_KEY` configurée en local (`.env.local`) | ✅ |

---

## 🔲 Bots à créer (d’après le registre)

Le registre (`docs/assets-gemini/registry-bots.md`) prévoit 5 bots. **Bob**, **Léa** et **John Coll** sont opérationnels. **Sinistro** et **Pauline** restent à créer.

### Léa (Santé Individuelle uniquement)

- [x] Créer `docs/assets-gemini/lea-sante/`
- [x] Créer `00-workflow-lea-methode.md` (workflow méthodologique)
- [ ] Créer les fiches métier (garanties, solutions santé individuelle)
- [x] Ajouter Léa dans `lib/config/agents.ts`
- [x] Créer la page `app/commun/agents-ia/lea/page.tsx` (+ layout)

### John Coll (john-coll — Santé, Prévoyance et Retraite Collectives)

- [x] Créer `docs/assets-gemini/john-coll/`
- [x] Créer `00-workflow-john-methode.md` (workflow méthodologique)
- [ ] Créer les fiches métier (CCN, santé coll., prévoyance coll., retraite coll.)
- [x] Ajouter john-coll dans `lib/config/agents.ts`
- [x] Créer la page `app/commun/agents-ia/john/page.tsx` (+ layout)

### Sinistro (Gestion & Analyse de sinistres)

- [x] Créer `docs/assets-gemini/sinistro/`
- [x] Créer `00-workflow-sinistro.md`
- [x] Base de connaissance : résumé conventions (racine), guide complet + table des matières dans `md-sinistro/`, `pdf-sinistro/` pour les PDF
- [ ] Créer les fiches métier (types de sinistres, process, acteurs) + Cas IRSA pour analyse de constat
- [ ] Ajouter Sinistro dans `lib/config/agents.ts`
- [ ] Créer la page `app/commun/agents-ia/sinistro/page.tsx`

### Pauline (Audit de protection familiale)

- [ ] Créer `docs/assets-gemini/pauline/`
- [ ] Créer `00-workflow-pauline.md`
- [ ] Créer les fiches métier (audit, protection familiale)
- [ ] Ajouter Pauline dans `lib/config/agents.ts`
- [ ] Créer la page `app/commun/agents-ia/pauline/page.tsx`

---

## 🔲 Fonctionnalités à compléter

### Liens vers les devis

- [ ] Référencer [docs/devis/](../devis/README.md) dans les workflows des bots
- [ ] Intégrer les URLs Corniche (H91358) et Rouvière (H92083) dans les fiches ou prompts
- [ ] Comportement attendu : proposer des liens cliquables selon le besoin (Auto, Habitation, Santé, etc.)

### UI / Expérience utilisateur

- [x] Bouton « Nouvelle conversation » dans le header du chat (composant partagé `BotChat` — s'applique à tous les bots)
- [x] Boutons Copier chat / Préparer mail / Préparer note de synthèse (prénom chargé dérivé de l'email, nom client extrait des messages)
- [x] Boutons d'accroche Bob niveau 1/2 : Bonjour, Question SSI, Régime obligatoire, Loi Madelin ; après Bonjour, 3 boutons colorés (Lagon, Liasse, Questions)
- [ ] Vérifier que le composant chat envoie bien les `attachments` (images) vers l’API
- [ ] Tester le flux complet : upload image Lagon → Vision → réponse Bob
- [ ] Rendu Markdown : tableaux, montants en gras, sources citées (déjà prévus dans le workflow Bob)

### Configuration

- [x] `GEMINI_API_KEY` configurée en local (`.env.local`)
- [ ] `GEMINI_API_KEY` configurée sur Vercel (variables d'environnement) pour la production (variables d’environnement)

---

## 🔲 Bob — Affinements possibles

- [x] Logique 3 couches TNS : SSI (1ère couche) → RO (2ème couche) → Gap = Besoin − (SSI + RO). Tableau diagnostic expose SSI et RO séparément.
- [ ] Table des matières : confirmer que le bot consulte bien `00-table-des-matieres.md` pour cibler le régime adapté
- [ ] Mise à jour annuelle : prévoir la rotation des fichiers 2026 → 2027 (plafonds, régimes)

---

## Récapitulatif des ressources assets-gemini

| Ressource | Rôle |
|-----------|------|
| `registry-bots.md` | Index des bots (botId, dossier, workflow) |
| `01-referentiel-social-plafonds-2026.md` | Plafonds PASS, PMSS, IJ CPAM (global) |
| `bob-prevoyance/` | Workflow + 15 fiches (régimes, solutions) |
| `lea-sante/` | Santé individuelle |
| `john-coll/` | Santé, prévoyance et retraite collectives |
| `sinistro/` | À créer |
| `pauline/` | À créer |
