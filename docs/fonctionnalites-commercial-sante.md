# Fonctionnalités - Commercial Santé Individuel

## Vue d'ensemble
_Document de réflexion et de spécification pour le développement d'une application de gestion commerciale pour les contrats santé individuels._

---

## 0. Rôles et permissions

### 0.1 Rôle "Commercial Santé Individuel"
- [ ] Les fonctionnalités de gestion des actes s'appliquent aux utilisateurs ayant le rôle **"Commercial Santé Individuel"**
- [ ] Seuls les utilisateurs avec ce rôle peuvent :
 - [ ] Accéder au tableau de recensement des actes
 - [ ] Saisir, modifier et consulter les actes
 - [ ] Voir leurs propres actes (ou tous selon les permissions)
- [ ] Gestion des rôles et permissions utilisateur

---

## 1. Gestion des actes

### 1.1 Tableau de recensement des actes
- [ ] Tableau de visualisation des actes saisis
- [ ] **Bouton "Nouvel acte"**
  - [ ] Bouton visible et accessible depuis la page du tableau
  - [ ] Au clic, ouverture d'une modale (dialog/modal)
  - [ ] La modale contient le formulaire de saisie d'un nouvel acte
  - [ ] Possibilité de fermer la modale (bouton fermer, clic en dehors, touche Échap)
- [ ] **Navigation mensuelle** (englobe tous les éléments de la page)
  - [ ] Sélecteur de mois/année (date picker ou dropdown)
  - [ ] Boutons de navigation (mois précédent / mois suivant)
  - [ ] Affichage du mois/année en cours
  - [ ] **Critère de filtrage** : basé sur la **date de saisie** de l'acte
  - [ ] Les actes sont affectés à un mois précis en fonction de leur date de saisie
  - [ ] **Mise à jour globale** : lors du changement de mois, tous les éléments sont mis à jour simultanément :
    - [ ] **Tableau** : affichage uniquement des actes du mois sélectionné
    - [ ] **KPIs** : recalcul basé sur les actes du mois sélectionné
    - [ ] **Timeline** : mise en évidence du mois sélectionné et affichage de la progression
    - [ ] **Seuils** : affichage des seuils atteints pour le mois sélectionné
  - [ ] **Données mockées pour test** : actes répartis sur 6 mois (mai à octobre 2025) avec des seuils différents par mois pour tester la navigation
- [ ] **Structure du tableau** : chaque ligne représente un acte
- [ ] Colonnes du tableau :
  - [ ] **TAUX** (coefficient en pourcentage, affiché automatiquement selon l'acte)
  - [ ] **ACTE** (sélection via dropdown)
  - [ ] **NOM** (nom du client)
  - [ ] **NUMERO** (numéro de contrat)
  - [ ] **EFFET** (date d'effet du contrat)
  - [ ] **CA** (CA annuel en euros)
  - [ ] **CA PONDERE** (calculé automatiquement)
  - [ ] **ACTIONS** (colonne avec boutons d'action)
- [ ] **Tri des colonnes** :
  - [ ] **Tri par défaut** : les actes sont affichés par ordre décroissant de date de saisie (les plus récents en haut)
  - [ ] Toutes les colonnes sont triables (sauf ACTIONS) par clic sur l'en-tête
  - [ ] Tri par ordre croissant au premier clic
  - [ ] Tri par ordre décroissant au deuxième clic sur la même colonne
  - [ ] Indicateur visuel (icône) sur la colonne triée (▲ croissant, ▼ décroissant)
  - [ ] Colonnes triables : TAUX, ACTE, NOM, NUMERO, EFFET, CA, CA PONDERE
  - [ ] Le tri s'applique immédiatement au tableau affiché
  - [ ] Le tri par défaut (date de saisie décroissante) s'applique au chargement initial et après filtrage par mois
- [ ] **Filtres par type d'acte** :
  - [ ] Section de filtres au-dessus du tableau
  - [ ] Boutons de filtre pour chaque type d'acte :
    - [ ] "Tous" : affiche tous les actes (filtre par défaut)
    - [ ] "Affaire Nouvelle" : affiche uniquement les actes de type Affaire Nouvelle
    - [ ] "Révision" : affiche uniquement les actes de type Révision
    - [ ] "Adhésion salarié" : affiche uniquement les actes de type Adhésion salarié
    - [ ] "COURT → AZ" : affiche uniquement les actes de type COURT → AZ
    - [ ] "AZ → courtage" : affiche uniquement les actes de type AZ → courtage
  - [ ] **Système exclusif** : un seul filtre actif à la fois
  - [ ] Sélection d'un nouveau filtre exclut automatiquement le précédent
  - [ ] Indicateur visuel du filtre actif (bouton mis en évidence)
  - [ ] Le tableau se met à jour immédiatement lors du changement de filtre
  - [ ] Le tri s'applique sur les actes filtrés
- [ ] **Boutons d'action par ligne** (en fin de ligne) :
  - [ ] **Bouton "Modifier"** : ouvre une modale avec le formulaire pré-rempli pour modifier l'acte
  - [ ] **Bouton "Supprimer"** : supprime l'acte (avec confirmation avant suppression)
  - [ ] Après modification : fermeture de la modale et rafraîchissement du tableau
  - [ ] Après suppression : rafraîchissement automatique du tableau et mise à jour des KPIs
- [ ] Enregistrement automatique lors de la saisie

### 1.2 Types d'actes à saisir
- [ ] Affaire Nouvelle
- [ ] Révision
- [ ] Adhésion salarié
- [ ] COURT -> AZ
- [ ] AZ -> courtage
- [ ] Champ de recherche/filtre pour sélectionner le type d'acte
- [ ] Possibilité d'éditer/ajouter des types d'actes (icône crayon)

### 1.3 Workflow de saisie d'un acte
- [ ] La saisie d'un nouvel acte se fait dans une **modale** ouverte via le bouton "Nouvel acte"
- [ ] Formulaire de saisie dans la modale avec tous les champs nécessaires

1. **Sélection de l'acte** (dropdown/select, obligatoire)
   - [ ] Sélection du type d'acte dans la liste (champ obligatoire)
   - [ ] Affichage automatique du coefficient (TAUX) correspondant à l'acte sélectionné
   - [ ] Champ de recherche/filtre pour faciliter la sélection
   - [ ] Possibilité d'éditer/ajouter des types d'actes (icône crayon)

2. **Saisie des informations (tous les champs sont obligatoires)**
   - [ ] **Type d'acte** (dropdown/select, obligatoire)
   - [ ] **Nom du client** (champ texte, saisie manuelle, obligatoire)
     - [ ] **Capitalisation automatique** : première lettre de chaque mot en majuscule, le reste en minuscule
     - [ ] **Gestion des noms et prénoms composés** : respect des tirets et apostrophes dans les noms composés (ex: "Jean-Pierre", "D'Angelo", "Le Blanc")
     - [ ] Exemples de formatage :
       - [ ] "jean dupont" → "Jean Dupont"
       - [ ] "marie-claire martin" → "Marie-Claire Martin"
       - [ ] "pierre d'angelo" → "Pierre D'Angelo"
       - [ ] "sophie le blanc" → "Sophie Le Blanc"
       - [ ] "JEAN-MICHEL NOGARO" → "Jean-Michel Nogaro"
   - [ ] **Numéro de contrat** (champ texte, saisie manuelle, obligatoire)
     - [ ] **Contrôle d'unicité** : vérification qu'il n'existe pas déjà un contrat avec ce numéro
     - [ ] **Condition** : le contrôle d'unicité ne s'applique QUE si l'acte est de type "Affaire Nouvelle"
     - [ ] Pour les autres types d'actes (Révision, etc.), le même numéro de contrat peut être utilisé (ex: révision d'un contrat existant)
     - [ ] Message d'erreur si doublon détecté (uniquement pour "Affaire Nouvelle")
   - [ ] **Effet du contrat** (date picker moderne, saisie manuelle, obligatoire)
   - [ ] **CA annuel** (nombre entier avec séparateur de milliers, saisie manuelle, obligatoire)

3. **Champs automatiques (non modifiables)**
   - [ ] **Date de saisie** (générée automatiquement à la création avec la date du jour, champ en lecture seule, non modifiable)
   - [ ] **CA pondéré** (calculé automatiquement selon la formule : CA annuel × coefficient du type d'acte, champ en lecture seule, non modifiable)

4. **Actions dans la modale**
   - [ ] Bouton "Valider" / "Enregistrer" pour sauvegarder l'acte
   - [ ] Bouton "Annuler" / "Fermer" pour fermer la modale sans sauvegarder
   - [ ] Après validation : fermeture automatique de la modale et rafraîchissement du tableau
   - [ ] Affichage d'un message de confirmation ou d'erreur selon le résultat

**Récapitulatif des champs du formulaire :**
- **Champs obligatoires (saisie manuelle)** : Type d'acte, Nom du client, Numéro de contrat, Effet du contrat, CA annuel
- **Champs automatiques (non modifiables)** : Date de saisie (générée automatiquement), CA pondéré (calculé automatiquement)
- **Validation** : Tous les champs obligatoires doivent être remplis avant l'enregistrement

### 1.3.1 Modification d'un acte
- [ ] Clic sur le bouton "Modifier" d'une ligne du tableau
- [ ] Ouverture d'une modale avec le formulaire pré-rempli avec les données de l'acte
- [ ] Même formulaire que pour la création, mais avec les valeurs existantes
- [ ] Possibilité de modifier tous les champs obligatoires :
  - [ ] Type d'acte (modifiable)
  - [ ] Nom du client (modifiable)
  - [ ] Numéro de contrat (modifiable)
  - [ ] Effet du contrat (modifiable)
  - [ ] CA annuel (modifiable)
- [ ] **Champs non modifiables lors de la modification** :
  - [ ] **Date de saisie** : reste la date originale de création (non modifiable, en lecture seule)
  - [ ] **CA pondéré** : recalculé automatiquement si le CA annuel ou le type d'acte change (non modifiable, en lecture seule)
- [ ] Validation et enregistrement des modifications
- [ ] Recalcul automatique du CA pondéré si le CA annuel ou le type d'acte est modifié

### 1.3.2 Suppression d'un acte
- [ ] Clic sur le bouton "Supprimer" d'une ligne du tableau
- [ ] Affichage d'une confirmation avant suppression (dialog de confirmation)
- [ ] Après confirmation : suppression de l'acte
- [ ] Rafraîchissement automatique du tableau et mise à jour des KPIs
- [ ] Message de confirmation de suppression

### 1.4 Calcul du CA pondéré
- [ ] Calcul automatique déclenché lors de la saisie/modification du CA annuel ou du changement d'acte
- [ ] Formule : **CA pondéré = CA annuel × coefficient (selon le type d'acte)**
- [ ] Coefficients par type d'acte :
  - [ ] **AZ -> courtage** : coefficient 50% (0.5)
  - [ ] **Affaire Nouvelle** : coefficient à définir
  - [ ] **Révision** : coefficient à définir
  - [ ] **Adhésion salarié** : coefficient à définir
  - [ ] **COURT -> AZ** : coefficient à définir
- [ ] Affichage du CA pondéré formaté en euros (ex: "1 250 €")

### 1.5 Grille de rémunération
- [ ] La rémunération est calculée en fonction de la **production pondérée** (somme des CA pondérés)
- [ ] Calcul basé sur le total du CA pondéré du mois sélectionné
- [ ] **Principe de calcul** : le pourcentage du seuil atteint s'applique à **TOUTE la production pondérée depuis le premier euro** (pas de calcul par tranche)
- [ ] **Exemple** : si production pondérée = 20 000 EUR → 3% appliqué sur les 20 000 EUR depuis le premier euro
- [ ] **Grille de seuils et pourcentages** :
  - [ ] **Seuil 1** : < 10 000 EUR → 0%
  - [ ] **Seuil 2** : < 14 000 EUR → 2%
  - [ ] **Seuil 3** : < 18 000 EUR → 3%
  - [ ] **Seuil 4** : < 22 000 EUR → 4%
  - [ ] **Seuil 5** : ≥ 22 000 EUR → 6%
- [ ] Calcul automatique du pourcentage de rémunération selon le seuil atteint
- [ ] Calcul de la rémunération : **Production pondérée × pourcentage du seuil**
- [ ] Affichage du pourcentage de rémunération applicable et du montant de rémunération
- [ ] Mise à jour automatique lors du changement de mois ou d'ajout/modification d'actes

### 1.5.1 Présentation visuelle des seuils
- [ ] **Section dédiée** : affichage visuel de la grille de rémunération avec les seuils
- [ ] **Barre de progression** :
  - [ ] Barre horizontale montrant la progression vers les seuils
  - [ ] Indicateur de position actuelle (production pondérée actuelle)
  - [ ] Affichage du montant de production pondérée sur la barre
  - [ ] Mise à jour automatique selon la production du mois
- [ ] **Marqueurs de seuils** :
  - [ ] 5 marqueurs visuels pour chaque seuil (Seuil 1 à Seuil 5)
  - [ ] Positionnement proportionnel sur la barre (0%, 22.7%, 45.5%, 68.2%, 90.9%)
  - [ ] Affichage du montant et du pourcentage de chaque seuil
  - [ ] **Indicateurs visuels** :
    - [ ] Seuils atteints : couleur verte, marqueur mis en évidence
    - [ ] Seuil actuel : couleur bleue, marqueur actif mis en évidence
    - [ ] Seuils à franchir : couleur grise, marqueur standard
- [ ] **Cartes d'information** :
  - [ ] Carte pour chaque seuil avec le pourcentage et le montant
  - [ ] Mise en évidence visuelle du seuil actuel (bordure bleue, fond coloré)
  - [ ] Mise en évidence des seuils atteints (bordure verte, fond coloré)
  - [ ] Affichage clair du montant maximum de chaque seuil
- [ ] **Mise à jour automatique** :
  - [ ] Recalcul et affichage lors de l'ajout/modification/suppression d'actes
  - [ ] Mise à jour lors du changement de mois (navigation mensuelle)
  - [ ] Animation de transition pour la barre de progression

### 1.5.2 Timeline visuel de progression
- [ ] **Timeline horizontal** : affichage de la progression de la production sur plusieurs mois
- [ ] **Représentation temporelle** :
  - [ ] Axe horizontal représentant les mois (affichage des 6-12 derniers mois ou période configurable)
  - [ ] Chaque mois affiché avec sa production pondérée totale
  - [ ] Visualisation de l'évolution de la production dans le temps
- [ ] **Indicateurs de seuils par mois** :
  - [ ] Pour chaque mois, affichage du seuil atteint (Seuil 1 à Seuil 5)
  - [ ] Code couleur selon le seuil :
    - [ ] Seuil 1 (0%) : gris clair
    - [ ] Seuil 2 (2%) : jaune/orange
    - [ ] Seuil 3 (3%) : bleu clair
    - [ ] Seuil 4 (4%) : bleu foncé
    - [ ] Seuil 5 (6%) : vert
  - [ ] Affichage du pourcentage de rémunération pour chaque mois
- [ ] **Graphique de progression** :
  - [ ] Courbe ou barres montrant l'évolution de la production pondérée
  - [ ] Lignes de référence pour les seuils (10k, 14k, 18k, 22k EUR)
  - [ ] Points marqués sur la courbe pour chaque mois
  - [ ] Tooltip au survol : affichage du mois, production pondérée, seuil atteint, commissions
- [ ] **Informations affichées** :
  - [ ] Mois/année pour chaque point
  - [ ] Production pondérée du mois
  - [ ] Seuil atteint (avec pourcentage)
  - [ ] Commissions acquises du mois
- [ ] **Interactivité** :
  - [ ] Clic sur un mois du timeline : navigation vers ce mois (mise à jour de la navigation mensuelle)
  - [ ] **Mise en évidence du mois sélectionné** : le mois actuellement sélectionné dans la navigation mensuelle est mis en évidence visuellement sur le timeline
  - [ ] Zoom/pagination si beaucoup de mois à afficher
  - [ ] Filtre par période (3 mois, 6 mois, 12 mois, année complète)
- [ ] **Mise à jour automatique** :
  - [ ] Ajout automatique des nouveaux mois avec leurs données
  - [ ] Recalcul lors de l'ajout/modification/suppression d'actes
  - [ ] **Synchronisation avec la navigation mensuelle** : le timeline se met à jour automatiquement lors du changement de mois via la navigation mensuelle
  - [ ] Mise en évidence du mois sélectionné synchronisée avec la navigation mensuelle

---

## 2. KPIs et indicateurs

### 2.1 KPIs basés sur les données saisies
- [ ] Affichage des KPIs sur la page de gestion des actes
- [ ] **Navigation mensuelle** : tous les KPIs sont calculés et affichés pour le mois sélectionné dans la navigation mensuelle
- [ ] Calcul automatique des KPIs basé sur les actes du mois sélectionné
- [ ] Mise à jour automatique des KPIs lors du changement de mois (navigation mensuelle)
- [ ] Mise à jour automatique des KPIs lors de l'ajout/modification/suppression d'actes

### 2.2 KPIs par type d'acte (comptage)
- [ ] **KPI "Affaire Nouvelle"** : nombre d'actes de type "Affaire Nouvelle" (comptage)
- [ ] **KPI "Révision"** : nombre d'actes de type "Révision" (comptage)
- [ ] **KPI "Adhésion salarié"** : nombre d'actes de type "Adhésion salarié" (comptage)
- [ ] **KPI "COURT -> AZ"** : nombre d'actes de type "COURT -> AZ" (comptage)
- [ ] **KPI "AZ -> courtage"** : nombre d'actes de type "AZ -> courtage" (comptage)
- [ ] Affichage visuel des KPIs (cartes, badges, graphiques)
- [ ] Format d'affichage : nombre entier

### 2.3 KPI Commissions et objectifs
- [ ] **KPI "Commissions acquises"** : montant des commissions acquises dans le mois sélectionné
  - [ ] Calcul : **Production pondérée × pourcentage du seuil atteint**
  - [ ] Format d'affichage : montant en euros avec séparateur de milliers (ex: "600 €")
  - [ ] Mise à jour automatique selon le mois sélectionné et les actes saisis
- [ ] **KPI "Objectif restant"** : montant de production pondérée restant à atteindre pour le seuil suivant
  - [ ] Si production < 10 000 EUR (Seuil 1) : afficher "X EUR restants pour atteindre le Seuil 2 (2%)"
  - [ ] Si production < 14 000 EUR (Seuil 2) : afficher "X EUR restants pour atteindre le Seuil 3 (3%)"
  - [ ] Si production < 18 000 EUR (Seuil 3) : afficher "X EUR restants pour atteindre le Seuil 4 (4%)"
  - [ ] Si production < 22 000 EUR (Seuil 4) : afficher "X EUR restants pour atteindre le Seuil 5 (6%)"
  - [ ] Si production ≥ 22 000 EUR (Seuil 5) : afficher "Seuil maximum atteint" ou message similaire
  - [ ] Calcul : **Montant du seuil suivant - Production pondérée actuelle**
  - [ ] Format d'affichage : montant en euros avec séparateur de milliers (ex: "2 000 EUR restants")
  - [ ] Affichage du pourcentage du seuil suivant à atteindre
- [ ] Affichage visuel des KPIs (cartes, badges)
- [ ] Mise à jour automatique lors de l'ajout/modification/suppression d'actes

---

## Notes et réflexions
_Espace libre pour les notes et réflexions pendant la phase de conception._

---

## Priorités de développement
_À définir selon les besoins métier._

---

## Questions ouvertes
_Questions à clarifier avant le développement._

---

## Références techniques
_Notes techniques pour le développement futur._

