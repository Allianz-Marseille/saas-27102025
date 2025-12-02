# Adapter Firebase Admin pour Vercel

## Pourquoi adapter ?

Les API Routes `/api/admin/users` utilisent actuellement un fichier JSON local pour Firebase Admin SDK :

```typescript
// ❌ Ne fonctionne pas sur Vercel
const serviceAccount = require("../../../../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json");
```

**Problème :** Ce fichier ne peut pas être commité sur GitHub pour des raisons de sécurité.

**Solution :** Utiliser des variables d'environnement.

---

## Étapes

### 1. Extraire les valeurs du fichier service account

Ouvrez `saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json` et copiez :

1. **`project_id`**
2. **`private_key`** (garde la structure avec `\n`)
3. **`client_email`**

### 2. Ajouter les variables dans Vercel

Dans Vercel → Your Project → Settings → Environment Variables, ajoutez :

```
FIREBASE_PROJECT_ID=votre_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=votre_client_email@your-project.iam.gserviceaccount.com
```

**Important pour FIREBASE_PRIVATE_KEY :**
- Gardez les guillemets
- Gardez les `\n` dans la clé
- Exemple complet : `"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANB...\n-----END PRIVATE KEY-----\n"`

### 3. Modifier app/api/admin/users/route.ts

Remplacez la section d'initialisation :

**AVANT :**
```typescript
import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialiser Firebase Admin si pas déjà fait
if (!admin.apps.length) {
  const serviceAccount = require("../../../../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
```

**APRÈS :**
```typescript
import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialiser Firebase Admin si pas déjà fait
if (!admin.apps.length) {
  // Utiliser des variables d'environnement
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
    throw new Error('Firebase Admin credentials are missing. Check environment variables.');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}
```

### 4. Option alternative : Base64 (plus simple)

Si les sauts de ligne posent problème, encodez tout le fichier JSON en base64 :

**En local, créez la variable :**
```bash
# Sur Mac/Linux :
cat saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json | base64

# Sur Windows (PowerShell) :
[Convert]::ToBase64String([IO.File]::ReadAllBytes("saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json"))
```

**Dans Vercel, ajoutez :**
```
FIREBASE_ADMIN_CONFIG_BASE64=[resultat_de_la_commande_base64]
```

**Dans le code :**
```typescript
if (!admin.apps.length) {
  const configBase64 = process.env.FIREBASE_ADMIN_CONFIG_BASE64;
  if (!configBase64) {
    throw new Error('FIREBASE_ADMIN_CONFIG_BASE64 is missing');
  }
  
  const serviceAccount = JSON.parse(
    Buffer.from(configBase64, 'base64').toString('utf-8')
  );
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
```

---

## Vérification

Après avoir modifié le code et ajouté les variables, vérifiez que :

1. Le build local fonctionne : `npm run build`
2. Les variables sont bien configurées dans Vercel Dashboard
3. Le déploiement se termine sans erreur
4. Les API Routes `/api/admin/users` fonctionnent sur Vercel

---

## Sécurité

✅ **À FAIRE :**
- Utiliser des variables d'environnement
- Ne jamais commiter le fichier JSON
- Changer les credentials si compromis

❌ **À NE JAMAIS FAIRE :**
- Commiter le fichier service account
- Partager les credentials par email
- Exposer les variables d'environnement dans le code frontend

---

## Dépannage

### Erreur : "Firebase Admin credentials are missing"

➡️ Vérifiez que les 3 variables d'environnement sont bien ajoutées dans Vercel

### Erreur : "Invalid private key"

➡️ Vérifiez que les `\n` dans FIREBASE_PRIVATE_KEY sont bien présents

### Erreur : "Permission denied"

➡️ Vérifiez que le compte de service Firebase a les bonnes permissions dans Firebase Console

