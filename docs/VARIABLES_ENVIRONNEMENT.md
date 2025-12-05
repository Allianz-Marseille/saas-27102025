# Variables d'environnement

Ce document liste toutes les variables d'environnement nécessaires au fonctionnement de l'application.

## Configuration requise

### Variables Firebase (déjà configurées)

Ces variables sont nécessaires pour l'authentification et la base de données :

- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

### Variables Assistant IA

#### `PINECONE_API_KEY` (requis)

**Description** : Clé API pour l'assistant IA utilisant Pinecone.

**Où l'obtenir** :
1. Se connecter à votre compte Pinecone
2. Accéder aux paramètres de l'assistant "commercial-quadri"
3. Récupérer la clé API

**Configuration dans Vercel** :

1. Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet
3. Aller dans **Settings** → **Environment Variables**
4. Ajouter une nouvelle variable :
   - **Name** : `PINECONE_API_KEY`
   - **Value** : Votre clé API Pinecone
   - **Environments** : Cocher **Production**, **Preview**, et **Development** selon vos besoins
5. Cliquer sur **Save**

**Important** : Après avoir ajouté/modifié une variable d'environnement dans Vercel, il faut **redéployer** l'application pour que les changements prennent effet.

### Redéploiement après modification

Pour appliquer les nouvelles variables d'environnement :

1. Dans Vercel Dashboard, aller dans **Deployments**
2. Cliquer sur les **3 points** (⋯) du dernier déploiement
3. Sélectionner **Redeploy**
4. Ou simplement faire un nouveau commit qui déclenchera un nouveau déploiement

## Variables optionnelles

### Google Cloud (pour fonctionnalités futures)

Si vous souhaitez utiliser les fonctionnalités de traitement de documents :

- `GOOGLE_APPLICATION_CREDENTIALS_BASE64`
- `GOOGLE_CLOUD_PROJECT_ID`

## Vérification

Pour vérifier que les variables sont bien configurées :

1. Dans Vercel, aller dans **Settings** → **Environment Variables**
2. Vérifier que `PINECONE_API_KEY` est présente
3. Tester l'assistant IA dans l'application

Si l'assistant affiche une erreur de configuration, vérifiez :
- Que la variable est bien définie dans Vercel
- Que vous avez redéployé après l'ajout de la variable
- Que la clé API est valide et active

