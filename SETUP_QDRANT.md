# Configuration Qdrant pour le système RAG

## Pourquoi Qdrant ?

Qdrant est une base de données vectorielle utilisée pour stocker et rechercher les embeddings des documents. C'est essentiel pour le système RAG (Retrieval Augmented Generation) qui permet au chatbot de répondre en se basant sur vos documents.

## Option 1 : Qdrant Cloud (Recommandé - Gratuit)

### Étapes de configuration :

1. **Créer un compte Qdrant Cloud**
   - Allez sur https://cloud.qdrant.io/
   - Cliquez sur "Sign Up" ou "Get Started"
   - Créez votre compte (gratuit)

2. **Créer un cluster**
   - Une fois connecté, cliquez sur "Create Cluster"
   - Choisissez le plan **Free** (1GB gratuit, largement suffisant pour commencer)
   - Sélectionnez la région la plus proche (Europe - eu-central recommandé)
   - Donnez un nom à votre cluster (ex: "allianz-rag")
   - Cliquez sur "Create"

3. **Récupérer les identifiants**
   - Une fois le cluster créé (quelques secondes), cliquez dessus
   - Vous verrez :
     - **Cluster URL** : quelque chose comme `https://xxxx-xxxx.eu-central.aws.cloud.qdrant.io:6333`
     - **API Key** : cliquez sur "API Keys" puis "Create API Key"
   - Copiez ces deux informations

4. **Configurer les variables d'environnement**
   - Ouvrez votre fichier `.env.local` à la racine du projet
   - Ajoutez ces lignes :

```bash
QDRANT_URL=https://votre-cluster.eu-central.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=votre-cle-api-qdrant
```

5. **Redémarrer le serveur**
   ```bash
   # Arrêtez le serveur (Ctrl+C)
   # Relancez
   npm run dev
   ```

## Option 2 : Qdrant Local (avec Docker)

Si vous préférez héberger Qdrant localement :

### Prérequis :
- Docker installé sur votre machine

### Commande :
```bash
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage:z \
  qdrant/qdrant
```

### Configuration :
```bash
# Dans .env.local
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=  # Peut être vide pour une instance locale sans auth
```

## Vérification

Une fois configuré, le système vérifie automatiquement la connexion au démarrage de l'upload. Si vous voyez encore une erreur :

1. Vérifiez que les variables sont bien dans `.env.local` (pas `.env`)
2. Vérifiez qu'il n'y a pas d'espaces autour des valeurs
3. Redémarrez complètement le serveur Next.js
4. Vérifiez que votre cluster Qdrant est bien actif (Status: Running)

## Limites du plan gratuit Qdrant Cloud

- **Stockage** : 1 GB (suffisant pour ~10 000 documents)
- **Requêtes** : Illimité
- **Collections** : Illimité
- **Pas de carte de crédit requise**

## Troubleshooting

### Erreur "Connection refused"
- Vérifiez que l'URL est correcte (avec le port :6333)
- Vérifiez que le cluster est bien actif sur Qdrant Cloud

### Erreur "Unauthorized"
- Vérifiez que la clé API est correcte
- Générez une nouvelle clé API si nécessaire

### Erreur "Cannot connect to Qdrant"
- Vérifiez votre connexion internet
- Vérifiez que le firewall n'bloque pas le port 6333

## Support

Pour plus d'informations :
- Documentation Qdrant : https://qdrant.tech/documentation/
- Documentation Qdrant Cloud : https://qdrant.tech/documentation/cloud/

