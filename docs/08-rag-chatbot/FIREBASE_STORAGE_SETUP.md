# Configuration Firebase Storage pour RAG Chatbot

## 📋 Étapes pour activer Firebase Storage

### 1. Activer Storage dans Firebase Console

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet **`saas-27102025`**
3. Dans le menu de gauche, cliquez sur **"Storage"**
4. Si Storage n'est pas encore activé, cliquez sur **"Premiers pas"** (Get started)
5. Choisissez le mode de sécurité :
   - **Mode test** (pour développement) : règles permissives
   - **Mode production** : règles strictes (recommandé)
6. Sélectionnez l'emplacement du bucket (ex: `europe-west1`)
7. Cliquez sur **"Terminé"**

### 2. Récupérer le nom du bucket

Une fois Storage activé :

1. Dans Firebase Console → **Storage**
2. En haut de la page, vous verrez le nom du bucket
3. Format attendu : `saas-27102025.firebasestorage.app` ou `saas-27102025.appspot.com`
4. **Copiez ce nom exactement**

### 3. Configurer la variable d'environnement dans Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez ou modifiez :
   - **Key** : `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - **Value** : Le nom du bucket (ex: `saas-27102025.firebasestorage.app`)
   - **Environments** : Production, Preview, Development
5. Cliquez sur **"Save"**

### 4. Vérifier les permissions du Service Account

Le service account Firebase Admin doit avoir les permissions pour accéder à Storage :

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez le projet **`saas-27102025`**
3. Allez dans **IAM & Admin** → **Service Accounts**
4. Trouvez le service account : `firebase-adminsdk-fbsvc@saas-27102025.iam.gserviceaccount.com`
5. Vérifiez qu'il a au moins un de ces rôles :
   - **Storage Admin** (recommandé)
   - **Storage Object Admin**
   - **Storage Object Creator** + **Storage Object Viewer**

Si les permissions manquent :
1. Cliquez sur le service account
2. Cliquez sur **"GRANT ACCESS"** ou **"ADD PRINCIPAL"**
3. Ajoutez le rôle **"Storage Admin"**
4. Cliquez sur **"Save"**

### 5. Configurer les règles de sécurité Storage (optionnel)

Dans Firebase Console → Storage → Rules :

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Dossier rag-documents : accessible en lecture pour tous, écriture pour admins uniquement
    match /rag-documents/{documentId} {
      // Lecture publique (pour les URLs publiques)
      allow read: if true;
      
      // Écriture : uniquement pour les utilisateurs authentifiés avec rôle admin
      allow write: if request.auth != null 
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMINISTRATEUR';
    }
    
    // Dossier chat-images : accessible en lecture pour tous, écriture pour utilisateurs authentifiés
    match /chat-images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Tout le reste : refusé par défaut
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 6. Tester la configuration

1. Redéployez votre application sur Vercel (ou attendez le prochain commit)
2. Allez sur `/admin/outils/chatbot`
3. Essayez d'uploader un PDF
4. Vérifiez dans Firebase Console → Storage que le fichier apparaît dans `rag-documents/`

## 🔍 Vérification

### Vérifier que le bucket existe

Dans Firebase Console → Storage, vous devriez voir :
- Le bucket listé
- La possibilité de créer des fichiers
- Les statistiques d'utilisation

### Vérifier les logs Vercel

Si l'upload échoue, consultez les logs Vercel :
1. Allez sur Vercel → Votre projet → **Logs**
2. Cherchez les logs `[Upload]` pour voir l'étape exacte qui échoue
3. Les messages d'erreur indiqueront le problème :
   - "Bucket n'existe pas" → Vérifiez le nom du bucket
   - "Permissions insuffisantes" → Vérifiez les permissions du service account
   - "Configuration manquante" → Vérifiez la variable d'environnement

## ⚠️ Problèmes courants

### Erreur : "Bucket n'existe pas"
- Vérifiez que Storage est bien activé dans Firebase Console
- Vérifiez que le nom du bucket dans la variable d'environnement correspond exactement

### Erreur : "Permissions insuffisantes"
- Vérifiez que le service account a le rôle "Storage Admin"
- Attendez quelques minutes après avoir modifié les permissions (propagation)

### Erreur : "Configuration manquante"
- Vérifiez que `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` est bien définie dans Vercel
- Redéployez l'application après avoir ajouté la variable

## 📝 Notes

- Le bucket est créé automatiquement lors de l'activation de Storage
- Le nom du bucket est généralement : `[project-id].firebasestorage.app` ou `[project-id].appspot.com`
- Les fichiers sont stockés dans le dossier `rag-documents/` dans le bucket
- Les images du chat sont stockées dans `chat-images/`

