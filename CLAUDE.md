# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commandes essentielles

```bash
npm run dev          # Serveur de développement Next.js
npm run build        # Build de production
npm run lint         # ESLint sur tout le projet
npm run test         # Tests Vitest en mode watch
npm run test:run     # Tests Vitest one-shot (CI)
npm run test:coverage # Couverture de code (lib/** hors firebase)
```

Les tests couvrent uniquement `lib/**/*.ts` (hors `lib/firebase/`). Il n'y a pas de tests d'intégration Firestore en local — les règles sont testées via `npm run test:rules:emulator` (Firebase Emulator requis).

Les scripts d'administration (`scripts/`) s'exécutent avec `ts-node --project tsconfig.scripts.json`.

---

## Contexte Métier

SaaS interne pour les agences Allianz du groupe Nogaro. Il automatise :
- Gestion des contrats preterme (Auto & IARD) — dispatch vers Trello par CDC
- Suivi sinistres, commissions, leads, santé collective/individuelle
- Assistant IA avec base de connaissance (RAG Gemini)
- Leaderboard commercial, offres, courtage

---

## Stack Technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Style | Tailwind CSS 4, Shadcn UI, Radix UI, Lucide Icons |
| Base de données | **Firebase Firestore** (jamais Prisma/SQL) |
| Auth | Firebase Auth (custom claims) |
| IA | Gemini (`@google/genai`) — classification, RAG, OCR |
| Excel | ExcelJS (parse/génération) |
| Animations | Framer Motion, GSAP |
| Graphiques | Recharts |
| Toasts | Sonner |
| Tests | Vitest (node env) |
| Déploiement | Vercel |

---

## Architecture

### Flux de données — API Routes

Toutes les mutations passent par des API Routes Next.js (`/app/api/`). Le client appelle ces routes via `buildAuthenticatedJsonHeaders()` (`lib/firebase/api-auth.ts`) qui injecte le token Firebase dans les headers. Côté serveur, `verifyAdmin(req)` ou `verifyAuth(req)` (`lib/utils/auth-utils.ts`) valide le token via Firebase Admin SDK.

```
Client (React) → fetch + buildAuthenticatedJsonHeaders()
    → /app/api/admin/... (route serverless)
        → verifyAdmin(req)  [lib/utils/auth-utils.ts]
        → Firebase Admin SDK [lib/firebase/admin-config.ts]
        → Firestore / services métier
```

### Pattern Firestore (client-side)

```ts
// Toujours assertDb() avant accès + typage explicite
const db = assertDb()
const snap = await getDoc(doc(db, 'collection', id))
const data = { ...snap.data(), createdAt: toDate(snap.data()?.createdAt) }
```

- `assertDb()` — lazy init Firestore client
- `toDate()` — conversion Timestamp Firestore → Date JS
- Firebase Admin SDK : `lib/firebase/admin-config.ts` (proxy lazy `adminDb`/`adminAuth`)

### Rôles utilisateur

5 rôles Firebase Auth custom claims :
`ADMINISTRATEUR` | `CDC_COMMERCIAL` | `COMMERCIAL_SANTE_INDIVIDUEL` | `COMMERCIAL_SANTE_COLLECTIVE` | `GESTIONNAIRE_SINISTRE`

`/app/admin/layout.tsx` contient un `RouteGuard` qui restreint toutes les pages admin au rôle `ADMINISTRATEUR`.

---

## Config Trello — Structure Firestore

- **Collection** `config`, **Document** `trello`, champ `agencies: Agency[]`
- `Agency` : `{ id, code (ex: "H92083"), name, cdc: CDC[] }`
- `CDC` : `{ id, firstName, letters: string[], boardId?, lists?: { processM3, pretermeAuto, pretermeIrd } }`
- `boardId` et `lists` sont **optionnels** — seul `firstName` est requis
- `isTrelloComplete(cdc)` → true si `boardId` + les 3 list IDs renseignés
- Fichiers : `lib/trello-config/` (types, hooks, validators, constants)

---

## Workflows Préterme — Architecture partagée

Deux workflows identiques en architecture : **Préterme Auto** et **Préterme IARD**.
Chacun suit 6 étapes séquentielles persistées en Firestore.

### Pipeline par workflow

```
Step 1: Sélection du mois (moisKey = "YYYY-MM")
Step 2: Upload Excel par agence → parser ExcelJS → seuils majo/etp
Step 3: Classification Gemini batch → particulier / professionnel
Step 4: Saisie gérants (entreprises uniquement)
Step 5: Routing lettre → CDC → dispatch cartes Trello
Step 6: Rapport Slack
```

### Collections Firestore

| Collection | Clé doc | Contenu |
|---|---|---|
| `preterme_workflows` | `{moisKey}` | WorkflowState Auto complet |
| `preterme_snapshots` | `{moisKey}_{cdcId}` | Snapshot CDC figé au dispatch Auto |
| `preterme_ird_workflows` | `{moisKey}` | WorkflowState IARD complet |
| `preterme_ird_snapshots` | `{moisKey}_{cdcId}` | Snapshot CDC figé au dispatch IARD |

### Différences Auto vs IARD

| | Auto | IARD |
|---|---|---|
| Colonnes Excel | 20 | 19 (pas de `Nb sinistres` ni `Bonus/Malus`) |
| Seuils défaut | majo ≥ 15%, etp ≥ 1.20 | idem |
| Agences | H91358 + H92083 | H91358 + H92083 |

### Services métier (`lib/services/`)

| Fichier | Rôle |
|---|---|
| `preterme-gemini.ts` | Classification Gemini batch, retry x1, fallback particulier |
| `preterme-router.ts` | Routing lettre → CDC via Agency/CDC |
| `preterme-trello.ts` / `preterme-ird-trello.ts` | Dispatch Trello, retry 429, idempotence `trelloCardId` |
| `preterme-slack.ts` / `preterme-ird-slack.ts` | Rapport Slack |
| `preterme-anomaly.ts` / `preterme-ird-anomaly.ts` | Détection anomalies |

---

## Design System — Workflows Préterme

### Palette

```
Background principal : #0e0c1a
Cards / panneaux     : rgba(255, 255, 255, 0.03) + border rgba(255,255,255,0.06)
Accent violet        : #9b87f5  (hover : #b8a9f7)
Texte principal      : #e2e8f0
Texte secondaire     : rgba(255,255,255,0.5)
Succès / Erreur / Warning : #10b981 / #ef4444 / #f59e0b
```

### Typographie

```
Titres  : Syne
Corps   : DM Sans
Labels  : DM Mono
```

### Règle critique

Le **glassmorphism** (`rgba`, `backdrop-filter`) s'applique **en inline styles**, pas via classes Tailwind — les valeurs rgba arbitraires ne compilent pas correctement avec Tailwind CSS 4. Le layout (flex, grid, spacing) reste en Tailwind.

---

## Intégrations Externes

| Service | Env var |
|---|---|
| Trello | `TRELLO_API_KEY`, `TRELLO_TOKEN` |
| Slack | `SLACK_BOT_TOKEN` |
| Gemini | `GEMINI_API_KEY` |
| Pappers | `PAPPERS_API_KEY` |
| Firebase Admin | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |

---

## Règles de développement

- Pattern CRUD Firestore : toujours `assertDb()` + typage explicite, jamais d'accès direct à `db` global.
- Si une tâche touche > 3 fichiers, proposer un plan avant de coder.
- Commits par phase logique (upload, classify, dispatch…), PRs séparées par feature.
