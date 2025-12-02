# Guide de Déploiement sur Vercel

Ce guide explique comment déployer votre application Next.js 16 (App Router) sur Vercel - **le meilleur choix pour Next.js**.

## 🚀 Pourquoi Vercel ?

- ✅ Créé par les créateurs de Next.js
- ✅ Support natif de Next.js App Router
- ✅ API Routes fonctionnent directement avec Firebase Admin SDK
- ✅ Configuration minimale
- ✅ Meilleures performances
- ✅ Déploiements automatiques depuis GitHub

---

## 📋 Étape 1 : Créer un compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Sign up"** (ou connectez-vous)
3. **Connectez votre compte GitHub** (recommandé)

---

## 📋 Étape 2 : Importer votre projet

1. Dans Vercel Dashboard, cliquez sur **"Add New..."** → **"Project"**
2. Trouvez votre repository : `nonodu13009/saas-27102025`
3. Cliquez sur **"Import"**

---

## 📋 Étape 3 : Configurer le projet

Vercel détecte automatiquement Next.js. Vérifiez :

**Build Settings :**
- Framework Preset : `Next.js` (auto-détecté)
- Build Command : `npm run build` (auto-détecté)
- Output Directory : `.next` (auto-détecté)
- Install Command : `npm install` (auto-détecté)

→ **Ne changez rien, c'est déjà bon !**

---

## 📋 Étape 4 : Configurer les variables d'environnement

**AVANT de cliquer sur "Deploy", cliquez sur "Environment Variables"**

Ajoutez toutes ces variables (copiez depuis votre `.env.local`) :

```
NEXT_PUBLIC_FIREBASE_API_KEY=votre_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=votre_app_id
```

**Important :** Pour les API Routes Admin, ajoutez aussi (voir section ci-dessous) :

```
FIREBASE_PROJECT_ID=votre_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=votre_client_email@your-project.iam.gserviceaccount.com
```

---

## 📋 Étape 5 : Adapter les API Routes pour Vercel

**IMPORTANT :** Les API Routes `/api/admin/users` utilisent Firebase Admin SDK avec un fichier JSON local qui ne peut pas être commité sur GitHub.

### Solution : Utiliser des variables d'environnement

Je vais modifier `app/api/admin/users/route.ts` pour utiliser des variables d'environnement au lieu du fichier JSON. Voir le guide `VERCEL_FIREBASE_ADMIN.md`.

---

## 📋 Étape 6 : Déployer

1. Cliquez sur **"Deploy"**
2. Attendez 2-3 minutes
3. Votre site sera déployé sur une URL comme : `https://votre-projet.vercel.app`

---

## 📋 Étape 7 : Vérifier le déploiement

1. Cliquez sur l'URL fournie par Vercel
2. Testez les fonctionnalités :
   - ✅ Page de login
   - ✅ Dashboard commercial
   - ✅ Dashboard admin
   - ✅ API Routes

---

## 🔄 Déploiements automatiques

Vercel configure automatiquement :
- ✅ **Production** : chaque push sur `main` → déploie automatiquement
- ✅ **Preview** : chaque Pull Request → crée un déploiement preview
- ✅ **Rollback** : retour en arrière en un clic

---

## 🔧 Configuration Firebase Auth pour Vercel

Après le déploiement, ajoutez le domaine Vercel dans Firebase :

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Authentication → Settings → Authorized domains
3. Ajoutez votre domaine Vercel : `votre-projet.vercel.app`

---

## 📝 Checklist finale

- [ ] Tous les fichiers sont commités et pushés sur GitHub
- [ ] Toutes les variables d'environnement sont configurées dans Vercel
- [ ] Le build local fonctionne (`npm run build`)
- [ ] Les API Routes admin sont adaptées (voir guide)
- [ ] Le domaine Firebase Auth autorise le domaine Vercel

---

## 🎉 Avantages de Vercel pour ce projet

1. **Support natif Next.js** : Pas besoin de fichier de configuration spécial
2. **API Routes** : Fonctionnent sans adaptation (avec les variables d'env)
3. **Edge Functions** : Accessibles si besoin pour optimiser les performances
4. **Analytics** : Intégré dans le dashboard
5. **Monitoring** : Logs en temps réel
6. **HTTPS** : Automatique et gratuit
7. **CDN global** : Meilleure vitesse pour vos utilisateurs

---

## 🔐 Sécurité

**Important :** Ne commitez JAMAIS :
- Le fichier `saas-27102025-firebase-adminsdk-*.json`
- Les fichiers `.env.local` avec les vraies clés

Utilisez uniquement les variables d'environnement dans Vercel Dashboard.

---

## 📚 Documentation

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://nextjs.org/docs/deployment#vercel-recommended)
- [Environment Variables on Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 🆘 Dépannage

### Erreur : "Module not found"

➡️ Vérifiez que `package-lock.json` est commité sur GitHub

### Erreur : Variables d'environnement manquantes

➡️ Vérifiez que toutes les variables `NEXT_PUBLIC_*` sont configurées dans Vercel

### Erreur : API Routes ne fonctionnent pas

➡️ Vérifiez que Firebase Admin est configuré avec des variables d'environnement

### Erreur lors du login Firebase

➡️ Vérifiez que le domaine Vercel est autorisé dans Firebase Auth

---

## 🚀 Prochaines étapes

1. Déployer sur Vercel
2. Configurer un domaine personnalisé (optionnel)
3. Activer les analytics (optionnel)
4. Configurer les notifications de déploiement

