# Refonte page admin santé individuelle

## Objectif

Refondre `app/admin/sante-individuelle/page.tsx` en s'inspirant de `components/admin/activity-overview.tsx` pour créer une interface cohérente avec navigation mensuelle, sélection d'utilisateur, KPIs détaillés, timeline et tableau filtré.

## Structure de la nouvelle page

### 1. Navigation mensuelle

- Utiliser le même système que `ActivityOverview` avec boutons précédent/suivant
- Le mois sélectionné affecte tous les éléments (KPIs, timeline, tableau)

### 2. Sélection d'utilisateur

- Select avec option "Tous" + liste des utilisateurs avec rôle `COMMERCIAL_SANTE_INDIVIDUEL`
- Récupérer les utilisateurs via `getAllCommercials()` et filtrer par rôle
- Le filtre affecte les KPIs, timeline et tableau

### 3. KPIs (première ligne)

- **Total des actes** (nombre)
- **CA des AN** (somme des `caAnnuel` pour `AFFAIRE_NOUVELLE`)
- **CA des révisions** (somme des `caAnnuel` pour `REVISION`)
- **CA des adhésions** (somme des `caAnnuel` pour `ADHESION_SALARIE`)
- **CA de courtage vers Allianz** (somme des `caAnnuel` pour `COURT_TO_AZ`)
- **CA d'Allianz vers courtage** (somme des `caAnnuel` pour `AZ_TO_COURTAGE`)

### 4. KPIs (deuxième ligne)

- **CA brut** (somme de tous les `caAnnuel`)
- **CA pondéré commission** (somme de tous les `caPondere`)

### 5. Timeline

- Réutiliser la logique de `generateTimeline` mais adaptée pour `HealthAct`
- Afficher les jours du mois avec le nombre d'actes par jour
- Scroll automatique vers aujourd'hui si le mois en cours est sélectionné

### 6. Tableau des actes

- Colonnes : Date saisie, Type, Client, N° Contrat, Compagnie, Date effet, CA Annuel, CA Pondéré
- Tri par colonne (comme dans `ActivityOverview`)
- Filtres par tags : Tous, AN, Révisions, Adhésions, Courtage vers Allianz, Allianz vers courtage
- Actions admin : modifier/supprimer (utiliser les dialogs existants)

### 7. Progression seuils de commissions

- Afficher uniquement quand un commercial est sélectionné (pas "Tous")
- Afficher au-dessus du tableau
- Barre de progression vers le prochain seuil
- Informations : seuil actuel, prochain seuil, CA pondéré actuel, objectif restant
- Utiliser `getHealthCommissionRate()` pour calculer

### 8. Graphiques détaillés (uniquement si commercial sélectionné)

- Afficher uniquement quand un `COMMERCIAL_SANTE_INDIVIDUEL` est sélectionné (pas "Tous")
- Afficher après la progression seuils et avant le tableau

#### 8.1. Évolution des commissions versées

- Graphique en ligne ou en barres montrant l'évolution des commissions sur 6 mois
- Période : mois en cours + 5 mois précédents
- Données : commissions calculées pour chaque mois via `getHealthCommissionRate()`
- Utiliser `recharts` (AreaChart ou LineChart) comme dans `ActivityOverview`
- Afficher les valeurs sur les points du graphique

#### 8.2. Répartition du CA par type d'acte

- Graphique en camembert (PieChart) montrant la répartition du CA annuel
- Types d'actes à afficher :
  - AN (Affaire Nouvelle)
  - Révisions
  - Adhésions
  - Courtage vers Allianz
  - Allianz vers courtage
- Utiliser `recharts` PieChart comme dans `ActivityOverview`
- Afficher les pourcentages et les montants sur chaque segment
- Couleurs distinctes pour chaque type d'acte

## Modifications nécessaires

### Fichiers à modifier/créer

1. **`app/admin/sante-individuelle/page.tsx`** - Refonte complète

   - Remplacer le contenu actuel par une structure similaire à `ActivityOverview`
   - Implémenter la logique de chargement des actes par mois et utilisateur
   - Calculer les KPIs spécifiques par type d'acte
   - Implémenter la timeline pour `HealthAct`
   - Créer le tableau avec filtres et tri
   - Ajouter les graphiques d'évolution des commissions (6 mois) et de répartition du CA (camembert) quand un commercial est sélectionné
   - Charger les données historiques des 5 mois précédents pour le graphique d'évolution

2. **`lib/utils/health-kpi.ts`** - Ajouter fonction de calcul CA par type

   - Créer `calculateHealthKPIsByType(acts: HealthAct[])` qui retourne les CA par type d'acte

3. **`lib/firebase/health-acts.ts`** - Ajouter fonction de récupération par mois

   - Créer `getHealthActsByMonth(userId: string | null, monthKey: string)` pour récupérer tous les actes d'un mois (avec ou sans filtre utilisateur)

### Composants à réutiliser

- `MonthSelector` ou créer une navigation similaire à `ActivityOverview`
- `KPICard` pour afficher les KPIs
- `EditHealthActDialog` pour modifier les actes
- `DeleteHealthActDialog` pour supprimer les actes (à créer si nécessaire)

### Logique de calcul des KPIs

```typescript
// Calculer les CA par type
const caByType = {
  total: acts.length,
  caAN: acts.filter(a => a.kind === "AFFAIRE_NOUVELLE").reduce((sum, a) => sum + a.caAnnuel, 0),
  caRevision: acts.filter(a => a.kind === "REVISION").reduce((sum, a) => sum + a.caAnnuel, 0),
  caAdhesion: acts.filter(a => a.kind === "ADHESION_SALARIE").reduce((sum, a) => sum + a.caAnnuel, 0),
  caCourtToAz: acts.filter(a => a.kind === "COURT_TO_AZ").reduce((sum, a) => sum + a.caAnnuel, 0),
  caAzToCourtage: acts.filter(a => a.kind === "AZ_TO_COURTAGE").reduce((sum, a) => sum + a.caAnnuel, 0),
  caBrut: acts.reduce((sum, a) => sum + a.caAnnuel, 0),
  caPondere: acts.reduce((sum, a) => sum + a.caPondere, 0),
};
```

### Timeline pour HealthAct

- Adapter `generateTimeline` pour accepter `HealthAct[]` au lieu de `Act[]`
- Utiliser `dateSaisie` pour grouper les actes par jour

### Affichage progression seuils

- Utiliser `getHealthCommissionRate(kpi.caPondere)` pour obtenir les informations
- Afficher une barre de progression similaire à celle dans la page actuelle
- Afficher uniquement si `selectedUser !== "all"`

## Notes importantes

- Respecter le style et la structure de `ActivityOverview` pour la cohérence
- Utiliser les mêmes composants UI (Card, Select, Button, etc.)
- Gérer les conversions Timestamp/Date pour Firestore
- Implémenter le tri et le filtrage côté client pour les performances
- Ajouter les états de chargement et les messages d'erreur appropriés
- Pour les graphiques (section 8) : charger les données des 6 mois (mois en cours + 5 précédents) uniquement quand un commercial est sélectionné
- Utiliser `getHealthActsByMonth()` pour récupérer les actes de chaque mois historique
- Calculer les commissions pour chaque mois en utilisant `getHealthCommissionRate()` avec le CA pondéré du mois
- Les graphiques doivent être conditionnels : afficher uniquement si `selectedUser !== "all"`

