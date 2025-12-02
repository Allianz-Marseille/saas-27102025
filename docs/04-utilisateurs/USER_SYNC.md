# Synchronisation des Utilisateurs Firebase

Ce guide explique comment utiliser le script de synchronisation des utilisateurs pour créer automatiquement les documents Firestore à partir des utilisateurs Firebase Auth.

## 🎯 Objectif

Le script `sync-users.ts` automatise la création des documents dans la collection `users` de Firestore à partir des utilisateurs existants dans Firebase Authentication.

## 📋 Prérequis

1. Les utilisateurs doivent déjà exister dans Firebase Authentication
2. Firebase Admin SDK doit être configuré
3. Les variables d'environnement doivent être configurées dans `.env.local`

## 🚀 Utilisation

### Option 1 : Avec Firebase CLI (Recommandé)

Si vous avez Firebase CLI installé et configuré :

```bash
npm run sync-users
```

### Option 2 : Avec une clé de service

1. **Télécharger la clé de service** :
   - Allez dans Firebase Console
   - Project Settings > Service Accounts
   - Cliquez sur "Generate new private key"
   - Sauvegardez le fichier JSON (ex: `serviceAccountKey.json`)

2. **Modifier le script** :
   Ouvrez `scripts/sync-users.ts` et décommentez les lignes suivantes :

```typescript
const serviceAccount = require('../serviceAccountKey.json');
app = initializeApp({
  credential: cert(serviceAccount),
  projectId: firebaseConfig.projectId,
});
```

3. **Exécuter le script** :
```bash
npm run sync-users
```

## 🔧 Configuration des rôles

Les rôles sont définis dans le script `scripts/sync-users.ts` :

```typescript
const USER_ROLES: Record<string, 'ADMINISTRATEUR' | 'CDC_COMMERCIAL'> = {
  'jeanmichel@allianz-nogaro.fr': 'ADMINISTRATEUR',
  'julien.boetti@allianz-nogaro.fr': 'ADMINISTRATEUR',
  'gwendal.clouet@allianz-nogaro.fr': 'CDC_COMMERCIAL',
  'emma@allianz-nogaro.fr': 'CDC_COMMERCIAL',
  'joelle.abikaram@allianz-nogaro.fr': 'CDC_COMMERCIAL',
  'astrid.ulrich@allianz-nogaro.fr': 'CDC_COMMERCIAL',
  'corentin.ulrich@allianz-nogaro.fr': 'CDC_COMMERCIAL',
  'donia.sahraoui@allianz-nogaro.fr': 'CDC_COMMERCIAL',
};
```

Pour ajouter ou modifier des rôles, éditez ce mapping.

## 📊 Résultat

Le script va :

1. ✅ Lister tous les utilisateurs Firebase Auth
2. ✅ Créer les documents correspondants dans Firestore
3. ✅ Assigner les rôles selon l'email
4. ✅ Afficher un résumé de la synchronisation

### Structure du document créé

Chaque document dans la collection `users` aura cette structure :

```json
{
  "id": "UID_FIREBASE",
  "email": "user@example.com",
  "role": "ADMINISTRATEUR" | "CDC_COMMERCIAL",
  "active": true,
  "createdAt": "2025-01-XX..."
}
```

## 🔄 Mise à jour

Le script est **idempotent** : vous pouvez l'exécuter plusieurs fois sans problème.

- Si le document n'existe pas → il sera créé
- Si le document existe déjà → il sera mis à jour avec les nouvelles données

## ⚠️ Important

- Le fichier `serviceAccountKey.json` contient des **credentials sensibles**
- **NE COMMITEZ JAMAIS** ce fichier dans Git
- Ajoutez-le à votre `.gitignore` :

```gitignore
serviceAccountKey.json
```

## 🐛 Dépannage

### Erreur : "Firebase not configured"

Vérifiez que vos variables d'environnement sont correctement configurées dans `.env.local` :

```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
...
```

### Erreur : "Permission denied"

Assurez-vous que la clé de service a les permissions nécessaires :
- Cloud Datastore User
- Firebase Admin

## 📝 Exemple de sortie

```
🔄 Initialisation de Firebase Admin...
✅ Firebase Admin initialisé

📋 Récupération de la liste des utilisateurs...
📊 8 utilisateur(s) trouvé(s)

📝 Création des documents dans Firestore...

✅ Créé: jeanmichel@allianz-nogaro.fr (ADMINISTRATEUR)
✅ Créé: julien.boetti@allianz-nogaro.fr (ADMINISTRATEUR)
✅ Créé: gwendal.clouet@allianz-nogaro.fr (CDC_COMMERCIAL)
...

==================================================
📊 Résumé:
   ✅ Créés: 8
   ✏️  Mis à jour: 0
   ⚠️  Ignorés: 0
==================================================

🎉 Synchronisation terminée avec succès !
```

## 🔐 Sécurité

Le script utilise Firebase Admin SDK qui a des permissions élevées. Assurez-vous de :

1. Ne pas exposer la clé de service
2. Limiter l'accès au script aux personnes autorisées
3. Ne pas exécuter ce script en production sans nécessité

## 📚 Ressources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firestore Data Structure](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
