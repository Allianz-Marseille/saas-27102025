# Refonte santé collective - 3 vues à créer

## Objectif

Créer 3 vues différentes pour la santé collective :

1. **Dashboard admin** : Section dans le dashboard admin (`app/admin/page.tsx`)
2. **Page admin santé collective** : Page dédiée (`app/admin/sante-collective/page.tsx`)
3. **Vue commercial santé collective** : Vue pour le commercial lui-même (`app/sante-collective/page.tsx`)

**Note :** Les pages sont actuellement en construction. Cette documentation servira de base pour l'implémentation future.

## Résumé comparatif des 3 vues

| Fonctionnalité | Vue 1: Dashboard Admin | Vue 2: Page Admin | Vue 3: Vue Commercial |
|----------------|----------------------|-------------------|----------------------|
| **Accès** | Admin uniquement | Admin uniquement | Commercial santé collective uniquement |
| **Sélection utilisateur** | Oui (Tous ou spécifique) | Oui (Tous ou spécifique) | Non (toujours l'utilisateur connecté) |
| **Navigation mensuelle** | Oui | Oui | Oui |
| **KPIs** | Globaux (résumé) | Détaillés par type | Personnels |
| **Timeline** | Non | Oui | Oui |
| **Tableau des actes** | Non | Oui (tous les actes) | Oui (ses propres actes) |
| **Thermomètre seuils** | Non | Oui (si commercial sélectionné) | Oui (toujours visible) |
| **Graphiques** | Non | Oui (si commercial sélectionné) | Oui (toujours visibles) |
| **Actions** | Aucune | Modifier/Supprimer (admin) | Créer/Modifier/Supprimer (ses actes) |
| **Lien vers page dédiée** | Oui → `/admin/sante-collective` | - | - |

## Vue 1 : Dashboard Admin (`app/admin/page.tsx`)

### Objectif

Ajouter une section pour les commerciaux santé collective dans le dashboard admin, similaire à ce qui existe pour les autres rôles (CDC_COMMERCIAL, COMMERCIAL_SANTE_INDIVIDUEL).

### Structure

- Section `RoleSection` pour `COMMERCIAL_SANTE_COLLECTIVE`
- Afficher les KPIs globaux du mois sélectionné
- Sélection d'utilisateur (Tous ou commercial spécifique)
- Lien vers la page dédiée `/admin/sante-collective`
- Retirer le flag `underConstruction`

### KPIs à afficher

- Nombre d'actes
- CA brut
- CA pondéré
- Commissions acquises
- Nombre de commerciaux actifs

### Fichiers à modifier

- `app/admin/page.tsx` : Ajouter la logique de chargement des actes santé collective dans `RoleSection`
- Créer/utiliser `getHealthCollectiveActsByMonthFiltered()` pour récupérer les actes
- Créer/utiliser `calculateHealthCollectiveKPI()` pour calculer les KPIs

## Vue 2 : Page Admin Santé Collective (`app/admin/sante-collective/page.tsx`)

### Objectif

Page dédiée pour l'administration des commerciaux santé collective, avec navigation mensuelle, sélection d'utilisateur, KPIs détaillés, timeline et tableau filtré.

**Inspiration :** `app/admin/sante-individuelle/page.tsx`

### Structure de la page

### 1. Navigation mensuelle

- Utiliser le même système que `ActivityOverview` avec boutons précédent/suivant
- Le mois sélectionné affecte tous les éléments (KPIs, timeline, tableau)

### 2. Sélection d'utilisateur

- Select avec option "Tous" + liste des utilisateurs avec rôle `COMMERCIAL_SANTE_COLLECTIVE`
- Récupérer les utilisateurs via requête Firestore et filtrer par rôle
- Le filtre affecte les KPIs, timeline et tableau

### 3. KPIs (première ligne)

- **Total des actes** (nombre)
- **CA Ind AN Santé** (somme des `caAnnuel` pour `IND_AN_SANTE`)
- **CA Ind AN Prévoyance** (somme des `caAnnuel` pour `IND_AN_PREVOYANCE`)
- **CA Ind AN Retraite** (somme des `caAnnuel` pour `IND_AN_RETRAITE`)
- **CA Coll AN Santé** (somme des `caAnnuel` pour `COLL_AN_SANTE`)
- **CA Coll AN Prévoyance** (somme des `caAnnuel` pour `COLL_AN_PREVOYANCE`)

### 4. KPIs (deuxième ligne)

- **CA Coll AN Retraite** (somme des `caAnnuel` pour `COLL_AN_RETRAITE`)
- **CA Coll Adhésion/Renfort** (somme des `caAnnuel` pour `COLL_ADHESION_RENFORT`)
- **CA Révision** (somme des `caAnnuel` pour `REVISION`)
- **CA Adhésion/Renfort** (somme des `caAnnuel` pour `ADHESION_RENFORT`)
- **CA Courtage → Allianz** (somme des `caAnnuel` pour `COURTAGE_TO_ALLIANZ`)
- **CA Allianz → Courtage** (somme des `caAnnuel` pour `ALLIANZ_TO_COURTAGE`)

### 5. KPIs (troisième ligne)

- **CA brut** (somme de tous les `caAnnuel`)
- **CA pondéré commission** (somme de tous les `caPondere`)

### 6. Timeline

- Réutiliser la logique de `generateTimeline` adaptée pour les actes santé collective
- Afficher les jours du mois avec le nombre d'actes par jour
- Scroll automatique vers aujourd'hui si le mois en cours est sélectionné

### 7. Tableau des actes

- Colonnes : Date saisie, Origine, Type, Client, N° Contrat, Compagnie, Date effet, Prime, CA Annuel, CA Pondéré
- Tri par colonne (comme dans `ActivityOverview`)
- Filtres par tags : Tous les types d'actes (11 types) + filtres par origine (Proactif, Réactif, Prospection)
- Actions admin : modifier/supprimer (utiliser les dialogs existants ou à créer)

### 8. Progression seuils de commissions

- Afficher uniquement quand un commercial est sélectionné (pas "Tous")
- Afficher au-dessus du tableau
- **Thermomètre horizontal** avec tous les seuils visibles (comme santé individuelle)
- Informations : seuil actuel, prochain seuil, CA pondéré actuel, objectif restant
- Utiliser la fonction de calcul des seuils de commission santé collective (à définir)

### 9. Graphiques détaillés (uniquement si commercial sélectionné)

- Afficher uniquement quand un `COMMERCIAL_SANTE_COLLECTIVE` est sélectionné (pas "Tous")
- Afficher après la progression seuils et avant le tableau

#### 9.1. Évolution des commissions versées

- Graphique en ligne ou en barres montrant l'évolution des commissions sur 6 mois
- Période : mois en cours + 5 mois précédents
- Données : commissions calculées pour chaque mois via la fonction de calcul des seuils
- Utiliser `recharts` (AreaChart ou LineChart) comme dans `ActivityOverview`
- Afficher les valeurs sur les points du graphique

#### 9.2. Répartition du CA par type d'acte

- Graphique en camembert (PieChart) montrant la répartition du CA annuel
- Types d'actes à afficher (11 types) :
  - Ind AN Santé
  - Ind AN Prévoyance
  - Ind AN Retraite
  - Coll AN Santé
  - Coll AN Prévoyance
  - Coll AN Retraite
  - Coll Adhésion/Renfort
  - Révision
  - Adhésion/Renfort
  - Courtage → Allianz
  - Allianz → Courtage
- Utiliser `recharts` PieChart comme dans `ActivityOverview`
- Afficher les pourcentages et les montants sur chaque segment
- Couleurs distinctes pour chaque type d'acte

## Vue 3 : Vue Commercial Santé Collective (`app/sante-collective/page.tsx`)

### Objectif

Vue pour le commercial santé collective lui-même (ex: karen.chollet@allianz-nogaro.fr) pour gérer ses propres actes.

### Structure

- Navigation mensuelle (boutons précédent/suivant)
- KPIs personnels du mois sélectionné
- Timeline des actes
- Tableau des actes avec tri et filtres
- Actions : créer, modifier, supprimer ses propres actes
- Thermomètre de progression des seuils de commission
- Graphiques d'évolution (6 mois) et répartition CA par type

### Différences avec la vue admin

- Pas de sélection d'utilisateur (toujours l'utilisateur connecté)
- Actions limitées à ses propres actes
- Affichage du thermomètre toujours visible (pas conditionnel)
- Graphiques toujours visibles (pas conditionnels)

### Fichiers à créer/modifier

- `app/sante-collective/page.tsx` - Créer la page (s'inspirer de `app/sante-individuelle/page.tsx`)
- `app/sante-collective/layout.tsx` - Layout avec navigation (si nécessaire)
- `components/health-collective-acts/new-health-collective-act-dialog.tsx` - Dialog pour créer un acte
- `components/health-collective-acts/edit-health-collective-act-dialog.tsx` - Dialog pour modifier un acte
- `components/health-collective-acts/delete-health-collective-act-dialog.tsx` - Dialog pour supprimer un acte

## Modifications nécessaires

### Fichiers à modifier/créer pour Vue 2 (Page Admin)

1. **`app/admin/sante-collective/page.tsx`** - Refonte complète

   - Remplacer le contenu actuel (page blanche) par une structure similaire à `sante-individuelle`
   - Implémenter la logique de chargement des actes par mois et utilisateur
   - Calculer les KPIs spécifiques par type d'acte
   - Implémenter la timeline pour les actes santé collective
   - Créer le tableau avec filtres et tri
   - Ajouter les graphiques d'évolution des commissions (6 mois) et de répartition du CA (camembert) quand un commercial est sélectionné
   - Charger les données historiques des 5 mois précédents pour le graphique d'évolution

2. **`lib/utils/health-collective-kpi.ts`** - Créer fichier de calcul KPIs (à créer)

   - Créer `calculateHealthCollectiveKPIsByType(acts: HealthCollectiveAct[])` qui retourne les CA par type d'acte
   - Créer `calculateHealthCollectiveKPI(acts: HealthCollectiveAct[])` pour les KPIs globaux
   - **Réutiliser `getHealthCommissionRate(caPondere: number)` de `lib/utils/health-kpi.ts`** - Les seuils sont identiques à santé individuelle

3. **`lib/firebase/health-collective-acts.ts`** - Créer fichier de gestion Firestore (à créer)

   - Créer `getHealthCollectiveActsByMonthFiltered(userId: string | null, monthKey: string)` pour récupérer tous les actes d'un mois (avec ou sans filtre utilisateur)
   - Créer `createHealthCollectiveAct`, `updateHealthCollectiveAct`, `deleteHealthCollectiveAct`
   - Définir les coefficients pour le calcul du CA pondéré (voir section "Calcul du CA pondéré")

4. **`types/index.ts`** - Ajouter types

   - Créer `HealthCollectiveAct` interface avec les champs :
     - `id: string`
     - `userId: string`
     - `kind: "IND_AN_SANTE" | "IND_AN_PREVOYANCE" | "IND_AN_RETRAITE" | "COLL_AN_SANTE" | "COLL_AN_PREVOYANCE" | "COLL_AN_RETRAITE" | "COLL_ADHESION_RENFORT" | "REVISION" | "ADHESION_RENFORT" | "COURTAGE_TO_ALLIANZ" | "ALLIANZ_TO_COURTAGE"`
     - `origine: "PROACTIF" | "REACTIF" | "PROSPECTION"`
     - `clientNom: string`
     - `numeroContrat: string`
     - `compagnie: string`
     - `dateEffet: Date | Timestamp`
     - `dateSaisie: Date | Timestamp`
     - `prime: number` (montant de la prime)
     - `caAnnuel: number` (égal à prime)
     - `coefficientOrigine: number`
     - `coefficientTypeActe: number`
     - `coefficientCompagnie: number`
     - `caPondere: number` (prime × coefficientOrigine × coefficientTypeActe × coefficientCompagnie)
     - `moisKey: string`
   - Créer `HealthCollectiveKPI` interface similaire à `HealthKPI` mais avec les 11 types d'actes

5. **`components/health-collective-acts/`** - Créer composants (à créer)

   - `edit-health-collective-act-dialog.tsx` - Dialog pour modifier un acte
   - `delete-health-collective-act-dialog.tsx` - Dialog pour supprimer un acte
   - `new-health-collective-act-dialog.tsx` - Dialog pour créer un acte

### Fichiers à modifier/créer pour Vue 1 (Dashboard Admin)

1. **`app/admin/page.tsx`** - Modifier `RoleSection` pour santé collective

   - Retirer le flag `underConstruction` pour `COMMERCIAL_SANTE_COLLECTIVE`
   - Ajouter la logique de chargement des actes santé collective
   - Utiliser `getHealthCollectiveActsByMonthFiltered()` et `calculateHealthCollectiveKPI()`
   - Afficher les KPIs dans la section (similaire à santé individuelle)

### Fichiers à modifier/créer pour Vue 3 (Vue Commercial)

1. **`app/sante-collective/page.tsx`** - Créer la page complète

   - Structure similaire à `app/sante-individuelle/page.tsx`
   - Pas de sélection d'utilisateur (toujours l'utilisateur connecté)
   - Navigation mensuelle
   - KPIs personnels
   - Timeline
   - Thermomètre de progression (toujours visible)
   - Graphiques (toujours visibles)
   - Tableau des actes avec actions (créer, modifier, supprimer)

2. **`app/sante-collective/layout.tsx`** - Créer layout (si nécessaire)

   - Navigation pour le commercial santé collective
   - RouteGuard avec rôle `COMMERCIAL_SANTE_COLLECTIVE`

### Composants à réutiliser

- `MonthSelector` ou créer une navigation similaire à `ActivityOverview`
- `KPICard` pour afficher les KPIs
- Composants UI : `Card`, `Select`, `Button`, `Badge`, etc.
- `toDate` helper de `lib/utils/date-helpers`

## Structure des actes santé collective

### Types d'actes (11 types)

1. **IND_AN_SANTE** - Individuel AN Santé
2. **IND_AN_PREVOYANCE** - Individuel AN Prévoyance
3. **IND_AN_RETRAITE** - Individuel AN Retraite
4. **COLL_AN_SANTE** - Collectif AN Santé
5. **COLL_AN_PREVOYANCE** - Collectif AN Prévoyance
6. **COLL_AN_RETRAITE** - Collectif AN Retraite
7. **COLL_ADHESION_RENFORT** - Collectif Adhésion/Renfort
8. **REVISION** - Révision
9. **ADHESION_RENFORT** - Adhésion/Renfort
10. **COURTAGE_TO_ALLIANZ** - Courtage → Allianz
11. **ALLIANZ_TO_COURTAGE** - Allianz → Courtage

### Champs de saisie

Lors de la saisie d'un acte, les champs suivants doivent être renseignés :

- **Origine** (obligatoire) : `PROACTIF` | `REACTIF` | `PROSPECTION`
- **Nom du client** (obligatoire) : texte
- **Numéro de contrat** (obligatoire) : texte
- **Compagnie** (obligatoire) : sélection depuis la base de compagnies (même base que commercial et santé individuel)
- **Date d'effet** (obligatoire) : date
- **Montant de la prime** (obligatoire) : nombre entier, monétaire, avec séparateur de milliers
- **Date de saisie** : automatique (date du jour)

### Calcul du CA pondéré

Le CA pondéré se calcule en multipliant le CA (prime) par **3 coefficients** :

#### Coefficient selon l'origine

- **PROACTIF** : 100% (1.0)
- **REACTIF** : 50% (0.5)
- **PROSPECTION** : 125% (1.25)

#### Coefficient selon le type d'acte

- **IND_AN_SANTE** : 100% (1.0)
- **IND_AN_PREVOYANCE** : 100% (1.0)
- **IND_AN_RETRAITE** : 100% (1.0)
- **COLL_AN_SANTE** : 100% (1.0)
- **COLL_AN_PREVOYANCE** : 100% (1.0)
- **COLL_AN_RETRAITE** : 100% (1.0)
- **COLL_ADHESION_RENFORT** : 100% (1.0)
- **REVISION** : 75% (0.75)
- **ADHESION_RENFORT** : 50% (0.5)
- **COURTAGE_TO_ALLIANZ** : 75% (0.75)
- **ALLIANZ_TO_COURTAGE** : 50% (0.5)

#### Coefficient selon la compagnie

- **Allianz** : 120% (1.2)
- **Unim** ou **Uniced** : 150% (1.5)
- **Courtage** (autres) : 100% (1.0)

#### Formule de calcul

```typescript
caPondere = Math.round(
  prime * 
  coefficientOrigine * 
  coefficientTypeActe * 
  coefficientCompagnie
);
```

### Logique de calcul des KPIs

```typescript
// Calculer les CA par type
const caByType = {
  total: acts.length,
  caIndANSante: acts.filter(a => a.kind === "IND_AN_SANTE").reduce((sum, a) => sum + a.caAnnuel, 0),
  caIndANPrevoyance: acts.filter(a => a.kind === "IND_AN_PREVOYANCE").reduce((sum, a) => sum + a.caAnnuel, 0),
  caIndANRetraite: acts.filter(a => a.kind === "IND_AN_RETRAITE").reduce((sum, a) => sum + a.caAnnuel, 0),
  caCollANSante: acts.filter(a => a.kind === "COLL_AN_SANTE").reduce((sum, a) => sum + a.caAnnuel, 0),
  caCollANPrevoyance: acts.filter(a => a.kind === "COLL_AN_PREVOYANCE").reduce((sum, a) => sum + a.caAnnuel, 0),
  caCollANRetraite: acts.filter(a => a.kind === "COLL_AN_RETRAITE").reduce((sum, a) => sum + a.caAnnuel, 0),
  caCollAdhesionRenfort: acts.filter(a => a.kind === "COLL_ADHESION_RENFORT").reduce((sum, a) => sum + a.caAnnuel, 0),
  caRevision: acts.filter(a => a.kind === "REVISION").reduce((sum, a) => sum + a.caAnnuel, 0),
  caAdhesionRenfort: acts.filter(a => a.kind === "ADHESION_RENFORT").reduce((sum, a) => sum + a.caAnnuel, 0),
  caCourtageToAllianz: acts.filter(a => a.kind === "COURTAGE_TO_ALLIANZ").reduce((sum, a) => sum + a.caAnnuel, 0),
  caAllianzToCourtage: acts.filter(a => a.kind === "ALLIANZ_TO_COURTAGE").reduce((sum, a) => sum + a.caAnnuel, 0),
  caBrut: acts.reduce((sum, a) => sum + a.caAnnuel, 0),
  caPondere: acts.reduce((sum, a) => sum + a.caPondere, 0),
};
```

### Timeline pour HealthCollectiveAct

- Adapter `generateTimeline` pour accepter les actes santé collective
- Utiliser `dateSaisie` pour grouper les actes par jour

### Affichage progression seuils

- **Réutiliser `getHealthCommissionRate(kpi.caPondere)` de `lib/utils/health-kpi.ts`** - Les seuils sont identiques à santé individuelle
- Afficher un thermomètre horizontal identique à celui de santé individuelle
- Afficher uniquement si `selectedUser !== "all"`
- Tous les seuils doivent être visibles avec leurs pourcentages en relief

### Grille de rémunération (seuils de commission)

Les seuils de commission sont **identiques à santé individuelle** :

| Seuil | CA Pondéré | Taux de commission |
|-------|------------|-------------------|
| Seuil 1 | 0€ - 10 000€ | 0% |
| Seuil 2 | 10 000€ - 14 000€ | 2% |
| Seuil 3 | 14 000€ - 18 000€ | 3% |
| Seuil 4 | 18 000€ - 22 000€ | 4% |
| Seuil 5 | 22 000€+ | 6% |

**Important :** Le taux de commission s'applique sur **TOUTE la production** depuis le 1er euro (pas de calcul progressif par tranche).

**Exemple :** Si CA pondéré = 15 000€ → Taux = 3% → Commission = 15 000€ × 3% = 450€

## Points à clarifier avant implémentation

1. **Collection Firestore** : Quel est le nom de la collection ? (`health_collective_acts` ?)
2. **Seuils de commission** : ✅ **Identiques à santé individuelle** - Réutiliser `getHealthCommissionRate()` de `lib/utils/health-kpi.ts`
3. **Validation numéro de contrat** : Y a-t-il une vérification d'unicité comme pour santé individuelle ?
4. **Compagnies** : Comment identifier si une compagnie est "Allianz", "Unim", "Uniced" ou "Courtage" ?
   - Ajouter un champ `type` dans la collection `companies` ?
   - Ou utiliser le nom de la compagnie pour déterminer le coefficient ?

## Notes importantes

- Respecter le style et la structure de `sante-individuelle` pour la cohérence
- Utiliser les mêmes composants UI (Card, Select, Button, etc.)
- Gérer les conversions Timestamp/Date pour Firestore
- Implémenter le tri et le filtrage côté client pour les performances
- Ajouter les états de chargement et les messages d'erreur appropriés
- Pour les graphiques (section 9) : charger les données des 6 mois (mois en cours + 5 précédents) uniquement quand un commercial est sélectionné
- Les graphiques doivent être conditionnels : afficher uniquement si `selectedUser !== "all"`
- Le thermomètre doit afficher tous les seuils avec leurs explications et pourcentages en relief

