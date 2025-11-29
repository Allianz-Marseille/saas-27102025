# Corrections Codex - Sécurité & Architecture

Ce document résume les corrections apportées suite à l'audit Codex du 29 novembre 2025.

## 📋 Résumé des corrections

Les 4 problèmes identifiés par Codex ont été corrigés :

1. ✅ **Domaine autorisé** - Configuration centralisée
2. ✅ **Firebase SSR** - Support des Server Actions
3. ✅ **Règles Firestore** - Confidentialité des actes
4. ✅ **Audit connexions** - Retry automatique

---

## 1. Domaine email autorisé - Configuration centralisée

### Problème
Le domaine `@allianz-nogaro.fr` était codé en dur dans 2 fichiers différents, rendant la maintenance difficile.

### Solution
Configuration centralisée dans `lib/config/auth-config.ts` avec possibilité de surcharge via variable d'environnement.

### Fichiers modifiés
- ✅ `lib/config/auth-config.ts` - Nouveau fichier de configuration
- ✅ `lib/firebase/auth.ts` - Utilise la config centralisée
- ✅ `app/login/page.tsx` - Utilise la config centralisée
- ✅ `env.example` - Ajout de `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN`

### Configuration (optionnel)
Pour changer le domaine autorisé, ajoutez dans `.env.local` :
```env
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN=@votre-domaine.fr
```

---

## 2. Firebase Admin SDK - Support SSR

### Problème
`lib/firebase/config.ts` bloquait l'initialisation côté serveur (`typeof window !== 'undefined'`), empêchant l'utilisation dans les Server Actions.

### Solution
Création d'un module séparé `lib/firebase/admin-config.ts` pour les opérations serveur.

### Fichiers créés
- ✅ `lib/firebase/admin-config.ts` - Firebase Admin SDK pour SSR
- ✅ `app/api/leaderboard/route.ts` - Exemple d'utilisation

### Usage
```typescript
// Côté client (composants React)
import { db } from '@/lib/firebase/config';

// Côté serveur (API Routes, Server Actions, scripts)
import { adminDb } from '@/lib/firebase/admin-config';
```

### Configuration requise
Le module utilise automatiquement :
- **Production (Vercel)** : Variables d'environnement `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
- **Développement** : Fichier `saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json`

---

## 3. Règles Firestore - Confidentialité des actes

### Problème
Tous les utilisateurs authentifiés pouvaient lire tous les actes, posant un problème de confidentialité.

### Solution
1. Restriction de l'accès en lecture aux actes (propriétaire ou admin uniquement)
2. Création d'une collection `leaderboard` avec données agrégées pour les classements

### Fichiers modifiés/créés
- ✅ `firestore.rules` - Règles mises à jour
- ✅ `lib/firebase/leaderboard.ts` - Fonctions de lecture du leaderboard
- ✅ `scripts/generate-leaderboard.ts` - Script d'agrégation
- ✅ `components/dashboard/process-leaderboard-widget.tsx` - Utilise leaderboard
- ✅ `lib/firebase/acts.ts` - `getAllCommercialsKPI` marquée deprecated

### Nouvelles règles Firestore

**Acts (actes)** :
```
allow read: if isAdmin() || (isAuthenticated() && resource.data.userId == request.auth.uid);
```
- Les commerciaux voient uniquement leurs propres actes
- Les admins voient tous les actes

**Leaderboard** :
```
allow read: if isAuthenticated();
allow create/update/delete: if isAdmin();
```
- Tous les utilisateurs peuvent lire le leaderboard
- Seuls les admins/scripts peuvent modifier

### ⚠️ IMPORTANT : Déploiement des règles

Après avoir testé localement, déployez les nouvelles règles :
```bash
firebase deploy --only firestore:rules
```

### Migration des données

Exécutez le script pour générer les données du leaderboard :

```bash
# Pour le mois en cours
npx tsx scripts/generate-leaderboard.ts

# Pour un mois spécifique
npx tsx scripts/generate-leaderboard.ts 2025-11

# Pour plusieurs mois
npx tsx scripts/generate-leaderboard.ts 2025-01
npx tsx scripts/generate-leaderboard.ts 2025-02
# etc.
```

### Automatisation recommandée

**Option 1 - Cron job (production)**
Ajoutez un cron job quotidien pour mettre à jour le leaderboard :
```bash
0 2 * * * cd /path/to/project && npx tsx scripts/generate-leaderboard.ts >> /var/log/leaderboard.log 2>&1
```

**Option 2 - Cloud Function (Firebase)**
Créez une Cloud Function déclenchée quotidiennement (code non fourni, à implémenter si besoin).

---

## 4. Audit des connexions - Retry automatique

### Problème
Les échecs réseau lors de l'enregistrement des logs de connexion n'étaient pas gérés (simple `console.error`).

### Solution
Implémentation d'un système de retry avec backoff exponentiel pour les opérations critiques.

### Fichiers créés/modifiés
- ✅ `lib/utils/retry.ts` - Utilitaire de retry générique
- ✅ `lib/firebase/use-auth.ts` - Utilise retry pour les logs

### Comportement
Lors d'une connexion utilisateur :
1. **Tentative 1** : Enregistrement immédiat du log
2. **En cas d'échec** : Retry après 1 seconde
3. **En cas d'échec** : Retry après 2 secondes
4. **En cas d'échec** : Erreur définitive loggée

### Messages console
```
⚠️ Échec de l'enregistrement du log (tentative 1/3): network error
⚠️ Échec de l'enregistrement du log (tentative 2/3): network error
✅ Log de connexion enregistré pour: user@allianz-nogaro.fr
```

Ou en cas d'échec définitif :
```
❌ Échec définitif de l'enregistrement du log de connexion après 3 tentatives: ...
   Ceci peut indiquer un problème de connexion réseau ou de configuration Firestore.
```

### Réutilisable
L'utilitaire `retryAsync` peut être utilisé pour d'autres opérations critiques :
```typescript
import { retryAsync, isFirebaseRetryableError } from '@/lib/utils/retry';

await retryAsync(
  () => someAsyncOperation(),
  {
    maxAttempts: 3,
    initialDelay: 1000,
    shouldRetry: isFirebaseRetryableError,
    onRetry: (attempt, error) => {
      console.warn(`Retry attempt ${attempt}:`, error);
    }
  }
);
```

---

## 📊 Récapitulatif des fichiers

### Nouveaux fichiers (7)
1. `lib/config/auth-config.ts` - Config centralisée auth
2. `lib/firebase/admin-config.ts` - Firebase Admin SDK
3. `lib/firebase/leaderboard.ts` - Gestion leaderboard
4. `lib/utils/retry.ts` - Utilitaire retry
5. `scripts/generate-leaderboard.ts` - Script agrégation
6. `app/api/leaderboard/route.ts` - API route exemple
7. `docs/CODEX_CORRECTIONS.md` - Cette documentation

### Fichiers modifiés (6)
1. `lib/firebase/auth.ts` - Config domaine centralisée
2. `app/login/page.tsx` - Config domaine centralisée
3. `lib/firebase/use-auth.ts` - Retry pour logs
4. `firestore.rules` - Nouvelles règles sécurité
5. `lib/firebase/acts.ts` - Deprecated getAllCommercialsKPI
6. `components/dashboard/process-leaderboard-widget.tsx` - Utilise leaderboard
7. `env.example` - Ajout variable domaine

---

## ✅ Checklist de déploiement

### Développement local
- [x] Tous les fichiers créés/modifiés
- [x] Pas d'erreurs de linter
- [ ] Tester l'authentification
- [ ] Exécuter `generate-leaderboard.ts`
- [ ] Vérifier le leaderboard dans l'UI

### Avant production
- [ ] Ajouter `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN` dans `.env.local` (optionnel)
- [ ] Tester les nouvelles règles Firestore en local (Firebase Emulator recommandé)
- [ ] Exécuter `generate-leaderboard.ts` pour tous les mois historiques
- [ ] Vérifier que les classements s'affichent correctement

### Déploiement production
- [ ] Déployer le code sur Vercel
- [ ] Déployer les règles Firestore : `firebase deploy --only firestore:rules`
- [ ] Vérifier les variables d'environnement sur Vercel (FIREBASE_*)
- [ ] Configurer un cron job pour `generate-leaderboard.ts` (recommandé)
- [ ] Monitorer les logs de connexion pour vérifier le retry

---

## 🔒 Améliorations de sécurité

### Avant
- ✗ Domaine email codé en dur
- ✗ Pas de support SSR pour Firebase
- ✗ Tous les actes lisibles par tous
- ✗ Logs de connexion non garantis

### Après
- ✅ Configuration centralisée et flexible
- ✅ Firebase Admin SDK pour SSR
- ✅ Confidentialité des actes respectée
- ✅ Logs de connexion avec retry automatique
- ✅ Collection leaderboard pour performances et sécurité

---

## 📚 Ressources

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

**Date de correction** : 29 novembre 2025  
**Audit par** : Codex  
**Implémenté par** : AI Assistant

