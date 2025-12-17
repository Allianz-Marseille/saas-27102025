# Outil Pappers - Inventaire des fonctionnalités disponibles

## 📋 Vue d'ensemble

Ce document recense toutes les fonctionnalités disponibles via l'API Pappers v2 avec un compte payant et une clé API. L'objectif est de documenter les possibilités d'enrichissement de l'outil "Bénéficiaires effectifs" actuellement implémenté.

## 🔑 Configuration actuelle

- **API utilisée** : Pappers API v2
- **Endpoint de base** : `https://api.pappers.fr/v2/`
- **Authentification** : Header `api-key` avec la clé API stockée dans `PAPPERS_API_KEY`
- **Fonctionnalité actuelle** : Recherche de bénéficiaires effectifs par SIREN

## ✅ Fonctionnalités actuellement implémentées

### 1. Recherche de bénéficiaires effectifs
- **Endpoint** : `/entreprise?siren={siren}`
- **Méthode** : GET
- **Paramètres** :
  - `siren` : Numéro SIREN (9 chiffres)
- **Données retournées** :
  - Informations de base de l'entreprise (dénomination, forme juridique, adresse, SIREN)
  - Liste des bénéficiaires effectifs avec :
    - Nom, prénom, nom complet
    - Date de naissance
    - Nationalité
    - Pourcentage de parts (total, directes, indirectes)
    - Pourcentage de votes
- **Note** : Nécessite une habilitation pour les données complètes des bénéficiaires effectifs

## 🚀 Fonctionnalités disponibles via l'API Pappers (à implémenter)

### 2. Informations complètes de l'entreprise
- **Endpoint** : `/entreprise?siren={siren}`
- **Données supplémentaires disponibles** :
  - **Identité** :
    - Dénomination complète
    - Sigle
    - Forme juridique détaillée
    - Date de création
    - Durée de vie
    - Date de clôture (si applicable)
    - Statut (actif, radié, etc.)
  - **Adresse** :
    - Adresse complète du siège social
    - Coordonnées géographiques (latitude, longitude)
    - Code postal, ville, département, région
  - **Identifiants** :
    - SIREN
    - SIRET du siège
    - Numéro RCS
    - Numéro TVA intracommunautaire
    - Code NAF/APE avec libellé
  - **Capital** :
    - Montant du capital social
    - Devise
    - Date de dernière modification du capital
  - **Effectifs** :
    - Tranche d'effectifs
    - Effectif moyen
    - Date de dernière déclaration

### 3. Recherche d'entreprise par nom
- **Endpoint** : `/recherche`
- **Méthode** : GET
- **Paramètres** :
  - `q` : Nom ou raison sociale de l'entreprise
  - `par_page` : Nombre de résultats par page (défaut: 20, max: 100)
  - `page` : Numéro de page
  - `precision` : Niveau de précision de la recherche
- **Données retournées** :
  - Liste des entreprises correspondantes
  - Pour chaque entreprise : SIREN, dénomination, forme juridique, adresse, code NAF
- **Note** : Peut nécessiter un abonnement spécifique selon le plan

### 4. Dirigeants et représentants légaux
- **Endpoint** : `/entreprise?siren={siren}`
- **Données disponibles dans la réponse** :
  - Liste des dirigeants actuels et historiques
  - Pour chaque dirigeant :
    - Nom, prénom
    - Date de naissance
    - Nationalité
    - Fonction (PDG, Directeur général, etc.)
    - Date de nomination
    - Date de fin de mandat (si applicable)
    - Pourcentage de détention (si actionnaire)

### 5. Bilans et comptes annuels
- **Endpoint** : `/entreprise?siren={siren}`
- **Données disponibles** :
  - Liste des bilans disponibles
  - Pour chaque bilan :
    - Année du bilan
    - Date de clôture
    - Type de bilan (simplifié, abrégé, complet)
    - Chiffre d'affaires
    - Résultat net
    - Actif total
    - Passif total
    - Effectif moyen
    - Devise
- **Note** : Nécessite généralement un abonnement premium pour accéder aux bilans complets

### 6. Établissements secondaires
- **Endpoint** : `/entreprise?siren={siren}`
- **Données disponibles** :
  - Liste de tous les établissements de l'entreprise
  - Pour chaque établissement :
    - SIRET
    - Dénomination
    - Adresse complète
    - Code NAF/APE
    - Type (siège, établissement secondaire)
    - Date de création
    - Statut (ouvert, fermé)

### 7. Procédures collectives
- **Endpoint** : `/entreprise?siren={siren}`
- **Données disponibles** :
  - Liste des procédures collectives (redressement, liquidation, sauvegarde)
  - Pour chaque procédure :
    - Type de procédure
    - Date d'ouverture
    - Date de clôture (si applicable)
    - Tribunal compétent
    - Nom de l'administrateur/juge commissaire
    - Statut actuel

### 8. Événements et modifications
- **Endpoint** : `/entreprise?siren={siren}`
- **Données disponibles** :
  - Historique des événements significatifs :
    - Changements de dirigeants
    - Modifications du capital
    - Changements d'adresse
    - Modifications de la forme juridique
    - Changements d'activité (code NAF)
    - Transferts de siège
    - Dates et détails de chaque événement

### 9. Filiales et participations
- **Endpoint** : `/entreprise?siren={siren}`
- **Données disponibles** :
  - Liste des filiales (entreprises contrôlées)
  - Liste des participations (entreprises où l'entreprise détient des parts)
  - Pour chaque filiale/participation :
    - SIREN
    - Dénomination
    - Pourcentage de détention
    - Type de contrôle (direct, indirect)

### 10. Liens entre entreprises
- **Endpoint** : `/entreprise?siren={siren}`
- **Données disponibles** :
  - Réseau d'entreprises liées
  - Relations de contrôle
  - Participations croisées
  - Groupes d'entreprises

### 11. Documents officiels
- **Endpoint** : `/entreprise?siren={siren}`
- **Données disponibles** :
  - Liste des documents disponibles :
    - Extrait Kbis
    - Statuts
    - PV d'assemblée générale
    - Bilans déposés
    - Comptes annuels
  - Liens de téléchargement (si disponibles selon l'abonnement)

### 12. Scoring et indicateurs financiers
- **Endpoint** : `/entreprise?siren={siren}`
- **Données disponibles** :
  - Score de solvabilité
  - Indicateurs financiers :
    - Ratio de liquidité
    - Ratio d'endettement
    - Rentabilité
    - Croissance du CA
  - Évolution sur plusieurs années
- **Note** : Nécessite généralement un abonnement premium

### 13. Alertes et surveillance
- **Endpoint** : `/alertes` (si disponible)
- **Fonctionnalités** :
  - Création d'alertes sur une entreprise
  - Notifications en cas de :
    - Changement de dirigeant
    - Modification du capital
    - Nouvelle procédure collective
    - Changement d'adresse
    - Nouveau bilan disponible
- **Note** : Fonctionnalité avancée, peut nécessiter un abonnement spécifique

### 14. Recherche avancée
- **Endpoint** : `/recherche`
- **Paramètres avancés** :
  - Recherche par code postal
  - Recherche par code NAF/APE
  - Recherche par tranche d'effectifs
  - Recherche par tranche de CA
  - Recherche par date de création
  - Filtres combinés
- **Données retournées** :
  - Résultats paginés
  - Statistiques sur les résultats
  - Export possible (selon l'abonnement)

### 15. Données financières agrégées
- **Endpoint** : `/entreprise?siren={siren}`
- **Données disponibles** :
  - Évolution du chiffre d'affaires sur plusieurs années
  - Évolution du résultat net
  - Évolution des effectifs
  - Graphiques et tendances
  - Comparaison avec le secteur d'activité

### 16. Informations sur les dirigeants
- **Endpoint** : `/dirigeant` (si disponible)
- **Fonctionnalités** :
  - Recherche d'un dirigeant par nom
  - Liste des entreprises où une personne est dirigeant
  - Historique des mandats
  - Réseau de dirigeants

### 17. Marques et brevets
- **Endpoint** : `/entreprise?siren={siren}`
- **Données disponibles** :
  - Liste des marques déposées par l'entreprise
  - Pour chaque marque :
    - Numéro d'enregistrement
    - Date de dépôt
    - Date d'expiration
    - Statut (en vigueur, expirée)
    - Classes de produits/services

### 18. Export de données
- **Fonctionnalités** :
  - Export des données au format JSON
  - Export au format CSV (selon l'abonnement)
  - Export de rapports personnalisés
  - API batch pour récupérer plusieurs entreprises en une fois

## 📊 Limites et restrictions selon l'abonnement

### Abonnement gratuit/Basique
- Nombre limité de requêtes par mois
- Accès aux données de base uniquement
- Pas d'accès aux bilans complets
- Pas d'accès aux documents officiels

### Abonnement Standard
- Plus de requêtes par mois
- Accès aux bilans simplifiés
- Accès aux bénéficiaires effectifs (avec habilitation)
- Recherche par nom disponible

### Abonnement Premium/Pro
- Requêtes illimitées ou très élevées
- Accès aux bilans complets
- Accès aux documents officiels
- Scoring et indicateurs financiers
- Alertes et surveillance
- Export de données avancé
- Support prioritaire

## 🔒 Sécurité et habilitation

### Bénéficiaires effectifs
- **Habilitation requise** : Pour accéder aux données complètes des bénéficiaires effectifs, une habilitation spécifique est nécessaire auprès de l'INPI
- **Données limitées sans habilitation** : Seules les données publiques sont accessibles

### Données sensibles
- Certaines données peuvent nécessiter des justifications d'usage
- Respect du RGPD obligatoire
- Traçabilité des accès aux données

## 💡 Recommandations d'implémentation

### Priorité 1 : Fonctionnalités essentielles
1. **Enrichissement des informations entreprise** : Ajouter toutes les données disponibles dans la réponse `/entreprise`
2. **Recherche par nom** : Permettre la recherche d'entreprise par nom en plus du SIREN
3. **Affichage des dirigeants** : Afficher la liste des dirigeants actuels et historiques

### Priorité 2 : Fonctionnalités utiles
4. **Bilans et comptes** : Afficher les bilans disponibles (selon l'abonnement)
5. **Établissements** : Lister tous les établissements de l'entreprise
6. **Procédures collectives** : Afficher les procédures en cours ou passées
7. **Événements** : Historique des modifications importantes

### Priorité 3 : Fonctionnalités avancées
8. **Filiales et participations** : Visualiser le réseau d'entreprises
9. **Scoring** : Afficher les scores et indicateurs financiers
10. **Documents** : Permettre le téléchargement des documents officiels
11. **Alertes** : Système de surveillance des entreprises

## 🔗 Ressources

- **Documentation API Pappers** : https://www.pappers.fr/api
- **Portail développeur** : https://www.pappers.fr/portail-developpeur
- **Support** : support@pappers.fr
- **Tarification** : https://www.pappers.fr/tarifs

## 📝 Notes importantes

- Les fonctionnalités disponibles dépendent du type d'abonnement Pappers
- Certaines données nécessitent des habilitations spécifiques (notamment pour les bénéficiaires effectifs)
- Respecter les limites de taux d'appel (rate limiting) de l'API
- Implémenter un système de cache pour optimiser les performances et réduire les coûts
- Logger toutes les requêtes API pour le suivi et le débogage

