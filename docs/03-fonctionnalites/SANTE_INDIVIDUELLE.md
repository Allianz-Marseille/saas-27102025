# Dashboard Santé Individuelle

## Vue d'ensemble

Le dashboard **Santé Individuelle** est un système complètement autonome et parallèle au dashboard commercial existant. Il permet aux commerciaux santé de gérer leurs actes et suivre leur production avec un système de commissions progressif basé sur des seuils.

## Accès

- **URL** : `/sante-individuelle`
- **Rôle requis** : `COMMERCIAL_SANTE_INDIVIDUEL`
- **Permissions** : Gestion complète de leurs propres actes

## Architecture

### 1. Types TypeScript

**Fichier** : `types/index.ts`

Nouveaux types ajoutés :
- `HealthAct` : Structure d'un acte santé individuelle
- `HealthKPI` : Structure des indicateurs de performance

### 2. Rôle utilisateur

**Nouveau rôle** : `COMMERCIAL_SANTE_INDIVIDUEL`

**Fichiers mis à jour** :
- `types/index.ts` : Ajout du rôle dans l'interface User
- `lib/utils/roles.ts` : Ajout des fonctions `isCommercialSanteIndividuel()` et `canAccessHealthDashboard()`

### 3. Firebase

**Nouvelle collection** : `health_acts`

**Fichiers** :
- `lib/firebase/health-acts.ts` : Gestion CRUD des actes santé
- `firestore.rules` : Règles de sécurité pour la collection health_acts

**Fonctions disponibles** :
- `createHealthAct()` : Créer un acte
- `getHealthActsByMonth()` : Récupérer les actes d'un mois
- `updateHealthAct()` : Modifier un acte
- `deleteHealthAct()` : Supprimer un acte
- `healthContractNumberExists()` : Vérifier l'unicité d'un numéro de contrat

### 4. Système de commissions

**Fichier** : `lib/utils/health-kpi.ts`

**Grille de rémunération** :
- Seuil 1 : < 10 000 € → 0%
- Seuil 2 : < 14 000 € → 2%
- Seuil 3 : < 18 000 € → 3%
- Seuil 4 : < 22 000 € → 4%
- Seuil 5 : ≥ 22 000 € → 6%

**Principe** : Le pourcentage s'applique sur **toute** la production pondérée depuis le premier euro (pas de calcul par tranche).

**Fonctions** :
- `calculateHealthKPI()` : Calcule tous les KPIs à partir des actes
- `getHealthCommissionRate()` : Détermine le seuil atteint et le taux applicable
- `formatCommissionRate()` : Formatte le taux pour l'affichage
- `getThresholdColor()` : Retourne la couleur du seuil pour les visualisations

## Types d'actes

### 5 types d'actes avec coefficients

Chaque acte a un coefficient qui s'applique au CA annuel pour obtenir le CA pondéré.

**Coefficients définis** :
- `AFFAIRE_NOUVELLE` : 100% (1.0)
- `REVISION` : 50% (0.5)
- `ADHESION_SALARIE` : 30% (0.3)
- `COURT_TO_AZ` : 70% (0.7)
- `AZ_TO_COURTAGE` : 50% (0.5)

**Calcul** : `CA pondéré = CA annuel × coefficient`

## Pages et composants

### Layout

**Fichier** : `app/sante-individuelle/layout.tsx`

Sidebar dédiée avec :
- Logo et branding "Santé Individuelle"
- Navigation : Tableau de bord, Mes actes, Mon profil
- User info et déconnexion
- Theme toggle

### Page principale

**Fichier** : `app/sante-individuelle/page.tsx`

**Contenu** :
- Welcome banner avec CA pondéré du mois
- KPIs : Total actes, CA Total, Commissions, Objectif restant
- Barre de progression vers les seuils
- Cartes des 5 seuils avec indicateurs visuels
- Répartition des actes par type

### Page des actes

**Fichier** : `app/sante-individuelle/actes/page.tsx`

**Fonctionnalités** :
- Navigation mensuelle
- Bouton "Nouvel acte" (ouvre une modale)
- Tableau avec toutes les colonnes :
  - Date de saisie
  - Type
  - Client
  - N° Contrat
  - Date d'effet
  - CA Annuel
  - Taux (coefficient en %)
  - CA Pondéré
  - Actions (Modifier, Supprimer)
- Tri sur toutes les colonnes
- Filtres par type d'acte (exclusifs)
- Stats en footer : Total actes, CA pondéré total

### Composants

**Fichier** : `components/health-acts/new-health-act-dialog.tsx`

**Modale de création d'acte** :
- Sélection du type d'acte (affiche automatiquement le coefficient)
- Nom du client (avec capitalisation automatique)
- Numéro de contrat (avec vérification d'unicité pour AFFAIRE_NOUVELLE)
- Date d'effet (date picker)
- CA annuel
- Affichage automatique du CA pondéré calculé

**Validation** :
- Tous les champs sont obligatoires
- Vérification d'unicité du numéro de contrat (uniquement pour AFFAIRE_NOUVELLE)
- Capitalisation automatique du nom (gestion des noms composés)

## Interface Admin

**Fichier** : `app/admin/users/page.tsx`

**Mise à jour** :
- Ajout du rôle "Commercial Santé Individuel" dans les sélecteurs
- Possibilité de créer des utilisateurs avec ce rôle
- Possibilité de changer le rôle d'un utilisateur existant

## Sécurité Firestore

**Fichier** : `firestore.rules`

**Nouvelle règle** :
```javascript
// Helper function to check if user is Commercial Santé Individuel
function isCommercialSante() {
  return isAuthenticated() && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'COMMERCIAL_SANTE_INDIVIDUEL';
}

// Health acts collection (Santé Individuelle)
match /health_acts/{actId} {
  allow read: if isAuthenticated();
  allow create: if isCommercialSante();
  allow update: if isCommercialSante() && resource.data.userId == request.auth.uid;
  allow delete: if isAdmin() || (isCommercialSante() && resource.data.userId == request.auth.uid);
}
```

## Authentification et routing

### RouteGuard

**Fichier** : `components/auth/route-guard.tsx`

**Mise à jour** :
- Ajout de la vérification pour `/sante-individuelle`
- Redirection appropriée selon le rôle
- Support du rôle `COMMERCIAL_SANTE_INDIVIDUEL` dans `allowedRoles`

### Page de connexion

**Fichier** : `app/login/page.tsx`

**Redirection après connexion** :
- `ADMINISTRATEUR` → `/admin`
- `COMMERCIAL_SANTE_INDIVIDUEL` → `/sante-individuelle`
- `CDC_COMMERCIAL` → `/dashboard`

## Indépendance des systèmes

Le système santé individuelle est **complètement indépendant** du système commercial :

1. **Collection Firebase séparée** : `health_acts` vs `acts`
2. **Routes séparées** : `/sante-individuelle` vs `/dashboard`
3. **Types séparés** : `HealthAct` vs `Act`
4. **Fonctions séparées** : `lib/firebase/health-acts.ts` vs `lib/firebase/acts.ts`
5. **KPIs séparés** : `lib/utils/health-kpi.ts` vs `lib/utils/kpi.ts`
6. **Composants séparés** : `components/health-acts/` vs `components/acts/`

## Fonctionnalités à venir

- [ ] Modale d'édition d'acte
- [ ] Timeline de progression multi-mois
- [ ] Export des données
- [ ] Graphiques de visualisation
- [ ] Notifications de seuils atteints
- [ ] Historique des commissions

## Utilisation

### Pour un administrateur

1. Se connecter à l'interface admin (`/admin`)
2. Aller dans "Gestion des Utilisateurs"
3. Cliquer sur "Nouvel utilisateur"
4. Sélectionner le rôle "Commercial Santé Individuel"
5. Créer l'utilisateur

### Pour un commercial santé

1. Se connecter avec les identifiants fournis
2. Redirection automatique vers `/sante-individuelle`
3. Consulter le tableau de bord
4. Ajouter des actes via "Mes actes" → "Nouvel acte"
5. Suivre la progression vers les seuils de commission

## Notes techniques

- **Framework** : Next.js 15 (App Router)
- **Base de données** : Firebase Firestore
- **UI** : Tailwind CSS v4 + Radix UI
- **Validation** : Zod
- **Dates** : date-fns
- **Notifications** : Sonner (toast)

## Maintenance

Pour mettre à jour les coefficients des actes, modifier le fichier :
`lib/firebase/health-acts.ts` → constante `HEALTH_ACT_COEFFICIENTS`

Pour mettre à jour les seuils de commission, modifier le fichier :
`lib/utils/health-kpi.ts` → constante `HEALTH_COMMISSION_THRESHOLDS`

