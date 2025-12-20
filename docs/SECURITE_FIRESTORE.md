# Sécurité Firestore - Resserrement des droits

## 📋 Résumé des modifications

Ce document décrit les modifications apportées aux règles Firestore pour renforcer la sécurité des données.

## 🔒 Modifications apportées

### 1. Collection `users` - Lecture restreinte

**Avant :**
```javascript
allow read: if isAuthenticated(); // Tous les utilisateurs authentifiés pouvaient lire TOUS les users
```

**Après :**
```javascript
allow read: if isAdmin() || (isAuthenticated() && userId == request.auth.uid);
```

**Impact :** Les utilisateurs ne peuvent désormais lire que leur propre document utilisateur, sauf les admins qui peuvent lire tous les documents.

### 2. Collection `health_acts` - Lecture restreinte

**Avant :**
```javascript
allow read: if isAuthenticated(); // Tous les utilisateurs authentifiés pouvaient lire tous les actes santé
```

**Après :**
```javascript
allow read: if isAdmin() || (isAuthenticated() && resource.data.userId == request.auth.uid);
```

**Impact :** Les utilisateurs ne peuvent lire que leurs propres actes santé, sauf les admins.

### 3. Collection `health_collective_acts` - Lecture restreinte

**Avant :**
```javascript
allow read: if isAuthenticated(); // Tous les utilisateurs authentifiés pouvaient lire tous les actes santé collective
```

**Après :**
```javascript
allow read: if isAdmin() || (isAuthenticated() && resource.data.userId == request.auth.uid);
```

**Impact :** Les utilisateurs ne peuvent lire que leurs propres actes santé collective, sauf les admins.

### 4. Collection `commissionRules` - Aucun changement

La collection `commissionRules` reste accessible en lecture à tous les utilisateurs authentifiés car ces règles sont nécessaires pour les calculs de commissions côté client. L'écriture reste réservée aux admins.

## ✅ Collections déjà sécurisées

Les collections suivantes étaient déjà correctement sécurisées :

- **`logs`** : Lecture admin uniquement ✅
- **`agency_commissions`** : Accès admin uniquement ✅
- **`acts`** : Lecture restreinte au propriétaire ou admin ✅

## 🧪 Tests avec Firebase Emulator

Un fichier de tests a été créé pour valider les règles de sécurité : `scripts/test-firestore-rules-emulator.ts`

### Prérequis

1. Démarrer l'Emulator Firebase :
```bash
firebase emulators:start --only firestore,auth
```

**Note:** Ce script utilise directement le SDK Firebase client connecté à l'Emulator, sans dépendre de `@firebase/rules-unit-testing` (qui nécessite Firebase 10, alors que le projet utilise Firebase 12).

### Exécuter les tests

```bash
npm run test:rules:emulator
```

### Tests couverts

Le fichier de tests valide :

1. **Collection `users`** :
   - ✅ Admin peut lire tous les users
   - ✅ Utilisateur peut lire son propre document
   - ✅ Utilisateur ne peut PAS lire le document d'un autre utilisateur

2. **Collection `logs`** :
   - ✅ Admin peut lire les logs
   - ✅ Utilisateur ne peut PAS lire les logs
   - ✅ Utilisateur authentifié peut créer des logs

3. **Collection `agency_commissions`** :
   - ✅ Admin peut lire les commissions
   - ✅ Utilisateur ne peut PAS lire les commissions

4. **Collection `acts`** :
   - ✅ Utilisateur peut lire son propre acte
   - ✅ Utilisateur ne peut PAS lire l'acte d'un autre utilisateur
   - ✅ Admin peut lire tous les actes

5. **Collection `health_acts`** :
   - ✅ Utilisateur peut lire son propre acte santé
   - ✅ Utilisateur ne peut PAS lire l'acte santé d'un autre utilisateur

## 📊 Impact sur l'application

### Points d'attention

1. **Requêtes côté client** : Vérifier que les requêtes qui listent tous les utilisateurs ou tous les actes sont effectuées côté serveur (API routes) avec Admin SDK, ou qu'elles utilisent des filtres appropriés.

2. **Composants existants** : Certains composants peuvent nécessiter des ajustements si ils tentent de lire des documents auxquels l'utilisateur n'a plus accès.

3. **Tests d'intégration** : Les tests d'intégration doivent être mis à jour pour refléter les nouvelles restrictions.

### Migration recommandée

1. Tester les modifications en local avec l'Emulator
2. Déployer les nouvelles règles sur un environnement de staging
3. Vérifier que toutes les fonctionnalités fonctionnent correctement
4. Déployer en production

## 🔍 Vérification manuelle

Pour vérifier manuellement les règles :

1. Se connecter avec un compte utilisateur non-admin
2. Tenter de lire un document user d'un autre utilisateur → doit échouer
3. Tenter de lire un acte d'un autre utilisateur → doit échouer
4. Tenter de lire les logs → doit échouer
5. Tenter de lire les commissions → doit échouer

## 📝 Notes importantes

- Les règles Firestore sont évaluées côté serveur Firebase
- Les règles ne s'appliquent pas aux opérations effectuées avec Admin SDK
- Les règles s'appliquent uniquement aux opérations effectuées avec le SDK client Firebase
- Les requêtes qui ne respectent pas les règles échouent avec une erreur `permission-denied`

