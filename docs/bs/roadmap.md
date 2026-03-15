# Bilan Social — Roadmap de développement

## Table des Matières

1. [Vision & UX cible](#vision--ux-cible)
2. [Ce que le SaaS récupère automatiquement](#ce-que-le-saas-récupère-automatiquement)
3. [Ce que le SaaS demande à l'utilisateur](#ce-que-le-saas-demande-à-lutilisateur)
4. [Architecture cible](#architecture-cible)
5. [Phase 1 — Socle salariés](#phase-1--socle-salariés-fait-)
6. [Phase 2 — Engagements multi-mois](#phase-2--engagements-multi-mois)
7. [Phase 3 — Navigation mensuelle & workflow BS](#phase-3--navigation-mensuelle--workflow-bs)
8. [Phase 4 — Intégration Google Calendar](#phase-4--intégration-google-calendar)
9. [Phase 5 — Calculs automatiques](#phase-5--calculs-automatiques)
10. [Phase 6 — Tableau récapitulatif expert-comptable](#phase-6--tableau-récapitulatif-expert-comptable)
11. [Modèle de données Firestore](#modèle-de-données-firestore)

---

## Vision & UX cible

En fin de mois, l'administrateur clique sur **"Préparer le BS de [mois]"**.

Le SaaS enchaîne alors deux étapes :

```
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 — Récupération automatique                         │
│  → Google Calendar : CP, maladies, absences                 │
│  → Commissions réelles du mois (depuis le SaaS)             │
│  → Boost Google du mois (depuis le SaaS)                    │
│  → Engagements actifs : garantie variable, prime formation  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 — Complétion manuelle (salarié par salarié)        │
│  → Le SaaS demande : y a-t-il un élément ponctuel ce mois ? │
│  → Prime Macron, Prime Noël, Avance, Avance sur frais,      │
│    Frais, Heures sup, Régul                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 — Génération du tableau récapitulatif              │
│  → Prêt à copier / exporter pour l'expert-comptable         │
│  → Clôture du mois                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Ce que le SaaS récupère automatiquement

| Source | Données récupérées | Condition |
|---|---|---|
| **Google Calendar agence** | CP, maladie, école (par salarié, par jour) | Mots-clés `cp`, `malade`, `école` dans le titre |
| **Commissions réelles** | Montant commission du mois (depuis le SaaS) | Pôles Commercial, Santé Ind, Santé Coll uniquement — pas Sinistre |
| **Boost Google** | Prime Boost du mois précédent (depuis le SaaS) | Tous pôles |
| **Engagements actifs** | Garantie de variable, prime formation | Si engagement déclaré sur la fiche salarié et période couvrant le mois |

> ⚠️ Pour les commissions : on déclare les **commissions réelles**, jamais les potentielles.
> Le décalage s'applique : salaires de **février** = commissions réelles de **janvier**.

---

## Ce que le SaaS demande à l'utilisateur

### Éléments ponctuels (salarié par salarié, mois par mois)

Le SaaS présente chaque salarié et demande si l'un de ces éléments s'applique ce mois :

| Élément | Type | Valeur saisie |
|---|---|---|
| Prime Macron | Ponctuel | Montant (€) |
| Prime Noël | Ponctuel | Montant (€) |
| Avance | Ponctuel | Montant (€) |
| Avance sur frais | Ponctuel | Montant (€) |
| Frais | Ponctuel | Montant (€) |
| Heures supplémentaires | Ponctuel | Nombre d'heures |
| Régul | Ponctuel | Texte libre (instruction à l'expert-comptable) |

Ces éléments sont **non récurrents** — ils doivent être saisis à chaque mois concerné.

### Engagements multi-mois (déclarés dans la fiche salarié)

Les engagements suivants sont déclarés **une fois** dans la fiche de chaque salarié et s'appliquent automatiquement sur tous les mois couverts :

| Élément | Déclaration | Logique mensuelle |
|---|---|---|
| **Garantie de variable** | Mois de début → mois de fin + montant mensuel | `max(commissions réelles, garantie)` |
| **Prime formation** | Mois de début → mois de fin + montant mensuel | Montant fixe chaque mois |

> Exemple : garantie de 300 €/mois de janvier à juin 2026 → déclarée une fois sur la fiche du salarié → appliquée automatiquement sur chaque BS mensuel de janvier à juin.

---

## Architecture cible

```
/admin/bs
  ├── Dashboard              ← KPIs ETP (fait ✅)
  ├── Gestion salarié        ← CRUD salariés + engagements multi-mois (fait partiel ✅)
  ├── Déclarations           ← Navigation mensuelle + workflow BS
  └── FAQ
```

**Collections Firestore :**

| Collection | Rôle | Phase |
|---|---|---|
| `collaborateurs` | Salariés déclarés | ✅ Fait |
| `bs_engagements` | Garanties variable, primes formation par salarié | Phase 2 |
| `bs_declarations/{moisKey}` | Déclaration mensuelle complète | Phase 3 |

---

## Phase 1 — Socle salariés ✅ Fait

- [x] CRUD salariés (prénom, pôle, contrat, jours travaillés)
- [x] KPIs ETP global et par pôle
- [x] Toggle avec/sans agent (+2 ETP)
- [x] ETP calculé depuis `joursTravail.length` (alternant = 0.5 fixe)

---

## Phase 2 — Engagements multi-mois

> Intégrés dans la **fiche salarié** (carte collaborateur dans "Gestion salarié")

### UX

Chaque carte collaborateur affiche ses engagements actifs, avec un bouton **"+ Ajouter un engagement"** :

```
┌─────────────────────────────────┐
│ Karen — CDI — Commercial        │
│ M / J / V — 0.6 ETP             │
│                                 │
│ Engagements actifs :            │
│ 🟡 Garantie variable            │
│    300 €/mois · jan→juin 2026   │
│                                 │
│ [+ Ajouter un engagement]       │
└─────────────────────────────────┘
```

### Fonctionnalités

- [ ] Ajout d'un engagement depuis la fiche salarié (type, montant, mois début, mois fin)
- [ ] Affichage des engagements actifs sur la carte
- [ ] Clôture manuelle anticipée
- [ ] Calcul automatique de la date de fin depuis nb de mois

### Collection Firestore : `bs_engagements`

```ts
{
  id: string
  collaborateurId: string
  type: "garantie_variable" | "prime_formation"
  montantMensuel: number          // €
  moisDebut: string               // "2026-01"
  moisFin: string                 // "2026-06" (calculé)
  nbMois: number
  clos: boolean
  createdAt: Timestamp
}
```

---

## Phase 3 — Navigation mensuelle & workflow BS

> Onglet **Déclarations** dans `/admin/bs`

### Navigation mensuelle

- [ ] Sélecteur `← Janvier 2026 →`
- [ ] Badge statut par mois :
  - `⬜ Vide` — aucune saisie
  - `🟡 En cours` — saisie partielle
  - `✅ Clôturé` — transmis à l'expert-comptable (lecture seule)
- [ ] Bouton **"Préparer le BS de [mois]"** → déclenche la récupération automatique puis la complétion manuelle

### Workflow de génération

```
1. Clic "Préparer le BS de janvier 2026"
   ↓
2. Récupération auto (spinner)
   - Google Calendar → CP, maladie, école du mois
   - Commissions réelles janvier
   - Boost Google janvier
   - Engagements actifs sur janvier
   ↓
3. Revue des données auto (affichage pour validation)
   ↓
4. Complétion manuelle — salarié par salarié
   "Y a-t-il un élément ponctuel pour [prénom] ce mois ?"
   → Champs optionnels : Prime Macron, Avance, Frais, Heures sup, Régul…
   ↓
5. Génération du tableau récapitulatif
   ↓
6. Bouton "Clôturer" → statut = clos, lecture seule
```

### Collection Firestore : `bs_declarations/{moisKey}`

```ts
{
  moisKey: string                 // "2026-01"
  statut: "vide" | "en_cours" | "clos"
  salaries: {
    [collaborateurId: string]: {
      // Auto-récupérés
      commissions?: number
      boostGoogle?: number
      garantieVariable?: number
      primeFormation?: number
      absences: { semaine: number; evenements: string[] }[]
      ticketsRestaurants: { semaine: number; nb: number }[]
      // Saisis manuellement
      primeMacron?: number
      primeNoel?: number
      avance?: number
      avanceFrais?: number
      frais?: number
      heuresSup?: number
      regul?: string
    }
  }
  closedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

---

## Phase 4 — Intégration Google Calendar + parsing Gemini

### 4a — Lecture Google Calendar

- [ ] Connexion API Google Calendar (service account ou OAuth)
- [ ] Lecture des événements du mois sur le calendrier agence
- [ ] Récupération du titre, date, présence d'une heure (demi-journée)

**Calendrier agence :**
`https://calendar.google.com/calendar/u/0?cid=YWxsaWFuei1ub2dhcm8uZnJfMmJ1ZWE5M2h2NDdrMGJkaGluZTRlYWFzNWNAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ`

### 4b — Parsing Gemini (`lib/services/bs-gemini.ts`) ✅ Créé

Gemini interprète les titres d'événements bruts pour en extraire une structure propre.

**Pourquoi Gemini ?**
Les titres sont saisis librement et varient : `"virginie cp"`, `"virginie-cp"`, `"CP Virginie"`, `"cp de virginie"`, `"Virginie - congé"`, `"virginie (cp)"` → Gemini normalise tout.

**Ce que Gemini extrait pour chaque événement :**

| Champ | Exemple |
|---|---|
| `prenom` | `"virginie"` (normalisé, sans accent, sans tiret) |
| `type` | `"cp"` / `"malade"` / `"ecole"` / `"ignore"` |
| `date` | `"2026-01-05"` ou `"2026-01-16/2026-01-25"` |
| `demiJournee` | `true` si heure dans le titre (ex: `9h-12h30`) |
| `titreOriginal` | Titre brut pour traçabilité |

**Mots-clés reconnus :**
- CP : `cp`, `congé`, `conge`, `vacances` et toutes variantes avec tiret, espace, majuscule
- Maladie : `malade`, `maladie`, `arrêt`, `arret`, `am`
- École : `école`, `ecole`, `school`

**Robustesse :** retry x1 en cas d'échec, fallback tableau vide (jamais de crash).

### 4c — Post-traitement

- [ ] Matching `prenom` Gemini → salarié Firestore (comparaison normalisée)
- [ ] Respect des jours déclarés : CP un jour non travaillé pour ce salarié = ignoré
- [ ] Signalement ⚠️ des salariés hors effectif (dans le calendrier mais plus dans `collaborateurs`)

---

## Phase 5 — Calculs automatiques

- [ ] **Tickets restaurants** par salarié, par semaine
  - Base = jours déclarés travaillés dans la semaine
  - `-1` par journée CP complète, maladie complète, école
  - Demi-journée CP/maladie = pas d'impact
- [ ] **CP décompte** : total de jours CP par salarié sur le mois (journée = 1, demi = 0.5)
- [ ] **Garantie variable** : `max(commissions réelles, garantie mensuelle)` si engagement actif

---

## Phase 6 — Tableau récapitulatif expert-comptable

- [ ] Génération du tableau (colonnes = salariés, lignes = éléments)
- [ ] Les lignes occasionnelles n'apparaissent que si renseignées
- [ ] Bouton **Copier** (presse-papier)
- [ ] Bouton **Exporter** (Excel ou PDF)
- [ ] Bouton **Clôturer le mois**

### Format des cellules CP / Absence

| Valeur | Signification |
|---|---|
| `2/1 cp` | CP le 2 janvier |
| `16->25/1 cp` | CP du 16 au 25 |
| `8/1 cp (demi-j)` | Demi-journée CP |
| `ÉCOLE` | Journée école alternant |
| `5/1 maladie` | Maladie le 5 janvier |

### Structure du tableau

```
                    │ Salarié 1 │ Salarié 2 │ …
────────────────────┼───────────┼───────────┼──
Commissions         │           │           │
Garantie variable   │           │           │
Boost Google        │           │           │
────────────────────┼───────────┼───────────┼──
[OCCASIONNELS]      │           │           │
Prime Macron        │           │           │
Avance              │           │           │
Frais               │           │           │
Heures sup          │           │           │
Régul               │           │           │
────────────────────┼───────────┼───────────┼──
CP / MALADIE        │           │           │
  Semaine 1         │           │           │
  Semaine 2         │           │           │
  Semaine 3         │           │           │
  Semaine 4         │           │           │
────────────────────┼───────────┼───────────┼──
TICKETS RESTAURANTS │           │           │
  Semaine 1         │           │           │
  Semaine 2         │           │           │
  Semaine 3         │           │           │
  Semaine 4         │           │           │
```
