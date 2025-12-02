# Gestion des Rôles Utilisateur

Ce document explique comment le système de rôles est implémenté dans l'application.

## Vue d'ensemble

L'application utilise un système de **contrôle d'accès basé sur les rôles (RBAC)** pour gérer les permissions des utilisateurs.

## Rôles Disponibles

### 1. ADMINISTRATEUR

**Identifiant :** `ADMINISTRATEUR`

**Permissions :**
- Accès complet à l'interface d'administration (`/admin`)
- Gestion des utilisateurs
- Gestion des compagnies
- Configuration des règles de commissions
- Accès au dashboard commercial

**Accès aux pages :**
- `/admin` ✅
- `/dashboard` ✅

### 2. CDC_COMMERCIAL (Centre de Développement Commercial)

**Identifiant :** `CDC_COMMERCIAL`

**Permissions :**
- Accès au dashboard commercial uniquement
- Visualisation des KPIs
- Création et gestion des actes commerciaux

**Accès aux pages :**
- `/admin` ❌ (redirection vers `/dashboard`)
- `/dashboard` ✅

## Architecture de l'Implémentation

### 1. Types et Interfaces

Les types sont définis dans `types/index.ts` :

```typescript
export interface User {
  id: string;
  email: string;
  role: "ADMINISTRATEUR" | "CDC_COMMERCIAL";
  active: boolean;
  createdAt: Date;
}
```

### 2. Hook d'Authentification

Le hook `useAuth` (`lib/firebase/use-auth.ts`) récupère automatiquement :
- Les données Firebase de l'utilisateur
- Les informations de l'utilisateur depuis Firestore (dont le rôle)

```typescript
const { user, userData, loading } = useAuth();

// userData contient :
// {
//   id: string;
//   email: string;
//   role: "ADMINISTRATEUR" | "CDC_COMMERCIAL";
//   active: boolean;
//   createdAt: Date;
// }
```

### 3. Utilitaires de Rôles

Le fichier `lib/utils/roles.ts` contient toutes les fonctions de vérification des rôles :

#### Fonctions Disponibles

- `isAdmin(userData)` : Vérifie si l'utilisateur est administrateur
- `isCommercial(userData)` : Vérifie si l'utilisateur est CDC Commercial
- `hasAccess(userData, requiredRole)` : Vérifie l'accès à une fonctionnalité
- `canAccessAdmin(userData)` : Vérifie l'accès à l'interface admin
- `canAccessDashboard(userData)` : Vérifie l'accès au dashboard
- `getRoleLabel(role)` : Retourne le libellé du rôle

### 4. Protection des Routes

Le composant `RouteGuard` (`components/auth/route-guard.tsx`) protège automatiquement les pages :

```tsx
import { RouteGuard } from "@/components/auth/route-guard";

export default function AdminPage() {
  return (
    <RouteGuard allowedRoles={["ADMINISTRATEUR"]}>
      {/* Contenu de la page */}
    </RouteGuard>
  );
}
```

**Fonctionnalités du RouteGuard :**
- ✅ Vérifie l'authentification de l'utilisateur
- ✅ Vérifie que le compte est actif
- ✅ Vérifie les permissions selon le rôle
- ✅ Redirige automatiquement si l'accès est refusé
- ✅ Affiche un loader pendant la vérification
- ✅ Affiche des messages d'erreur appropriés

### 5. Redirection lors de la Connexion

Dans `app/login/page.tsx`, la redirection se fait automatiquement selon le rôle :

```typescript
const firebaseUser = await login(data.email, data.password);
const userData = await getUserData(firebaseUser.uid);

// Redirection selon le rôle
if (userData?.role === ROLES.ADMINISTRATEUR) {
  router.push("/admin");
} else {
  router.push("/dashboard");
}
```

## Utilisation Pratique

### 1. Afficher du contenu conditionnel

```tsx
import { useAuth } from "@/lib/firebase/use-auth";
import { isAdmin } from "@/lib/utils/roles";

export default function MyComponent() {
  const { userData } = useAuth();

  return (
    <div>
      {isAdmin(userData) && (
        <button>Action Admin</button>
      )}
    </div>
  );
}
```

### 2. Protéger une page

```tsx
import { RouteGuard } from "@/components/auth/route-guard";

export default function ProtectedPage() {
  return (
    <RouteGuard allowedRoles={["ADMINISTRATEUR", "CDC_COMMERCIAL"]}>
      {/* Contenu accessible aux deux rôles */}
    </RouteGuard>
  );
}
```

### 3. Afficher le nom et le rôle de l'utilisateur

```tsx
import { useAuth } from "@/lib/firebase/use-auth";
import { getRoleLabel } from "@/lib/utils/roles";

export default function UserProfile() {
  const { userData } = useAuth();

  if (!userData) return null;

  return (
    <div>
      <p>Email: {userData.email}</p>
      <p>Rôle: {getRoleLabel(userData.role)}</p>
    </div>
  );
}
```

### 4. Créer un menu de navigation adaptatif

```tsx
import { useAuth } from "@/lib/firebase/use-auth";
import { isAdmin } from "@/lib/utils/roles";

export default function Navigation() {
  const { userData } = useAuth();

  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      {isAdmin(userData) && (
        <Link href="/admin">Administration</Link>
      )}
    </nav>
  );
}
```

## Règles de Sécurité

### ✅ Bonnes Pratiques

1. **Toujours vérifier le rôle côté serveur** (quand vous ajouterez des API routes)
2. **Vérifier que `active === true`** avant d'autoriser l'accès
3. **Utiliser les fonctions utilitaires** plutôt que de comparer directement les rôles
4. **Protéger les pages avec RouteGuard** dès la création

### ❌ À Éviter

1. Ne jamais vérifier uniquement côté client
2. Ne pas confier la sécurité uniquement au composant RouteGuard
3. Ne pas exposer de données sensibles selon le rôle sans vérification
4. Ne pas hardcoder les rôles en strings, utiliser les constantes `ROLES`

## Ajout d'un Nouveau Rôle

Pour ajouter un nouveau rôle :

1. **Ajouter le type** dans `types/index.ts` :
```typescript
role: "ADMINISTRATEUR" | "CDC_COMMERCIAL" | "NOUVEAU_ROLE";
```

2. **Ajouter la constante** dans `lib/utils/roles.ts` :
```typescript
export const ROLES = {
  ADMINISTRATEUR: "ADMINISTRATEUR",
  CDC_COMMERCIAL: "CDC_COMMERCIAL",
  NOUVEAU_ROLE: "NOUVEAU_ROLE",
} as const;
```

3. **Ajouter une fonction de vérification** :
```typescript
export function isNouveauRole(userData: UserData | null): boolean {
  return userData?.role === ROLES.NOUVEAU_ROLE && userData?.active === true;
}
```

4. **Ajouter les règles d'accès** dans les fonctions appropriées

5. **Mettre à jour la documentation**

## Tests

Pour tester les rôles en développement :

1. Utilisez les boutons de connexion rapide dans `/login`
2. Créez des utilisateurs de test dans Firestore avec différents rôles
3. Testez l'accès aux différentes pages selon les rôles

## Notes Importantes

- Le champ `active` est crucial : même avec un rôle valide, un utilisateur inactif ne peut pas accéder à l'application
- Les administrateurs ont toujours accès à tout
- Les redirections sont automatiques et affichent des messages d'erreur clairs

## Support

Pour toute question sur le système de rôles, consultez :
- Ce document
- Le code source de `lib/utils/roles.ts`
- Le composant `RouteGuard` dans `components/auth/route-guard.tsx`
