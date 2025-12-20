# SaaS Agence Allianz Marseille

Application SaaS complète pour la gestion d'une agence d'assurance Allianz, permettant le suivi des actes commerciaux, le calcul automatique des commissions, et la gestion des performances par équipe.

## 📋 Vue d'ensemble

Cette application permet de gérer l'ensemble des activités commerciales d'une agence d'assurance Allianz avec :

- **Gestion des actes commerciaux** : Saisie et suivi de tous les types d'actes (Apports Nouveaux, M+3, Préterme, etc.)
- **Calcul automatique des commissions** : Calcul des commissions selon les règles spécifiques à chaque type de commercial
- **KPIs en temps réel** : Suivi des indicateurs de performance par commercial et par équipe
- **Outils intégrés** : Accès à des outils externes (Pappers, Process, ChatGPT Assistant)
- **Interface d'administration** : Gestion complète des utilisateurs, entreprises, et offres commerciales

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
- (En développement)

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

#### Logs système
- Consultation des logs d'activité
- Traçabilité des actions utilisateurs

#### Commissions agence
- Suivi des commissions IARD, Vie, Courtage
- Gestion des profits exceptionnels
- Calcul des charges et résultats
- Prélèvements associés

#### Leaderboard
- Classement des commerciaux
- Mise à jour automatique via cron

### Outils communs

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

#### Process
Documentation des processus métier :
- Gestion des leads
- Production : saisie des affaires nouvelles
- Stratégie Process : L'art de la régularité

#### ChatGPT Assistant
Assistant ChatGPT intégré (en développement selon `docs/bot-mcp-chatgpt.md`) :
- Contournement des restrictions réseau Allianz
- Accès à toutes les fonctionnalités ChatGPT
- Support images, OCR, fichiers, recherche web

## 📁 Structure du projet

```
app/
├── admin/                    # Interface administrateur
│   ├── commercial/          # Détails d'un commercial
│   ├── commissions-agence/  # Gestion commissions agence
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
│   ├── outils/              # Outils (Pappers, ChatGPT, etc.)
│   └── process/             # Documentation processus
├── api/                     # Routes API Next.js
│   ├── acts/                # API actes
│   ├── admin/               # API admin
│   ├── assistant/           # API assistant ChatGPT
│   ├── cron/                # Tâches cron
│   ├── leaderboard/         # API leaderboard
│   ├── offres/              # API offres
│   ├── pappers/             # API Pappers
│   ├── process/             # API process
│   └── societe/             # API Societe.com
├── login/                    # Page de connexion
└── page.tsx                  # Page d'accueil

components/                   # Composants React réutilisables
├── acts/                    # Composants actes
├── admin/                   # Composants admin
├── assistant/               # Composants assistant
├── auth/                    # Composants authentification
├── commissions/             # Composants commissions
├── dashboard/               # Composants dashboard
├── health-acts/             # Composants actes santé
├── navigation/             # Composants navigation
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
- `rag_documents` : Documents RAG pour l'assistant
- `assistant_conversations` : Conversations de l'assistant

**⚠️ Important** : Les règles de sécurité ont été renforcées pour protéger les données personnelles. Voir `docs/SECURITE_FIRESTORE.md` pour plus de détails.

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
npm run import:commissions               # Importer des commissions depuis Markdown
npm run import:commissions-2023          # Importer des commissions 2023
npm run import:kheira-nov               # Importer données Kheira novembre
npm run import:kheira-oct               # Importer données Kheira octobre
npm run import:kheira-sep               # Importer données Kheira septembre
npm run import:kheira-jul               # Importer données Kheira juillet
npm run import:kheira-jun               # Importer données Kheira juin
npm run import:kheira-may               # Importer données Kheira mai
```

### Scripts de migration

```bash
npm run migrate-ird-pro-commissions      # Migrer les commissions IRD Pro
npm run generate-leaderboard             # Générer le leaderboard
```

### Scripts utilitaires

```bash
npm run get-user-info                    # Obtenir les informations d'un utilisateur
npm run index:rag                        # Indexer des documents RAG
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
- Documentation complète : `docs/SECURITE_FIRESTORE.md`

### Protection des routes

Toutes les routes sont protégées par le composant `RouteGuard` qui vérifie :
- L'authentification de l'utilisateur
- Le rôle requis pour accéder à la route
- L'activation du compte

## 🚀 Déploiement

### Vercel (recommandé)

1. Connecter le repository GitHub à Vercel
2. Configurer les variables d'environnement dans Vercel (voir [Guide de déploiement](docs/deployment.md))
3. Déployer automatiquement à chaque push sur `main`

### Variables d'environnement de production

**📖 Documentation complète** : Voir [docs/deployment.md](docs/deployment.md) pour la liste complète des variables d'environnement requises.

Variables essentielles :
- **`OPENAI_API_KEY`** (requis) : Clé API OpenAI pour l'assistant IA
- Variables Firebase (client et admin)
- Clés API externes (Pappers, Societe.com, etc.)

### Configuration Vercel

Le fichier `vercel.json` configure les redirections et les routes API.

Pour plus de détails sur la configuration Vercel et les variables d'environnement, consultez le [Guide de déploiement](docs/deployment.md).

## 📚 Documentation supplémentaire

- **Sécurité Firestore** : Voir `docs/SECURITE_FIRESTORE.md` pour les détails sur le resserrement des droits d'accès et les tests de sécurité
- **Pinecone vs Firestore Vectoriel** : Voir `docs/PINECONE_VS_FIRESTORE_VECTORIEL.md` pour le guide de décision sur l'architecture de recherche vectorielle
- **Bot ChatGPT** : Voir `docs/bot-mcp-chatgpt.md` pour la documentation du bot ChatGPT Assistant
- **Pappers** : Voir `docs/outil-pappers.md` pour l'inventaire des fonctionnalités Pappers (si disponible)

## 🤝 Contribution

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
**Dernière mise à jour** : 2025

