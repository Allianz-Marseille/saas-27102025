# Workflow — Préterme Auto (from scratch)

## Table des Matières

1. [Étape 1 — Détermination du mois du préterme](#étape-1--détermination-du-mois-du-préterme)
2. [Étape 2 — Import & Filtrage par agence](#étape-2--import--filtrage-par-agence)
3. [Étape 3 — Classification Particulier / Entreprise](#étape-3--classification-particulier--entreprise)
4. [Étape 4 — Détermination des gérants](#étape-4--détermination-des-gérants)
5. [Étape 5 — Routing & Dispatch Trello](#étape-5--routing--dispatch-trello)
6. [Étape 6 — Rapport Slack](#étape-6--rapport-slack)
7. [Arrière-plan — Snapshot historique](#arrière-plan--snapshot-historique)
8. [Persistance — État du workflow](#persistance--état-du-workflow)
9. [Configuration — Trello & CDC](#configuration--trello--cdc)
10. [IA — Gemini Flash](#ia--gemini-flash)

---

## Contexte — Qu'est-ce qu'un préterme ?

Un **préterme** est un contrat dont l'échéance principale arrive le mois suivant.

> Exemple : en **mars**, Allianz génère la liste des contrats qui arrivent à échéance en **avril**. C'est sur cette liste qu'on intervient — en mars — pour décider si on corrige, relance ou laisse partir le client avant que l'appel de cotisation parte.

Le mois du préterme est donc toujours **mois courant + 1**.

---

## Étape 1 — Détermination du mois du préterme

### Objectif

Confirmer le mois sur lequel porte le traitement avant toute action. C'est le contexte de référence pour tout le workflow.

---

### Règle de validation de l'étape

> L'étape 1 est **validée** quand l'utilisateur a confirmé le mois du préterme.

---

### Comportement

- La date système est lue automatiquement
- Le système propose le mois suivant comme mois du préterme (ex : si on est en **mars 2026**, le système propose **avril 2026**)
- L'utilisateur confirme ou modifie manuellement
- Une fois validé, le mois est figé pour tout le workflow en cours

---

### Schéma de données (ébauche)

```typescript
type MoisPreterme = {
  moisKey: string    // ex: "2026-04" — clé unique du workflow
  moisLabel: string  // ex: "Avril 2026" — affiché dans l'UI
  confirmeAt: Date
}
```

---

## Étape 2 — Import & Filtrage par agence

### Objectif

Importer les fichiers prétermes des deux agences, paramétrer les seuils de filtrage, visualiser les KPIs et valider les volumes avant de poursuivre.

---

### Règle de validation de l'étape

> L'étape 2 est **validée** quand les **deux agences sont bloquées**.

---

### Fichiers à importer

- Un fichier par agence (format Excel)
- Le **code agence** est présent dans le nom du fichier (ex : `H92083 LISTE PRETERMES DU Avr2026 BRANCHE AUTO.xlsx`)
- Il faut exactement **2 fichiers** pour pouvoir valider l'étape 2

---

### Structure des fichiers Excel

Les deux fichiers analysés (`H92083` et `H91358`) ont **exactement la même structure** — 20 colonnes, feuille unique `Feuil1`, ligne 1 = en-têtes.

| # | En-tête | Type observé | Notes |
|---|---|---|---|
| 1 | `Nom du client` | string | Utilisé pour le routing CDC (1ère lettre) |
| 2 | `N° de Contrat` | string | **Identifiant unique du contrat** — clé de déduplication (voir ci-dessous) |
| 3 | `Branche` | string | Toujours `"Auto"` dans ces fichiers |
| 4 | `Echéance principale` | date | Format ISO |
| 5 | `Code produit` | string / number | Ex : `"NOA2"`, `12222` |
| 6 | `Mode de règlement` | string | Ex : `"PA"` |
| 7 | `Code fractionnement` | string | Ex : `"Mensuel"` |
| 8 | `Prime TTC annuelle précédente` | number | En € |
| 9 | `Prime TTC annuelle actualisée` | number | En € (espace avant le nom) |
| 10 | `Taux de variation` | number | **= Majoration** — en % (ex : `48.86` = +48,86 %) |
| 11 | `Surveillance portefeuille` | string | `"Oui"` / `"Non"` (espace avant le nom) |
| 12 | `Avantage client` | number / string | Ex : `10`, `"0.00"` |
| 13 | `Formule` | string / number | Ex : `"C2"`, `5` |
| 14 | `Packs` | null / string | Souvent vide |
| 15 | `Nb sinistres` | number | |
| 16 | `Bonus/Malus` | number | Coefficient (ex : `0.57`) |
| 17 | `ETP` | number | Coefficient multiplicateur (ex : `1.29` = 129 %) |
| 18 | `Code gestion centrale` | number / null | Ex : `5000`, `1447` |
| 19 | `Taux de modulation commission` | number | Toujours `0` observé |
| 20 | `Date d'effet du dernier avenant` | date | Format ISO (espaces en fin de nom) |

> **Idempotence — N° de Contrat** : la clé de déduplication est la combinaison **`moisKey` + `N° de Contrat`**. Sur un même mois, un contrat ne peut pas être importé deux fois — il est mis à jour, jamais dupliqué. En revanche, le même contrat peut tout à fait réapparaître sur un mois futur (ex : une nouvelle correction un an plus tard) : ce sera une entrée distincte.

> **ETP** : les valeurs sont des coefficients décimaux (ex : `1.29` = 129 %). Le seuil de rétention est `>= 1.20` dans le fichier (= 120 %).

---

### KPIs affichés par agence

| KPI | Description |
|---|---|
| **Clients total** | Nombre total de lignes dans le fichier |
| **Clients retenus** | Clients correspondant aux deux critères actifs |
| **Clients exclus** | Total − Retenus |

---

### Critères de rétention

Un client est **retenu** si les deux conditions suivantes sont réunies (logique ET) :

| Critère | Colonne | Valeur par défaut |
|---|---|---|
| **Taux de variation** | `col 10` | `>= 15` — en % |
| **ETP** | `col 17` | `>= 1.20` — coefficient décimal (= 120 %) |

---

### Paramétrage par agence

- Les seuils `majo` et `etp` sont **configurables indépendamment** pour chaque agence
- Modifier un seuil recalcule instantanément les KPIs (preview temps réel)
- Les deux agences peuvent avoir des seuils **différents**

---

### Blocage d'une agence

- Quand l'utilisateur est satisfait des volumes de clients retenus, il **bloque l'agence**
- Le blocage **fige** les seuils `majo` et `etp` choisis pour cette agence
- Une agence bloquée n'est plus modifiable (sauf déblocage explicite)
- Les deux agences doivent être bloquées pour valider l'étape 2

---

### États possibles d'une agence

| État | Description |
|---|---|
| `en_attente` | Fichier non importé |
| `importé` | Fichier chargé, seuils modifiables, KPIs visibles |
| `bloqué` | Seuils figés, agence prête — contribue à la validation de l'étape |

---

### Schéma de données (ébauche)

```typescript
type AgenceImport = {
  codeAgence: string    // ex: "H92083" — extrait du nom de fichier
  fichierNom: string
  clientsTotal: number
  seuilMajo: number     // défaut: 15 (Taux de variation en %)
  seuilEtp: number      // défaut: 1.20 (ETP coefficient décimal)
  clientsRetenus: number  // calculé : tauxVariation >= seuilMajo AND etp >= seuilEtp
  clientsExclus: number   // calculé : total - retenus
  statut: "en_attente" | "importé" | "bloqué"
}
```

---

## Étape 3 — Classification Particulier / Entreprise

### Objectif

Pour chaque agence, classer automatiquement les clients **retenus** (issus de l'étape 2) en deux catégories : **Particulier** ou **Entreprise**. Gemini propose une classification à l'ouverture de l'étape, l'utilisateur la vérifie et la corrige si besoin, puis bloque l'agence.

---

### Règle de validation de l'étape

> L'étape 3 est **validée** quand les **deux agences sont bloquées**.

---

### Comportement — Classification par Gemini

- **Déclenchement automatique à l'ouverture de l'étape** — pas d'action manuelle requise
- Un appel Gemini Flash par agence (batch) — voir section [IA — Gemini Flash](#ia--gemini-flash)
- Gemini reçoit la liste complète des clients retenus de l'agence et retourne une classification pour chacun
- Le résultat est affiché sous forme de **deux colonnes** : `Particulier` | `Entreprise`
- Chaque client est placé dans la colonne correspondante

---

### Correction manuelle

- Un **clic sur une carte** la bascule dans l'autre colonne (toggle Particulier ↔ Entreprise)
- La modification est instantanée et met à jour les KPIs en temps réel

---

### KPIs par agence

| KPI | Description |
|---|---|
| **Clients retenus** | Total hérité de l'étape 2 (inchangé) |
| **Particuliers** | Nombre de clients classés Particulier |
| **Entreprises** | Nombre de clients classés Entreprise |

> Invariant : `Particuliers + Entreprises = Clients retenus`

---

### Blocage d'une agence

- Quand l'utilisateur est satisfait du classement d'une agence, il la **bloque**
- Le blocage fige la répartition Particulier / Entreprise pour cette agence
- Les deux agences doivent être bloquées pour valider l'étape 3

---

### Schéma de données (ébauche)

```typescript
type ClassificationClient = "particulier" | "entreprise"

type ClientRetenu = {
  numeroContrat: string                         // clé — héritée étape 2
  nomClient: string
  classificationIA: ClassificationClient        // proposition de Gemini
  classificationFinale: ClassificationClient    // après correction manuelle éventuelle
  corrigeParUtilisateur: boolean
}
```

---

## Étape 4 — Détermination des gérants

### Objectif

Pour les clients classés **Entreprise** (issus de l'étape 3), renseigner le nom du gérant. Les particuliers ne sont pas concernés par cette étape.

---

### Règle de validation de l'étape

> L'étape 4 est **validée** quand les **deux agences sont bloquées**.

---

### Saisie des gérants

- Seuls les clients **Entreprise** sont affichés
- Pour chaque entreprise, un champ texte permet de saisir le nom du gérant
- La saisie se fait **entreprise par entreprise**
- Le nom du gérant est **obligatoire** — un gérant manquant bloque le passage à l'étape suivante
- Pas de valeur vide ou N/A autorisée

---

### Blocage d'une agence

- Quand tous les gérants sont renseignés pour une agence, l'utilisateur la **bloque**
- Les deux agences doivent être bloquées pour valider l'étape 4

---

### Schéma de données (ébauche)

```typescript
type ClientEntreprise = {
  numeroContrat: string    // clé — héritée étape 3
  nomClient: string
  gerant: string           // obligatoire — jamais null
}
```

---

## Étape 5 — Routing vers les CDC

### Objectif

Visualiser la charge par CDC avant le dispatch, puis envoyer les données pour créer les cartes Trello dans le tableau de chaque CDC.

---

### Phase 1 — Visualisation de la charge

- Affichage **agence par agence**
- Pour chaque CDC : nombre de clients assignés (particuliers + entreprises)
- KPIs visuels par CDC : total clients, dont particuliers, dont entreprises
- Routing automatique : première lettre du nom du client → CDC selon `/config/trello`

```
Exemple — Agence Kennedy :
  Corentin (A–C + X) → 12 clients  (8 particuliers, 4 entreprises)
  Emma     (D–F)     →  7 clients  (5 particuliers, 2 entreprises)
  Donia    (G–W)     →  9 clients  (6 particuliers, 3 entreprises)
```

---

### Phase 2 — Dispatch Trello

Une fois la charge validée visuellement, l'utilisateur déclenche l'envoi.

**Source de configuration** : `/config/trello` (Firestore) — voir section [Configuration — Trello & CDC](#configuration--trello--cdc)

**Une carte Trello est créée par client**, dans la colonne `Préterme Auto` du CDC assigné.

> **Idempotence du dispatch** : si le dispatch est relancé sur un client déjà dispatché (`trelloCardId` non null), la carte existante est mise à jour — jamais dupliquée.

---

### Format de la carte Trello

Chaque carte doit permettre au CDC de comprendre la situation et préparer son action **sans ouvrir d'autre outil**.

**Titre**

```
[AUTO] NOM DU CLIENT — Échéance JJ/MM/AAAA
```

Exemple :
```
[AUTO] BARTHELEMY-RIO VIRGINIE — Échéance 04/04/2026
```

**Description**

```
## Contrat
- N° de contrat     : 60214313
- Code produit      : NOA2
- Formule           : C3
- Fractionnement    : Mensuel
- Mode de règlement : PA

## Tarif
- Prime précédente  : 962,28 €
- Prime actualisée  : 1 078,44 €
- Majoration        : +12,07 %
- ETP               : 1,29

## Sinistralité
- Nb sinistres      : 2
- Bonus/Malus       : 0,50

## Client
- Type              : Particulier
- Surveillance      : Non
- Avantage client   : 10
- Dernier avenant   : 04/04/2025

## Entreprise (si applicable)
- Gérant            : [nom saisi étape 4]
```

**Champs non inclus dans la carte** (peu exploitables en action) : `Code gestion centrale`, `Taux de modulation commission`, `Packs`, `Branche`

---

### Cas d'erreur

| Cas | Comportement attendu |
|---|---|
| Première lettre non couverte dans la config | Client signalé en erreur — non dispatché |
| `boardId` ou `lists.pretermeAuto` manquant pour un CDC | Bloque le dispatch pour ce CDC — avertissement |

---

### Schéma de données (ébauche)

```typescript
type ClientRouté = {
  numeroContrat: string
  nomClient: string
  premiereLettre: string
  codeAgence: string
  cdcId: string
  cdcPrenom: string
  boardId: string                   // depuis /config/trello
  trelloListId: string              // lists.pretermeAuto depuis /config/trello
  classification: "particulier" | "entreprise"
  gerant: string | null
  trelloCardId: string | null       // renseigné après création de la carte
  dispatchStatut: "en_attente" | "ok" | "erreur"
}
```

---

## Étape 6 — Rapport Slack

### Objectif

Une fois les cartes des deux agences envoyées dans Trello, le système génère un rapport de synthèse et l'envoie automatiquement sur Slack.

---

### Règle de déclenchement

> L'étape 6 se débloque quand le dispatch Trello des **deux agences** est terminé.

---

### Canal cible

- Channel ID : `CE58HNVF0`
- Configuration Slack : `https://notre-saas-agence.com/admin/parametres-slack`

---

### Contenu du rapport

Le système génère un message dynamique à partir de toutes les données du workflow. Le rapport doit être **lisible directement dans Slack**, sans avoir à ouvrir l'application.

Structure :

```
📋 Préterme Auto — Avril 2026

Traitement terminé. Voici la synthèse :

AGENCE H92083
• Clients total        : XX
• Clients retenus      : XX  (majo ≥ 15 % | ETP ≥ 1,20)
• Particuliers         : XX
• Entreprises          : XX
• Cartes Trello créées : XX

AGENCE H91358
• Clients total        : XX
• Clients retenus      : XX
• Particuliers         : XX
• Entreprises          : XX
• Cartes Trello créées : XX

TOTAL — 2 agences
• Clients retenus      : XX
• Cartes créées        : XX
• Erreurs dispatch     : XX
```

---

### Schéma de données (ébauche)

```typescript
type RapportSlack = {
  moisKey: string             // ex: "2026-04"
  moisLabel: string           // ex: "Avril 2026"
  agences: {
    codeAgence: string
    clientsTotal: number
    clientsRetenus: number
    particuliers: number
    entreprises: number
    cartesCreees: number
    erreurs: number
  }[]
  totalRetenus: number
  totalCartesCreees: number
  totalErreurs: number
  slackChannelId: string      // "CE58HNVF0"
  envoyeAt: Date
}
```

---

## Arrière-plan — Snapshot historique

### Objectif

Au moment du dispatch (étape 5), le système enregistre silencieusement une **photo figée** de la répartition. Ce snapshot est indépendant de la configuration Trello courante et ne sera jamais modifié.

---

### Pourquoi figer ?

Les effectifs évoluent : un CDC peut partir, changer d'agence, voir ses lettres redistribuées. Il faut pouvoir répondre à la question **"qui a traité quoi, ce mois-là ?"** sans que la réponse change avec le temps.

> Exemple : Matthieu avait 24 clients en avril 2026. Il quitte l'agence en juin. Le snapshot d'avril doit toujours afficher ses 24 clients.

---

### Déclenchement

- Automatique, invisible pour l'utilisateur
- Déclenché en même temps que le dispatch Trello (étape 5)
- Aucune action manuelle requise

---

### Ce qui est figé

Pour chaque CDC ayant reçu des clients ce mois :

| Champ | Description |
|---|---|
| `moisKey` | Ex : `"2026-04"` |
| `cdcPrenom` | Copie du prénom au moment du dispatch — indépendant de la config |
| `codeAgence` | Agence de rattachement au moment du dispatch |
| `lettresAttribuees` | Copie de la plage de lettres au moment du dispatch |
| `clientsTotal` | Nombre de clients assignés |
| `particuliers` | Dont particuliers |
| `entreprises` | Dont entreprises |
| `cartesCreees` | Cartes Trello effectivement créées |
| `snapshotAt` | Horodatage de la création du snapshot |

> Les données sont copiées — elles ne pointent pas vers `/config/trello`. Modifier ou supprimer un CDC dans les paramètres n'altère pas les snapshots passés.

---

### Schéma de données (ébauche)

```typescript
// Collection Firestore : preterme_snapshots
// Document : `{moisKey}_{cdcId}` — un document par CDC par mois

type SnapshotCdc = {
  moisKey: string           // ex: "2026-04"
  snapshotAt: Date
  cdcId: string             // copie de l'id au moment du dispatch
  cdcPrenom: string         // copie — ne pas référencer /config/trello
  codeAgence: string
  lettresAttribuees: string[]
  clientsTotal: number
  particuliers: number
  entreprises: number
  cartesCreees: number
}
```

---

## Persistance — État du workflow

### Objectif

Permettre de reprendre un workflow en cours à tout moment, depuis n'importe quelle machine (agence le matin, maison le soir). Chaque action écrit immédiatement dans Firestore — l'état est toujours à jour.

---

### Règles

- **Un seul workflow actif à la fois** — identifié par son `moisKey`
- Si un workflow `en_cours` existe déjà et qu'on tente d'en démarrer un nouveau, l'app avertit et propose de continuer l'existant ou de l'archiver
- À l'ouverture de l'app, l'état est lu depuis Firestore et l'UI est restaurée exactement là où on s'était arrêté
- Chaque action utilisateur (blocage agence, clic classification, saisie gérant, dispatch...) écrit immédiatement dans Firestore

---

### Collection Firestore : `preterme_workflows`

Document : `{moisKey}` — un seul document par mois actif

```typescript
type WorkflowState = {
  moisKey: string              // "2026-04" — clé du document
  moisLabel: string            // "Avril 2026"
  confirmeAt: Date
  etapeActive: 1 | 2 | 3 | 4 | 5 | 6
  statut: "en_cours" | "terminé"

  agences: {
    [codeAgence: string]: {
      // Étape 2
      fichierNom: string
      clientsTotal: number
      seuilMajo: number
      seuilEtp: number
      clientsRetenus: number
      etape2Statut: "en_attente" | "importé" | "bloqué"

      // Étape 3
      etape3Statut: "en_attente" | "analysé" | "bloqué"
      clients: ClientRetenu[]

      // Étape 4
      etape4Statut: "en_attente" | "complet" | "bloqué"

      // Étape 5
      dispatchStatut: "en_attente" | "ok" | "erreur"
    }
  }
}
```

---

## Configuration — Trello & CDC

### Collection Firestore : `/config/trello`

La configuration Trello est lue à l'étape 5 pour le routing et le dispatch. Elle est également copiée dans les snapshots au moment du dispatch (indépendance historique).

---

### Structure d'un CDC

```typescript
// Collection : config
// Document   : trello
// Sous-collection : cdc
// Document   : {cdcId}

type CdcConfig = {
  cdcId: string           // ex: "corentin" — identifiant stable
  cdcPrenom: string       // ex: "Corentin" — affiché dans l'UI
  codeAgence: string      // ex: "H92083" — agence de rattachement
  lettres: string[]       // ex: ["A","B","C","X","Y"]
                          // Tableau de lettres individuelles — non contiguës possibles
                          // 4 à 6 CDC par agence
  boardId: string         // Trello board ID du CDC
  lists: {
    pretermeAuto: string  // Trello list ID de la colonne "Préterme Auto"
  }
}
```

---

### Routing

- La première lettre du `Nom du client` (uppercase, sans accent) est comparée au tableau `lettres` de chaque CDC
- Si aucun CDC ne couvre la lettre → client en erreur, non dispatché
- Les lettres doivent couvrir l'ensemble de l'alphabet sans doublon (responsabilité de la configuration)

---

## IA — Gemini Flash

### Usage

Gemini Flash (`gemini-2.0-flash`) est utilisé uniquement à l'**étape 3** pour la classification Particulier / Entreprise.

La clé API est lue depuis `GEMINI_API_KEY` dans `.env.local`.

---

### Appel — Classification

- **Un appel par agence** (batch) — tous les clients retenus de l'agence en une seule requête
- Déclenché automatiquement à l'ouverture de l'étape 3

**Input envoyé à Gemini :**

```json
[
  { "numeroContrat": "60214313", "nomClient": "BARTHELEMY-RIO VIRGINIE" },
  { "numeroContrat": "60198742", "nomClient": "SARL DUPONT SERVICES" }
]
```

**System prompt :**

```
Tu es un classificateur. Pour chaque entrée, détermine si le nom correspond à un particulier (nom + prénom d'une personne physique) ou à une entreprise (raison sociale, sigle, forme juridique comme SARL, SAS, EURL, SA, SCI, AUTO-ENTREPRENEUR, etc.).

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ni après, sans balises markdown.
Format de réponse : [{ "numeroContrat": "...", "classification": "particulier" | "entreprise" }]

En cas d'ambiguïté, utilise "particulier" par défaut.
```

**Output attendu :**

```json
[
  { "numeroContrat": "60214313", "classification": "particulier" },
  { "numeroContrat": "60198742", "classification": "entreprise" }
]
```

---

### Gestion des erreurs

| Cas | Comportement |
|---|---|
| Réponse non parseable | Retry une fois, puis afficher une erreur à l'utilisateur |
| `numeroContrat` manquant dans la réponse | Client marqué `particulier` par défaut |
| Timeout ou erreur réseau | Retry une fois, puis afficher une erreur à l'utilisateur |

---

---

## Design — Charte visuelle

### Univers

- **Mode** : dark mode exclusif
- **Esthétique** : glassmorphism + gradients colorés + animations fluides (type Framer Motion)
- **Stack** : Next.js / React

---

### Palette

| Rôle | Valeur | Usage |
|---|---|---|
| Background principal | `#0e0c1a` | Page, layout global |
| Surface card | `rgba(255,255,255,0.03)` | Cartes, panneaux |
| Surface card active | `rgba(155,135,245,0.06)` | Élément sélectionné / focus |
| Bordure subtile | `rgba(255,255,255,0.08)` | Bordures au repos |
| Bordure active | `rgba(155,135,245,0.25)` | Bordures sélectionnées |
| Accent violet | `#9b87f5` / `#c4b5fd` | Éléments principaux, timeline spine |
| Accent amber | `#ef9f27` / `#fbbf24` | Badges IA / Gemini, arrière-plan |
| Accent vert | `#2dc596` / `#34d399` | Badges "Auto", succès |
| Texte primaire | `#f0eeff` | Titres |
| Texte secondaire | `rgba(200,196,230,0.55)` | Descriptions, labels |

---

### Typographie

| Élément | Police | Taille | Poids |
|---|---|---|---|
| Titres / headings | **Syne** | 22px / 14px | 700 / 600 |
| Corps / descriptions | **DM Sans** | 13–14px | 300–500 |
| Labels techniques | **DM Mono** | 11–12px | 400 |

---

### Composants — principes

**Cards (panneaux étape)**
- `background: rgba(255,255,255,0.03)` + `backdrop-filter: blur(8px)`
- `border: 0.5px solid rgba(255,255,255,0.08)`
- `border-radius: 14px`
- Au survol / actif : border violet + `box-shadow: 0 0 30px rgba(155,135,245,0.08)`

**Badges**
- Trois variantes : `lock` (violet), `ai` (amber), `auto` (vert)
- `border-radius: 20px`, `font-size: 10px`, `letter-spacing: 0.04em`
- Fond teinté + bordure 0.5px de la même couleur

**Boutons d'action**
- Fond transparent au repos, `rgba(155,135,245,0.12)` au survol
- Transition `0.2s ease` sur background et border
- Pas d'ombre portée — uniquement glow `box-shadow: 0 0 16px rgba(155,135,245,0.3)` sur l'état actif

**Inputs / champs texte**
- `background: rgba(255,255,255,0.04)`, `border: 0.5px solid rgba(255,255,255,0.1)`
- Focus : border violet, `box-shadow: 0 0 0 3px rgba(155,135,245,0.15)`
- `border-radius: 8px`, padding `10px 14px`

---

### Timeline — composant principal

La timeline verticale est le composant central de navigation entre les étapes.

- Spine verticale : `1px`, gradient `rgba(155,135,245,0)` → `rgba(155,135,245,0.4)` → `rgba(155,135,245,0)`
- Dots : cercles 18px, border violet, inner dot 6px avec glow sur l'état actif
- Étape active : card surlignée + dot glowant + détail expand (max-height animation)
- Arrière-plan (snapshot) : style distinct — bordure dashed amber, opacité réduite
- Barre de progression en bas : `2px`, gradient violet, labels des étapes

---

### Animations

Toutes les animations doivent respecter `prefers-reduced-motion`.

| Interaction | Animation |
|---|---|
| Ouverture d'étape | `max-height: 0 → 300px` + `opacity: 0 → 1`, `0.4s cubic-bezier(0.4,0,0.2,1)` |
| Activation d'un dot | Border + glow, `0.3s ease` |
| Progress bar | `width`, `0.4s ease` |
| Apparition des cards | Staggered reveal au mount, `opacity + translateY(8px)`, délai `i × 60ms` |
| Import fichier | Spinner puis KPIs fade-in |
| Blocage agence | Flash de confirmation (border vert 300ms puis retour violet) |
| Dispatch Trello | Compteur animé des cartes créées (count-up) |

---

### Layout global

```
┌─────────────────────────────────────┐
│  Header (logo + mois actif + statut)│
├─────────────────────────────────────┤
│  Timeline sidebar (étapes 1–6)      │  ← fixe à gauche
│                                     │
│  Contenu étape active               │  ← zone principale droite
│  (KPIs, upload, classification...)  │
└─────────────────────────────────────┘
```

- Sidebar : `280px` fixe, scrollable indépendamment
- Zone principale : flex-grow, padding `2rem`
- Responsive : sidebar collapse en stepper horizontal sous `768px`

---

> Ce fichier est mis à jour au fil de la construction du workflow. Chaque étape est ajoutée ici une fois définie.
