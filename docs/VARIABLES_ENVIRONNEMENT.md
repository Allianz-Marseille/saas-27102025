# Variables d'environnement

Ce document liste **uniquement** les variables d'environnement nécessaires au fonctionnement de l'application.

## Variables requises

### Firebase (côté serveur)

Ces variables sont nécessaires pour Firebase Admin SDK (opérations serveur) :

- `FIREBASE_PROJECT_ID` - ID du projet Firebase
- `FIREBASE_PRIVATE_KEY` - Clé privée du compte de service Firebase
- `FIREBASE_CLIENT_EMAIL` - Email du compte de service Firebase

### Firebase (côté client)

Ces variables sont nécessaires pour l'initialisation Firebase côté client :

- `NEXT_PUBLIC_FIREBASE_API_KEY` - Clé API Firebase
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Domaine d'authentification Firebase
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - ID du projet Firebase (public)
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Bucket de stockage Firebase
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - ID de l'expéditeur de messages
- `NEXT_PUBLIC_FIREBASE_APP_ID` - ID de l'application Firebase

### Assistant IA

- `PINECONE_API_KEY` - Clé API pour l'assistant IA utilisant Pinecone

**Où l'obtenir** :
1. Se connecter à votre compte Pinecone
2. Accéder aux paramètres de l'assistant "commercial-quadri"
3. Récupérer la clé API

## Variables optionnelles

### Cron Jobs

- `CRON_SECRET` - Secret pour sécuriser les endpoints de cron (si utilisés)

## Variables à supprimer (non utilisées)

Si vous avez supprimé le RAG de votre application, vous pouvez supprimer ces variables qui ne sont **plus utilisées** :

- ❌ `GOOGLE_PRIVATE_KEY`
- ❌ `GOOGLE_CLIENT_CERT_URL`
- ❌ `GOOGLE_CLIENT_ID`
- ❌ `GOOGLE_CLIENT_EMAIL` (sauf si différent de FIREBASE_CLIENT_EMAIL)
- ❌ `GOOGLE_PRIVATE_KEY_ID`
- ❌ `GOOGLE_DOCUMENT_AI_LOCATION`
- ❌ `GOOGLE_DOCUMENT_AI_PROCESSOR_ID`
- ❌ `GOOGLE_CLOUD_PROJECT`
- ❌ `QDRANT_API_KEY`
- ❌ `QDRANT_URL`
- ❌ `OPENAI_API_KEY`

## Configuration dans Vercel

1. Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet
3. Aller dans **Settings** → **Environment Variables**
4. Vérifier que seules les variables listées ci-dessus sont présentes
5. Supprimer les variables non utilisées (Google Cloud, Qdrant, OpenAI)

**Important** : Après avoir ajouté/modifié/supprimé une variable d'environnement dans Vercel, il faut **redéployer** l'application pour que les changements prennent effet.

## Redéploiement après modification

Pour appliquer les changements :

1. Dans Vercel Dashboard, aller dans **Deployments**
2. Cliquer sur les **3 points** (⋯) du dernier déploiement
3. Sélectionner **Redeploy**
4. Ou simplement faire un nouveau commit qui déclenchera un nouveau déploiement

## Vérification

Pour vérifier que les variables sont bien configurées :

1. Dans Vercel, aller dans **Settings** → **Environment Variables**
2. Vérifier que toutes les variables requises sont présentes
3. Tester l'application :
   - Authentification Firebase
   - Assistant IA
   - Fonctionnalités principales

Si l'assistant affiche une erreur de configuration, vérifiez :
- Que `PINECONE_API_KEY` est bien définie dans Vercel
- Que vous avez redéployé après l'ajout de la variable
- Que la clé API est valide et active

