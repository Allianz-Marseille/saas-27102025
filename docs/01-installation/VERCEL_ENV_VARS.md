# Variables d'Environnement pour Vercel

## 🔥 Variables Firebase Client (OBLIGATOIRES)

Ces variables sont nécessaires pour que Firebase fonctionne côté client (login, dashboard, etc.).

### Comment les récupérer :

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez le projet **`saas-27102025`**
3. Cliquez sur **Settings** (⚙️) → **Project settings**
4. Scroll jusqu'à **"Your apps"**
5. Si vous avez déjà une app web, cliquez dessus, sinon créez-en une
6. Copiez les valeurs de configuration

### Variables à ajouter dans Vercel :

| Variable | Où la trouver | Exemple de valeur |
|----------|---------------|-------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → App → API Key | `AIzaSyABCD...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings → App → Auth Domain | `saas-27102025.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings → General → Project ID | `saas-27102025` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings → App → Storage Bucket | `saas-27102025.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings → App → Sender ID | `123456789012` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console → Project Settings → App → App ID | `1:123456789012:web:abc123def456` |

---

## 🔒 Variables Firebase Admin (pour les API Routes)

Ces variables sont nécessaires pour les fonctionnalités admin (gestion utilisateurs).

### Variables :

| Variable | Valeur |
|----------|--------|
| `FIREBASE_PROJECT_ID` | `saas-27102025` |
| `FIREBASE_PRIVATE_KEY` | Copiez depuis le fichier JSON (voir ci-dessous) |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@saas-27102025.iam.gserviceaccount.com` |

### Pour FIREBASE_PRIVATE_KEY :

Ouvrez le fichier `saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json` et copiez TOUTE la valeur de `private_key` :

```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwCbVIvcrRSj6k\n...toute la clé complète...\n-----END PRIVATE KEY-----\n
```

⚠️ **Important :**
- Gardez tous les `\n` 
- Gardez les guillemets si Vercel en ajoute automatiquement

---

## 📝 Comment ajouter dans Vercel

### Option 1 : Via l'interface web

1. Allez sur [vercel.com](https://vercel.com)
2. Ouvrez votre projet `saas-27102025`
3. Cliquez sur **Settings** (en haut)
4. Cliquez sur **Environment Variables** (dans le menu de gauche)
5. Pour chaque variable :
   - Cliquez sur **"Add new"**
   - Entrez le **Key** (ex: `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - Entrez la **Value** (votre clé API, etc.)
   - Sélectionnez **Production**, **Preview**, et **Development** ✅
   - Cliquez sur **Save**

### Option 2 : Via Vercel CLI (fichier .env)

Créez un fichier `.env.production` :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=votre_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=saas-27102025.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=saas-27102025
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=saas-27102025.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=votre_app_id
FIREBASE_PROJECT_ID=saas-27102025
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@saas-27102025.iam.gserviceaccount.com
```

Puis dans Vercel Dashboard, importez ce fichier.

---

## ✅ Vérification

Après avoir ajouté toutes les variables :

1. **Redeploy** votre projet dans Vercel
2. Ouvrez votre URL Vercel
3. Ouvrez la console du navigateur (F12)
4. L'erreur "Firebase not initialized" ne devrait plus apparaître

---

## 🆘 Dépannage

### Erreur persiste : "Firebase not initialized"

**Cause :** Les variables `NEXT_PUBLIC_*` ne sont pas correctement configurées.

**Solution :**
1. Vérifiez que les variables commencent bien par `NEXT_PUBLIC_`
2. Vérifiez qu'elles sont bien sélectionnées pour **Production**
3. **Redeploy** le projet (les changements de variables nécessitent un nouveau déploiement)

### Les API Routes admin ne fonctionnent pas

**Cause :** Les variables `FIREBASE_*` ne sont pas configurées.

**Solution :**
1. Vérifiez que `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, et `FIREBASE_CLIENT_EMAIL` sont bien ajoutées
2. Vérifiez que la clé privée contient tous les `\n`
3. **Redeploy** le projet

### Comment forcer un redeploy ?

1. Dans Vercel Dashboard → Deployments
2. Cliquez sur les 3 points (...) du dernier déploiement
3. Cliquez sur **"Redeploy"**

Ou simplement faire un petit changement et push sur GitHub déclenchera un nouveau déploiement.

