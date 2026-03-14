# Workflow — Préterme IARD

## Table des Matières

1. [Contexte métier](#contexte-métier)
2. [Différences clés avec le Préterme Auto](#différences-clés-avec-le-préterme-auto)
3. [Architecture — Fichiers clés](#architecture--fichiers-clés)
4. [Collections Firestore](#collections-firestore)
5. [Intégration page — Toggle Auto / IARD](#intégration-page--toggle-auto--iard)
6. [Étape 1 — Mois du préterme](#étape-1--mois-du-préterme)
7. [Étape 2 — Import & Seuils par agence](#étape-2--import--seuils-par-agence)
8. [Étape 3 — Classification IA (Gemini)](#étape-3--classification-ia-gemini)
9. [Étape 4 — Gérants des entreprises](#étape-4--gérants-des-entreprises)
10. [Étape 5 — Routing & Dispatch Trello](#étape-5--routing--dispatch-trello)
11. [Étape 6 — Rapport Slack](#étape-6--rapport-slack)
12. [Histogramme historique](#histogramme-historique)
13. [Snapshot historique CDC](#snapshot-historique-cdc)
14. [Configuration — Paramètres Trello](#configuration--paramètres-trello)
15. [IA — Gemini Flash](#ia--gemini-flash)
16. [Design — Charte visuelle](#design--charte-visuelle)
17. [Points techniques critiques](#points-techniques-critiques)

---

## Contexte métier

Un **préterme IARD** est un contrat Incendie, Risques Divers (habitation, multirisque professionnelle, RC, etc.) dont l'échéance principale arrive le mois suivant.

> Exemple : en **mars**, Allianz génère la liste des contrats IARD qui arrivent à échéance en **avril**. C'est sur cette liste qu'on intervient — en mars — pour décider si on contacte, ajuste ou laisse renouveler automatiquement le contrat.

Le mois du préterme est toujours **mois courant + 1**.

Le workflow couvre **2 agences** : `H91358` et `H92083`.

---

## Différences clés avec le Préterme Auto

| Dimension | Préterme Auto | Préterme IARD |
|---|---|---|
| **Branche** | `Auto` | `I.R.D` |
| **Colonnes Excel** | 20 colonnes | 19 colonnes |
| **Colonnes absentes** | — | `Nb sinistres`, `Bonus/Malus` |
| **Colonne exclusive** | — | `Taux d'augmentation indice` (col 12) |
| **ETP** | Décimal (ex : `1.29`) | Décimal identique (ex : `1.20`) |
| **Règle de filtrage** | ETP **ET** Taux de variation | ETP **OU** Taux de variation |
| **Seuils par défaut** | majo ≥ 15%, ETP ≥ 1.20 | majo ≥ 15%, ETP ≥ 1.20 |
| **List Trello cible** | `lists.pretermeAuto` | `lists.pretermeIrd` |
| **Titre carte Trello** | `[AUTO] NOM — Échéance` | `[IRD] NOM — Échéance` |
| **Collections Firestore** | `preterme_workflows`, `preterme_snapshots` | `preterme_ird_workflows`, `preterme_ird_snapshots` |
| **Route API** | `/api/admin/preterme-auto/*` | `/api/admin/preterme-ird/*` |
| **Page** | `/admin/preterme-auto` | `/admin/preterme-iard` |

---

## Architecture — Fichiers clés

### Types

| Fichier | Rôle |
|---|---|
| `types/preterme-ird.ts` | Interfaces TypeScript du workflow IARD (`WorkflowIrdState`, `ClientIrdImporte`, `AgenceIrdState`, `SnapshotIrdCdc`) |

### Services métier

| Fichier | Rôle |
|---|---|
| `lib/utils/preterme-ird-parser.ts` | Parser ExcelJS — 19 colonnes, mapping headers, normalisation, détection agence depuis nom de fichier |
| `lib/services/preterme-ird-gemini.ts` | Classificateur Gemini batch, JSON strict, fallback `particulier` (identique Auto) |
| `lib/services/preterme-router.ts` | Routing partagé lettre/gérant → CDC (réutilisé tel quel depuis Auto) |
| `lib/services/preterme-ird-trello.ts` | Dispatch Trello IRD — `lists.pretermeIrd`, titre `[IRD]`, pas de sinistres, taux augmentation indice |

### Firebase client

| Fichier | Rôle |
|---|---|
| `lib/firebase/preterme-ird.ts` | CRUD Firestore — collections `preterme_ird_workflows` / `preterme_ird_snapshots`, `getDocFromServer` (anti-cache), `getAllIrdWorkflows` |

### API Routes

| Route | Méthode | Rôle |
|---|---|---|
| `/api/admin/preterme-ird/upload` | POST | Import fichier Excel IARD — idempotence sur `moisKey + numeroContrat` |
| `/api/admin/preterme-ird/recalc` | POST | Recalcul clients retenus avec nouveaux seuils |
| `/api/admin/preterme-ird/classify` | POST | Filtrage seuils + Gemini + écriture Firestore batch |
| `/api/admin/preterme-ird/dispatch` | POST | Routing + création cartes Trello + snapshots CDC |
| `/api/admin/preterme-ird/slack` | POST | Génération rapport + `chat.postMessage` sur la chaîne cible |

### Composants UI

| Composant | Rôle |
|---|---|
| `components/preterme-ird/Step2ImportIrd.tsx` | Upload Excel IARD, seuils, KPIs par agence |
| `components/preterme-ird/Step3ClassificationIrd.tsx` | Classification IA + correction manuelle |
| `components/preterme-ird/Step4GerantsIrd.tsx` | Saisie gérants entreprises |
| `components/preterme-ird/Step5DispatchIrd.tsx` | Aperçu routing + dispatch Trello colonne IRD |
| `components/preterme-ird/Step6SlackIrd.tsx` | Sélecteur chaîne Slack + envoi rapport IRD |

> Les composants `Step1Mois`, `TimelineSidebar` et `HistoPanel` sont **partagés** entre Auto et IARD (via props `mode`).

**Page principale** : `app/admin/preterme-iard/page.tsx`

---

## Collections Firestore

### `preterme_ird_workflows`

Document : `{moisKey}` (ex : `2026-04`)

```typescript
type WorkflowIrdState = {
  moisKey: string               // "2026-04"
  moisLabel: string             // "Avril 2026"
  confirmeAt: string            // ISO
  etapeActive: 1 | 2 | 3 | 4 | 5 | 6
  statut: "en_cours" | "terminé"
  slackEnvoye?: boolean

  agences: {
    [codeAgence: string]: AgenceIrdState   // "H91358", "H92083"
  }
}

type AgenceIrdState = {
  fichierNom: string
  clientsTotal: number
  seuilMajo: number             // % — ex: 15
  seuilEtp: number              // coefficient — ex: 1.20
  clientsRetenus: number
  etape2Statut: "en_attente" | "importé" | "bloqué"
  etape3Statut: "en_attente" | "analysé" | "bloqué"
  etape4Statut: "en_attente" | "complet" | "bloqué"
  dispatchStatut: "en_attente" | "ok" | "erreur"
  clients: ClientIrdImporte[]
}

type ClientIrdImporte = {
  // 19 champs Excel
  nomClient: string
  numeroContrat: string           // clé de déduplication
  brancheContrat: string          // "I.R.D"
  echeancePrincipale: string
  codeProduit: string
  modeReglement: string
  codeFractionnement: string
  primeTTCAnnuellePrecedente: number | null
  primeTTCAnnuelleActualisee: number | null
  tauxVariation: number | null
  surveillancePortefeuille: string
  tauxAugmentationIndice: number | null   // col 12 — IARD uniquement
  formule: string
  packs: string
  codeGestionCentrale: string
  tauxModulationCommission: string
  dateDernierAvenant: string
  avantageClient: string
  etp: number | null              // décimal (ex : 1.20)

  // Calculé / assigné
  retenu: boolean
  classificationIA: "particulier" | "entreprise" | null
  classificationFinale: "particulier" | "entreprise" | null
  corrigeParUtilisateur: boolean
  gerant: string | null
  trelloCardId: string | null
  dispatchStatut: "en_attente" | "ok" | "erreur"
  dispatchErreur?: string | null
}
```

### `preterme_ird_snapshots`

Document : `{moisKey}_{cdcId}` — un document par CDC par mois, écrit au moment du dispatch.

```typescript
type SnapshotIrdCdc = {
  moisKey: string
  snapshotAt: string
  cdcId: string
  cdcPrenom: string
  codeAgence: string
  lettresAttribuees: string[]
  clientsTotal: number
  particuliers: number
  entreprises: number
  cartesCreees: number
}
```

### `preterme_gerants`

**Partagée avec Auto** — même collection, même logique de mémoire gérants. Un gérant identifié en Auto est réutilisable en IARD (et inversement).

---

## Page dédiée — `/admin/preterme-iard`

Le workflow IARD dispose de sa **propre page**, indépendante de `/admin/preterme-auto`. Les deux pages coexistent et fonctionnent de façon totalement autonome.

### Fichiers page

```
app/admin/preterme-iard/page.tsx          ← page principale IARD
app/admin/preterme-iard/layout.tsx        ← layout (RouteGuard ADMINISTRATEUR)
```

### Structure de la page

```
┌───────────┬─────────────────────────────────────┐
│ Sidebar   │ Content (Steps 1–6)                 │
│ Timeline  │                                     │
│ IARD      │  ← composants preterme-ird/*        │
└───────────┴─────────────────────────────────────┘
```

### Navigation multi-mois IARD

`getAllIrdWorkflows()` charge tous les workflows IRD (tri DESC `moisKey`), priorité `en_cours` sinon le plus récent — identique à la logique Auto.

---

## Étape 1 — Mois du préterme

**Identique à Auto** — le mois est commun aux deux workflows. Si un mois est déjà confirmé en Auto, le même `moisKey` est proposé par défaut pour IARD.

---

## Étape 2 — Import & Seuils par agence

### Fichiers Excel IARD

- Nommage : `H92083 - LISTE PRETERMES DU Avr2026 BRANCHE I.R.D.Avr2026.xlsx`
- Code agence détecté automatiquement depuis le nom de fichier (`detectAgenceFromFilename`)

### Structure Excel — 19 colonnes (feuille `Feuil1`, ligne 1 = en-têtes)

| # | En-tête | Type | Notes |
|---|---|---|---|
| 1 | `Nom du client` | string | Routing CDC pour particuliers |
| 2 | `N° de Contrat` | string | **Clé de déduplication** |
| 3 | `Branche` | string | Toujours `"I.R.D"` |
| 4 | `Echéance principale` | date | ISO |
| 5 | `Code produit` | string | |
| 6 | `Mode de règlement` | string | Ex : `PA` |
| 7 | `Code fractionnement` | string | Ex : `Mensuel` |
| 8 | `Prime TTC annuelle précédente` | number | En € |
| 9 | `Prime TTC annuelle actualisée` | number | En € |
| 10 | `Taux de variation` | number | En % |
| 11 | `Surveillance portefeuille` | string | `Oui` / `Non` |
| 12 | `Taux d'augmentation indice` | number | **Absent en Auto** — en % |
| 13 | `Formule` | string | |
| 14 | `Packs` | string | Souvent vide |
| 15 | `Code gestion centrale` | string | |
| 16 | `Taux de modulation commission` | string | |
| 17 | `Date d'effet du dernier avenant` | date | ISO |
| 18 | `Avantage client` | string | |
| 19 | `ETP` | number | Décimal (ex : `1.20`) |

> **Absent vs Auto** : pas de `Nb sinistres` (col 15 Auto) ni de `Bonus/Malus` (col 16 Auto).

> **ETP** : valeurs décimales identiques à Auto (ex : `1.20`). Comparaison directe — pas de division par 100.

### Critères de rétention — Règle OU

Un client IARD est **retenu** si **au moins une** des conditions suivantes est remplie :

| Critère | Colonne | Valeur par défaut |
|---|---|---|
| **Taux de variation** | col 10 | `>= 15` % |
| **ETP** | col 19 | `>= 1.20` |

> ⚠️ **Différence critique vs Auto** : en Auto la règle est **ET** (les deux critères doivent être vrais). En IARD la règle est **OU** (un seul suffit). Cela entraîne un volume de clients retenus généralement plus élevé.

### États d'une agence

Identiques à Auto : `en_attente` → `importé` → `bloqué`.

---

## Étape 3 — Classification IA (Gemini)

**Identique à Auto** — même modèle, même prompt, même logique de toggle manuel.

### Appel Gemini

**Modèle** : `gemini-2.0-flash`
**Clé API** : `GEMINI_API_KEY` (`.env.local`)

**System prompt :**
```
Tu es un classificateur. Pour chaque entrée, détermine si le nom correspond à un particulier
(nom + prénom d'une personne physique) ou à une entreprise (raison sociale, sigle, forme juridique
comme SARL, SAS, EURL, SA, SCI, AUTO-ENTREPRENEUR, etc.).

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ni après, sans balises markdown.
Format : [{ "numeroContrat": "...", "classification": "particulier" | "entreprise" }]

En cas d'ambiguïté, utilise "particulier" par défaut.
```

**Fallback** : si la réponse n'est pas parseable → retry 1 fois, puis `particulier` par défaut.

---

## Étape 4 — Gérants des entreprises

**Identique à Auto** — même collection `preterme_gerants`, même logique de mémoire automatique.

Le routing IARD utilise identiquement la **première lettre du gérant** pour les entreprises :

```typescript
function getRoutingName(client): string {
  if (client.classificationFinale === "entreprise" && client.gerant?.trim()) {
    return client.gerant.trim()
  }
  return client.nomClient
}
```

---

## Étape 5 — Routing & Dispatch Trello

### Routing

**Identique à Auto** — réutilise `preterme-router.ts` sans modification. La lettre est normalisée (NFD → strip accents → uppercase → `[0]`) et matchée contre `CDC.letters`.

La seule différence : la vérification de configuration porte sur `lists.pretermeIrd` au lieu de `lists.pretermeAuto`.

```typescript
// Vérification config CDC pour IARD
if (!cdc.boardId || !cdc.lists?.pretermeIrd) {
  // client en erreur — colonne IARD non configurée
}
```

### Dispatch Trello

**Colonne cible** : `CDC.lists.pretermeIrd` (configurée dans `/admin/parametres-trello`)

**Idempotence** : identique Auto — si `client.trelloCardId` renseigné → `PUT /cards/:id`.

**Retry 429** : identique Auto — `sleep(1500ms)` puis retry, max 2 tentatives.

### Format carte Trello IARD

**Titre :**
```
[IRD] NOM DU CLIENT — Échéance JJ/MM/AAAA
```

**Date d'échéance** (`due`) : `echeancePrincipale` convertie en ISO, fixée à **midi UTC**.

**Description :**
```markdown
## 🔴 DOUBLE ALERTE — Préterme IARD Avril 2026

🤖 Carte générée le 14/03/2026 à 10:32 — suivi proactif avant échéance du 04/04/2026.

---

## 🎯 Pourquoi ce client ?

- 📈 Majoration tarifaire : +22.5 % → dépasse le seuil de 15 % ✅
- 📊 ETP : 1.35 → dépasse le seuil de 1.2 ✅
- 🏷️ Profil : 👤 Particulier (détection IA)

---

## 📋 Fiche contrat

- 🔢 N° contrat      : 60214313
- 🏠 Branche         : I.R.D
- 📦 Code produit    : MRH2
- 🔄 Fractionnement  : Mensuel
- 💳 Règlement       : PA
- 📝 Dernier avenant : 04/04/2025
- 📅 Échéance        : 04/04/2026

---

## 💶 Situation tarifaire

- Prime N-1             : 892,00 €
- Prime actualisée      : 1 093,30 €
- ⚠️ Variation          : +22.5 %
- ETP                   : 1.35
- Taux augm. indice     : 6.2 %

---

## 🔍 Surveillance

- Surveillance PF : Non
- Avantage client : 10

---

💡 Utilisez les checklists ci-dessous pour suivre vos actions.
```

> **Absent vs Auto** : pas de section `🚨 Sinistralité` (pas de `Nb sinistres` ni `Bonus/Malus` en IARD).
> **Ajout IARD** : ligne `Taux augm. indice` dans la section tarifaire.

**Niveau d'alerte :**
- `🔴 DOUBLE ALERTE` : majo ET ETP dépassent les seuils
- `🟠 ALERTE VARIATION` : seulement le taux de variation dépasse
- `🟠 ALERTE ETP` : seulement l'ETP dépasse
- `🟡 SURVEILLANCE` : aucun critère (cas impossible avec la règle OU — mais prévu en fallback)

### Checklists Trello (identiques Auto)

Créées uniquement à la première création (pas sur mise à jour).

**📬 Tentatives de contact** (6 items), **🤝 Entretien** (3 items), **🏁 Résultat final** (4 items) — voir doc Auto pour le détail.

---

## Étape 6 — Rapport Slack

### Sélection de la chaîne cible

**Identique à Auto** — même picker, même chaîne par défaut `CE58HNVF0`.

### Format du message Slack IARD

```
🛡️ *Préterme IARD — Avril 2026*
_Traitement du 14/03/2026 · 2 agences_

📊 Nbre de contrats dans le préterme : *312*
✅ Nbre retenu : *178*
🃏 Nbre de cartes Trello : *178/178* ✅

━━━━━━━━━━━━━━━━━━━

🏢 *H91358* — 104 retenus (33% / 312)
Donia: 52 — Corentin: 33 — Emma: 19

🏢 *H92083* — 74 retenus (24% / 312)
Joëlle: 42 — Sandra: 32
```

Le format est identique à Auto, avec l'icône `🛡️` (vs `🚗`) et la mention `Préterme IARD` dans le header.

### Idempotence Slack

Après envoi réussi :
```typescript
{ slackEnvoye: true, statut: "terminé" }
```
L'utilisateur peut renvoyer vers une autre chaîne — non bloquant.

---

## Histogramme historique

Identique à Auto — le `HistoPanel` affiche l'historique des workflows IARD (importés / retenus par agence). Les données viennent de `allIrdWorkflows` déjà en mémoire — aucun appel Firestore supplémentaire.

---

## Snapshot historique CDC

**Identique à Auto** — collection `preterme_ird_snapshots`, document ID `{moisKey}_{cdcId}`.

Écriture sélective au moment du dispatch. `cartesCreees` calculé sur l'état complet des clients.

---

## Configuration — Paramètres Trello

### `CDC.lists.pretermeIrd`

Dans `/admin/parametres-trello`, chaque CDC dispose de trois colonnes configurables :

```typescript
lists?: {
  pretermeAuto?: string    // List ID colonne Préterme Auto
  processM3?: string       // List ID colonne M+3
  pretermeIrd?: string     // List ID colonne Préterme IARD ← utilisée ici
}
```

Le `TrelloListPicker` dans la configuration permet de rechercher et sélectionner la bonne colonne depuis le board Trello du CDC.

### `isTrelloComplete(cdc)`

Retourne `true` si `boardId` + les 3 list IDs sont renseignés (dont `pretermeIrd`). Badge orange si incomplet, vert si complet.

---

## IA — Gemini Flash

**Identique à Auto** — même modèle, mêmes tokens, même gestion d'erreurs.

| Cas | Comportement |
|---|---|
| Réponse non parseable | Retry 1 fois, puis fallback `particulier` |
| `numeroContrat` absent dans la réponse | Client marqué `particulier` |
| Timeout / erreur réseau | Retry 1 fois, puis erreur affichée |

---

## Design — Charte visuelle

**Identique à Auto** — glassmorphism dark mode, palette violet/vert, typographie Syne/DM Sans/DM Mono.

Seule différence visuelle : les badges de branche affichent `IARD` (couleur amber `#ef9f27`) au lieu de `AUTO` (vert `#2dc596`).

| Élément | Auto | IARD |
|---|---|---|
| Badge branche | `#2dc596` (vert) | `#ef9f27` (amber) |
| Icône mode | `🚗` | `🛡️` |
| Titre page | `Préterme Auto` | `Préterme IARD` |

---

## Points techniques critiques

### 1. Règle de filtrage OU — impact volume

La règle OU génère davantage de clients retenus qu'en Auto. Prévoir des batches Gemini plus larges et un temps de dispatch Trello plus long. Le retry 429 est identique (sleep 1500ms, max 2 tentatives).

### 2. ETP décimal — comparaison directe

L'ETP IARD est stocké en décimal (`1.20`). La comparaison se fait directement sans division :

```typescript
// ✅ IARD — comparaison directe
const etpOk = client.etp !== null && client.etp >= seuilEtp  // seuilEtp = 1.20

// ❌ Ne pas diviser par 100 (c'était une ancienne convention du code legacy)
```

### 3. Isolation des collections Firestore

Les collections `preterme_ird_workflows` et `preterme_ird_snapshots` sont **séparées** de `preterme_workflows` et `preterme_snapshots`. Cela garantit que les workflows Auto et IARD d'un même mois sont indépendants et ne se perturbent pas.

### 4. Colonne `pretermeIrd` manquante en config

Si un CDC n'a pas `lists.pretermeIrd` configuré, le dispatch échoue en erreur non-bloquante pour ce CDC. Les autres CDC sont dispatchés normalement. L'UI affiche un badge d'avertissement.

### 5. `tauxAugmentationIndice` — champ nullable

Ce champ peut être absent ou nul dans certains fichiers. Toujours utiliser `null` (pas `undefined`) pour la compatibilité Firestore Admin SDK.

```typescript
tauxAugmentationIndice: number | null   // ✅
tauxAugmentationIndice?: number         // ❌ — undefined rejeté par Admin SDK
```

### 6. Firestore — Anti-cache et dot-notation

Identique Auto :
- `getDocFromServer` pour éviter les données stale après dispatch
- Dot-notation pour les mises à jour de clients par agence afin d'éviter les race conditions entre CDC parallèles

### 7. Page IARD — chargement autonome

Au mount de `app/admin/preterme-iard/page.tsx`, seuls les workflows IRD sont chargés via `getAllIrdWorkflows()`. Aucune dépendance avec la page Auto.

---

> Dernière mise à jour : 14/03/2026 — Documentation initiale, implémentation à venir.
