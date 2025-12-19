# Guide de déploiement Vercel

Ce document décrit la configuration nécessaire pour déployer l'application sur Vercel.

## Variables d'environnement requises

### Variables requises pour l'assistant IA

- **`OPENAI_API_KEY`** (requis) : Clé API OpenAI pour les fonctionnalités de chat et RAG
  - Utilisée dans :
    - `app/api/assistant/chat/route.ts`
    - `app/api/assistant/rag/route.ts`
    - `lib/assistant/embeddings.ts`
    - `lib/assistant/history-truncation.ts`
  - Format : `sk-...` (clé API OpenAI)
  - Environnements : Production, Preview, Development
  - Où l'obtenir : [OpenAI API Keys](https://platform.openai.com/api-keys)

### Variables Firebase (côté client - NEXT_PUBLIC_*)

Ces variables sont exposées côté client et doivent être publiques :

- **`NEXT_PUBLIC_FIREBASE_API_KEY`** : Clé API Firebase
- **`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`** : Domaine d'authentification Firebase (format : `project-id.firebaseapp.com`)
- **`NEXT_PUBLIC_FIREBASE_PROJECT_ID`** : ID du projet Firebase
- **`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`** : Bucket de stockage Firebase (format : `project-id.appspot.com`)
- **`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`** : ID de l'expéditeur de messages
- **`NEXT_PUBLIC_FIREBASE_APP_ID`** : ID de l'application Firebase

Où les trouver : Firebase Console > Project Settings > General > Your apps

### Variables Firebase Admin (côté serveur)

Ces variables sont secrètes et utilisées uniquement côté serveur :

- **`FIREBASE_PROJECT_ID`** : ID du projet Firebase (pour Admin SDK)
- **`FIREBASE_PRIVATE_KEY`** : Clé privée du compte de service Firebase
  - Format : Clé privée complète avec les sauts de ligne (`\n`)
  - Vercel gère automatiquement les `\n`, copiez la clé telle quelle
- **`FIREBASE_CLIENT_EMAIL`** : Email du compte de service Firebase (format : `firebase-adminsdk-xxxxx@project-id.iam.gserviceaccount.com`)

Où les trouver :
1. Firebase Console > Project Settings > Service Accounts
2. Cliquer sur "Generate new private key"
3. Télécharger le fichier JSON
4. Extraire les valeurs :
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### Variables optionnelles

- **`PAPPERS_API_KEY`** : Clé API Pappers (pour recherche d'entreprises)
  - Utilisée dans : `app/api/pappers/*`
  - Où l'obtenir : [Pappers API](https://www.pappers.fr/api)

- **`SOCIETE_API_KEY`** : Clé API Societe.com (pour recherche d'entreprises)
  - Utilisée dans : `app/api/societe/*`
  - Où l'obtenir : [Societe.com API](https://www.societe.com/)

- **`CRON_SECRET`** : Secret pour sécuriser les routes cron
  - Utilisée dans : `app/api/cron/*`
  - Format : Chaîne aléatoire sécurisée (recommandé : 32+ caractères)

- **`NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN`** : Domaine email autorisé pour l'authentification
  - Défaut : `@allianz-nogaro.fr`
  - Utilisée dans : `lib/config/auth-config.ts`

## Configuration dans Vercel

### Étapes de configuration

1. **Accéder aux variables d'environnement**
   - Aller dans Vercel Dashboard
   - Sélectionner votre projet
   - Aller dans **Settings** > **Environment Variables**

2. **Ajouter les variables**
   - Pour chaque variable, cliquer sur **Add New**
   - Entrer le nom de la variable (exact, respecter la casse)
   - Entrer la valeur
   - Sélectionner les environnements :
     - **Production** : Variables pour la production
     - **Preview** : Variables pour les preview deployments (branches)
     - **Development** : Variables pour le développement local (optionnel)

3. **Variables importantes**
   - `OPENAI_API_KEY` : **OBLIGATOIRE** pour que l'assistant IA fonctionne
   - `FIREBASE_PRIVATE_KEY` : Copier la clé complète avec les sauts de ligne (Vercel les gère automatiquement)
   - Toutes les variables `NEXT_PUBLIC_*` : Doivent être configurées pour que Firebase fonctionne côté client

4. **Redéployer**
   - Après avoir ajouté/modifié des variables, redéployer l'application
   - Les nouvelles variables seront disponibles au prochain déploiement

### Vérification

Pour vérifier que les variables sont bien configurées :

1. Aller dans **Deployments**
2. Cliquer sur le dernier déploiement
3. Vérifier les logs de build
4. Si `OPENAI_API_KEY` est manquante, vous verrez une erreur dans les logs

## Notes importantes

### Sécurité

- **Variables `NEXT_PUBLIC_*`** : Ces variables sont exposées côté client et peuvent être vues dans le code JavaScript compilé. Ne pas y mettre de secrets.
- **Variables sans préfixe** : Ces variables sont uniquement côté serveur et restent secrètes. Ne jamais les exposer côté client.

### Environnements

- **Production** : Variables pour `vercel.com` (domaine principal)
- **Preview** : Variables pour les déploiements de branches (pull requests, etc.)
- **Development** : Variables pour `vercel dev` (développement local)

### Dépannage

Si l'assistant IA ne fonctionne pas après le déploiement :

1. Vérifier que `OPENAI_API_KEY` est bien configurée dans Vercel
2. Vérifier que la clé est valide (format `sk-...`)
3. Vérifier les logs de déploiement pour les erreurs
4. Redéployer après avoir corrigé les variables

## Exemple de configuration minimale

Pour un déploiement fonctionnel minimal, configurez au minimum :

```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
```

