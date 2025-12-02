# 🚀 Déploiement Vercel - Guide Rapide

Ce guide vous permet de déployer votre application sur Vercel en **5 minutes**.

## 📋 Prérequis

✅ Votre code est sur GitHub  
✅ Vous avez un compte Firebase actif  
✅ Vous avez un compte Vercel (ou vous en créez un)

---

## 🎯 Étapes de déploiement

### 1. Préparer les variables d'environnement

Copiez ces valeurs depuis votre fichier `.env.local` ou votre projet Firebase.

**Dans Firebase Console :**
1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet `saas-27102025`
3. Allez dans **Project Settings** (⚙️)
4. Scroll jusqu'à **"Your apps"**
5. Copiez les valeurs de configuration

**Pour Firebase Admin (API Routes) :**
1. Allez dans **Project Settings** → **Service accounts**
2. Téléchargez le fichier service account (ou utilisez celui existant)
3. Extrayez ces 3 valeurs du JSON :
   - `project_id`
   - `private_key` (garde les `\n`)
   - `client_email`

---

### 2. Importer le projet sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Sign up"** ou **"Log in"**
3. **Connectez votre compte GitHub** (bouton GitHub)
4. Cliquez sur **"Add New..."** → **"Project"**
5. Trouvez et sélectionnez : `nonodu13009/saas-27102025`
6. Cliquez sur **"Import"**

---

### 3. Configurer les variables d'environnement

**AVANT de cliquer sur "Deploy" :**

1. Dans la section **"Environment Variables"**, ajoutez ces variables une par une :

#### Variables Firebase Client (pour le frontend) :

| Variable | Valeur à copier depuis `.env.local` |
|----------|-------------------------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Votre API Key Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Votre Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `saas-27102025` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `saas-27102025.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Votre Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Votre App ID |

#### Variables Firebase Admin (pour les API Routes) :

| Variable | Valeur à copier depuis le fichier JSON |
|----------|-----------------------------------------|
| `FIREBASE_PROJECT_ID` | `saas-27102025` |
| `FIREBASE_PRIVATE_KEY` | **Entière** la clé privée avec `\n` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@saas-27102025.iam.gserviceaccount.com` |

**Pour FIREBASE_PRIVATE_KEY :**
- Copiez TOUTE la clé : `"-----BEGIN PRIVATE KEY-----\nMIIE...-----END PRIVATE KEY-----\n"`
- Gardez les guillemets
- Gardez tous les `\n`

---

### 4. Déployer

1. Cliquez sur **"Deploy"**
2. Attendez 2-3 minutes
3. Votre site sera déployé ! 🎉

---

### 5. Autoriser le domaine dans Firebase

Une fois déployé, obtenez votre URL Vercel (ex: `votre-projet.vercel.app`)

1. Allez dans [Firebase Console](https://console.firebase.google.com)
2. **Authentication** → **Settings** → **Authorized domains**
3. Cliquez sur **"Add domain"**
4. Ajoutez : `votre-projet.vercel.app`
5. Sauvegardez

---

### 6. Tester

1. Ouvrez l'URL fournie par Vercel
2. Testez :
   - ✅ Page de login
   - ✅ Dashboard commercial
   - ✅ Dashboard admin (CRUD compagnies)
   - ✅ Gestion utilisateurs (si configuré)

---

## ✅ C'est tout !

Votre application est maintenant en ligne et se mettra à jour automatiquement à chaque push sur `main`.

---

## 🔧 Dépannage

### "Firebase not initialized"

➡️ Vérifiez que toutes les variables `NEXT_PUBLIC_FIREBASE_*` sont bien configurées

### Erreur lors du login

➡️ Vérifiez que le domaine Vercel est dans "Authorized domains" de Firebase

### Les API Routes admin ne fonctionnent pas

➡️ Vérifiez que les 3 variables `FIREBASE_*` sont configurées avec les bonnes valeurs

### Build failed

➡️ Vérifiez les logs de build dans Vercel Dashboard pour plus de détails

---

## 📚 Documentation complète

- `docs/VERCEL_DEPLOYMENT.md` - Guide détaillé
- `docs/VERCEL_FIREBASE_ADMIN.md` - Configuration Firebase Admin
- [Documentation Vercel](https://vercel.com/docs)

---

## 🎉 Avantages

- ✅ Déploiement automatique à chaque push
- ✅ Preview pour chaque Pull Request
- ✅ HTTPS gratuit
- ✅ CDN global
- ✅ Analytics intégrés

