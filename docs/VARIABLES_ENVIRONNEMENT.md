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
2. Accéder aux paramètres de l'assistant "saas-allianz"
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

## Vérification en production (Vercel)

### Vérifier PINECONE_API_KEY dans le dashboard Vercel

1. Se connecter au [Dashboard Vercel](https://vercel.com/dashboard)
2. Sélectionner le projet
3. Aller dans **Settings** → **Environment Variables**
4. Chercher `PINECONE_API_KEY` dans la liste
5. Vérifier que :
   - La variable est présente
   - Elle est définie pour l'environnement approprié (Production, Preview, Development)
   - Le format est correct : doit commencer par `pcsk_`

**Important** : Ne jamais copier/coller la valeur complète de la clé dans des captures d'écran ou des logs. Vérifier uniquement :
- La longueur (environ 40-60 caractères)
- Le préfixe (`pcsk_`)
- Les 4 derniers caractères pour validation

### Vérifier la valeur sans l'exposer

Dans Vercel, vous pouvez :
- Voir la longueur de la clé (nombre de caractères)
- Voir les 4 premiers caractères (`pcsk_`)
- Voir les 4 derniers caractères (pour validation)

Si vous devez vérifier que la clé correspond à celle configurée dans Pinecone :
1. Dans le dashboard Pinecone, voir les 4 derniers caractères de la clé
2. Comparer avec ceux affichés dans Vercel (masqués par défaut)

### Procédure pour regénérer la clé si nécessaire

Si la clé a été exposée ou compromise :

1. **Dans Pinecone** :
   - Aller dans les paramètres de l'assistant "saas-allianz"
   - Révoquer l'ancienne clé
   - Générer une nouvelle clé API
   - Copier la nouvelle clé (format `pcsk_...`)

2. **Dans Vercel** :
   - Aller dans **Settings** → **Environment Variables**
   - Éditer `PINECONE_API_KEY`
   - Remplacer par la nouvelle clé
   - Sauvegarder

3. **Redéployer l'application** :
   - Aller dans **Deployments**
   - Cliquer sur les **3 points** (⋯) du dernier déploiement
   - Sélectionner **Redeploy**
   - Ou faire un nouveau commit

### Tester via l'endpoint de diagnostic

Un endpoint de diagnostic est disponible pour les administrateurs :

**GET** `/api/admin/pinecone-health`

Cet endpoint :
- Vérifie la présence de `PINECONE_API_KEY`
- Valide le format de la clé
- Teste une requête ping vers Pinecone
- Identifie le format accepté par l'API
- Retourne les temps de réponse

**Utilisation** :
```bash
# Récupérer le token d'authentification depuis le frontend
# Puis faire une requête :
curl -X GET "https://votre-domaine.vercel.app/api/admin/pinecone-health" \
  -H "Authorization: Bearer <token_admin>"
```

**POST** `/api/admin/pinecone-health`

Permet de tester manuellement avec des paramètres personnalisés :

```bash
curl -X POST "https://votre-domaine.vercel.app/api/admin/pinecone-health" \
  -H "Authorization: Bearer <token_admin>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "test",
    "category": "auto",
    "theme": "retail",
    "format": "message"
  }'
```

**Formats disponibles** : `message`, `query`, `input`, `prompt`, `text`, `message_with_params`

### Tester en local avec le script de test

Un script de test est disponible pour tester l'endpoint Pinecone en local :

```bash
npm run test-pinecone
```

Ce script :
- Lit `PINECONE_API_KEY` depuis `.env.local`
- Teste différents formats de requête
- Affiche les résultats détaillés
- Génère des commandes cURL prêtes à utiliser
- Teste avec et sans contexte (category/theme)

**Prérequis** :
- `.env.local` doit contenir `PINECONE_API_KEY`
- Le script doit être exécuté depuis la racine du projet

### Vérifier les logs en production

Si l'assistant IA rencontre des erreurs :

1. **Dans Vercel** :
   - Aller dans **Deployments**
   - Sélectionner un déploiement
   - Cliquer sur **View Function Logs**
   - Rechercher les logs contenant "Pinecone" ou "Tous les formats de requête ont échoué"

2. **Logs à vérifier** :
   - Status HTTP de l'erreur (400, 401, 403, 500, etc.)
   - `errorText` complet (pas limité à 500 caractères)
   - `errorJson` avec tous les champs
   - Formats testés et l'ordre
   - URL utilisée
   - Timestamp de l'erreur

3. **Format accepté** :
   - Les logs indiquent quel format a fonctionné (si un format fonctionne)
   - Si tous les formats échouent, vérifier :
     - Que `PINECONE_API_KEY` est valide
     - Que l'URL `PINECONE_API_URL` est correcte
     - Que la clé n'est pas expirée
     - Que l'endpoint Pinecone est accessible depuis Vercel

### Checklist de vérification post-déploiement

Après avoir déployé ou modifié les variables d'environnement :

- [ ] `PINECONE_API_KEY` est définie dans Vercel (Production)
- [ ] La clé correspond à une clé valide (format `pcsk_...`)
- [ ] La clé n'est pas expirée (vérifier dans Pinecone)
- [ ] L'URL `PINECONE_API_URL` correspond à `https://prod-1-data.ke.pinecone.io/mcp/assistants/saas-allianz`
- [ ] L'application a été redéployée après modification des variables
- [ ] L'endpoint `/api/admin/pinecone-health` retourne `"status": "healthy"`
- [ ] Les logs Vercel ne montrent pas d'erreurs d'authentification (401, 403)
- [ ] Les logs Vercel montrent un format accepté par Pinecone (si des requêtes ont été faites)

