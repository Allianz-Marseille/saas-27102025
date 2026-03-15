# Bilan Social — Roadmap de développement

## Table des Matières

1. [Vision](#vision)
2. [Architecture cible](#architecture-cible)
3. [Phase 1 — Socle salariés](#phase-1--socle-salariés-fait-)
4. [Phase 2 — Engagements multi-mois](#phase-2--engagements-multi-mois)
5. [Phase 3 — Navigation mensuelle & déclarations](#phase-3--navigation-mensuelle--déclarations)
6. [Phase 4 — Intégration Google Calendar](#phase-4--intégration-google-calendar)
7. [Phase 5 — Calculs automatiques](#phase-5--calculs-automatiques)
8. [Phase 6 — Tableau récapitulatif expert-comptable](#phase-6--tableau-récapitulatif-expert-comptable)
9. [Modèle de données Firestore](#modèle-de-données-firestore)

---

## Vision

Générer chaque mois, **automatiquement**, un tableau récapitulatif des éléments variables à communiquer à l'expert-comptable :
- CP, maladie, absences (lu depuis Google Calendar)
- Tickets restaurants (calculés selon jours déclarés)
- Commissions réelles (récupérées depuis le SaaS)
- Primes, garanties, boosts, frais (saisis ou automatiques)

> Spécification fonctionnelle complète : `docs/bs/bilan_social_spec.md`

---

## Architecture cible

```
/admin/bs
  ├── Dashboard         ← KPIs ETP (fait ✅)
  ├── Gestion salarié   ← CRUD salariés (fait ✅)
  ├── Engagements       ← Garanties variable, primes formation
  ├── Déclarations      ← Navigation mensuelle + saisie + calculs
  └── FAQ
```

**Collections Firestore :**
- `collaborateurs` — salariés déclarés (fait ✅)
- `bs_engagements` — garanties variable et primes formation
- `bs_declarations/{moisKey}` — déclaration mensuelle complète (état + données saisies)

---

## Phase 1 — Socle salariés ✅ Fait

- [x] CRUD salariés (prénom, pôle, contrat, jours travaillés)
- [x] KPIs ETP global et par pôle
- [x] Toggle avec/sans agent (+2 ETP)
- [x] ETP calculé depuis `joursTravail.length` (alternant = 0.5 fixe)

---

## Phase 2 — Engagements multi-mois

> Onglet **Engagements** dans `/admin/bs`

### Fonctionnalités

- [ ] CRUD engagements : type, salarié, montant/mois, date début, durée en mois
- [ ] Calcul automatique de la date de fin
- [ ] Vue liste avec statut : `🟡 En cours` / `✅ Terminé` / `🔜 À venir`
- [ ] Clôture manuelle anticipée

### Types d'engagements

| Type | Bénéficiaire | Logique |
|---|---|---|
| Garantie de variable | Salarié concerné | `max(commissions réelles, garantie mensuelle)` |
| Prime formation | CDC formateur | Montant fixe mensuel sur la période |

### Collection Firestore : `bs_engagements`

```ts
{
  id: string
  type: "garantie_variable" | "prime_formation"
  collaborateurId: string
  montantMensuel: number       // en euros
  dateDebut: Timestamp         // 1er du mois
  nbMois: number
  dateFin: Timestamp           // calculée automatiquement
  clos: boolean                // clôture manuelle
  createdAt: Timestamp
}
```

---

## Phase 3 — Navigation mensuelle & déclarations

> Onglet **Déclarations** dans `/admin/bs`

### Navigation mensuelle

- [ ] Sélecteur mois/année (type `← Janvier 2026 →`)
- [ ] Pour chaque mois : badge de statut
  - `⬜ Vide` — aucune saisie
  - `🟡 En cours` — saisie partielle
  - `✅ Clôturé` — transmis à l'expert-comptable
- [ ] Historique : pouvoir consulter les mois passés (lecture seule si clôturé)

### Saisie mensuelle

Pour chaque mois sélectionné, une page de saisie avec :

- [ ] **Section commissions** : affichage auto des commissions réelles du mois (depuis le SaaS) — Commercial, Santé Ind, Santé Coll uniquement
- [ ] **Section garanties** : application automatique des engagements actifs sur ce mois
- [ ] **Section Boost Google** : montant auto depuis le SaaS (mois précédent)
- [ ] **Section occasionnels** : saisie manuelle ligne par ligne (Prime Macron, Noël, Avance, Frais, Heures sup, Régul)
- [ ] **Section CP / Absences** : lu depuis Google Calendar (phase 4) ou saisie manuelle de secours
- [ ] **Section Tickets Restaurants** : calculés automatiquement (phase 5)

### Collection Firestore : `bs_declarations/{moisKey}`

```ts
{
  moisKey: string              // ex : "2026-01"
  statut: "vide" | "en_cours" | "clos"
  salaries: {
    [collaborateurId: string]: {
      commissions?: number
      garantieVariable?: number
      boostGoogle?: number
      primeFormation?: number
      primeMacron?: number
      primeNoel?: number
      avance?: number
      avanceFrais?: number
      heuresSup?: number       // nombre d'heures
      frais?: number
      regul?: string           // texte libre
      absences: {              // par semaine
        semaine: number        // 1 à 5
        evenements: string[]   // ex: ["2/1 cp", "16->25/1 cp"]
      }[]
      ticketsRestaurants: {    // par semaine
        semaine: number
        nb: number
      }[]
    }
  }
  closedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

---

## Phase 4 — Intégration Google Calendar

- [ ] Connexion API Google Calendar (OAuth ou service account)
- [ ] Lecture automatique des événements du mois pour le calendrier de l'agence
- [ ] Filtrage sur les mots-clés : `cp`, `malade`, `école`
- [ ] Détection journée complète vs demi-journée (événement avec heure = demi-journée)
- [ ] Matching événement → salarié (par prénom dans le titre de l'événement)
- [ ] Respect des jours déclarés : un CP sur un jour non travaillé est ignoré
- [ ] Signalement des salariés hors effectif (⚠️) mais inclus si événements les concernent

**URL calendrier agence :**
`https://calendar.google.com/calendar/u/0?cid=YWxsaWFuei1ub2dhcm8uZnJfMmJ1ZWE5M2h2NDdrMGJkaGluZTRlYWFzNWNAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ`

---

## Phase 5 — Calculs automatiques

- [ ] **Tickets restaurants** : pour chaque salarié, pour chaque semaine
  - Base = jours déclarés travaillés cette semaine
  - `-1` par journée CP complète, maladie complète, école
  - Demi-journée CP/maladie = pas d'impact
- [ ] **CP décompte** : total de jours CP par salarié sur le mois (journée = 1, demi = 0.5)
- [ ] **Garantie variable** : `max(commissions réelles, garantie mensuelle)` si engagement actif

---

## Phase 6 — Tableau récapitulatif expert-comptable

- [ ] Génération du tableau au format attendu (colonnes = salariés, lignes = éléments)
- [ ] Affichage dans l'UI avec mise en forme
- [ ] Bouton **Copier** (copie le tableau dans le presse-papier)
- [ ] Bouton **Exporter** (Excel ou PDF)
- [ ] Bouton **Clôturer le mois** → passe le statut à `clos`, verrouille la saisie

### Format des cellules CP / Absence

| Valeur affichée | Signification |
|---|---|
| `2/1 cp` | CP le 2 janvier |
| `16->25/1 cp` | CP du 16 au 25 janvier |
| `8/1 cp (demi-j)` | Demi-journée de CP |
| `ÉCOLE` | Journée école alternant |
| `5/1 maladie` | Maladie le 5 janvier |

---

## Modèle de données Firestore — Vue d'ensemble

| Collection | Rôle | Phase |
|---|---|---|
| `collaborateurs` | Salariés déclarés | ✅ Fait |
| `bs_engagements` | Garanties variable, primes formation | Phase 2 |
| `bs_declarations/{moisKey}` | Déclaration mensuelle complète | Phase 3 |
