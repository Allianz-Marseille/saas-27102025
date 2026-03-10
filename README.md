# SaaS Agence Allianz Marseille

Application SaaS complète pour la gestion d'une agence d'assurance Allianz, permettant le suivi des actes commerciaux, le calcul automatique des commissions, et la gestion des performances par équipe.

## 📋 Vue d'ensemble

Cette application permet de gérer l'ensemble des activités commerciales d'une agence d'assurance Allianz avec :

- **Gestion des actes commerciaux** : Saisie et suivi de tous les types d'actes (Apports Nouveaux, M+3, Préterme, etc.)
- **Calcul automatique des commissions** : Calcul des commissions selon les règles spécifiques à chaque type de commercial
- **KPIs en temps réel** : Suivi des indicateurs de performance par commercial et par équipe
- **Boost** : Déclaration des avis clients (ex. Google) avec rémunération associée
- **Messages** : Envoi de messages internes aux commerciaux (admin → collaborateurs)
- **Outils intégrés** : Pappers, Societe.com, Process
- **Interface d'administration** : Gestion des utilisateurs, entreprises, offres, sinistres, rémunérations, messages

## 🚀 Technologies utilisées

### Frontend
- **Next.js 16** - Framework React avec App Router
- **React 19** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Tailwind CSS 4** - Framework CSS utilitaire
- **Framer Motion** - Animations
- **Radix UI** - Composants UI accessibles
- **Lucide React** - Icônes

### Backend
- **Next.js API Routes** - API REST intégrée
- **Firebase Firestore** - Base de données NoSQL
- **Firebase Authentication** - Authentification utilisateurs
- **Firebase Admin SDK** - Opérations serveur

### Bibliothèques principales
- **date-fns** - Manipulation de dates
- **recharts** - Graphiques et visualisations
- **sonner** - Notifications toast
- **react-hook-form** + **zod** - Gestion de formulaires et validation
- **@tanstack/react-table** - Tableaux de données
- **react-markdown** + **remark-gfm** - Rendu Markdown (messages)
- **exceljs**, **pdf-lib**, **pdfjs-dist** - Manipulation de documents
- **canvas-confetti** - Animations
- **Motion** (ex `framer-motion`) - Animations

## 👥 Rôles utilisateurs

L'application gère 5 types de rôles avec des permissions spécifiques :

### ADMINISTRATEUR
- Accès complet à toutes les fonctionnalités
- Gestion des utilisateurs
- Gestion des entreprises
- Gestion des offres commerciales
- Consultation des logs système
- Vue d'ensemble globale de tous les commerciaux

### CDC_COMMERCIAL
Commerciaux généraux (Auto, IARD, etc.)
- Dashboard personnel avec KPIs
- Gestion des actes commerciaux (AN, M+3, Préterme Auto, Préterme IRD)
- Calcul automatique des commissions
- Suivi des process
- Timeline des actes
- Export des données

### COMMERCIAL_SANTE_INDIVIDUEL
Commerciaux spécialisés en santé individuelle
- Dashboard santé individuelle
- Gestion des actes santé (Affaires nouvelles, Révisions, Adhésions salariés, etc.)
- Calcul du CA pondéré et commissions selon grille spécifique
- Comparaison des performances
- KPIs avec seuils de commission (0%, 2%, 3%, 4%, 6%)

### COMMERCIAL_SANTE_COLLECTIVE
Commerciaux spécialisés en santé collective
- Dashboard santé collective
- Gestion des actes santé collective avec coefficients multiples
- Calcul complexe avec coefficients d'origine, type d'acte et compagnie
- Comparaison des performances
- KPIs avec seuils de commission identiques à la santé individuelle

### GESTIONNAIRE_SINISTRE
Gestionnaires de sinistres
- Interface dédiée à la gestion des sinistres
- Import de fichiers Excel depuis le CRM Lagon
- Gestion des routes de sinistres (assistance, artisan, expert, convention, juridique)
- Suivi des statuts et affectations
- Notes et historique des modifications
- Alertes et notifications

## 🎯 Fonctionnalités principales

### Dashboard Commercial (CDC_COMMERCIAL)

#### Tableau de bord
- **KPIs en temps réel** :
  - CA mensuel (Auto, Autres)
  - Nombre de contrats
  - Ratio Auto/Autres
  - Nombre de process
  - Commissions potentielles
  - Commissions réelles (si objectifs validés)

#### Gestion des actes
- **Types d'actes** :
  - **AN** (Apport Nouveau) : Nouveaux contrats
  - **M+3** : Suivi à 3 mois
  - **PRETERME_AUTO** : Préterme Auto
  - **PRETERME_IRD** : Préterme IARD

- **Fonctionnalités** :
  - Création, modification, suppression d'actes
  - Suivi des appels téléphoniques
  - Tags de suivi (appel téléphonique, mise à jour Lagoon, bilan, SMS/Mail)
  - Timeline visuelle des actes
  - Export des données

#### Calcul des commissions
Les commissions sont validées si :
- Commissions potentielles ≥ 200 €
- Nombre de process ≥ 15
- Ratio Auto/Autres ≥ 100%

### Dashboard Santé Individuelle

#### Types d'actes
- **AFFAIRE_NOUVELLE** : Nouvelle affaire
- **REVISION** : Révision de contrat
- **ADHESION_SALARIE** : Adhésion salarié
- **COURT_TO_AZ** : Courtage vers Allianz
- **AZ_TO_COURTAGE** : Allianz vers courtage

#### Calcul des commissions
Grille de rémunération basée sur le CA pondéré :
- **0%** : CA pondéré < 10 000 €
- **2%** : CA pondéré de 10 000 € à 13 999 €
- **3%** : CA pondéré de 14 000 € à 17 999 €
- **4%** : CA pondéré de 18 000 € à 21 999 €
- **6%** : CA pondéré ≥ 22 000 €

Le taux s'applique sur l'ensemble du CA pondéré (pas progressif).

### Dashboard Santé Collective

#### Types d'actes
- **IND_AN_SANTE** : Affaire nouvelle individuelle santé
- **IND_AN_PREVOYANCE** : Affaire nouvelle individuelle prévoyance
- **IND_AN_RETRAITE** : Affaire nouvelle individuelle retraite
- **COLL_AN_SANTE** : Affaire nouvelle collective santé
- **COLL_AN_PREVOYANCE** : Affaire nouvelle collective prévoyance
- **COLL_AN_RETRAITE** : Affaire nouvelle collective retraite
- **COLL_ADHESION_RENFORT** : Adhésion renfort collective
- **REVISION** : Révision
- **ADHESION_RENFORT** : Adhésion renfort
- **COURTAGE_TO_ALLIANZ** : Courtage vers Allianz
- **ALLIANZ_TO_COURTAGE** : Allianz vers courtage

#### Calcul du CA pondéré
Le CA pondéré est calculé avec 3 coefficients :
- **Coefficient d'origine** : PROACTIF, REACTIF, PROSPECTION
- **Coefficient type d'acte** : Spécifique à chaque type d'acte
- **Coefficient compagnie** : Spécifique à chaque compagnie

**Formule** : `CA pondéré = Prime × CoefficientOrigine × CoefficientTypeActe × CoefficientCompagnie`

#### Calcul des commissions
Même grille de rémunération que la santé individuelle (0%, 2%, 3%, 4%, 6%).

### Interface Admin

#### Vue d'ensemble globale
- KPIs agrégés par rôle
- Sélection de commercial pour voir les détails
- Commissions potentielles et réelles par commercial
- Comparaison des performances

#### Gestion des utilisateurs
- Création, modification, suppression d'utilisateurs
- Attribution de rôles
- Activation/désactivation de comptes
- Synchronisation avec Firebase Auth

#### Gestion des entreprises
- Création et gestion des entreprises clients
- Association aux actes commerciaux

#### Gestion des offres commerciales
- Création et gestion des offres
- Import en masse
- Association aux actes

#### Gestion des sinistres
- Import de fichiers Excel depuis le CRM Lagon
- Gestion des routes de sinistres (assistance, artisan, expert, convention, juridique)
- Suivi des statuts et affectations
- Notes et historique des modifications
- Alertes et notifications
- Synchronisation avec Google Sheets (optionnel)

#### Logs système
- Consultation des logs d'activité
- Traçabilité des actions utilisateurs

#### Commissions agence
- Suivi des commissions IARD, Vie, Courtage
- Gestion des profits exceptionnels
- Calcul des charges et résultats
- Prélèvements associés

#### Prétermes Auto (outil admin)

Outil d'automatisation du traitement mensuel des exports de prétermes Allianz :
- **Parcours guidé en 6 étapes** : période → configuration → upload → filtrage → sociétés → dispatch
- **Import multi-fichiers** : upload guidé avec dialog de confirmation entre chaque fichier, détection automatique de l'agence (H91358 / H92083), alerte explicite en cas de doublon ou de remplacement d'agence
- **Filtrage métier** : seuils configurables ETP (≥ 120) et Taux de variation (≥ 20%), sliders dynamiques avec preview temps réel
- **Classification Gemini** : détection personne physique vs société via API Gemini (batch 50, fallback `a_valider`)
- **Validation des sociétés** : saisie du nom gérant pour le routage correct
- **Routage CDC** : répartition par tranche de lettres, gestion des absences avec remplaçant
- **Dispatch Trello** : création de cartes CRM dans le tableau de chaque chargé de clientèle, idempotence complète
- **Synthèse Slack** : message de pilotage automatique en fin de traitement
- **KPI historiques** : graphiques Recharts par mois, agence et collaborateur
- **Branche** : `main` — Accès : `/admin/preterme-auto`

Collections Firestore associées : `preterme_configs`, `preterme_imports`, `preterme_clients`, `preterme_trello_logs`

Spec complète : `docs/preterme-auto.md`

#### Leaderboard
- Classement des commerciaux
- Mise à jour automatique via cron

#### Rémunérations
- Gestion des salaires (brouillons, historique, validation)
- Pilotage multi-années
- Accès : `/admin/remunerations`

#### Boost
- Suivi des boosts déclarés par tous les collaborateurs
- Filtres (mois, collaborateur, type)
- Classement et totaux par personne
- Accès : `/admin/boost`

#### Messages
- Envoi de messages aux commerciaux
- Templates réutilisables
- Planification des envois
- Statistiques : `/admin/messages/statistics`
- Templates : `/admin/messages/templates`
- Accès : `/admin/messages`

### Messages (module utilisateur)

- **Consultation** : `/messages` — liste des messages reçus (tous rôles sauf admin)
- **Paramètres** : `/settings/messages` — préférences (rappel, fréquence des notifications)
- **Admin** : création, envoi, templates, planification (voir Interface Admin ci-dessus)

### Outils communs

#### Boost

Module de déclaration et suivi des avis clients :
- **Types** : Google (5 € par avis), autres types à venir
- **Accès** : Tous les rôles (CDC, Santé Indiv/Coll, Gestionnaire sinistre)
- Page utilisateur : `/commun/boost` — déclaration et classement
- Page admin : `/admin/boost` — liste, filtres, leaderboard, export
- Documentation : `docs/boost/google/BOOST.md`

#### Pappers

Outil complet de recherche d'informations entreprises via l'API Pappers :
- **Recherche par SIREN/SIRET** ou **par nom**
- **Informations légales** : Dénomination, forme juridique, adresse, capital, effectifs, etc.
- **Bénéficiaires effectifs** : Liste complète avec pourcentages de détention
- **Dirigeants** : Liste des dirigeants actuels et historiques
- **Bilans** : Bilans et comptes annuels
- **Établissements** : Liste de tous les établissements
- **Procédures collectives** : Historique des procédures
- **Événements** : Historique des modifications
- **Filiales et participations** : Réseau d'entreprises
- **Marques** : Marques déposées
- **Accès** : `/commun/outils/beneficiaires-effectifs`

#### Societe.com

Informations entreprise et conventions collectives. Accès : `/commun/outils/societe-entreprise`

#### Process

Documentation des processus métier :
- Gestion des leads
- Production : saisie des affaires nouvelles
- Stratégie Process : L'art de la régularité

## 📁 Structure du projet

```
app/
├── admin/                    # Interface administrateur
│   ├── commercial/          # Détails d'un commercial
│   ├── commissions-agence/  # Gestion commissions agence
│   ├── boost/               # Suivi boosts (liste, filtres, leaderboard)
│   ├── remunerations/       # Gestion salaires (brouillons, historique)
│   ├── messages/            # Messages admin (page, statistics, templates)
│   ├── companies/           # Gestion entreprises
│   ├── logs/                # Logs système
│   ├── offres-commerciales/ # Gestion offres
│   ├── sante-collective/    # Dashboard santé collective admin
│   ├── sante-individuelle/  # Dashboard santé individuelle admin
│   ├── sinistre/            # Gestion sinistres
│   ├── users/               # Gestion utilisateurs
│   └── page.tsx             # Vue d'ensemble admin
├── dashboard/               # Dashboard commerciaux généraux
│   ├── acts/                # Gestion actes
│   ├── commissions/         # Commissions personnelles
│   ├── offres/              # Offres commerciales
│   ├── profile/             # Profil utilisateur
│   └── page.tsx             # Dashboard principal
├── sante-individuelle/      # Dashboard santé individuelle
│   ├── actes/               # Gestion actes santé individuelle
│   ├── comparaison/         # Comparaison performances
│   ├── profile/             # Profil utilisateur
│   └── page.tsx             # Dashboard principal
├── sante-collective/        # Dashboard santé collective
│   ├── actes/               # Gestion actes santé collective
│   ├── comparaison/         # Comparaison performances
│   ├── profile/             # Profil utilisateur
│   └── page.tsx             # Dashboard principal
├── commun/                  # Pages communes
│   ├── boost/               # Page Boost (déclaration utilisateurs)
│   ├── outils/              # Outils (Pappers, Societe.com)
│   │   ├── beneficiaires-effectifs/
│   │   └── societe-entreprise/
│   ├── process/             # Documentation processus
│   └── mentions-legales/    # Mentions légales
├── messages/                # Messages utilisateurs (consultation)
├── settings/                # Paramètres utilisateur
│   └── messages/           # Préférences messages
├── api/                     # Routes API Next.js
│   ├── acts/                # API actes
│   ├── admin/               # API admin (users)
│   ├── conventions-collectives/ # API conventions collectives (Societe.com)
│   ├── cron/                # Tâches cron (leaderboard)
│   ├── health-acts/         # API actes santé
│   ├── leaderboard/         # API leaderboard
│   ├── offres/              # API offres
│   ├── pappers/             # API Pappers
│   ├── process/             # API process
│   ├── sinistres/           # API sinistres (import Excel, sync Google Sheets)
│   └── societe/             # API Societe.com
├── login/                   # Page de connexion
└── page.tsx                 # Page d'accueil

components/                   # Composants React réutilisables
├── acts/                    # Composants actes
├── admin/                   # Composants admin
├── auth/                    # Composants authentification
├── commissions/             # Composants commissions
├── dashboard/               # Composants dashboard
├── health-acts/             # Composants actes santé
├── messages/                # Composants messages
├── navigation/              # Composants navigation
└── ui/                      # Composants UI de base

lib/                         # Utilitaires et logique métier
├── firebase/                # Configuration Firebase
├── utils/                   # Utilitaires (KPI, rôles, etc.)
├── hooks/                   # Hooks React personnalisés
└── validations/             # Schémas de validation

types/                       # Types TypeScript
scripts/                     # Scripts de migration/import
docs/                        # Documentation
```

## 🛠️ Installation et configuration

### Prérequis

- **Node.js** 20 ou supérieur
- **npm** ou **yarn**
- **Compte Firebase** avec projet configuré
- **Clés API Pappers** (optionnel, pour l'outil Pappers)

### Installation

1. Cloner le repository :
```bash
git clone https://github.com/Allianz-Marseille/saas-27102025.git
cd saas-27102025
```

2. Installer les dépendances :
```bash
npm install
```

### Configuration

#### Variables d'environnement

Créer un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
# Firebase Client (obligatoire)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (obligatoire pour les opérations serveur)
# En production (Vercel), utiliser ces variables :
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com

# En développement local, utiliser le fichier JSON :
# saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json

# APIs externes (optionnel)
PAPPERS_API_KEY=your_pappers_api_key
SOCIETE_API_KEY=your_societe_api_key

# Base URL (liens, webhooks)
NEXT_PUBLIC_BASE_URL=

# Crons — Bearer secret pour routes protégées (/api/cron/*)
CRON_SECRET=

# Prétermes Auto — Classification Gemini
GEMINI_API_KEY=
```

#### Configuration Firebase

1. Créer un projet Firebase sur [Firebase Console](https://console.firebase.google.com/)
2. Activer **Authentication** (Email/Password)
3. Créer une base de données **Firestore**
4. Configurer les règles Firestore (voir `firestore.rules`)
5. Créer un compte de service pour Firebase Admin SDK
6. Télécharger le fichier JSON du compte de service et le placer à la racine du projet

#### Configuration Firestore

Les règles Firestore sont définies dans `firestore.rules`. Les collections principales sont :
- `users` : Utilisateurs de l'application (lecture restreinte au propriétaire ou admin)
- `acts` : Actes commerciaux généraux (lecture restreinte au propriétaire ou admin)
- `health_acts` : Actes santé individuelle (lecture restreinte au propriétaire ou admin)
- `health_collective_acts` : Actes santé collective (lecture restreinte au propriétaire ou admin)
- `companies` : Entreprises clients
- `offres` : Offres commerciales
- `logs` : Logs système (lecture admin uniquement)
- `agency_commissions` : Commissions agence (accès admin uniquement)
- `leaderboard` : Classement des commerciaux
- `commissionRules` : Règles de calcul des commissions
- `salary_history` : Historique des salaires (admin uniquement)
- `salary_drafts` : Brouillons de salaires
- `boosts` : Boosts déclarés (avis clients)
- `admin_messages` : Messages envoyés par l'admin
- `message_recipients` : Destinataires des messages
- `message_replies` : Réponses aux messages
- `sinistres` : Sinistres (lecture admin, gestionnaire sinistre, CDC)
- `sinistres_metadata` : Métadonnées des imports de sinistres
- `preterme_configs` : Configuration mensuelle préterme (moisKey unique)
- `preterme_imports` : Historique des imports (moisKey + agence + branche)
- `preterme_clients` : Lignes clients par import
- `preterme_trello_logs` : Journal de création des cartes Trello

**⚠️ Important** : Les règles de sécurité ont été renforcées pour protéger les données personnelles. Voir `firestore.rules` pour les règles détaillées.

### Démarrage

#### Développement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

#### Production

```bash
npm run build
npm start
```

## 📜 Scripts disponibles

### Scripts de développement

```bash
npm run dev          # Démarrer le serveur de développement
npm run build        # Construire l'application pour la production
npm run start        # Démarrer le serveur de production
npm run lint         # Lancer ESLint
```

### Scripts d'import de données

```bash
npm run create-users                    # Créer des utilisateurs
npm run check-users                     # Vérifier les utilisateurs
npm run sync-users                      # Synchroniser les utilisateurs
npm run init-companies                  # Initialiser les entreprises
npm run fix-kheira-user                 # Corriger un utilisateur Kheira
npm run import:commissions              # Importer des commissions depuis Markdown
npm run import:commissions-2023         # Importer des commissions 2023
npm run import:sinistres-initial        # Importer les sinistres initiaux
npm run import:kheira-nov               # Importer données Kheira novembre
npm run import:kheira-oct               # Importer données Kheira octobre
npm run import:kheira-sep                # Importer données Kheira septembre
npm run import:kheira-jul                # Importer données Kheira juillet
npm run import:kheira-jun                # Importer données Kheira juin
npm run import:kheira-may                # Importer données Kheira mai
```

### Scripts de migration

```bash
npm run migrate-ird-pro-commissions     # Migrer les commissions IRD Pro
npm run generate-leaderboard            # Générer le leaderboard
```

### Scripts utilitaires

```bash
npm run get-user-info                   # Obtenir les informations d'un utilisateur
npm run get-firebase-token              # Obtenir un token Firebase (pour tests)
```

### Scripts de test

```bash
npm run test:rules                        # Tester les règles Firebase (Admin SDK)
npm run test:rules:emulator              # Tester les règles Firestore avec l'Emulator
npm run test:storage                     # Tester les règles Storage
```

**Note** : Pour `test:rules:emulator`, démarrer d'abord l'Emulator :
```bash
firebase emulators:start --only firestore,auth
```

## 🔌 APIs externes

### Pappers API

L'application utilise l'API Pappers v2 pour récupérer des informations sur les entreprises.

**Endpoints utilisés** :
- `/api/pappers/entreprise` : Récupération complète des informations d'une entreprise
- `/api/pappers/recherche` : Recherche d'entreprises par nom
- `/api/pappers/beneficiaires` : Recherche des bénéficiaires effectifs

**Configuration** : Définir `PAPPERS_API_KEY` dans `.env.local`

**Documentation** : [https://www.pappers.fr/api](https://www.pappers.fr/api)

### Societe.com API

L'application utilise l'API Societe.com pour récupérer les conventions collectives.

**Endpoints utilisés** :
- `/api/conventions-collectives` : Récupération de la convention collective selon code APE, SIREN ou SIRET
- `/api/societe/entreprise` : Récupération des informations complètes d'une entreprise

**Configuration** : Définir `SOCIETE_API_KEY` dans `.env.local`

**Documentation** : [https://www.societe.com/api](https://www.societe.com/api)

### Firebase

Firebase est utilisé pour :
- **Authentication** : Authentification des utilisateurs
- **Firestore** : Base de données principale
- **Admin SDK** : Opérations serveur (gestion utilisateurs, etc.)

## 💰 Calculs de commissions

### Commerciaux généraux (CDC_COMMERCIAL)

Les commissions sont calculées selon les règles définies dans `lib/firebase/commission-rules.ts`.

**Validation des commissions** :
- Commissions potentielles ≥ 200 €
- Nombre de process ≥ 15
- Ratio Auto/Autres ≥ 100%

Si ces conditions sont remplies, les commissions réelles = commissions potentielles, sinon 0.

### Santé Individuelle et Collective

**Grille de rémunération** :
- **0%** : CA pondéré < 10 000 €
- **2%** : CA pondéré de 10 000 € à 13 999 €
- **3%** : CA pondéré de 14 000 € à 17 999 €
- **4%** : CA pondéré de 18 000 € à 21 999 €
- **6%** : CA pondéré ≥ 22 000 €

**Important** : Le taux s'applique sur l'ensemble du CA pondéré (pas de calcul progressif).

**Exemple** :
- CA pondéré = 13 000 € → Commission = 13 000 × 2% = 260 €
- CA pondéré = 15 000 € → Commission = 15 000 × 3% = 450 €

### Santé Collective - Calcul du CA pondéré

Le CA pondéré est calculé avec 3 coefficients :
1. **Coefficient d'origine** : PROACTIF, REACTIF, PROSPECTION
2. **Coefficient type d'acte** : Spécifique à chaque type d'acte
3. **Coefficient compagnie** : Spécifique à chaque compagnie

**Formule** : `CA pondéré = Prime × CoefficientOrigine × CoefficientTypeActe × CoefficientCompagnie`

## 🔒 Sécurité

### Authentification

- Authentification Firebase avec Email/Password
- Protection des routes par rôle via `RouteGuard`
- Vérification des tokens JWT côté serveur

### Règles Firestore

Les règles Firestore sont définies dans `firestore.rules` avec des restrictions de sécurité renforcées :

**Collections protégées** :
- **`users`** : Lecture limitée au propriétaire du document ou aux admins uniquement
- **`acts`** : Lecture limitée au propriétaire de l'acte ou aux admins
- **`health_acts`** : Lecture limitée au propriétaire de l'acte ou aux admins
- **`health_collective_acts`** : Lecture limitée au propriétaire de l'acte ou aux admins
- **`sinistres`** : Lecture pour admin, gestionnaire sinistre et CDC (pour leurs sinistres affectés)
- **`logs`** : Lecture réservée aux admins uniquement
- **`agency_commissions`** : Accès complet réservé aux admins uniquement

**Règles générales** :
- Les utilisateurs ne peuvent lire que leurs propres documents (sauf admin)
- Seuls les admins peuvent créer/modifier/supprimer des utilisateurs
- Les règles varient selon le rôle de l'utilisateur
- Les collections sensibles (logs, commissions) sont protégées

**Tests des règles** :
- Script de test disponible : `scripts/test-firestore-rules-emulator.ts`
- Exécution : `npm run test:rules:emulator` (nécessite l'Emulator Firebase)
- Documentation : `firestore.rules` et `scripts/test-firestore-rules-emulator.ts`

### Protection des routes

Toutes les routes sont protégées par le composant `RouteGuard` qui vérifie :
- L'authentification de l'utilisateur
- Le rôle requis pour accéder à la route
- L'activation du compte

## 🚀 Déploiement

### Vercel (recommandé)

1. Connecter le repository GitHub à Vercel
2. Configurer les variables d'environnement dans Vercel (voir `.env.example` et la section "Variables d'environnement" ci-dessus)
3. Déployer automatiquement à chaque push sur `main`

### ⚠️ Éviter les déploiements multiples

**Important** : Vercel déclenche automatiquement un déploiement à chaque commit poussé sur `main`.

Pour éviter les déploiements multiples lors de commits intermédiaires, utilisez `[skip vercel]` dans le message de commit :

```bash
git commit -m "fix: Correction intermédiaire [skip vercel]"
```

Les commits avec `[skip vercel]` dans le message seront ignorés par Vercel et ne déclencheront pas de déploiement.

**Exemple de workflow recommandé :**
- Commits intermédiaires : utiliser `[skip vercel]`
- Commit final/prêt pour production : commit normal (sans `[skip vercel]`)

### Variables d'environnement de production

**📖 Référence** : Voir `.env.example` pour la liste des variables. Les variables essentielles sont :
- Variables Firebase (client et admin)
- Clés API externes (Pappers, Societe.com)

### Configuration Vercel

Le fichier `vercel.json` configure les redirections et les routes API.

Le fichier `vercel.json` configure le cron du leaderboard. Pour les variables d'environnement, consultez `.env.example`.

## 🤖 Agents IA — Bots spécialisés

Le projet a connu plusieurs itérations d'agents IA pour assister les collaborateurs (diagnostic prévoyance, santé TNS, sinistres, etc.).

### Essais réalisés

| Plateforme | Usage | État |
|------------|-------|------|
| **OpenAI** | Embeddings pour la base de connaissance RAG (ingest PDF) | Utilisé côté admin (ingestion) |
| **Mistral** | Chat avec agents (Bob prévoyance/santé TNS via `MISTRAL_AGENT_BOB`) | En production actuellement |
| **Gemini** | — | **Cible actuelle** |

### État actuel (Mistral)

- **Bob** : Expert santé et prévoyance TNS, connecté à l'API Mistral Agents
- **API** : `POST /api/chat` avec `botId`, `message`, `history`
- **Config** : `lib/config/agents.ts` — `MISTRAL_API_KEY` et `MISTRAL_AGENT_BOB` requis
- **Interface** : `/commun/agents-ia/bob`, `/admin/test-bots`

### Migration vers Gemini

La base de connaissances pour Bob est prête dans `docs/assets-gemini/bob-prevoyance/` :

- **Référentiels** : Plafonds 2026 (PASS, PMSS, SMIC), régimes (SSI, CARPIMKO, CIPAV, CARMF, CAVEC, etc.)
- **Workflow** : `00-workflow-bob-methode.md` — méthodologie d'accueil, collecte, analyse et livrable
- **Solutions** : Allianz, UNIM, UNICED
- **Index** : `00-table-des-matieres.md` — 15 fichiers de référence

L'intégration Gemini remplacera Mistral pour alimenter Bob avec cette base technique complète (vision OCR, contexte structuré, calculs prévoyance 2026).

## 📚 Documentation supplémentaire

- **Docs** : `docs/README.md` — Inventaire et structure de la documentation
- **Bob Prévyance** : `docs/assets-gemini/bob-prevoyance/` — Base technique pour l'agent Bob (référentiels, régimes, workflow, solutions Allianz/UNIM/UNICED)
- **Boost** : `docs/boost/google/BOOST.md` — Spécification du module de déclaration des avis clients
- **Rémunérations** : `docs/remuneration/grille.md` — Grille de pilotage des rémunérations
- **Process M+3** : `docs/process/m+3/m+3_ia.md` — Workflow M+3 (suivi client ~3 mois)
- **Conventions Firestore** : `firestore.rules` — Règles de sécurité

## 🤝 Contribution

### Workflow Git - Développement de nouvelles fonctionnalités

Pour développer de nouvelles fonctionnalités sans mettre en danger la branche `main`, suivez ce workflow :

#### 1. Créer une branche de fonctionnalité

```bash
# S'assurer d'être sur main et à jour
git checkout main
git pull origin main

# Créer une nouvelle branche pour votre fonctionnalité
git checkout -b feature/nom-de-la-fonctionnalite

# Exemples :
# git checkout -b feature/messagerie-amelioree
# git checkout -b feature/nouveau-dashboard
# git checkout -b fix/correction-bug-xyz
```

#### 2. Développer sur la branche

```bash
# Faire vos modifications, commits, etc.
git add .
git commit -m "feat: Ajout de la fonctionnalité X"

# Pousser la branche sur le dépôt distant
git push origin feature/nom-de-la-fonctionnalite
```

#### 3. Tester et valider

- Tester localement votre fonctionnalité
- Vérifier qu'il n'y a pas de régression
- S'assurer que les tests passent (si applicable)

#### 4. Fusionner dans main

```bash
# Revenir sur main
git checkout main
git pull origin main

# Fusionner la branche de fonctionnalité
git merge feature/nom-de-la-fonctionnalite

# Pousser sur origin
git push origin main

# Supprimer la branche locale (optionnel)
git branch -d feature/nom-de-la-fonctionnalite

# Supprimer la branche distante (optionnel)
git push origin --delete feature/nom-de-la-fonctionnalite
```

#### 5. Conventions de nommage des branches

- **`feature/`** : Nouvelles fonctionnalités
  - Exemple : `feature/nouveau-module-sinistres`
- **`fix/`** : Corrections de bugs
  - Exemple : `fix/erreur-connexion-emma`
- **`refactor/`** : Refactorisation de code
  - Exemple : `refactor/optimisation-queries-firestore`
- **`docs/`** : Documentation uniquement
  - Exemple : `docs/guide-deploiement`

#### 6. Éviter les déploiements multiples

Pour les commits intermédiaires sur une branche de fonctionnalité, utilisez `[skip vercel]` :

```bash
git commit -m "fix: Correction intermédiaire [skip vercel]"
```

Le commit final de fusion dans `main` déclenchera le déploiement.

### Structure du code

- **Composants** : Dans `components/`, organisés par fonctionnalité
- **Pages** : Dans `app/`, suivant la structure Next.js App Router
- **API Routes** : Dans `app/api/`, une route par endpoint
- **Utilitaires** : Dans `lib/utils/`, fonctions réutilisables
- **Types** : Dans `types/`, définitions TypeScript centralisées

### Conventions de nommage

- **Composants** : PascalCase (ex: `ActivityOverview.tsx`)
- **Fichiers** : kebab-case pour les pages, PascalCase pour les composants
- **Variables** : camelCase
- **Types/Interfaces** : PascalCase

### Processus de contribution

1. Créer une branche depuis `main`
2. Développer la fonctionnalité
3. Tester localement
4. Créer une Pull Request
5. Attendre la revue de code

## 📄 Licence

Propriétaire - Allianz Marseille

## 👤 Contact

Pour toute question ou support, contacter l'équipe de développement.

---

**Version** : 0.1.0
**Dernière mise à jour** : Mars 2026

