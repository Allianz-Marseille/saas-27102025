# Grille de Pilotage des Rémunérations

## Vue d'ensemble

Page de pilotage permettant la gestion complète des rémunérations de tous les utilisateurs (hors administrateurs).

### Fonctionnalités principales

1. **Saisie et modification directe** : Entrer et modifier directement le salaire d'un utilisateur
2. **Apparition automatique** : Les utilisateurs créés (non-admin) apparaissent automatiquement avec salaire 0€
3. **Disparition automatique** : Les utilisateurs désactivés/supprimés disparaissent automatiquement
4. **Toggle d'inclusion** : Chaque ligne possède un toggle pour inclure/exclure l'utilisateur de la comparaison
5. **Simulation d'augmentations** : 
   - Sélecteur par ligne pour choisir le type : "Euros" ou "%"
   - Saisie de la valeur selon le type sélectionné
   - Calcul automatique du nouveau salaire
   - Chaque ligne peut avoir un type différent (euros ou %)
6. **Simulation d'arrivées** : Simuler un recrutement avec choix de l'année et du salaire
7. **Simulation de départs** : Désactiver virtuellement un utilisateur (via toggle ou neutralisation) pour analyser l'impact
8. **Mode brouillon partagé** : Enregistrer toutes les simulations dans un brouillon accessible par tous les admins
9. **Validation globale** : Valider toutes les modifications du brouillon en une seule action

### Exemple d'utilisation

**Scénario** : Analyser l'impact d'un remplacement
- Départ : Utilisateur A à 30000€/an
- Arrivée : Recrutement B à 32000€/an
- **Action** : Décocher le toggle d'inclusion de l'utilisateur A, ajouter le recrutement simulé B
- **Résultat** : Impact net affiché = +2000€/an (surcoût)

## Spécifications fonctionnelles

### 1. Affichage des utilisateurs

- **Filtrage automatique** : Afficher tous les utilisateurs actifs sauf les administrateurs
- **Chargement dynamique** : Les utilisateurs sont chargés automatiquement depuis Firestore
- **Collection source** : `users` dans Firestore
- **Critères d'inclusion** :
  - `active === true`
  - `role !== "ADMINISTRATEUR"`

#### 1.1 Apparition automatique

- **Création d'un utilisateur** : Quand un utilisateur non-admin est créé dans le SaaS, il apparaît automatiquement dans la page de rémunération
- **Salaire par défaut** : Si aucun salaire n'est défini, l'utilisateur apparaît avec un revenu de **0€**
- **Saisie possible** : Possibilité de renseigner immédiatement un salaire pour ce nouvel utilisateur

#### 1.2 Disparition automatique

- **Désactivation** : Si un utilisateur est désactivé (`active = false`), il disparaît automatiquement de la page de rémunération
- **Suppression** : Si un utilisateur est supprimé du SaaS, il disparaît automatiquement de la page de rémunération
- **Pas de neutralisation nécessaire** : La désactivation/suppression dans le SaaS suffit, pas besoin de neutraliser manuellement dans la page de rémunération

#### 1.3 Présence dans la grille

- **Règle** : Tant qu'un utilisateur n'est pas désactivé ou supprimé comme user dans le SaaS, il est présent dans la grille de rémunération
- **Inclusion par défaut** : Tous les utilisateurs actifs sont inclus dans la comparaison par défaut

### 2. Gestion des rémunérations

#### 2.1 Saisie du salaire brut

- **Deux modes de saisie** :
  - **Salaire brut mensuel** : Montant en euros par mois
  - **Salaire brut annuel** : Montant en euros par an

- **Conversion automatique** :
  - Mensuel → Annuel : `salaire_annuel = salaire_mensuel × 12`
  - Annuel → Mensuel : `salaire_mensuel = salaire_annuel / 12`

- **Affichage simultané** : Les deux valeurs (mensuelle et annuelle) doivent être visibles et synchronisées

- **Modification directe** : Possibilité de modifier directement le salaire dans le tableau (saisie directe)

#### 2.2 Attribution par année

- **Champ obligatoire** : Année d'application du salaire
- **Format** : Année complète (ex: 2025, 2026)
- **Validation** : Année valide (pas dans le passé sauf pour historique)
- **Sélecteur d'année** : Dropdown pour choisir l'année d'application

#### 2.3 Saisie depuis zéro

- **Point de départ** : Possibilité de renseigner un salaire pour un utilisateur qui n'a pas encore de rémunération enregistrée
- **Valeur par défaut** : 0 (si aucun salaire n'est défini)
- **Première saisie** : Permettre la saisie complète (montant + année) même si l'utilisateur n'a jamais eu de salaire
- **Sauvegarde** : Bouton "Sauvegarder" par ligne pour enregistrer la modification

### 3. Structure des données

#### 3.1 Données utilisateur

```typescript
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string; // Exclure "ADMINISTRATEUR"
  active: boolean; // Filtrer sur true
  currentMonthlySalary?: number; // Salaire mensuel actuel (optionnel)
  currentAnnualSalary?: number; // Salaire annuel actuel (optionnel)
  salaryYear?: number; // Année d'application du salaire actuel
}
```

#### 3.2 Historique des salaires

- **Collection** : `salary_history` dans Firestore
- **Champs** :
  - `userId` : ID de l'utilisateur
  - `year` : Année d'application
  - `monthlySalary` : Salaire mensuel en euros
  - `annualSalary` : Salaire annuel en euros (calculé)
  - `previousMonthlySalary` : Salaire mensuel précédent (pour traçabilité)
  - `changeType` : Type de changement ("initial", "increase", "decrease")
  - `changeAmount` : Montant du changement en euros
  - `changePercentage` : Pourcentage du changement
  - `createdAt` : Date de création
  - `validatedAt` : Date de validation
  - `validatedBy` : ID de l'administrateur qui a validé l'entrée

#### 3.3 Simulation de recrutement

```typescript
interface RecruitmentSimulation {
  id: string; // ID temporaire généré côté client
  firstName: string;
  lastName: string;
  email?: string;
  role: string; // Rôle sélectionné (hors ADMINISTRATEUR)
  contrat: string; // Type de contrat
  etp: number; // Équivalent Temps Plein (0.5, 0.75, 1.0, etc.)
  monthlySalary: number; // Salaire mensuel
  annualSalary: number; // Salaire annuel (calculé)
  year: number; // Année d'application
  isSimulation: true; // Flag pour identifier les simulations
}
```

#### 3.4 Neutralisation de départ

```typescript
interface DepartureNeutralization {
  userId: string; // ID de l'utilisateur qui part
  userName: string; // Nom complet pour affichage
  monthlySalary: number; // Salaire mensuel économisé
  annualSalary: number; // Salaire annuel économisé (calculé)
  departureDate?: Date; // Date de départ prévue (optionnel)
  isNeutralized: true; // Flag pour identifier les neutralisations
}
```

#### 3.5 Brouillon partagé

- **Collection** : `salary_drafts` dans Firestore
- **Document ID** : `"shared"` (document unique partagé)
- **Structure** : Voir section 11.5 pour les interfaces TypeScript

### 4. Interface utilisateur

#### 4.1 Tableau principal

- **Colonnes** :
  1. **Toggle inclusion** (à gauche) : Case à cocher pour inclure/exclure l'utilisateur de la comparaison
  2. Nom / Prénom
  3. Email
  4. Rôle
  5. Salaire brut mensuel (éditable directement)
  6. Salaire brut annuel (éditable directement, synchronisé)
  7. Année d'application (sélecteur d'année)
  8. **Simulation d'augmentation** :
     - Sélecteur de type : "Euros" ou "%" (par ligne, indépendant)
     - Champ de saisie : Montant en euros OU pourcentage selon le sélecteur
     - Affichage du nouveau salaire calculé (en temps réel)
  9. Actions :
     - Sauvegarder (pour enregistrer la modification directe)
     - Neutraliser départ (pour simuler un départ)
     - Historique (voir l'historique des salaires)

#### 4.1.1 Toggle d'inclusion dans la comparaison

- **Position** : Colonne à gauche du tableau (première colonne)
- **Fonctionnalité** : Case à cocher pour chaque utilisateur
- **État par défaut** : Tous les utilisateurs sont inclus (cochés) par défaut
- **Impact** : 
  - **Coché** : L'utilisateur est inclus dans le calcul de la masse salariale
  - **Décoché** : L'utilisateur est exclu du calcul de la masse salariale
- **Utilisation** : Permet de simuler des scénarios précis
  - Exemple : Désélectionner un départ (30000€/an) et ajouter un recrutement (32000€/an) pour voir le surcoût net de 2000€/an

#### 4.2 Fonctionnalités

- **Saisie directe** : Modification possible directement dans le tableau (champs éditables)
- **Conversion en temps réel** : Lors de la saisie du mensuel, l'annuel se met à jour automatiquement (et vice versa)
- **Sélecteur d'année** : Dropdown pour choisir l'année d'application
- **Simulation d'augmentation** :
  - Sélecteur de type par ligne : "Euros", "%", ou "Aucune"
  - Champ de saisie adaptatif selon le type sélectionné
  - Calcul automatique du nouveau salaire en temps réel
  - Affichage de la différence (en euros et en %)
- **Sauvegarde individuelle** : Bouton "Sauvegarder" par ligne pour enregistrer les modifications directes (hors brouillon)
- **Mode brouillon** : Les simulations (augmentations, départs, arrivées) sont enregistrées dans le brouillon partagé
- **Validation globale** : Bouton "Valider" principal pour valider tout le contenu du brouillon en une fois

#### 4.3 Validation

- **Montant valide** : Nombre positif ou zéro
- **Année valide** : Année entre 2020 et 2100
- **Conversion précise** : Arrondi à 2 décimales pour les montants

### 5. Workflow de saisie

#### 5.1 Nouvel utilisateur (salaire = 0)

1. L'utilisateur apparaît dans le tableau avec salaire = 0
2. Saisie du salaire brut (mensuel ou annuel)
3. Sélection de l'année d'application
4. Sauvegarde → Création d'une entrée dans `salary_history`
5. Mise à jour du champ `currentMonthlySalary` et `currentAnnualSalary` dans `users`

#### 5.2 Utilisateur existant

1. Affichage du salaire actuel (mensuel et annuel)
2. Modification possible du montant
3. Possibilité de changer l'année (création d'une nouvelle entrée d'historique)
4. Sauvegarde → Mise à jour de l'historique et des champs utilisateur

### 6. Règles métier

- **Un salaire par année** : Un utilisateur peut avoir un salaire différent par année
- **Salaire actuel** : Le salaire de l'année en cours est considéré comme le salaire "actuel"
- **Historique** : Tous les changements sont enregistrés dans `salary_history`
- **Traçabilité** : Chaque modification enregistre qui l'a faite et quand

### 7. Calculs et conversions

#### 7.1 Conversion mensuel ↔ annuel

```
Salaire annuel = Salaire mensuel × 12
Salaire mensuel = Salaire annuel ÷ 12
```

#### 7.2 Arrondi

- **Précision** : 2 décimales pour l'affichage
- **Stockage** : Valeur exacte en base de données

### 8. Exclusions et inclusions

#### 8.1 Exclusions automatiques

- **Administrateurs** : Les utilisateurs avec `role === "ADMINISTRATEUR"` ne sont jamais affichés
- **Utilisateurs inactifs** : Les utilisateurs avec `active === false` ne sont pas affichés (disparaissent automatiquement)

#### 8.2 Inclusion dans la comparaison

- **Par défaut** : Tous les utilisateurs actifs (hors admin) sont inclus dans la comparaison (toggle coché)
- **Toggle d'inclusion** : Chaque ligne possède un toggle pour inclure/exclure l'utilisateur de la comparaison
- **Utilisation** : Permet de créer des scénarios précis
  - Exemple 1 : Exclure un départ (décocher le toggle) et ajouter un recrutement pour voir le surcoût net
  - Exemple 2 : Exclure plusieurs utilisateurs pour simuler une réduction d'effectif
  - Exemple 3 : Inclure uniquement certains utilisateurs pour analyser un sous-groupe

### 9. Données à afficher

Pour chaque utilisateur (hors admin) :
- Nom complet (prénom + nom)
- Email
- Rôle
- Salaire brut mensuel actuel
- Salaire brut annuel actuel
- Année d'application du salaire actuel
- Historique des salaires (sur demande)

### 10. Actions disponibles

- **Modifier le salaire** : Saisie directe dans le tableau
- **Changer l'année** : Sélection d'une nouvelle année
- **Sauvegarder** : Enregistrement des modifications
- **Voir l'historique** : Consultation de l'historique des salaires pour un utilisateur
- **Simuler une augmentation** : 
  - Sélectionner le type (Euros ou %) via le sélecteur sur chaque ligne
  - Saisir la valeur (montant en euros ou pourcentage)
  - Le nouveau salaire est calculé automatiquement
  - Chaque ligne peut avoir un type différent (euros ou %)
- **Enregistrer le brouillon** : Sauvegarder les augmentations simulées dans un brouillon partagé
- **Charger le brouillon** : Charger le brouillon partagé existant
- **Mettre à jour le brouillon** : Mettre à jour le brouillon avec les nouvelles modifications
- **Supprimer le brouillon** : Effacer le brouillon partagé
- **Valider une augmentation** : Valider une augmentation individuelle
- **Valider toutes les augmentations** : Valider toutes les augmentations du brouillon en une fois
- **Neutraliser un départ** : Marquer un utilisateur comme partant pour évaluer l'impact
- **Réactiver un départ** : Annuler la neutralisation d'un départ
- **Simuler un recrutement** : Ajouter un recrutement fictif pour évaluer l'impact
- **Comparer les coûts** : Visualiser la différence entre situation actuelle et avec mouvements (départs + arrivées)
- **Valider un recrutement** : Convertir une simulation en utilisateur réel
- **Valider un départ** : Confirmer définitivement le départ d'un utilisateur
- **Valider tous les mouvements** : Valider tous les départs et arrivées en une fois
- **Réinitialiser les mouvements** : Annuler tous les mouvements simulés
- **Exporter** : Export des données (optionnel, à implémenter)

## Simulation de recrutement et gestion des mouvements

### Fonctionnalité

Permet de simuler l'ajout d'un nouveau recrutement et de gérer les départs pour évaluer l'impact sur la masse salariale. Gestion complète des mouvements de personnel (départs + arrivées).

### 10.1 Gestion des départs (neutralisation)

#### 10.1.1 Neutraliser un départ

- **Action "Neutraliser le départ"** : Disponible sur chaque ligne d'utilisateur dans le tableau
- **Fonctionnalité** : Permet de marquer temporairement un utilisateur comme "partant" sans le supprimer
- **Affichage visuel** :
  - Badge "Départ simulé" sur la ligne
  - Style visuel distinct (grisé, barré, ou couleur spécifique)
  - L'utilisateur reste visible mais son salaire n'est plus comptabilisé dans la masse salariale "avec mouvements"
- **Alternative : Toggle d'exclusion** : Au lieu de neutraliser, on peut simplement décocher le toggle d'inclusion pour exclure l'utilisateur de la comparaison

#### 10.1.2 Liste des départs neutralisés

- **Section dédiée** : Zone visible listant tous les utilisateurs neutralisés
- **Informations affichées** :
  - Nom complet
  - Salaire mensuel/annuel qui sera économisé
  - Date de départ prévue (optionnel)
- **Action de réactivation** : Possibilité de "réactiver" un départ neutralisé

#### 10.1.3 Impact du départ

- **Économie réalisée** : Le salaire de l'utilisateur partant est soustrait de la masse salariale
- **Calcul** :
  ```
  Masse avec mouvements = Masse actuelle - Σ(salaires_départs) + Σ(salaires_arrivées)
  ```

### 10.2 Création d'un recrutement simulé (arrivée)

- **Bouton "Simuler un recrutement"** : Disponible dans l'interface principale
- **Formulaire de saisie** :
  - Prénom (obligatoire)
  - Nom (obligatoire)
  - Email (optionnel, pour identification)
  - Rôle (sélection parmi les rôles disponibles, sauf ADMINISTRATEUR)
  - Type de contrat (CDI, CDD, Stage, etc.)
  - ETP (Équivalent Temps Plein) : 0.5, 0.75, 1.0, etc.
  - Salaire brut mensuel ou annuel (avec conversion automatique)
  - Année d'application (sélecteur d'année)
- **Enregistrement** : Le recrutement simulé peut être enregistré dans le brouillon partagé

### 10.2 Affichage du recrutement simulé

- **Intégration dans le tableau** : Le recrutement simulé apparaît dans le tableau avec un badge distinctif "Simulation"
- **Style visuel** : Mise en évidence différente (couleur, bordure) pour distinguer les simulations des utilisateurs réels
- **Actions** : Possibilité de modifier ou supprimer la simulation

### 10.3 Comparaison des coûts avec mouvements

#### 10.3.1 Affichage des totaux

- **Masse salariale actuelle** : Somme des salaires de tous les utilisateurs réels **inclus dans la comparaison** (selon les toggles)
- **Masse salariale avec mouvements** : 
  - Base : Masse salariale actuelle (utilisateurs avec toggle coché)
  - Moins : Salaires des utilisateurs exclus (toggle décoché) OU neutralisés (départs)
  - Plus : Salaires des recrutements simulés (arrivées)
- **Différence** : Écart entre masse actuelle et masse avec mouvements
- **Impact net** : Différence positive (augmentation) ou négative (diminution)

**Exemple concret** :
- Utilisateur A : 30000€/an, toggle décoché (exclu) → Économie de 30000€/an
- Recrutement simulé B : 32000€/an → Coût de 32000€/an
- Impact net : +2000€/an (surcoût)

#### 10.3.2 Scénarios de mouvement

- **Départ seul** : Un utilisateur part → Masse diminue
- **Arrivée seule** : Un recrutement arrive → Masse augmente
- **Départ + Arrivée** : Remplacement → Impact net à calculer
- **Plusieurs mouvements** : Gestion de plusieurs départs et/ou arrivées simultanés

#### 10.3.3 Vue comparative

- **Mode mensuel** : Affichage des coûts en euros par mois
- **Mode annuel** : Affichage des coûts en euros par an
- **Conversion automatique** : Basculement entre mensuel et annuel avec recalcul automatique
- **Affichage détaillé** :
  - Masse actuelle (mensuel/annuel)
  - Économies réalisées (départs) (mensuel/annuel)
  - Coûts supplémentaires (arrivées) (mensuel/annuel)
  - Masse finale avec mouvements (mensuel/annuel)
  - Impact net (mensuel/annuel)

#### 10.3.4 Indicateurs visuels

- **Badge de différence** : Affichage de l'impact net avec code couleur
  - Vert foncé : Diminution importante (économies)
  - Vert clair : Diminution modérée
  - Gris : Impact neutre (départ = arrivée)
  - Orange : Augmentation modérée
  - Rouge : Augmentation importante
- **Pourcentage d'évolution** : Calcul et affichage du pourcentage d'évolution
  ```
  % évolution = ((Masse avec mouvements - Masse actuelle) / Masse actuelle) × 100
  ```
- **Indicateur de remplacement** : Si départ ≈ arrivée, affichage "Remplacement neutre"

### 10.4 Gestion des mouvements

#### 10.4.1 Gestion des départs

- **Plusieurs départs** : Possibilité de neutraliser plusieurs utilisateurs simultanément
- **Réactivation** : Possibilité de réactiver un départ neutralisé (annulation du départ)
- **Suppression de neutralisation** : Retirer la neutralisation d'un départ
- **Affichage groupé** : Section dédiée listant tous les départs neutralisés

#### 10.4.2 Gestion des arrivées (simulations)

- **Plusieurs simulations** : Possibilité de créer plusieurs recrutements simulés simultanément
- **Modification** : Modification possible des paramètres d'une simulation (salaire, ETP, etc.)
- **Suppression** : Suppression individuelle ou globale des simulations
- **Affichage groupé** : Section dédiée listant toutes les arrivées simulées

#### 10.4.3 Gestion combinée

- **Vue d'ensemble** : Tableau récapitulatif des mouvements
  - Colonne "Départs" : Liste des utilisateurs neutralisés
  - Colonne "Arrivées" : Liste des recrutements simulés
  - Colonne "Impact" : Impact net par mouvement
- **Sauvegarde** : Les mouvements peuvent être sauvegardés temporairement (non persistés en base)
- **Réinitialisation** : Bouton pour annuler tous les mouvements et revenir à l'état initial

### 10.5 Calculs de comparaison avec mouvements

#### 10.5.1 Masse salariale actuelle

```
Masse actuelle (mensuelle) = Σ(salaire_mensuel_utilisateur_réel_inclus)
// Où utilisateur_réel_inclus = utilisateur avec toggle d'inclusion coché

Masse actuelle (annuelle) = Masse actuelle (mensuelle) × 12
```

**Note** : Seuls les utilisateurs avec le toggle d'inclusion coché sont comptabilisés dans la masse actuelle.

#### 10.5.2 Économies réalisées (départs et exclusions)

```
Économies (mensuelle) = Σ(salaire_mensuel_utilisateur_exclu)
// Où utilisateur_exclu = utilisateur avec toggle décoché OU neutralisé

Économies (annuelle) = Économies (mensuelle) × 12
```

**Note** : Les économies incluent :
- Les utilisateurs avec toggle d'inclusion décoché
- Les utilisateurs neutralisés (départs simulés)

#### 10.5.3 Coûts supplémentaires (arrivées)

```
Coûts arrivées (mensuelle) = Σ(salaire_mensuel_simulation)
Coûts arrivées (annuelle) = Coûts arrivées (mensuelle) × 12
```

#### 10.5.4 Masse salariale avec mouvements

```
Masse avec mouvements (mensuelle) = Masse actuelle (mensuelle) 
                                   - Économies (mensuelle) 
                                   + Coûts arrivées (mensuelle)

Masse avec mouvements (annuelle) = Masse avec mouvements (mensuelle) × 12
```

**Exemple de calcul** :
- Masse actuelle (utilisateurs inclus) : 500000€/an
- Utilisateur A exclu (toggle décoché) : -30000€/an
- Recrutement simulé B : +32000€/an
- Masse avec mouvements : 500000 - 30000 + 32000 = 502000€/an
- Impact net : +2000€/an

#### 10.5.5 Impact net

```
Impact net (mensuelle) = Masse avec mouvements (mensuelle) - Masse actuelle (mensuelle)
Impact net (annuelle) = Impact net (mensuelle) × 12

Ou directement :
Impact net (mensuelle) = Coûts arrivées (mensuelle) - Économies (mensuelle)
Impact net (annuelle) = Impact net (mensuelle) × 12
```

#### 10.5.6 Pourcentage d'évolution

```
% évolution = (Impact net / Masse actuelle) × 100
```

**Note** : Si le résultat est négatif, cela indique une diminution de la masse salariale (économies > coûts).

### 10.6 Interface de comparaison

#### 10.6.1 Section dédiée

- **Zone de comparaison** : Section visible en haut de la page ou dans un panneau latéral
- **Affichage côte à côte** :
  - Colonne gauche : Situation actuelle
  - Colonne droite : Situation avec simulation(s)
  - Colonne centrale : Différence et évolution

#### 10.6.2 Métriques affichées

- Nombre d'utilisateurs réels (total)
- Nombre d'utilisateurs inclus dans la comparaison (toggles cochés)
- Nombre d'utilisateurs exclus de la comparaison (toggles décochés)
- Nombre de départs neutralisés
- Nombre d'arrivées simulées
- Masse salariale mensuelle (actuelle vs avec mouvements)
- Masse salariale annuelle (actuelle vs avec mouvements)
- Économies réalisées (exclusions + départs) en euros (mensuel et annuel)
- Coûts supplémentaires (arrivées) en euros (mensuel et annuel)
- Impact net en euros (mensuel et annuel)
- Pourcentage d'évolution
- Coût par ETP (optionnel)
- Ratio départ/arrivée (si applicable)

### 10.7 Validation des mouvements

#### 10.7.1 Validation d'un recrutement

- **Bouton "Valider le recrutement"** : Disponible sur chaque simulation
- **Action** : Convertit la simulation en utilisateur réel
  - Création de l'utilisateur dans Firestore (collection `users`)
  - Création de l'entrée de salaire dans `salary_history`
  - Suppression de la simulation
  - Mise à jour automatique des totaux

#### 10.7.2 Validation d'un départ

- **Bouton "Valider le départ"** : Disponible sur chaque utilisateur neutralisé
- **Action** : Confirme définitivement le départ
  - Mise à jour de `active = false` dans Firestore (collection `users`)
  - Suppression de la neutralisation temporaire
  - Mise à jour automatique des totaux
  - Optionnel : Enregistrement dans un historique des départs

#### 10.7.3 Validation groupée

- **Bouton "Valider tous les mouvements"** : Disponible dans la section de comparaison
- **Action** : Valide tous les mouvements en une seule opération
  - Tous les recrutements simulés → utilisateurs réels
  - Tous les départs neutralisés → utilisateurs inactifs
  - Mise à jour complète de la base de données
  - Réinitialisation de l'interface de simulation

## Mode brouillon partagé

### Fonctionnalité

Permet d'enregistrer en mode brouillon toutes les modifications simulées (augmentations, mouvements) et de les partager entre tous les administrateurs pour validation collaborative. Le brouillon peut contenir :
- Des augmentations de salaire simulées
- Des départs neutralisés
- Des arrivées simulées (recrutements)

Toutes ces modifications peuvent être sauvegardées ensemble dans un seul brouillon partagé.

### 11.1 Simulation d'augmentations

#### 11.1.1 Interface de simulation par ligne

- **Sélecteur de type** : Sur chaque ligne du tableau, un sélecteur permet de choisir le type d'augmentation
  - Option "Euros" : Augmentation en montant fixe
  - Option "%" : Augmentation en pourcentage
  - Option "Aucune" (par défaut) : Pas d'augmentation simulée
- **Champ de saisie** : Champ numérique à côté du sélecteur
  - Si "Euros" sélectionné : Saisie en euros (ex: 500, 1000)
  - Si "%" sélectionné : Saisie en pourcentage (ex: 5, 10)
- **Indépendance par ligne** : Chaque ligne peut avoir un type différent (euros ou %)
  - Ligne 1 : Augmentation de 500€
  - Ligne 2 : Augmentation de 5%
  - Ligne 3 : Pas d'augmentation
  - etc.

#### 11.1.2 Calcul automatique

- **Calcul en temps réel** : Le nouveau salaire est calculé automatiquement dès la saisie
- **Formule pour euros** :
  ```
  nouveau_salaire = salaire_actuel + montant_euros
  ```
- **Formule pour pourcentage** :
  ```
  nouveau_salaire = salaire_actuel × (1 + pourcentage / 100)
  ```
- **Affichage** : 
  - Le nouveau salaire calculé s'affiche en temps réel
  - Différence affichée (en euros et en %)
  - Colonnes "Nouveau salaire mensuel" et "Nouveau salaire annuel" mises à jour automatiquement

#### 11.1.3 Gestion des augmentations simulées

- **Plusieurs augmentations** : Possibilité de simuler des augmentations pour plusieurs utilisateurs simultanément
- **Modification** : 
  - Changer le type (Euros ↔ %) : Le champ de saisie s'adapte automatiquement
  - Modifier la valeur : Le calcul se met à jour en temps réel
  - Réinitialiser : Sélectionner "Aucune" pour supprimer l'augmentation
- **Suppression** : 
  - Individuelle : Sélectionner "Aucune" sur une ligne
  - Globale : Bouton "Effacer toutes les augmentations"
- **Affichage visuel** : 
  - Les lignes avec augmentation simulée sont mises en évidence (couleur, badge)
  - Badge indiquant le type d'augmentation (€ ou %)
  - Affichage de la différence (en euros et en %)

### 11.2 Enregistrement en mode brouillon

#### 11.2.1 Sauvegarde du brouillon

- **Bouton "Enregistrer le brouillon"** : Disponible dans l'interface principale
- **Action** : Sauvegarde toutes les modifications simulées dans un brouillon partagé :
  - Toutes les augmentations simulées
  - Tous les départs neutralisés
  - Toutes les arrivées simulées (recrutements)
- **Données enregistrées** :
  - Liste des augmentations (userId, type, valeur, nouveau salaire)
  - Liste des départs neutralisés (userId, salaire économisé)
  - Liste des arrivées simulées (données du recrutement)
  - Année d'application
  - Date de création/modification
  - Créateur/modificateur (ID de l'admin)
- **Collection Firestore** : `salary_drafts` avec document ID `"shared"`

#### 11.2.2 Brouillon partagé

- **Accessibilité** : Tous les administrateurs peuvent voir et modifier le même brouillon
- **Dernière modification** : Affichage de qui a modifié le brouillon en dernier et quand
- **Chargement automatique** : Au chargement de la page, le brouillon partagé est automatiquement chargé s'il existe
- **Indicateur visuel** : Badge "Brouillon partagé actif" visible dans l'interface

#### 11.2.3 Gestion du brouillon

- **Chargement** : Le brouillon est chargé automatiquement au démarrage de la page
- **Mise à jour** : Chaque modification peut être sauvegardée dans le brouillon
- **Suppression** : Bouton "Supprimer le brouillon" pour effacer le brouillon partagé
- **Conflits** : Gestion des modifications simultanées (dernière modification écrasant les précédentes)

### 11.3 Interface du mode brouillon

#### 11.3.1 Indicateurs

- **Badge "Brouillon actif"** : Visible en haut de la page quand un brouillon existe
- **Compteur** : Nombre d'augmentations dans le brouillon
- **Dernière modification** : Affichage "Modifié par [Nom] le [Date]"

#### 11.3.2 Actions disponibles

- **Enregistrer le brouillon** : Sauvegarde les augmentations simulées
- **Mettre à jour le brouillon** : Met à jour le brouillon existant avec les nouvelles modifications
- **Charger le brouillon** : Recharge le brouillon depuis Firestore
- **Supprimer le brouillon** : Efface le brouillon partagé
- **Valider les augmentations** : Valide définitivement toutes les augmentations du brouillon

### 11.4 Validation globale

#### 11.4.1 Bouton de validation principal

- **Bouton "Valider"** : Bouton principal visible en permanence dans l'interface
- **Disponibilité** : Actif uniquement si des modifications sont enregistrées dans le brouillon
- **Action** : Valide toutes les modifications du brouillon en une seule opération

#### 11.4.2 Validation groupée complète

- **Bouton "Valider"** : Valide TOUT le contenu du brouillon partagé
- **Actions effectuées** :
  - **Augmentations** : 
    - Création des entrées dans `salary_history` pour tous les utilisateurs concernés
    - Mise à jour de `currentMonthlySalary` et `currentAnnualSalary` dans `users`
  - **Départs** :
    - Mise à jour de `active = false` dans Firestore (collection `users`)
    - Optionnel : Enregistrement dans un historique des départs
  - **Arrivées (recrutements)** :
    - Création de l'utilisateur dans Firestore (collection `users`)
    - Création de l'entrée de salaire dans `salary_history`
  - **Nettoyage** :
    - Suppression du brouillon partagé
    - Réinitialisation de l'interface de simulation

#### 11.4.3 Récapitulatif avant validation

- **Modal de confirmation** : Affichage obligatoire avant validation
- **Informations affichées** :
  - Nombre d'augmentations à valider
  - Nombre de départs à valider
  - Nombre d'arrivées à valider
  - Masse salariale actuelle vs nouvelle (avec tous les mouvements)
  - Impact total (mensuel et annuel)
  - Pourcentage d'évolution global
  - Liste détaillée des modifications (optionnel, dans un accordéon)
- **Validation requise** : Confirmation explicite nécessaire (double confirmation recommandée)

### 11.5 Structure des données du brouillon

```typescript
interface SalaryDraft {
  id: "shared"; // ID fixe pour le brouillon partagé
  year: number; // Année d'application
  salaryIncreases: SalaryDraftItem[]; // Liste des augmentations
  departures: DepartureDraftItem[]; // Liste des départs neutralisés
  arrivals: ArrivalDraftItem[]; // Liste des arrivées simulées
  createdAt: Date; // Date de création
  updatedAt: Date; // Date de dernière modification
  createdBy: string; // ID de l'admin créateur
  lastUpdatedBy: string; // ID du dernier admin modificateur
}

interface SalaryDraftItem {
  userId: string; // ID de l'utilisateur
  currentSalary: number; // Salaire actuel (au moment de la création du brouillon)
  newSalary: number; // Nouveau salaire calculé
  type: "percentage" | "amount"; // Type d'augmentation ("percentage" pour %, "amount" pour euros)
  value: number; // Valeur de l'augmentation (% si type="percentage", montant en euros si type="amount")
}

interface DepartureDraftItem {
  userId: string; // ID de l'utilisateur qui part
  userName: string; // Nom complet pour affichage
  monthlySalary: number; // Salaire mensuel économisé
  annualSalary: number; // Salaire annuel économisé
}

interface ArrivalDraftItem {
  id: string; // ID temporaire généré côté client
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
  contrat: string;
  etp: number;
  monthlySalary: number;
  annualSalary: number;
  year: number;
}
```

### 11.6 Workflow complet

#### 11.6.1 Création d'un brouillon

1. L'admin effectue des modifications :
   - Simule des augmentations sur plusieurs utilisateurs
   - Neutralise des départs
   - Simule des arrivées (recrutements)
2. Clic sur "Enregistrer le brouillon"
3. Le brouillon est sauvegardé dans Firestore (`salary_drafts/shared`)
4. Tous les admins peuvent voir le brouillon

#### 11.6.2 Modification collaborative

1. Un admin charge le brouillon existant (chargement automatique au démarrage)
2. Il ajoute/modifie/supprime des modifications (augmentations, départs, arrivées)
3. Il sauvegarde → Le brouillon est mis à jour
4. Les autres admins voient les modifications au prochain chargement

#### 11.6.3 Validation globale

1. Un admin consulte le brouillon (augmentations + départs + arrivées)
2. Il clique sur le bouton "Valider" principal
3. Modal de confirmation avec récapitulatif complet :
   - Liste des augmentations
   - Liste des départs
   - Liste des arrivées
   - Impact global sur la masse salariale
4. Confirmation → Toutes les modifications sont appliquées :
   - Augmentations → Mise à jour des salaires
   - Départs → Désactivation des utilisateurs
   - Arrivées → Création des nouveaux utilisateurs
5. Le brouillon est supprimé automatiquement
6. L'interface est réinitialisée

## Remise à plat

Cette nouvelle version intègre la gestion complète des rémunérations avec simulation et brouillon partagé :

- ✅ Saisie directe des salaires
- ✅ Gestion par année
- ✅ Conversion automatique mensuel/annuel
- ✅ Historique complet
- ✅ Apparition/disparition automatique selon l'état des utilisateurs dans le SaaS
- ✅ Toggle d'inclusion pour chaque utilisateur dans la comparaison
- ✅ Simulation de recrutement avec comparaison des coûts
- ✅ Gestion des départs (neutralisation ou exclusion via toggle)
- ✅ Simulation d'augmentations
- ✅ Mode brouillon partagé entre tous les admins
- ✅ Validation globale (augmentations + départs + arrivées)

## Notes techniques

- **Performance** : Chargement initial de tous les utilisateurs (hors admin) en une seule requête
- **Réactivité** : Conversion en temps réel lors de la saisie
- **Validation** : Vérification côté client avant sauvegarde
- **Persistance** : Sauvegarde dans Firestore avec gestion des erreurs
