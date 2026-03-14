# Workflow — Préterme Auto

## Table des Matières

1. [Contexte métier](#contexte-métier)
2. [Architecture — Fichiers clés](#architecture--fichiers-clés)
3. [Collections Firestore](#collections-firestore)
4. [Étape 1 — Mois du préterme](#étape-1--mois-du-préterme)
5. [Étape 2 — Import & Seuils par agence](#étape-2--import--seuils-par-agence)
6. [Étape 3 — Classification IA (Gemini)](#étape-3--classification-ia-gemini)
7. [Étape 4 — Gérants des entreprises](#étape-4--gérants-des-entreprises)
8. [Étape 5 — Routing & Dispatch Trello](#étape-5--routing--dispatch-trello)
9. [Étape 6 — Rapport Slack](#étape-6--rapport-slack)
10. [Snapshot historique](#snapshot-historique)
11. [Configuration — Paramètres Trello](#configuration--paramètres-trello)
12. [IA — Gemini Flash](#ia--gemini-flash)
13. [Design — Charte visuelle](#design--charte-visuelle)
14. [Points techniques critiques](#points-techniques-critiques)

---

## Contexte métier

Un **préterme** est un contrat dont l'échéance principale arrive le mois suivant.

> Exemple : en **mars**, Allianz génère la liste des contrats qui arrivent à échéance en **avril**. C'est sur cette liste qu'on intervient — en mars — pour décider si on corrige, relance ou laisse partir le client avant que l'appel de cotisation parte.

Le mois du préterme est toujours **mois courant + 1**.

Le workflow couvre **2 agences** : `H91358` et `H92083`.

---

## Architecture — Fichiers clés

### Types

| Fichier | Rôle |
|---|---|
| `types/preterme.ts` | Toutes les interfaces TypeScript du workflow |

### Services métier

| Fichier | Rôle |
|---|---|
| `lib/utils/preterme-parser.ts` | Parser ExcelJS — 20 colonnes, mapping headers, normalisation, détection agence |
| `lib/services/preterme-anomaly.ts` | Filtrage métier (seuils majo/ETP), calcul stats preview |
| `lib/services/preterme-gemini.ts` | Classificateur Gemini batch 50, JSON strict, fallback `particulier` |
| `lib/services/preterme-router.ts` | Routing par lettre/gérant → CDC |
| `lib/services/preterme-trello.ts` | Dispatch Trello — titre, description, checklists, due date, retry 429 |

### Firebase client

| Fichier | Rôle |
|---|---|
| `lib/firebase/preterme.ts` | CRUD Firestore — `getDocFromServer` (anti-cache) pour les lectures post-dispatch |

### API Routes

| Route | Méthode | Rôle |
|---|---|---|
| `/api/admin/preterme-auto/upload` | POST | Import fichier Excel — idempotence sur `moisKey + numeroContrat` |
| `/api/admin/preterme-auto/classify` | POST | Filtrage seuils + Gemini + écriture Firestore batch |
| `/api/admin/preterme-auto/dispatch` | POST | Routing + création cartes Trello + snapshots CDC |
| `/api/admin/preterme-auto/slack` | POST | Génération rapport + envoi `chat.postMessage` |
| `/api/admin/preterme-auto/trello-lists` | GET | Liste les colonnes ouvertes d'un board Trello |

### Composants UI

| Composant | Étape |
|---|---|
| `components/preterme/Step1Periode.tsx` | Étape 1 |
| `components/preterme/Step2Upload.tsx` | Étape 2 |
| `components/preterme/Step3Thresholds.tsx` | Étape 2 (seuils + preview) |
| `components/preterme/Step3Classify.tsx` | Étape 3 (classif IA) |
| `components/preterme/Step4Gerants.tsx` | Étape 4 |
| `components/preterme/Step5Dispatch.tsx` | Étape 5 |
| `components/preterme/Step6Slack.tsx` | Étape 6 |

Page principale : `app/admin/preterme-auto/page.tsx`

---

## Collections Firestore

### `preterme_workflows`

Document : `{moisKey}` (ex : `2026-04`)

```typescript
type WorkflowState = {
  moisKey: string               // "2026-04"
  moisLabel: string             // "Avril 2026"
  confirmeAt: string            // ISO
  etapeActive: 1 | 2 | 3 | 4 | 5 | 6
  statut: "en_cours" | "terminé"
  slackEnvoye?: boolean

  agences: {
    [codeAgence: string]: {     // ex: "H91358", "H92083"
      fichierNom: string
      clientsTotal: number
      seuilMajo: number         // % — ex: 15
      seuilEtp: number          // coefficient — ex: 1.20
      clientsRetenus: number
      etape2Statut: "en_attente" | "importé" | "bloqué"
      etape3Statut: "en_attente" | "analysé" | "bloqué"
      etape4Statut: "en_attente" | "complet" | "bloqué"
      dispatchStatut: "en_attente" | "ok" | "erreur"
      clients: ClientImporte[]  // tableau complet, mis à jour à chaque étape
    }
  }
}
```

### `preterme_snapshots`

Document : `{moisKey}_{cdcId}` — un document par CDC par mois, écrit au moment du dispatch.

```typescript
type SnapshotCdc = {
  moisKey: string
  snapshotAt: string            // ISO
  cdcId: string
  cdcPrenom: string             // copie figée — indépendant de la config
  codeAgence: string
  lettresAttribuees: string[]   // copie figée
  clientsTotal: number
  particuliers: number
  entreprises: number
  cartesCreees: number          // calculé sur l'état complet des clients (pas que ce batch)
}
```

> **Important** : les snapshots ne sont écrits que pour les CDC effectivement dispatchés dans l'appel courant. Un dispatch sur un seul CDC ne doit pas écraser les snapshots des autres CDC déjà traités.

### `config/trello`

Voir section [Configuration — Paramètres Trello](#configuration--paramètres-trello).

---

## Étape 1 — Mois du préterme

### Objectif

Confirmer le mois sur lequel porte le traitement. Ce mois est la **clé de référence** (`moisKey`) pour tout le workflow.

### Règle de validation

L'étape 1 est validée quand l'utilisateur confirme le mois.

### Comportement

- Date système lue automatiquement
- Le système propose `mois courant + 1` (ex : mars → avril 2026)
- L'utilisateur confirme ou modifie manuellement
- Une fois validé, le mois est figé — `moisKey` et `moisLabel` ne changent plus

### Données

```typescript
// Champs dans WorkflowState
moisKey: "2026-04"    // format YYYY-MM
moisLabel: "Avril 2026"
confirmeAt: string    // ISO date
```

---

## Étape 2 — Import & Seuils par agence

### Objectif

Importer les fichiers prétermes Excel des deux agences, paramétrer les seuils de filtrage, visualiser les KPIs, puis bloquer chaque agence pour figer les seuils.

### Règle de validation

L'étape 2 est validée quand les **deux agences sont bloquées**.

### Fichiers Excel

- Un fichier par agence, format `.xlsx`
- Le code agence est extrait du nom de fichier (ex : `H92083 LISTE PRETERMES DU Avr2026 BRANCHE AUTO.xlsx` → `H92083`)
- **Détection automatique** via `detectAgenceFromFilename` (importé de `preterme-parser.ts`)
- Fallback : sélection manuelle si la détection échoue

### Structure Excel — 20 colonnes (feuille `Feuil1`, ligne 1 = en-têtes)

| # | En-tête | Type | Notes |
|---|---|---|---|
| 1 | `Nom du client` | string | Routing CDC pour particuliers |
| 2 | `N° de Contrat` | string | **Clé de déduplication** |
| 3 | `Branche` | string | Toujours `"Auto"` |
| 4 | `Echéance principale` | date | ISO |
| 5 | `Code produit` | string/number | Ex : `NOA2`, `12222` |
| 6 | `Mode de règlement` | string | Ex : `PA` |
| 7 | `Code fractionnement` | string | Ex : `Mensuel` |
| 8 | `Prime TTC annuelle précédente` | number | En € |
| 9 | `Prime TTC annuelle actualisée` | number | En € |
| 10 | `Taux de variation` | number | **= Majoration** en % (ex : `48.86`) |
| 11 | `Surveillance portefeuille` | string | `Oui` / `Non` |
| 12 | `Avantage client` | number/string | Ex : `10` |
| 13 | `Formule` | string/number | Ex : `C2` |
| 14 | `Packs` | null/string | Souvent vide |
| 15 | `Nb sinistres` | number | |
| 16 | `Bonus/Malus` | number | Coefficient (ex : `0.57`) |
| 17 | `ETP` | number | Coefficient décimal (ex : `1.29` = 129 %) |
| 18 | `Code gestion centrale` | number/null | |
| 19 | `Taux de modulation commission` | number | |
| 20 | `Date d'effet du dernier avenant` | date | ISO |

> **Idempotence** : clé de déduplication = `moisKey` + `N° de Contrat`. Un contrat ne peut pas être importé deux fois sur le même mois — il est mis à jour, jamais dupliqué.

> **ETP** : valeurs décimales (ex : `1.29`). Seuil par défaut : `>= 1.20`.

### Critères de rétention

Un client est **retenu** si les **deux** conditions suivantes sont réunies :

| Critère | Colonne | Valeur par défaut |
|---|---|---|
| **Taux de variation** | col 10 | `>= 15` % |
| **ETP** | col 17 | `>= 1.20` |

Les seuils sont configurables indépendamment par agence. Modifier un seuil recalcule les KPIs en temps réel (preview sans ré-import).

### États d'une agence

| État | Description |
|---|---|
| `en_attente` | Fichier non importé |
| `importé` | Fichier chargé, seuils modifiables, KPIs visibles |
| `bloqué` | Seuils figés — agence prête pour la suite |

---

## Étape 3 — Classification IA (Gemini)

### Objectif

Classifier chaque client retenu en **Particulier** ou **Entreprise** via Gemini Flash, avec correction manuelle possible.

### Règle de validation

L'étape 3 est validée quand les **deux agences sont bloquées**.

### Comportement

- **Déclenchement automatique** à l'ouverture de l'étape
- Un appel Gemini par agence (batch de tous les clients retenus)
- Affichage en deux colonnes : `Particulier` | `Entreprise`
- Clic sur une carte → bascule dans l'autre colonne (toggle instantané)
- Correction marquée `corrigeParUtilisateur: true`

### Appel Gemini

**Input :**
```json
[
  { "numeroContrat": "60214313", "nomClient": "BARTHELEMY-RIO VIRGINIE" },
  { "numeroContrat": "60198742", "nomClient": "SARL DUPONT SERVICES" }
]
```

**System prompt :**
```
Tu es un classificateur. Pour chaque entrée, détermine si le nom correspond à un particulier
(nom + prénom d'une personne physique) ou à une entreprise (raison sociale, sigle, forme juridique
comme SARL, SAS, EURL, SA, SCI, AUTO-ENTREPRENEUR, etc.).

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ni après, sans balises markdown.
Format : [{ "numeroContrat": "...", "classification": "particulier" | "entreprise" }]

En cas d'ambiguïté, utilise "particulier" par défaut.
```

**Output :**
```json
[
  { "numeroContrat": "60214313", "classification": "particulier" },
  { "numeroContrat": "60198742", "classification": "entreprise" }
]
```

**Modèle** : `gemini-2.0-flash`
**Clé API** : `GEMINI_API_KEY` (`.env.local`)
**Fallback** : si la réponse n'est pas parseable → `particulier` par défaut

---

## Étape 4 — Gérants des entreprises

### Objectif

Saisir le nom du gérant pour chaque client classé **Entreprise**. Les particuliers ne sont pas concernés.

### Règle de validation

L'étape 4 est validée quand les **deux agences sont bloquées**.

### Règles

- Seuls les clients `classificationFinale === "entreprise"` sont affichés
- Champ `gerant` obligatoire — pas de valeur vide autorisée
- Les particuliers ont `gerant: null`

### Impact sur le routing (étape 5)

Le routing utilise la **première lettre du gérant** (pas du nom du client) pour les entreprises :

```typescript
// lib/services/preterme-router.ts
function getRoutingName(client): string {
  if (client.classificationFinale === "entreprise" && client.gerant?.trim()) {
    return client.gerant.trim()  // routing sur le gérant
  }
  return client.nomClient  // routing sur le nom client
}
```

---

## Étape 5 — Routing & Dispatch Trello

### Objectif

Visualiser la charge par CDC, puis créer les cartes Trello dans le tableau de chaque CDC.

### Routing — Règles

1. Extraire la première lettre du nom de routing (`getRoutingName` → gérant si entreprise, sinon nom client)
2. Normalisation : NFD → strip accents → uppercase → `[0]`
3. Chercher le CDC dont le tableau `letters` contient cette lettre
4. Si aucun CDC → client en erreur (`dispatchStatut: "erreur"`)
5. Si le CDC n'a pas `boardId` ou `lists.pretermeAuto` configuré → erreur

### Dispatch — Fonctionnement

- **Par CDC** : l'utilisateur peut dispatcher un CDC à la fois ou tous ensemble
- **Idempotence** : si `client.trelloCardId` est renseigné → mise à jour de la carte (`PUT /cards/:id`), pas de doublon
- **Position** : `pos: "bottom"` — cartes en fin de colonne
- **Retry 429** : `sleep(1500ms)` puis retry (max 2 tentatives)
- **Firestore** : mise à jour en dot-notation (`agences.H91358.clients`) pour éviter les conflits entre CDC dispatchés en parallèle

### Format carte Trello

**Titre :**
```
[AUTO] NOM DU CLIENT — Échéance JJ/MM/AAAA
```

**Date d'échéance** (`due`) : `echeancePrincipale` convertie en ISO, fixée à **midi UTC** pour éviter les décalages de fuseau. Uniquement sur les nouvelles cartes.

**Description :**
```markdown
## 🔴 DOUBLE ALERTE — Préterme Auto Avril 2026

🤖 Carte générée le 14/03/2026 à 10:32 — suivi proactif avant échéance du 04/04/2026.

---

## 🎯 Pourquoi ce client ?

- 📈 Majoration tarifaire : +48.86 % → dépasse le seuil de 15 % ✅
- 📊 ETP : 1.29 → dépasse le seuil de 1.2 ✅

- 🏷️ Profil : 👤 Particulier (détection IA)

---

## 📋 Fiche contrat

- 🔢 N° contrat      : 60214313
- 🚗 Code produit    : NOA2
- 📦 Formule         : C3
- 🔄 Fractionnement  : Mensuel
- 💳 Règlement       : PA
- 📝 Dernier avenant : 04/04/2025
- 📅 Échéance        : 04/04/2026

---

## 💶 Situation tarifaire

- Prime N-1          : 962,28 €
- Prime actualisée   : 1 078,44 €
- ⚠️ Variation       : +48.86 %
- ETP                : 1.29

---

## 🚨 Sinistralité (N-3)

- Nb sinistres    : ⚠️ 2
- Bonus/Malus     : 0.50
- Surveillance PF : Non
- Avantage client : 10

---

💡 Utilisez les checklists ci-dessous pour suivre vos actions, et les Commentaires pour noter chaque échange (date, canal, contenu, suite donnée).
```

**Niveau d'alerte dans le titre de description :**
- `🔴 DOUBLE ALERTE` : majo ET ETP dépassent les seuils
- `🟠 ALERTE` : un seul critère dépasse
- `🟡 SURVEILLANCE` : aucun critère (cas rare)

### Checklists Trello (créées uniquement à la première création — pas sur mise à jour)

**📬 Tentatives de contact** (6 items) :
- 📞 1er appel tenté — date : ___________
- ✅ Client joint
- 📱 SMS de relance — date : ___________
- 📧 Mail de relance — date : ___________
- 🎙️ Message vocal laissé — date : ___________
- 🔁 Rappel client reçu — date : ___________

**🤝 Entretien** (3 items) :
- 📅 Entretien planifié — date/heure : ___________
- ✅ Entretien réalisé
- 📝 Compte-rendu rédigé

**🏁 Résultat final** (4 items) :
- 🟢 Fidélisé — contrat maintenu
- 🔴 Résilié — départ client
- ⚫ Sans suite — client injoignable
- 🟡 En attente — suivi en cours

> Les checklists sont non-bloquantes : si la création échoue, la carte est quand même créée.

### Indicateurs UI (Step5Dispatch)

- Badge vert `X envoyées` quand un CDC est dispatché
- Bouton `↺ Renvoyer` → inline Oui / Non pour confirmation avant re-dispatch
- Toast Sonner : succès (vert), avertissement erreurs partielles (amber), erreur complète (rouge)
- Bannière erreur si l'agence est absente de la config Trello

### Statut dispatch agence

Calculé sur l'**ensemble** des clients retenus (pas seulement le CDC en cours) :

| Statut | Condition |
|---|---|
| `en_attente` | Au moins un client encore `en_attente` |
| `ok` | Tous traités, aucune erreur |
| `erreur` | Tous traités, au moins une erreur |

---

## Étape 6 — Rapport Slack

### Objectif

Envoyer une synthèse du traitement sur Slack. Se débloque quand les **deux agences** ont un `dispatchStatut` différent de `en_attente`.

### Canal cible

- **Production** : `CE58HNVF0`
- Scope Slack requis : `chat:write` **et** `chat:write.public` (pour les canaux publics sans le bot membre)
- Configuration bot : `https://api.slack.com/apps` → OAuth & Permissions → réinstaller l'app après ajout de scope

### Contenu du message Slack

Le message est généré à la volée depuis les données du workflow (`preterme_workflows/{moisKey}`) + la config Trello (`config/trello`). **Pas de dépendance aux snapshots** — les données CDC sont recalculées par `routeClientsTocdcs`.

```
📋 *Préterme Auto — Avril 2026*
_Traitement terminé le 14/03/2026_

*🏢 AGENCE H91358*
     • Contrats importés (fichier Avril 2026) : 450
     • Retenus (critères)  : 134  _(majo ≥ 15 % | ETP ≥ 1,20)_
     • Particuliers : 110   Entreprises : 24
     • Cartes Trello créées : 132 ✅

     Détail par CDC :
     › *Corentin* [A B C D E F G H] — 45/46 cartes _(⚠️ 1 err)_
     › *Emma* [I J K L M N O P Q] — 52/52 cartes ✅
     › *Donia* [R S T U V W X Y Z] — 35/36 cartes _(⚠️ 1 err)_

*🏢 AGENCE H92083*
     • Contrats importés (fichier Avril 2026) : 380
     • Retenus (critères)  : 98  _(majo ≥ 15 % | ETP ≥ 1,20)_
     • Particuliers : 80   Entreprises : 18
     • Cartes Trello créées : 98 ✅

     Détail par CDC :
     › *Joëlle* [A B C D E F G] — 27/28 cartes _(⚠️ 1 err)_
     › *Matthieu* [H I J K L M N] — 35/35 cartes ✅
     › *Sandra* [O P Q R S T U V W X Y Z] — 36/35 cartes ✅

─────────────────────────────────
*📊 TOTAL CONSOLIDÉ — 2 agences*
• Contrats importés : 830
• Retenus      : 232
• Cartes créées: 230   ⚠️ Erreurs : 2
```

### Idempotence

- Une fois envoyé, `slackEnvoye: true` et `statut: "terminé"` sont écrits dans Firestore
- L'UI affiche `Rapport envoyé sur Slack` et masque le bouton d'envoi

---

## Snapshot historique

### Objectif

Figer la répartition par CDC au moment du dispatch. Permet de répondre à "qui a traité quoi ce mois-là ?" même si la config Trello a changé depuis.

### Déclenchement

Automatique, invisible, au moment du dispatch (étape 5).

### Règles importantes

1. **Écriture sélective** : on n'écrit que les snapshots des CDC dispatchés dans *cet* appel — pas de réécriture des CDC déjà traités.
2. **Comptage correct** : `cartesCreees` est calculé depuis l'état complet des `updatedClients` (pas seulement les clients du batch courant).
3. **Indépendance** : les données sont copiées — modifier ou supprimer un CDC dans les paramètres n'altère pas les snapshots passés.

### Collection Firestore : `preterme_snapshots`

```typescript
// Document : {moisKey}_{cdcId}
type SnapshotCdc = {
  moisKey: string
  snapshotAt: string        // ISO
  cdcId: string
  cdcPrenom: string         // copie au moment du dispatch
  codeAgence: string
  lettresAttribuees: string[]
  clientsTotal: number
  particuliers: number
  entreprises: number
  cartesCreees: number
}
```

---

## Configuration — Paramètres Trello

### Page admin

`/admin/parametres-trello`

### Collection Firestore : `config/trello`

```typescript
type TrelloConfig = {
  agencies: Agency[]
}

type Agency = {
  code: string          // ex: "H91358" — doit correspondre EXACTEMENT au code dans le nom de fichier
  name: string          // ex: "Kennedy"
  cdc: CDC[]
}

type CDC = {
  id: string            // ex: "corentin" — stable, jamais modifié
  firstName: string     // ex: "Corentin" — affiché dans l'UI
  letters: string[]     // ex: ["A","B","C","X"] — lettres individuelles, sans doublons
  boardId?: string      // Trello board ID
  lists?: {
    pretermeAuto?: string   // Trello list ID de la colonne "Préterme Auto"
    processM3?: string
    pretermeIrd?: string
  }
}
```

### Règles de configuration

- `CDC.boardId` et `CDC.lists` sont **optionnels** — seul le prénom est requis pour créer un CDC
- `isTrelloComplete(cdc)` : `true` si `boardId` + les 3 list IDs sont renseignés
- `CdcCard` : badge **orange** si Trello manquant, **vert** si complet
- Code agence dans la config **doit matcher** le code dans le nom de fichier Excel (ex : `H91358`, pas `Kennedy`)
- Ajout d'une agence via `<select>` sur les codes connus (`H91358`, `H92083`) — pas de saisie libre

### Routing des lettres

- Les lettres couvrent idéalement l'alphabet complet sans doublons (responsabilité de la configuration)
- Lettre non couverte → client en erreur, non dispatché
- CDC sans Trello configuré → client en erreur, non dispatché

---

## IA — Gemini Flash

### Modèle

`gemini-2.0-flash`

### Usage dans le workflow

Uniquement à l'**étape 3** — classification Particulier / Entreprise.

### Clé API

`GEMINI_API_KEY` dans `.env.local`

### Gestion des erreurs

| Cas | Comportement |
|---|---|
| Réponse non parseable | Retry 1 fois, puis fallback `particulier` |
| `numeroContrat` absent dans la réponse | Client marqué `particulier` |
| Timeout / erreur réseau | Retry 1 fois, puis erreur affichée à l'utilisateur |

---

## Design — Charte visuelle

### Palette

| Rôle | Valeur | Usage |
|---|---|---|
| Background principal | `#0e0c1a` | Page, layout global |
| Surface card | `rgba(255,255,255,0.03)` | Cartes, panneaux |
| Surface card active | `rgba(155,135,245,0.06)` | Élément sélectionné |
| Bordure subtile | `rgba(255,255,255,0.08)` | Bordures au repos |
| Accent violet | `#9b87f5` | Éléments principaux |
| Accent vert | `#2dc596` | Succès, badges Auto |
| Accent amber | `#ef9f27` | Badges IA / Gemini |
| Texte primaire | `#f0eeff` | Titres |
| Texte secondaire | `rgba(200,196,230,0.55)` | Descriptions |

### Typographie

| Élément | Police | Taille | Poids |
|---|---|---|---|
| Titres | **Syne** | 20–22px | 700 |
| Labels étape | **DM Mono** | 11px | 600 |
| Corps | **DM Sans** | 13–14px | 400 |

### Composants — principes

**Cards** : `background: rgba(255,255,255,0.03)` + `backdrop-filter: blur(8px)` + `border: 0.5px solid rgba(255,255,255,0.08)` + `border-radius: 14px`

**Boutons d'action** : fond transparent au repos, glow `box-shadow: 0 0 16px rgba(X,X,X,0.15)` sur état actif

**Badges** : trois variantes — violet (lock), amber (IA), vert (auto)

---

## Points techniques critiques

### Firestore — `undefined` non accepté par l'admin SDK

Le SDK admin Firestore rejette silencieusement les champs `undefined` (erreur 500 côté serveur). Toujours utiliser `null` pour les champs optionnels absents.

```typescript
// ❌ Erreur
dispatchErreur: undefined

// ✅ Correct
dispatchErreur: null
```

Le type `dispatchErreur` est donc `string | null` (pas `string | undefined`).

### Firestore — Anti-cache côté client

Après un dispatch (écrit via l'admin SDK), un `getDoc` côté client peut retourner des données en cache stale. Utiliser `getDocFromServer` :

```typescript
// lib/firebase/preterme.ts
import { getDocFromServer } from "firebase/firestore"
const snap = await getDocFromServer(doc(db, "preterme_workflows", moisKey))
```

### Firestore — Dot-notation pour éviter les race conditions

Lors du dispatch de plusieurs CDC en parallèle, utiliser la dot-notation pour n'écraser que les champs concernés :

```typescript
await workflowRef.update({
  [`agences.${codeAgence}.clients`]: updatedClients,
  [`agences.${codeAgence}.dispatchStatut`]: agenceDispatchStatut,
})
```

### Dispatch — Gestion du body vide sur erreur 500

Si la route API lève une exception non gérée, le body peut être vide. Le client doit gérer `SyntaxError` :

```typescript
let data: { error?: string } = {}
try { data = await res.json() } catch { /* body vide */ }
if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`)
```

### Slack — Scopes requis

| Scope | Rôle |
|---|---|
| `chat:write` | Envoyer dans les canaux où le bot est membre |
| `chat:write.public` | Envoyer dans les canaux publics sans être membre |

Après ajout d'un scope sur `api.slack.com` → **réinstaller l'app** dans le workspace (le token reste identique, les scopes sont mis à jour).

### Rapport Slack — Source de données

Le rapport Slack est calculé **à la volée** depuis `workflow.agences[code].clients` + la config Trello, via `routeClientsTocdcs`. Il n'utilise pas la collection `preterme_snapshots` (qui peut être incomplète si certains CDC n'ont pas encore été dispatchés).

---

> Dernière mise à jour : 14/03/2026 — Workflow complet, opérationnel en production.
