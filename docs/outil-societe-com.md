# Outil Societe.com - Inventaire des fonctionnalités disponibles

## 📋 Vue d'ensemble

Ce document recense toutes les fonctionnalités disponibles via l'API Societe.com v1 avec un compte payant et une clé API. L'objectif est de documenter les possibilités d'enrichissement de l'outil "Informations entreprise" actuellement implémenté.

## 🔑 Configuration actuelle

- **API utilisée** : Societe.com API v1
- **Endpoint de base** : `https://api.societe.com/api/v1/`
- **Authentification** : Header `X-Authorization` avec format `socapi {apiKey}`
- **Clé API** : Stockée dans `SOCIETE_API_KEY`
- **Fonctionnalités actuelles** :
  - Recherche par SIREN/SIRET
  - Recherche par nom d'entreprise
  - Récupération d'informations complètes (existence, infos légales, dirigeants, bilans, établissements, procédures, événements, scoring, contact, marques, documents)

## ✅ Fonctionnalités actuellement implémentées

### 1. Vérification d'existence
- **Endpoint** : `/entreprise/{numId}/exist`
- **Données retournées** :
  - Confirmation de l'existence de l'entreprise
  - Statut de l'entreprise
  - Informations de base

### 2. Informations légales
- **Endpoint** : `/entreprise/{numId}/infoslegales`
- **Données retournées** :
  - Dénomination (INSEE et RCS)
  - Forme juridique
  - Adresse complète (siège social)
  - SIREN, SIRET siège
  - Numéro RCS
  - Numéro TVA intracommunautaire
  - Capital social avec devise
  - Code NAF/APE avec libellé
  - Date de création
  - Durée de vie
  - Statut (actif, radié, etc.)

### 3. Dirigeants
- **Endpoint** : `/entreprise/{numId}/dirigeants`
- **Données retournées** :
  - Liste des dirigeants actuels et historiques
  - Nom, prénom
  - Date de naissance
  - Âge
  - Fonction/titre
  - Date de début de mandat
  - Date de fin de mandat (si applicable)
  - Nombre total de dirigeants

### 4. Bilans et comptes annuels
- **Endpoint** : `/entreprise/{numId}/bilans`
- **Données retournées** :
  - Liste des bilans disponibles
  - Pour chaque bilan :
    - Année du bilan
    - Date de clôture
    - Type de bilan
    - Chiffre d'affaires (rescatotal)
    - Résultat net (resresnet)
    - Actif total (actiftotal)
    - Effectif (reseff)
    - Devise
  - Nombre total de bilans disponibles

### 5. Établissements
- **Endpoint** : `/entreprise/{numId}/etablissements`
- **Données retournées** :
  - Liste de tous les établissements
  - Pour chaque établissement :
    - SIRET
    - Dénomination
    - Adresse complète
    - Code postal, ville
    - Code NAF/APE avec libellé
    - Type (siège, établissement secondaire)
  - Nombre total d'établissements

### 6. Procédures collectives
- **Endpoint** : `/entreprise/{numId}/procedurescollectives`
- **Données retournées** :
  - Liste des procédures collectives
  - Pour chaque procédure :
    - Type de procédure
    - Date d'ouverture
    - Date de clôture (si applicable)
    - Tribunal compétent
    - Nom de l'administrateur/juge commissaire
    - Statut actuel
  - Nombre total de procédures

### 7. Événements
- **Endpoint** : `/entreprise/{numId}/evenements`
- **Données retournées** :
  - Historique des événements significatifs
  - Pour chaque événement :
    - Date de l'événement
    - Libellé de l'événement
    - Type d'événement
  - Nombre total d'événements

### 8. Scoring
- **Endpoint** : `/entreprise/{numId}/scoring`
- **Données retournées** :
  - Score financier
  - Score extra-financier :
    - Score général
    - Score social
    - Score fiscal
  - Période de calcul des scores

### 9. Contact
- **Endpoint** : `/entreprise/{numId}/contact`
- **Données retournées** :
  - Téléphone
  - Email
  - Site web
  - Adresse de contact (peut différer du siège social)

### 10. Marques
- **Endpoint** : `/entreprise/{numId}/marques`
- **Données retournées** :
  - Liste des marques déposées
  - Pour chaque marque :
    - Nom de la marque
    - Numéro d'enregistrement
    - Statut (en vigueur, expirée)
    - Date de dépôt
    - Date d'expiration
  - Nombre total de marques

### 11. Documents officiels
- **Endpoint** : `/entreprise/{numId}/documents-officiels`
- **Données retournées** :
  - Liste des documents disponibles
  - Types de documents :
    - Extrait Kbis
    - Statuts
    - PV d'assemblée générale
    - Bilans
    - Comptes annuels
  - Liens de téléchargement (selon l'abonnement)

### 12. Recherche par nom
- **Endpoint** : `/entreprise/search`
- **Paramètres** :
  - `nom` : Nom ou raison sociale de l'entreprise
  - `debut` : Numéro de page (défaut: 1)
  - `nbrep` : Nombre de résultats par page (max: 1000)
- **Données retournées** :
  - Liste des entreprises correspondantes
  - Pour chaque résultat :
    - Nom commercial
    - SIREN
    - Code NAF
    - Libellé NAF
    - Code postal et ville
    - Département
    - Coordonnées géographiques (longitude, latitude)
  - Pagination :
    - Total de résultats
    - Page actuelle
    - Nombre total de pages

## 🚀 Fonctionnalités supplémentaires disponibles (à vérifier/implémenter)

### 13. Recherche avancée
- **Endpoint** : `/entreprise/search` (avec paramètres avancés)
- **Paramètres supplémentaires possibles** :
  - `cp` : Code postal
  - `ville` : Ville
  - `dep` : Département
  - `naf` : Code NAF/APE
  - `forme` : Forme juridique
  - `capital_min` : Capital minimum
  - `capital_max` : Capital maximum
  - `date_creation_debut` : Date de création début
  - `date_creation_fin` : Date de création fin
  - `effectif_min` : Effectif minimum
  - `effectif_max` : Effectif maximum
- **Fonctionnalités** :
  - Filtres combinés
  - Recherche géographique
  - Recherche par secteur d'activité
  - Recherche par taille d'entreprise

### 14. Bénéficiaires effectifs
- **Endpoint** : `/entreprise/{numId}/beneficiaires-effectifs` (à vérifier)
- **Données possibles** :
  - Liste des bénéficiaires effectifs
  - Pourcentage de détention
  - Relations de contrôle
- **Note** : Nécessite une habilitation spécifique, peut ne pas être disponible via l'API standard

### 15. Filiales et participations
- **Endpoint** : `/entreprise/{numId}/filiales` ou `/entreprise/{numId}/participations` (à vérifier)
- **Données possibles** :
  - Liste des filiales
  - Liste des participations
  - Pourcentage de détention
  - Type de contrôle

### 16. Liens entre entreprises
- **Endpoint** : `/entreprise/{numId}/liens` (à vérifier)
- **Données possibles** :
  - Réseau d'entreprises liées
  - Relations de contrôle
  - Participations croisées

### 17. Historique des dirigeants
- **Endpoint** : `/entreprise/{numId}/dirigeants` (déjà implémenté, mais peut être enrichi)
- **Données supplémentaires possibles** :
  - Historique complet avec toutes les dates
  - Raisons de départ
  - Nominations simultanées

### 18. Données financières détaillées
- **Endpoint** : `/entreprise/{numId}/bilans` (déjà implémenté, mais peut être enrichi)
- **Données supplémentaires possibles** :
  - Détail ligne par ligne du bilan
  - Compte de résultat complet
  - Tableau de flux de trésorerie
  - Annexes
  - Ratios financiers calculés

### 19. Évolution financière
- **Endpoint** : `/entreprise/{numId}/evolution-financiere` (à vérifier)
- **Données possibles** :
  - Évolution du CA sur plusieurs années
  - Évolution du résultat net
  - Évolution des effectifs
  - Graphiques et tendances
  - Comparaison avec le secteur

### 20. Alertes et surveillance
- **Endpoint** : `/alertes` (à vérifier)
- **Fonctionnalités possibles** :
  - Création d'alertes sur une entreprise
  - Notifications en cas de changement
  - Surveillance de plusieurs entreprises
- **Note** : Fonctionnalité avancée, peut nécessiter un abonnement spécifique

### 21. Comparaison d'entreprises
- **Endpoint** : `/entreprise/compare` (à vérifier)
- **Fonctionnalités possibles** :
  - Comparaison de plusieurs entreprises
  - Tableaux comparatifs
  - Indicateurs de performance relatifs

### 22. Export de données
- **Fonctionnalités possibles** :
  - Export au format JSON (déjà disponible via l'API)
  - Export au format CSV (selon l'abonnement)
  - Export de rapports personnalisés
  - API batch pour récupérer plusieurs entreprises

### 23. Recherche de dirigeants
- **Endpoint** : `/dirigeant/search` (à vérifier)
- **Fonctionnalités possibles** :
  - Recherche d'un dirigeant par nom
  - Liste des entreprises où une personne est dirigeant
  - Historique des mandats
  - Réseau de dirigeants

### 24. Informations sur les actionnaires
- **Endpoint** : `/entreprise/{numId}/actionnaires` (à vérifier)
- **Données possibles** :
  - Liste des actionnaires
  - Pourcentage de détention
  - Type d'actionnaire (personne physique, personne morale)
  - Évolution de la détention

### 25. Conventions réglementées
- **Endpoint** : `/entreprise/{numId}/conventions` (à vérifier)
- **Données possibles** :
  - Liste des conventions réglementées
  - Dates et montants
  - Parties prenantes

### 26. Informations sur les commissaires aux comptes
- **Endpoint** : `/entreprise/{numId}/commissaires` (à vérifier)
- **Données possibles** :
  - Nom du commissaire aux comptes
  - Date de nomination
  - Durée du mandat

### 27. Informations sur les administrateurs
- **Endpoint** : `/entreprise/{numId}/administrateurs` (à vérifier)
- **Données possibles** :
  - Liste des administrateurs (pour SA)
  - Date de nomination
  - Fonctions exercées

### 28. Données RCS détaillées
- **Endpoint** : `/entreprise/{numId}/rcs` (à vérifier)
- **Données possibles** :
  - Informations détaillées du RCS
  - Historique des inscriptions
  - Modifications enregistrées

## 📊 Structure des données retournées

### Format de réponse standard
```json
{
  "data": {
    "results": [...],
    "nbtot": 100,
    "page": 1,
    "totalpages": 10
  }
}
```

### Format pour les endpoints spécifiques
```json
{
  "data": {
    "dirigeants": [...],
    "nbdirigeants": 5
  }
}
```

## 🔒 Authentification et limites

### Authentification
- **Méthode** : Header `X-Authorization`
- **Format** : `socapi {apiKey}`
- **Sécurité** : Ne jamais exposer la clé API côté client

### Limites selon l'abonnement
- **Abonnement gratuit/Basique** :
  - Nombre limité de requêtes par mois
  - Accès aux données de base uniquement
  - Recherche par nom peut être limitée
  
- **Abonnement Standard** :
  - Plus de requêtes par mois
  - Accès à plus de données
  - Recherche par nom disponible
  
- **Abonnement Premium/Pro** :
  - Requêtes illimitées ou très élevées
  - Accès à toutes les données
  - Documents officiels téléchargeables
  - Support prioritaire
  - Fonctionnalités avancées (alertes, exports, etc.)

## 💡 Recommandations d'implémentation

### Améliorations de l'existant
1. **Gestion d'erreurs améliorée** : Meilleure gestion des cas où certaines données ne sont pas disponibles
2. **Cache intelligent** : Mettre en cache les données qui changent peu (infos légales, établissements)
3. **Pagination** : Implémenter la pagination pour les listes longues (événements, bilans)
4. **Filtres** : Ajouter des filtres pour afficher seulement les données pertinentes

### Nouvelles fonctionnalités prioritaires
1. **Recherche avancée** : Implémenter les filtres de recherche avancée
2. **Export de données** : Permettre l'export des résultats au format CSV/Excel
3. **Comparaison** : Permettre la comparaison de plusieurs entreprises
4. **Alertes** : Système de surveillance des entreprises (si disponible)

### Optimisations
1. **Requêtes parallèles** : Déjà implémenté, à maintenir
2. **Lazy loading** : Charger certaines données seulement à la demande
3. **Compression** : Utiliser la compression pour les réponses volumineuses
4. **Rate limiting** : Respecter les limites de l'API et implémenter un système de retry

## 🔗 Ressources

- **Documentation API Societe.com** : https://api.societe.com/documentation
- **Portail développeur** : https://www.societe.com/portail-developpeur
- **Support** : support@societe.com
- **Tarification** : https://www.societe.com/tarifs-api

## 📝 Notes importantes

- Les fonctionnalités disponibles dépendent du type d'abonnement Societe.com
- Certaines données peuvent nécessiter des habilitations spécifiques
- Respecter les limites de taux d'appel (rate limiting) de l'API
- Implémenter un système de cache pour optimiser les performances et réduire les coûts
- Logger toutes les requêtes API pour le suivi et le débogage
- La recherche par nom peut nécessiter un abonnement payant selon le plan
- Certains endpoints mentionnés peuvent ne pas être disponibles dans la version actuelle de l'API (à vérifier dans la documentation officielle)

## 🆚 Comparaison avec Pappers

### Avantages Societe.com
- Recherche par nom très performante
- Données de contact souvent plus complètes
- Scoring financier et extra-financier
- Documents officiels accessibles

### Avantages Pappers
- Bénéficiaires effectifs (avec habilitation)
- Interface peut-être plus moderne
- Certaines données peuvent être plus à jour

### Recommandation
- Utiliser les deux APIs en complémentarité selon les besoins
- Societe.com pour les recherches générales et les données financières
- Pappers pour les bénéficiaires effectifs et certaines données spécifiques

