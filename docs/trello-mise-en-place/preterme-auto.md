# Workflow — Préterme Auto

## Table des Matières

1. [Contexte métier](#contexte-métier)
2. [Architecture — Fichiers clés](#architecture--fichiers-clés)
3. [Collections Firestore](#collections-firestore)
4. [Navigation multi-mois & persistance](#navigation-multi-mois--persistance)
5. [Étape 1 — Mois du préterme](#étape-1--mois-du-préterme)
6. [Étape 2 — Import & Seuils par agence](#étape-2--import--seuils-par-agence)
7. [Étape 3 — Classification IA (Gemini)](#étape-3--classification-ia-gemini)
8. [Étape 4 — Gérants des entreprises](#étape-4--gérants-des-entreprises)
9. [Étape 5 — Routing & Dispatch Trello](#étape-5--routing--dispatch-trello)
10. [Étape 6 — Rapport Slack](#étape-6--rapport-slack)
11. [Histogramme historique](#histogramme-historique)
12. [Snapshot historique CDC](#snapshot-historique-cdc)
13. [Configuration — Paramètres Trello](#configuration--paramètres-trello)
14. [Mémoire gérants](#mémoire-gérants)
15. [IA — Gemini Flash](#ia--gemini-flash)
16. [Design — Charte visuelle](#design--charte-visuelle)
17. [Points techniques critiques](#points-techniques-critiques)

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
| `types/preterme.ts` | Toutes les interfaces TypeScript du workflow (`WorkflowState`, `ClientImporte`, `AgenceState`, `SnapshotCdc`) |

### Services métier

| Fichier | Rôle |
|---|---|
| `lib/utils/preterme-parser.ts` | Parser ExcelJS — 20 colonnes, mapping headers, normalisation, détection agence depuis nom de fichier |
| `lib/services/preterme-anomaly.ts` | Filtrage métier (seuils majo/ETP), calcul stats preview |
| `lib/services/preterme-gemini.ts` | Classificateur Gemini batch, JSON strict, fallback `particulier` |
| `lib/services/preterme-router.ts` | Routing par lettre/gérant → CDC, gestion absences |
| `lib/services/preterme-trello.ts` | Dispatch Trello — titre, description, checklists, due date, retry 429 |

### Firebase client

| Fichier | Rôle |
|---|---|
| `lib/firebase/preterme.ts` | CRUD Firestore — `getDocFromServer` (anti-cache), `getAllWorkflows`, mémoire gérants |

### API Routes

| Route | Méthode | Rôle |
|---|---|---|
| `/api/admin/preterme-auto/upload` | POST | Import fichier Excel — idempotence sur `moisKey + numeroContrat` |
| `/api/admin/preterme-auto/classify` | POST | Filtrage seuils + Gemini + écriture Firestore batch |
| `/api/admin/preterme-auto/dispatch` | POST | Routing + création cartes Trello + snapshots CDC |
| `/api/admin/preterme-auto/slack` | POST | Génération rapport + `chat.postMessage` sur la chaîne cible |
| `/api/admin/preterme-auto/trello-lists` | GET | Liste les colonnes ouvertes d'un board Trello (params: boardId, apiKey, token) |
| `/api/admin/slack/channels` | GET | Liste toutes les chaînes Slack publiques (pagination, triées par nom) |

### Composants UI

| Composant | Rôle |
|---|---|
| `components/preterme/TimelineSidebar.tsx` | Sidebar gauche : timeline 6 étapes, sélecteur de mois dropdown, bouton histogramme |
| `components/preterme/HistoPanel.tsx` | Panel histogramme Recharts — importés & retenus par agence au fil du temps |
| `components/preterme/Step1Mois.tsx` | Étape 1 — Confirmation du mois |
| `components/preterme/Step2Import.tsx` | Étape 2 — Upload Excel, seuils, KPIs par agence |
| `components/preterme/Step3Classification.tsx` | Étape 3 — Classification IA + correction manuelle |
| `components/preterme/Step4Gerants.tsx` | Étape 4 — Saisie gérants entreprises |
| `components/preterme/Step5Dispatch.tsx` | Étape 5 — Aperçu routing + dispatch Trello |
| `components/preterme/Step6Slack.tsx` | Étape 6 — Sélecteur chaîne Slack + envoi rapport |

**Page principale** : `app/admin/preterme-auto/page.tsx`

> Les routes `/admin/preterme-auto/historique/[moisKey]` et `/admin/preterme-ird/historique/[moisKey]` redirigent automatiquement vers la page principale (les anciennes pages utilisaient des types supprimés et ont été remplacées par des stubs de redirection).

---

## Collections Firestore

### `preterme_workflows`

Document : `{moisKey}` (ex : `2026-04`)

```typescript
type WorkflowState = {
  moisKey: string               // "2026-04"
  moisLabel: string             // "Avril 2026"
  confirmeAt: string            // ISO
  etapeActive: 1 | 2 | 3 | 4 | 5 | 6   // vue active (peut régresser si navigation arrière)
  statut: "en_cours" | "terminé"
  slackEnvoye?: boolean

  agences: {
    [codeAgence: string]: AgenceState   // ex: "H91358", "H92083"
  }
}

type AgenceState = {
  fichierNom: string
  clientsTotal: number
  seuilMajo: number             // % — ex: 15
  seuilEtp: number              // coefficient — ex: 1.20
  clientsRetenus: number
  etape2Statut: "en_attente" | "importé" | "bloqué"
  etape3Statut: "en_attente" | "analysé" | "bloqué"
  etape4Statut: "en_attente" | "complet" | "bloqué"
  dispatchStatut: "en_attente" | "ok" | "erreur"
  clients: ClientImporte[]      // tableau complet, mis à jour à chaque étape
}

type ClientImporte = {
  // 20 champs Excel
  nomClient: string
  numeroContrat: string         // clé de déduplication
  branche: string
  echeancePrincipale: string
  codeProduit: string | number
  modeReglement: string
  codeFractionnement: string
  primePrecedente: number
  primeActualisee: number
  tauxVariation: number
  surveillancePortefeuille: string
  avantageClient: number | string
  formule: string | number
  packs: string | null
  nbSinistres: number
  bonusMalus: number
  etp: number
  codeGestionCentrale: number | null
  tauxModulationCommission: number
  dateEffetDernierAvenant: string

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

### `preterme_snapshots`

Document : `{moisKey}_{cdcId}` — un document par CDC par mois, écrit au moment du dispatch.

```typescript
type SnapshotCdc = {
  moisKey: string
  snapshotAt: string            // ISO
  cdcId: string
  cdcPrenom: string             // copie figée — indépendant de la config actuelle
  codeAgence: string
  lettresAttribuees: string[]   // copie figée au moment du dispatch
  clientsTotal: number
  particuliers: number
  entreprises: number
  cartesCreees: number          // calculé sur l'état complet des clients (pas que le batch)
}
```

> **Important** : les snapshots ne sont écrits que pour les CDC dispatchés dans *cet* appel — pas de réécriture des CDC déjà traités.

### `preterme_gerants`

Document : `{nomClient normalisé}` — mémoire persistante des gérants d'une session à l'autre.

```typescript
// Document ID = nomClient.trim().toUpperCase().replace(/\//g, "_")
{
  nomClient: string
  gerant: string
  updatedAt: string   // ISO
}
```

> À l'ouverture de l'étape 4, le système précharge automatiquement les gérants mémorisés pour les entreprises du mois en cours. Le gérant est sauvegardé définitivement au blocage de l'agence.

### `config/trello`

Voir section [Configuration — Paramètres Trello](#configuration--paramètres-trello).

---

## Navigation multi-mois & persistance

### Principe

Au chargement de la page, **tous** les workflows Firestore sont chargés via `getAllWorkflows()` (tri DESC par `moisKey`). La sélection automatique suit cette priorité :

1. Le workflow avec `statut === "en_cours"` (s'il existe)
2. Sinon le plus récent (index 0 du tableau trié)

Cela garantit que la reconnexion après un workflow terminé (`statut: "terminé"`) continue d'afficher les données — et non une page vierge.

### `etapeMax` vs `etapeActive`

Ces deux états sont **indépendants** dans `page.tsx` :

| État | Rôle | Régresse ? |
|---|---|---|
| `etapeActive` | Vue actuellement affichée | Oui (navigation libre vers l'arrière) |
| `etapeMax` | Plus haute étape atteinte — contrôle les verrouillages de la sidebar | **Non** — ne peut qu'augmenter |

```typescript
// handleAdvance — avance et met à jour etapeMax
const next = Math.min(6, workflow.etapeActive + 1)
setEtapeMax(prev => Math.max(prev, next))

// handleStepClick — navigation libre, etapeMax inchangé
setWorkflow(prev => prev ? { ...prev, etapeActive: step } : prev)
```

### Sidebar — Dropdown mois

Le dropdown en haut de la `TimelineSidebar` liste tous les workflows chargés avec leur statut :
- ✅ `CheckCircle2` vert → `statut: "terminé"`
- ⏳ `Clock` violet → `statut: "en_cours"`

L'option **"Nouveau mois"** en bas du dropdown ramène à l'étape 1 pour démarrer un nouveau cycle.

### Workflow en_cours existant

Si l'utilisateur tente de démarrer un nouveau mois alors qu'un workflow est déjà `en_cours`, une modale de confirmation s'affiche :
> « Archiver [mois actuel] et démarrer [nouveau mois] ? »

L'archivage met `statut: "terminé"` sur l'ancien, puis crée le nouveau workflow.

---

## Étape 1 — Mois du préterme

### Objectif

Confirmer le mois sur lequel porte le traitement. Ce mois est la **clé de référence** (`moisKey`) pour tout le workflow.

### Comportement

- Date système lue automatiquement
- Proposition par défaut : `mois courant + 1` (ex : mars → avril 2026)
- L'utilisateur confirme ou modifie manuellement
- Une fois validé, `moisKey` et `moisLabel` sont figés pour ce workflow

### Données

```typescript
moisKey: "2026-04"     // format YYYY-MM
moisLabel: "Avril 2026"
confirmeAt: string     // ISO date de confirmation
```

---

## Étape 2 — Import & Seuils par agence

### Objectif

Importer les fichiers prétermes Excel des deux agences, paramétrer les seuils de filtrage, visualiser les KPIs, puis bloquer chaque agence pour figer les seuils.

### Règle de validation

L'étape 2 est validée quand les **deux agences sont bloquées**.

### Fichiers Excel

- Un fichier `.xlsx` par agence
- Code agence extrait automatiquement du nom de fichier via `detectAgenceFromFilename` (ex : `H92083 LISTE PRETERMES DU Avr2026 BRANCHE AUTO.xlsx` → `H92083`)
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

> **Idempotence** : clé `moisKey` + `N° de Contrat`. Un contrat ne peut pas être importé deux fois sur le même mois — il est mis à jour, jamais dupliqué.

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

- Déclenchement automatique à l'ouverture de l'étape
- Un appel Gemini par agence (batch de tous les clients retenus)
- Affichage en deux colonnes : `Particulier` | `Entreprise`
- Clic sur une carte → bascule dans l'autre colonne (toggle instantané)
- Correction marquée `corrigeParUtilisateur: true`

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

**Input :**
```json
[
  { "numeroContrat": "60214313", "nomClient": "BARTHELEMY-RIO VIRGINIE" },
  { "numeroContrat": "60198742", "nomClient": "SARL DUPONT SERVICES" }
]
```

**Output :**
```json
[
  { "numeroContrat": "60214313", "classification": "particulier" },
  { "numeroContrat": "60198742", "classification": "entreprise" }
]
```

**Fallback** : si la réponse n'est pas parseable → `particulier` par défaut

---

## Étape 4 — Gérants des entreprises

### Objectif

Saisir le nom du gérant pour chaque client classé **Entreprise**. Les particuliers ne sont pas concernés.

### Règle de validation

L'étape 4 est validée quand les **deux agences sont bloquées**.

### Mémoire automatique

À l'ouverture de l'étape, le système consulte `preterme_gerants` pour pré-remplir les gérants déjà connus (même entreprise d'un mois précédent). Voir section [Mémoire gérants](#mémoire-gérants).

### Règles

- Seuls les clients `classificationFinale === "entreprise"` sont affichés
- Les particuliers ont `gerant: null`

### Impact sur le routing (étape 5)

Le routing utilise la **première lettre du gérant** (pas du nom du client) pour les entreprises :

```typescript
// lib/services/preterme-router.ts
function getRoutingName(client): string {
  if (client.classificationFinale === "entreprise" && client.gerant?.trim()) {
    return client.gerant.trim()   // routing sur le gérant
  }
  return client.nomClient          // routing sur le nom client
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
- **Idempotence** : si `client.trelloCardId` est renseigné → mise à jour de la carte existante (`PUT /cards/:id`), jamais de doublon
- **Position** : `pos: "bottom"` — cartes créées en fin de colonne (figé, non configurable)
- **Retry 429** : `sleep(1500ms)` puis retry (max 2 tentatives)
- **Firestore** : mise à jour en dot-notation pour éviter les race conditions entre CDC parallèles

```typescript
await workflowRef.update({
  [`agences.${codeAgence}.clients`]: updatedClients,
  [`agences.${codeAgence}.dispatchStatut`]: agenceDispatchStatut,
})
```

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

💡 Utilisez les checklists ci-dessous pour suivre vos actions.
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

> Les checklists sont non-bloquantes : si leur création échoue, la carte est quand même créée.

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

Envoyer une synthèse du traitement sur Slack. Se débloque quand les deux agences ont un `dispatchStatut` différent de `en_attente`.

### Sélection de la chaîne cible

L'utilisateur sélectionne la chaîne Slack **avant** d'envoyer. Le picker est toujours visible, même après un premier envoi :

1. **Affichage** : chaîne actuelle + bouton "Changer"
2. **Picker dépliable** : recherche par nom ou ID, bouton "Actualiser", liste paginée des chaînes publiques
3. **Envoi** : bouton unique qui adapte son label — "Envoyer vers #canal" (premier envoi) ou "Renvoyer vers #canal" (renvoi)
4. **Badge informatif** : si `slackEnvoye: true`, un badge vert non-bloquant informe que le rapport a déjà été envoyé — mais le picker et le bouton restent actifs pour envoyer vers une autre chaîne

**Chaîne par défaut** : `CE58HNVF0`

### API `/api/admin/slack/channels`

Retourne toutes les chaînes publiques non archivées, triées alphabétiquement.

```typescript
// Appel
GET /api/admin/slack/channels
// ou avec token explicite :
GET /api/admin/slack/channels?token=xoxb-...

// Réponse
{ channels: [{ id, name, is_private, num_members }], total: number }
```

- Utilise `SLACK_BOT_TOKEN` (env var) si aucun token en query param
- Pagination Slack : boucle sur `next_cursor` jusqu'à exhaustion (max 1000 par page)
- Limité à `types: public_channel` (contournement du scope `groups:read` non accordé)

### Scopes Slack requis

| Scope | Rôle |
|---|---|
| `chat:write` | Envoyer dans les canaux où le bot est membre |
| `chat:write.public` | Envoyer dans les canaux publics sans être membre |
| `channels:read` | Lister les chaînes publiques pour le picker |

> Après ajout d'un scope sur `api.slack.com` → **réinstaller l'app** dans le workspace.

### Format du message Slack

Le message est généré à la volée depuis `preterme_workflows/{moisKey}` + `config/trello`. Il n'utilise **pas** les snapshots (données CDC recalculées via `routeClientsTocdcs`).

La génération se fait en **deux passes** : totaux globaux d'abord, puis blocs par agence (pour calculer les pourcentages correctement).

```
🚗 *Préterme Auto — Avril 2026*
_Traitement du 14/03/2026 · 2 agences_

📊 Nbre de contrats dans le préterme : *248*
✅ Nbre retenu : *131*
🃏 Nbre de cartes Trello : *131/131* ✅

━━━━━━━━━━━━━━━━━━━

🏢 *H91358* — 83 retenus (33% / 248)
Donia: 40 — Corentin: 26 — Emma: 17

🏢 *H92083* — 48 retenus (19% / 248)
Joëlle: 28 — Sandra: 20
```

**Détail du format :**
- **Pourcentage** : `retenus agence / total importés global × 100` (arrondi entier)
- **CDC** : format `Prénom: total_routés`, séparés par ` — `, triés par volume décroissant
- **Erreur sur CDC** : `Donia: 40 _(⚠️ 2 err)_`
- **⚠️ sur l'agence** : ajouté si au moins une erreur de dispatch

### Idempotence Slack

Après envoi réussi, Firestore est mis à jour :
```typescript
{ slackEnvoye: true, statut: "terminé" }
```
L'utilisateur **peut renvoyer** vers une autre chaîne — l'envoi n'est pas bloqué. Le badge informatif vert s'affiche mais ne bloque rien.

---

## Histogramme historique

### Accès

Bouton `BarChart2` dans le footer de la `TimelineSidebar` (à droite du pourcentage de progression). S'allume en violet quand le panel est ouvert.

### Comportement

Le panel `HistoPanel` s'insère entre la sidebar et le contenu principal :
- **Largeur** : 420px, `flexShrink: 0`
- **Données** : issues de `allWorkflows` déjà en mémoire — aucun appel Firestore supplémentaire, instantané quel que soit le mois sélectionné
- **Visible à tout moment**, indépendant du mois courant affiché

### Contenu

- **Toggle** : `Importés` / `Retenus` (onglets en haut)
- **KPI pills** : total cumulé sur tous les mois par agence (`H91358` violet, `H92083` vert)
- **BarChart Recharts** :
  - Axe X : mois triés chronologiquement (ASC)
  - Barres groupées : une couleur par agence
  - Tooltip dark mode personnalisé
  - `barCategoryGap: 30%`, `barGap: 2`, coins arrondis `[3,3,0,0]`

### Métriques

| Toggle | Source de données |
|---|---|
| Importés | `agence.clientsTotal` |
| Retenus | `agence.clients.filter(c => c.retenu).length` |

---

## Snapshot historique CDC

### Objectif

Figer la répartition par CDC au moment du dispatch. Permet de répondre à "qui a traité quoi ce mois-là ?" même si la config Trello a changé depuis.

### Déclenchement

Automatique, invisible, au moment du dispatch (étape 5).

### Règles importantes

1. **Écriture sélective** : on n'écrit que les snapshots des CDC dispatchés dans *cet* appel — pas de réécriture des CDC déjà traités.
2. **Comptage correct** : `cartesCreees` est calculé depuis l'état complet des clients (pas seulement le batch courant).
3. **Indépendance** : les données sont copiées — modifier ou supprimer un CDC dans les paramètres n'altère pas les snapshots passés.

**Collection** : `preterme_snapshots`, document ID : `{moisKey}_{cdcId}`

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
  firstName: string     // ex: "Corentin"
  letters: string[]     // ex: ["A","B","C","X"] — lettres individuelles, sans doublons
  boardId?: string      // Trello board ID
  lists?: {
    pretermeAuto?: string   // Trello list ID de la colonne cible
    processM3?: string
    pretermeIrd?: string
  }
  trelloListName?: string   // Nom affiché de la colonne (renseigné par le TrelloListPicker)
}
```

### Règles de configuration

- `CDC.boardId` et `CDC.lists` sont **optionnels** — seul le prénom est requis pour créer un CDC
- `isTrelloComplete(cdc)` : `true` si `boardId` + les 3 list IDs sont renseignés
- `CdcCard` : badge **orange** si Trello manquant, **vert** si complet
- Code agence dans la config **doit matcher** le code dans le nom de fichier Excel (ex : `H91358`, pas `Kennedy`)

### TrelloListPicker

Dans `ConfigurationStep`, bouton "Chercher une colonne" → ouvre un picker qui :
1. Appelle `GET /api/admin/preterme-auto/trello-lists?boardId=...&apiKey=...&token=...`
2. Liste les colonnes ouvertes du board
3. Auto-remplit `trelloListId` + `trelloListName` dans la config CDC

Les credentials Trello utilisés dans le picker sont **temporaires** (non sauvegardés dans Firestore).

---

## Mémoire gérants

### Problème résolu

Chaque mois, des entreprises récurrentes réapparaissent dans le préterme. Sans mémoire, le CDC doit re-saisir le gérant à chaque mois pour les mêmes clients.

### Fonctionnement

```typescript
// Collection : preterme_gerants
// Document ID = nomClient.trim().toUpperCase().replace(/\//g, "_")
```

À l'**ouverture de l'étape 4** : `getGerantsMemo(nomClients)` est appelé pour toutes les entreprises. Les gérants connus sont pré-remplis automatiquement.

Au **blocage d'agence** : `saveGerantsMemo(entries)` persiste tous les gérants renseignés (upsert). Si un gérant a changé depuis le dernier mois, la mémoire est mise à jour.

### Clé de normalisation

```typescript
function gerantDocId(nomClient: string): string {
  return nomClient.trim().toUpperCase().replace(/\//g, "_")
}
```

Les slashes sont remplacés par `_` car Firestore n'accepte pas `/` dans les document IDs.

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
| Timeout / erreur réseau | Retry 1 fois, puis erreur affichée |

---

## Design — Charte visuelle

### Palette

| Rôle | Valeur | Usage |
|---|---|---|
| Background principal | `#0e0c1a` | Page, layout global |
| Surface card | `rgba(255,255,255,0.03)` | Cartes, panneaux |
| Surface card active | `rgba(155,135,245,0.06)` | Élément sélectionné |
| Bordure subtile | `rgba(255,255,255,0.08)` | Bordures au repos |
| Accent violet | `#9b87f5` | Éléments principaux, H91358 |
| Accent vert | `#2dc596` | Succès, badges Auto, H92083 |
| Accent amber | `#ef9f27` | Badges IA / Gemini |
| Texte primaire | `#f0eeff` | Titres |
| Texte secondaire | `rgba(200,196,230,0.55)` | Descriptions |

### Typographie

| Élément | Police | Taille | Poids |
|---|---|---|---|
| Titres | **Syne** | 20–22px | 700 |
| Labels étape / codes | **DM Mono** | 10–12px | 600 |
| Corps | **DM Sans** | 13–14px | 400 |

### Composants — principes

**Cards** : `background: rgba(255,255,255,0.03)` + `backdrop-filter: blur(8px)` + `border: 0.5px solid rgba(255,255,255,0.08)` + `border-radius: 14px`

**Boutons d'action** : fond transparent au repos, `box-shadow: 0 0 16px rgba(X,X,X,0.15)` sur état actif

**Badges** : trois variantes — violet (lock/progression), amber (IA), vert (auto/succès)

---

## Points techniques critiques

### 1. Firestore — `undefined` non accepté par l'admin SDK

Le SDK admin Firestore rejette silencieusement les champs `undefined` (erreur 500 côté serveur). Toujours utiliser `null` pour les champs optionnels absents.

```typescript
// ❌ Erreur silencieuse
dispatchErreur: undefined

// ✅ Correct
dispatchErreur: null
```

Le type `dispatchErreur` est `string | null` (pas `string | undefined`).

### 2. Firestore — Anti-cache côté client

Après un dispatch (écrit via l'admin SDK), un `getDoc` côté client peut retourner des données en cache stale. Utiliser `getDocFromServer` :

```typescript
// lib/firebase/preterme.ts
import { getDocFromServer } from "firebase/firestore"
const snap = await getDocFromServer(doc(db, "preterme_workflows", moisKey))
```

### 3. Firestore — Dot-notation pour éviter les race conditions

Lors du dispatch de plusieurs CDC en parallèle, utiliser la dot-notation pour n'écraser que les champs concernés :

```typescript
await workflowRef.update({
  [`agences.${codeAgence}.clients`]: updatedClients,
  [`agences.${codeAgence}.dispatchStatut`]: agenceDispatchStatut,
})
```

### 4. Dispatch — Gestion du body vide sur erreur 500

Si la route API lève une exception non gérée, le body peut être vide. Le client doit gérer `SyntaxError` :

```typescript
let data: { error?: string } = {}
try { data = await res.json() } catch { /* body vide */ }
if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`)
```

### 5. Build Turbopack — Fichiers legacy exclus de tsconfig

Turbopack ne respecte pas totalement `tsconfig.json exclude` pour le type-checking. Les fichiers legacy utilisant d'anciens types (`preterme-anomaly.ts`, `preterme-agence.ts`, etc.) ont reçu `// @ts-nocheck` en tête de fichier pour bloquer les erreurs de build.

Liste des fichiers concernés (exclus de la compilation active) :
- `lib/services/preterme-anomaly.ts`
- `lib/services/preterme-ird-anomaly.ts`
- `lib/services/preterme-ird-trello.ts`
- `lib/services/preterme-ird-slack.ts`
- `lib/services/preterme-slack.ts`
- `lib/utils/preterme-agence.ts`
- `lib/utils/preterme-ird-parser.ts`
- `lib/utils/preterme-quality.ts`
- `lib/firebase/preterme-ird.ts`

### 6. Slack — Scope `groups:read` non accordé

Le bot Slack n'a pas le scope `groups:read` (nécessaire pour lister les chaînes privées). L'API `/api/admin/slack/channels` est limitée à `types: public_channel` pour contourner ce problème.

### 7. Persistance reconnexion — `getAllWorkflows` vs `getActiveWorkflow`

L'ancienne implémentation utilisait `getActiveWorkflow()` (filtre `statut === "en_cours"`). Si le workflow du mois était terminé, la page affichait un état vierge après reconnexion.

La solution : `getAllWorkflows()` charge **tous** les workflows, avec priorité `en_cours` sinon le plus récent (trié DESC par `moisKey`).

### 8. Rapport Slack — Deux passes obligatoires

La fonction `buildSlackMessage` doit calculer les totaux globaux **avant** de construire les blocs par agence (pour calculer le pourcentage `retenus / grandTotalClients`). Une boucle unique produit des pourcentages incorrects si les totaux sont accumulés en parallèle de la construction des blocs.

```typescript
// Passe 1 — totaux globaux
for (const code of agenceCodes) { ... grandTotalClients += ... }

// Passe 2 — blocs par agence (utilise grandTotalClients)
const agenceBlocks = agenceCodes.map(code => {
  const pct = Math.round(retenus.length / grandTotalClients * 100)
  ...
})
```

---

> Dernière mise à jour : 14/03/2026 — Workflow complet, opérationnel en production.
