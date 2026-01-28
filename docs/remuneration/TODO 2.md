# TODO - Grille de Pilotage des Rémunérations

## 📋 Vue d'ensemble

Implémentation complète de la page de pilotage des rémunérations selon les spécifications de `grille.md`.

---

## 🏗️ Phase 1 : Structure de base et affichage

### 1.1 Page principale
- [ ] Créer la page de rémunération (`app/admin/remuneration/page.tsx`)
- [ ] Créer le composant principal de la grille
- [ ] Mettre en place la structure de layout (tableau, sections, actions)

### 1.2 Chargement des données
- [ ] Créer la fonction de récupération des utilisateurs depuis Firestore
- [ ] Filtrer automatiquement les administrateurs (`role !== "ADMINISTRATEUR"`)
- [ ] Filtrer les utilisateurs inactifs (`active === true`)
- [ ] Gérer le chargement dynamique et les mises à jour en temps réel

### 1.3 Affichage du tableau
- [ ] Colonne : Toggle d'inclusion (case à cocher)
- [ ] Colonne : Nom / Prénom
- [ ] Colonne : Email
- [ ] Colonne : Rôle
- [ ] Colonne : Salaire brut mensuel (éditable)
- [ ] Colonne : Salaire brut annuel (éditable, synchronisé)
- [ ] Colonne : Année d'application (sélecteur)
- [ ] Colonne : Simulation d'augmentation (sélecteur + champ)
- [ ] Colonne : Actions (Sauvegarder, Neutraliser, Historique)

---

## 💾 Phase 2 : Gestion des rémunérations

### 2.1 Saisie et modification
- [ ] Implémenter la saisie directe du salaire mensuel
- [ ] Implémenter la saisie directe du salaire annuel
- [ ] Conversion automatique en temps réel (mensuel ↔ annuel)
- [ ] Validation des montants (positifs ou zéro)
- [ ] Sélecteur d'année d'application (dropdown)
- [ ] Bouton "Sauvegarder" par ligne

### 2.2 Structure de données
- [ ] Créer l'interface TypeScript `User` avec champs salaires
- [ ] Créer la collection `salary_history` dans Firestore
- [ ] Implémenter la création d'entrée dans `salary_history`
- [ ] Mise à jour des champs `currentMonthlySalary` et `currentAnnualSalary` dans `users`
- [ ] Gérer les utilisateurs sans salaire (valeur par défaut 0€)

### 2.3 Historique
- [ ] Créer le composant d'affichage de l'historique
- [ ] Récupérer l'historique depuis `salary_history`
- [ ] Afficher l'historique dans un modal ou panneau latéral
- [ ] Afficher les métadonnées (date, type de changement, montant, %)

---

## 🎯 Phase 3 : Toggle d'inclusion et comparaison

### 3.1 Toggle d'inclusion
- [ ] Implémenter la case à cocher par ligne
- [ ] État par défaut : tous cochés (inclus)
- [ ] Gérer l'état local des toggles
- [ ] Calcul de la masse salariale uniquement pour les utilisateurs inclus

### 3.2 Calculs de masse salariale
- [ ] Calcul de la masse salariale actuelle (utilisateurs inclus)
- [ ] Affichage en mode mensuel
- [ ] Affichage en mode annuel
- [ ] Conversion automatique entre mensuel/annuel
- [ ] Mise à jour en temps réel lors des changements de toggle

---

## 📈 Phase 4 : Simulation d'augmentations

### 4.1 Interface de simulation
- [ ] Sélecteur de type par ligne ("Euros", "%", "Aucune")
- [ ] Champ de saisie adaptatif selon le type
- [ ] Calcul automatique du nouveau salaire en temps réel
- [ ] Affichage du nouveau salaire calculé
- [ ] Affichage de la différence (euros et %)

### 4.2 Logique de calcul
- [ ] Formule pour augmentation en euros : `nouveau_salaire = salaire_actuel + montant`
- [ ] Formule pour augmentation en % : `nouveau_salaire = salaire_actuel × (1 + pourcentage / 100)`
- [ ] Gestion de plusieurs augmentations simultanées
- [ ] Réinitialisation (sélectionner "Aucune")

### 4.3 Affichage visuel
- [ ] Mise en évidence des lignes avec augmentation simulée
- [ ] Badge indiquant le type d'augmentation (€ ou %)
- [ ] Affichage de la différence en temps réel

---

## 👥 Phase 5 : Simulation de recrutement (arrivées)

### 5.1 Formulaire de recrutement
- [ ] Créer le modal/formulaire de simulation de recrutement
- [ ] Champs : Prénom, Nom, Email (optionnel), Rôle, Contrat, ETP
- [ ] Saisie du salaire (mensuel ou annuel avec conversion)
- [ ] Sélecteur d'année d'application
- [ ] Validation du formulaire

### 5.2 Gestion des simulations
- [ ] Créer l'interface `RecruitmentSimulation`
- [ ] Stockage temporaire des simulations (état local ou brouillon)
- [ ] Affichage des simulations dans le tableau avec badge "Simulation"
- [ ] Style visuel distinct pour les simulations
- [ ] Actions : Modifier, Supprimer

### 5.3 Calculs avec arrivées
- [ ] Intégrer les simulations dans le calcul de masse salariale
- [ ] Calcul des coûts supplémentaires (arrivées)
- [ ] Mise à jour de la masse avec mouvements

---

## 🚪 Phase 6 : Gestion des départs

### 6.1 Neutralisation de départ
- [ ] Bouton "Neutraliser le départ" par ligne
- [ ] Créer l'interface `DepartureNeutralization`
- [ ] Marquer un utilisateur comme "partant" (sans le supprimer)
- [ ] Affichage visuel distinct (badge "Départ simulé", style grisé)
- [ ] Alternative : utiliser le toggle d'exclusion pour exclure de la comparaison

### 6.2 Liste des départs
- [ ] Section dédiée listant les départs neutralisés
- [ ] Affichage : Nom, Salaire économisé (mensuel/annuel)
- [ ] Action de réactivation (annuler le départ)

### 6.3 Calculs avec départs
- [ ] Calcul des économies réalisées (départs + exclusions)
- [ ] Intégration dans le calcul de masse avec mouvements
- [ ] Mise à jour en temps réel

---

## 📊 Phase 7 : Comparaison et impact

### 7.1 Section de comparaison
- [ ] Créer la section dédiée de comparaison
- [ ] Affichage côte à côte : Situation actuelle vs Avec mouvements
- [ ] Colonne centrale : Différence et évolution

### 7.2 Métriques affichées
- [ ] Nombre d'utilisateurs réels (total)
- [ ] Nombre d'utilisateurs inclus (toggles cochés)
- [ ] Nombre d'utilisateurs exclus (toggles décochés)
- [ ] Nombre de départs neutralisés
- [ ] Nombre d'arrivées simulées
- [ ] Masse salariale mensuelle (actuelle vs avec mouvements)
- [ ] Masse salariale annuelle (actuelle vs avec mouvements)
- [ ] Économies réalisées (mensuel et annuel)
- [ ] Coûts supplémentaires (mensuel et annuel)
- [ ] Impact net (mensuel et annuel)
- [ ] Pourcentage d'évolution

### 7.3 Calculs de comparaison
- [ ] Masse actuelle = Σ(salaires utilisateurs inclus)
- [ ] Économies = Σ(salaires utilisateurs exclus + départs)
- [ ] Coûts arrivées = Σ(salaires simulations)
- [ ] Masse avec mouvements = Masse actuelle - Économies + Coûts arrivées
- [ ] Impact net = Masse avec mouvements - Masse actuelle
- [ ] % évolution = (Impact net / Masse actuelle) × 100

### 7.4 Indicateurs visuels
- [ ] Badge de différence avec code couleur (vert/rouge/orange/gris)
- [ ] Affichage du pourcentage d'évolution
- [ ] Indicateur "Remplacement neutre" si départ ≈ arrivée

---

## 📝 Phase 8 : Mode brouillon partagé

### 8.1 Structure du brouillon
- [ ] Créer les interfaces TypeScript (`SalaryDraft`, `SalaryDraftItem`, etc.)
- [ ] Créer la collection `salary_drafts` dans Firestore
- [ ] Document unique avec ID `"shared"`
- [ ] Structure complète : augmentations + départs + arrivées

### 8.2 Sauvegarde du brouillon
- [ ] Bouton "Enregistrer le brouillon"
- [ ] Sauvegarde de toutes les simulations (augmentations, départs, arrivées)
- [ ] Enregistrement des métadonnées (date, créateur, modificateur)
- [ ] Gestion des erreurs de sauvegarde

### 8.3 Chargement du brouillon
- [ ] Chargement automatique au démarrage de la page
- [ ] Chargement manuel via bouton "Charger le brouillon"
- [ ] Restauration des simulations depuis le brouillon
- [ ] Indicateur visuel "Brouillon actif"

### 8.4 Gestion collaborative
- [ ] Affichage "Modifié par [Nom] le [Date]"
- [ ] Compteur d'augmentations/départs/arrivées dans le brouillon
- [ ] Bouton "Mettre à jour le brouillon"
- [ ] Bouton "Supprimer le brouillon"
- [ ] Gestion des conflits (dernière modification écrasant)

---

## ✅ Phase 9 : Validation globale

### 9.1 Bouton de validation
- [ ] Bouton "Valider" principal (actif uniquement si brouillon existe)
- [ ] Modal de confirmation avec récapitulatif complet
- [ ] Affichage de toutes les modifications à valider

### 9.2 Récapitulatif avant validation
- [ ] Nombre d'augmentations à valider
- [ ] Nombre de départs à valider
- [ ] Nombre d'arrivées à valider
- [ ] Masse salariale actuelle vs nouvelle
- [ ] Impact total (mensuel et annuel)
- [ ] Pourcentage d'évolution global
- [ ] Liste détaillée des modifications (accordéon optionnel)
- [ ] Double confirmation requise

### 9.3 Actions de validation
- [ ] **Augmentations** :
  - [ ] Création des entrées dans `salary_history`
  - [ ] Mise à jour de `currentMonthlySalary` et `currentAnnualSalary` dans `users`
- [ ] **Départs** :
  - [ ] Mise à jour de `active = false` dans `users`
  - [ ] Optionnel : Enregistrement dans historique des départs
- [ ] **Arrivées (recrutements)** :
  - [ ] Création de l'utilisateur dans `users`
  - [ ] Création de l'entrée de salaire dans `salary_history`
- [ ] **Nettoyage** :
  - [ ] Suppression du brouillon partagé
  - [ ] Réinitialisation de l'interface de simulation

### 9.4 Validation individuelle (optionnel)
- [ ] Bouton "Valider" par augmentation individuelle
- [ ] Bouton "Valider le recrutement" par simulation
- [ ] Bouton "Valider le départ" par départ neutralisé

---

## 🔄 Phase 10 : Apparition/disparition automatique

### 10.1 Apparition automatique
- [ ] Détection des nouveaux utilisateurs (non-admin)
- [ ] Affichage automatique avec salaire 0€
- [ ] Possibilité de saisie immédiate

### 10.2 Disparition automatique
- [ ] Détection des utilisateurs désactivés (`active = false`)
- [ ] Disparition automatique de la grille
- [ ] Détection des utilisateurs supprimés
- [ ] Nettoyage automatique

### 10.3 Synchronisation en temps réel
- [ ] Écoute des changements Firestore (onSnapshot)
- [ ] Mise à jour automatique de la grille
- [ ] Gestion des performances (éviter les re-renders inutiles)

---

## 🎨 Phase 11 : Interface utilisateur et UX

### 11.1 Design et style
- [ ] Design moderne et cohérent avec le reste de l'application
- [ ] Utilisation de Tailwind CSS selon les conventions
- [ ] Responsive design (mobile, tablette, desktop)
- [ ] Animations et transitions fluides

### 11.2 Feedback utilisateur
- [ ] Messages de succès/erreur pour les actions
- [ ] Indicateurs de chargement
- [ ] Validation en temps réel des champs
- [ ] Tooltips et aide contextuelle

### 11.3 Accessibilité
- [ ] Labels appropriés pour les champs
- [ ] Navigation au clavier
- [ ] Contraste des couleurs
- [ ] ARIA labels si nécessaire

---

## 🧪 Phase 12 : Tests et validation

### 12.1 Tests unitaires
- [ ] Tests des fonctions de calcul (conversion, augmentations)
- [ ] Tests des validations
- [ ] Tests des transformations de données

### 12.2 Tests d'intégration
- [ ] Tests de chargement des données
- [ ] Tests de sauvegarde/chargement du brouillon
- [ ] Tests de validation globale

### 12.3 Tests manuels
- [ ] Scénario complet : Création brouillon → Modifications → Validation
- [ ] Test de la synchronisation en temps réel
- [ ] Test des calculs de masse salariale
- [ ] Test des simulations (augmentations, départs, arrivées)

---

## 📚 Phase 13 : Documentation et nettoyage

### 13.1 Documentation
- [ ] Commentaires dans le code (pourquoi, pas comment)
- [ ] Documentation des fonctions complexes
- [ ] README pour la fonctionnalité (optionnel)

### 13.2 Optimisation
- [ ] Vérification des performances (chargement initial)
- [ ] Optimisation des requêtes Firestore
- [ ] Réduction des re-renders inutiles
- [ ] Code splitting si nécessaire

### 13.3 Nettoyage
- [ ] Suppression du code mort
- [ ] Suppression des commentaires temporaires
- [ ] Vérification des imports inutilisés
- [ ] Respect des conventions Prettier

---

## 🔐 Phase 14 : Sécurité et permissions

### 14.1 Permissions
- [ ] Vérification que seuls les administrateurs peuvent accéder
- [ ] Règles Firestore pour `salary_history`
- [ ] Règles Firestore pour `salary_drafts`
- [ ] Validation côté serveur des modifications

### 14.2 Validation des données
- [ ] Validation des montants (positifs, limites raisonnables)
- [ ] Validation des années
- [ ] Validation des rôles (exclusion ADMINISTRATEUR)
- [ ] Protection contre les injections

---

## 📝 Notes

- Prioriser les phases 1-4 pour avoir une base fonctionnelle
- Les phases 5-7 peuvent être développées en parallèle
- Le mode brouillon (phase 8) est essentiel pour la validation globale
- Tester régulièrement chaque phase avant de passer à la suivante

---

**Dernière mise à jour** : 2026-01-26
**Référence** : `docs/remuneration/grille.md`
