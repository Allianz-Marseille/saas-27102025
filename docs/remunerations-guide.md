# Guide d'utilisation - Gestion des Rémunérations

## Vue d'ensemble

Le module de gestion des rémunérations permet aux administrateurs de :
- Visualiser les rémunérations de tous les collaborateurs (hors administrateurs)
- Simuler des augmentations (en % ou en €)
- Valider les augmentations individuellement ou en masse
- Consulter l'historique des rémunérations (3 dernières années)

## Accès

**Navigation** : Sidebar Admin → Rémunérations  
**Permissions** : Réservé aux utilisateurs avec le rôle `ADMINISTRATEUR`

## Fonctionnalités

### 1. Tableau des rémunérations

#### Affichage
- **Toggle Mensuel/Annuel** : Affiche les montants au mois ou à l'année (×12)
- **Statistiques en haut** :
  - Nombre de collaborateurs
  - Masse salariale actuelle
  - Masse salariale simulée
  - Différence (impact des simulations)

#### Colonnes
- **Collaborateur** : Nom complet ou email
- **Contrat** : Type de contrat (CDI, Alternant, etc.) et ETP
- **Rémunération actuelle** : Salaire mensuel ou annuel selon le toggle
- **Type augmentation** : Sélecteur % ou €
- **Augmentation** : Champ de saisie pour la valeur
- **Nouvelle rémunération** : Calcul automatique
- **Différence** : Impact de l'augmentation
- **Actions** : Bouton "Valider" pour chaque ligne

#### Simulations

**Pourcentage** :
- Saisir un nombre (ex: 5 pour 5%)
- Calcul : `nouveau_salaire = salaire_actuel × (1 + pourcentage / 100)`

**Montant en euros** :
- Saisir un montant (ex: 200)
- Calcul : `nouveau_salaire = salaire_actuel + montant`

**Actions disponibles** :
- **Effacer (X)** : Efface toutes les simulations
- **Valider toutes** : Valide toutes les simulations en une fois
- **Valider** (par ligne) : Valide une seule augmentation

### 2. Validation des augmentations

Lors de la validation (individuelle ou multiple), une modale s'ouvre :

**Informations demandées** :
- **Année d'application** : Année pour laquelle l'augmentation s'applique (défaut: année en cours)

**Récapitulatif affiché** :
- Liste des collaborateurs concernés
- Salaire actuel vs nouveau salaire
- Type d'augmentation (% ou €)
- Total de l'augmentation

**⚠️ Avertissement** : L'opération est irréversible

**Actions backend** :
1. Création d'un document dans `salary_history` pour chaque collaborateur
2. Mise à jour du champ `currentMonthlySalary` dans le document utilisateur
3. Nettoyage automatique de l'historique > 3 ans (optionnel)

### 3. Historique

**Onglet "Historique"** : Affiche toutes les modifications de rémunérations

#### Filtres
- **Par collaborateur** : Voir l'historique d'une personne
- **Par année** : Filtrer par année d'application

#### Colonnes
- **Date** : Date et heure de validation
- **Année** : Année d'application
- **Collaborateur** : Nom du salarié concerné
- **Type** : Badge (Initial / Augmentation / Diminution)
- **Ancien salaire** : Salaire mensuel précédent
- **Nouveau salaire** : Salaire mensuel après modification
- **Variation** : Montant et pourcentage de changement
- **Validé par** : Administrateur ayant validé

#### Actions
- **Nettoyer anciennes données** : Supprime les entrées > 3 ans

## Import initial des salaires

Si vous avez déjà des salaires définis dans un fichier externe :

### 1. Créer le fichier de données

Créer `scripts/data/salaries.json` :

```json
[
  { "email": "user1@example.com", "monthlySalary": 3000 },
  { "email": "user2@example.com", "monthlySalary": 3500 },
  { "email": "user3@example.com", "monthlySalary": 2800 }
]
```

### 2. Exécuter le script

```bash
npx ts-node --project tsconfig.scripts.json scripts/import-salaries.ts
```

Le script va :
- Mettre à jour le champ `currentMonthlySalary` pour chaque utilisateur
- Créer une entrée d'historique de type "initial" pour l'année en cours

## Architecture technique

### Collections Firestore

**Collection `salary_history`** :
```typescript
{
  id: string;
  userId: string;
  year: number;
  monthlySalary: number;
  previousMonthlySalary?: number;
  changeType: "initial" | "increase" | "decrease";
  changeAmount?: number;
  changePercentage?: number;
  validatedAt: Date;
  validatedBy: string;
  createdAt: Date;
}
```

**Champ ajouté dans `users`** :
```typescript
{
  currentMonthlySalary?: number; // Salaire mensuel actuel en euros
}
```

### Règles de sécurité

**Firestore** : Accès réservé aux administrateurs
```
match /salary_history/{historyId} {
  allow read: if isAdmin();
  allow create: if isAdmin();
  allow update: if false; // Historique immuable
  allow delete: if isAdmin();
}
```

### Fonctions disponibles

**Fichier** : `lib/firebase/salaries.ts`

- `getCurrentSalaries()` : Récupère les utilisateurs actifs non-admin avec salaires
- `getSalaryHistory(userId?, year?)` : Récupère l'historique filtré
- `validateSalaryIncrease(...)` : Valide une augmentation unique
- `validateAllSalaryIncreases(...)` : Valide plusieurs augmentations
- `cleanOldSalaryHistory()` : Supprime les entrées > 3 ans
- `getLastSalary(userId)` : Récupère le dernier salaire d'un utilisateur

## Bonnes pratiques

1. **Saisir les salaires initiaux** : Utiliser le script d'import ou saisir manuellement
2. **Vérifier les simulations** : Toujours vérifier les calculs avant validation
3. **Année d'application** : Bien sélectionner l'année (généralement année en cours)
4. **Nettoyer régulièrement** : Supprimer l'historique > 3 ans (1 fois par an)
5. **Export de données** : Utiliser l'onglet historique avec les filtres pour des analyses

## Dépannage

**Problème** : "Aucun collaborateur trouvé"
- **Solution** : Vérifier qu'il existe des utilisateurs actifs avec un rôle autre que ADMINISTRATEUR

**Problème** : "Erreur lors du chargement des données"
- **Solution** : Vérifier les permissions Firestore et la connexion à Firebase

**Problème** : La validation échoue
- **Solution** : Vérifier que l'utilisateur est bien administrateur et que les règles Firestore sont correctes

**Problème** : Les montants ne s'affichent pas
- **Solution** : Vérifier que le champ `currentMonthlySalary` existe dans le document utilisateur

## Support

Pour toute question ou problème :
1. Consulter les logs du navigateur (Console DevTools)
2. Vérifier les logs Firestore dans la console Firebase
3. Contacter l'équipe technique
