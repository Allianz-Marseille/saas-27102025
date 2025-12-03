# Configuration complète du système RAG - Guide pas à pas

## Vue d'ensemble

Le système RAG (Retrieval Augmented Generation) permet au chatbot de répondre aux questions en se basant sur vos documents (PDFs et images). Il utilise :

- **Qdrant** : Base de données vectorielle pour stocker les embeddings
- **OpenAI** : Génération d'embeddings et réponses du chatbot
- **Firebase Storage** : Stockage des fichiers PDF et images
- **pdfjs-dist** : Extraction de texte des PDFs
- **Tesseract.js** : OCR pour extraire le texte des images

## ⚠️ CHECKLIST AVANT DE COMMENCER

Avant de coder ou déployer, assurez-vous que **TOUS** ces points sont validés :

### Services externes à configurer

- [ ] Compte Qdrant Cloud créé
- [ ] Cluster Qdrant créé et actif (HEALTHY)
- [ ] Clé API Qdrant générée
- [ ] Compte OpenAI créé
- [ ] Clé API OpenAI générée et crédits disponibles
- [ ] Firebase Storage configuré avec bucket créé
- [ ] Toutes les variables d'environnement ajoutées en local (.env.local)
- [ ] Toutes les variables d'environnement ajoutées sur Vercel

## Configuration détaillée

### 1. Qdrant Cloud (Base vectorielle)

#### Pourquoi Qdrant ?
Stocke les embeddings vectoriels de vos documents pour permettre la recherche sémantique.

#### Étapes de configuration

**a) Créer un compte**
1. Allez sur https://cloud.qdrant.io/
2. Cliquez sur "Sign Up" ou "Get Started"
3. Créez votre compte (gratuit, aucune carte bancaire requise)

**b) Créer un cluster**
1. Une fois connecté, cliquez sur "Create Cluster"
2. Choisissez le plan **Free** (1GB inclus - suffisant pour ~10 000 documents)
3. Sélectionnez la région :
   - Pour l'Europe : `europe-west3` (recommandé)
   - Pour la France : choisir la région la plus proche
4. Donnez un nom à votre cluster (ex: "allianz-rag")
5. Cliquez sur "Create"
6. Attendez que le statut devienne **HEALTHY** (30-60 secondes)

**c) Récupérer les identifiants**

**URL du cluster :**
- Cliquez sur le nom de votre cluster
- Copiez le champ "Endpoint" ou "Cluster URL"
- **IMPORTANT** : Ajoutez `:6333` à la fin si ce n'est pas déjà présent
- Format attendu : `https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.europe-west3-gcp.cloud.qdrant.io:6333`

**Clé API :**
- Dans la page du cluster, allez dans l'onglet "API Keys"
- Cliquez sur "Create API Key" (ou utilisez celle auto-générée)
- Donnez un nom (ex: "allianz-app")
- **Copiez la clé immédiatement** (vous ne pourrez la voir qu'une seule fois)
- Format : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...`

### 2. OpenAI (Embeddings et Chat)

#### Pourquoi OpenAI ?
- Génère les embeddings vectoriels des textes
- Fournit le modèle de langage pour les réponses du chatbot

#### Étapes de configuration

**a) Créer un compte**
1. Allez sur https://platform.openai.com/
2. Créez un compte ou connectez-vous

**b) Ajouter des crédits**
1. Allez dans "Billing" → "Payment methods"
2. Ajoutez une carte de crédit
3. Ajoutez des crédits (minimum 5$, recommandé 20$ pour commencer)

**c) Générer une clé API**
1. Allez dans "API Keys" (https://platform.openai.com/api-keys)
2. Cliquez sur "Create new secret key"
3. Donnez un nom (ex: "allianz-rag")
4. **Copiez la clé immédiatement**
5. Format : `sk-proj-...` ou `sk-...`

**d) Vérifier les modèles disponibles**
- Modèle d'embeddings utilisé : `text-embedding-3-small` (0.02$ / 1M tokens)
- Modèle de chat utilisé : `gpt-4o` (~5$ / 1M tokens input)

### 3. Firebase Storage

#### Configuration du bucket

**a) Créer le bucket (si pas déjà fait)**
1. Allez dans la console Firebase : https://console.firebase.google.com/
2. Sélectionnez votre projet
3. Allez dans "Storage" dans le menu de gauche
4. Cliquez sur "Get Started" si ce n'est pas configuré
5. Choisissez la localisation (europe-west pour l'Europe)
6. Le bucket sera créé automatiquement

**b) Récupérer le nom du bucket**
- Format : `nom-projet.appspot.com`
- Visible dans l'onglet "Files" du Storage

**c) Configurer les règles de sécurité (optionnel)**
- Par défaut, seuls les utilisateurs authentifiés peuvent lire/écrire
- Pour le RAG, les admins doivent avoir accès en écriture

## Configuration des variables d'environnement

### Fichier `.env.local` (développement local)

Créez ou modifiez le fichier `.env.local` à la racine du projet :

```bash
# ============================================
# QDRANT CLOUD - Base vectorielle
# ============================================
QDRANT_URL=https://votre-cluster-id.europe-west3-gcp.cloud.qdrant.io:6333
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...

# ============================================
# OPENAI - Embeddings et Chat
# ============================================
OPENAI_API_KEY=sk-proj-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o

# ============================================
# FIREBASE - Stockage et authentification
# ============================================
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin SDK (fichier JSON en base64 ou chemin)
FIREBASE_SERVICE_ACCOUNT_KEY=...
```

### Vercel (production)

**Ajoutez toutes ces variables sur Vercel** :

1. Allez sur https://vercel.com/
2. Sélectionnez votre projet
3. **Settings** → **Environment Variables**
4. Ajoutez chaque variable **une par une** :

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `QDRANT_URL` | `https://....:6333` | Production, Preview, Development |
| `QDRANT_API_KEY` | `eyJhbGci...` | Production, Preview, Development |
| `OPENAI_API_KEY` | `sk-proj-...` | Production, Preview, Development |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | Production, Preview, Development |
| `OPENAI_CHAT_MODEL` | `gpt-4o` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `projet.appspot.com` | Production, Preview, Development |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | (JSON en base64) | Production, Preview, Development |
| Autres variables Firebase... | ... | Production, Preview, Development |

**Important :** Après ajout des variables, Vercel redéploiera automatiquement.

## Validation de la configuration

### Étape 1 : Test en local

```bash
# Installer les dépendances
npm install

# Lancer le script de test
npm run test:rag
```

**Résultat attendu :**
```
✅ Succès: 10
❌ Erreurs: 0
⚠️  Avertissements: 0
🎉 Tous les tests sont passés ! Le système RAG est opérationnel.
```

**Si des erreurs apparaissent :**
- Vérifiez les variables dans `.env.local`
- Vérifiez que les services externes sont actifs (Qdrant HEALTHY, OpenAI avec crédits)
- Consultez les détails des erreurs affichées

### Étape 2 : Test de l'upload local

```bash
# Démarrer le serveur de développement
npm run dev
```

1. Connectez-vous en tant qu'admin
2. Allez dans **Outils** → **Gestion Chatbot**
3. Cliquez sur **"Importer des documents"**
4. Uploadez un petit PDF de test (< 1MB)
5. Vérifiez que l'upload se termine avec succès

### Étape 3 : Test en production

1. **Vérifiez les variables Vercel** (Settings → Environment Variables)
2. **Attendez le déploiement** (Deployments → dernier déploiement "Ready")
3. **Testez l'upload** sur le site en production

## Dépannage (Troubleshooting)

### Erreur : "Configuration système invalide"

**Cause :** Variables d'environnement manquantes

**Solution :**
1. Vérifiez que TOUTES les variables sont dans `.env.local` (local) ou Vercel (prod)
2. Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs
3. Redémarrez le serveur après modification du `.env.local`

### Erreur : "Impossible de se connecter à Qdrant"

**Causes possibles :**
- URL incorrecte (vérifiez le port `:6333`)
- Clé API invalide ou expirée
- Cluster Qdrant non actif (vérifiez le statut sur Qdrant Cloud)

**Solution :**
1. Vérifiez le statut du cluster sur Qdrant Cloud (doit être HEALTHY)
2. Testez la connexion avec curl :
```bash
curl -X GET 'https://VOTRE-URL:6333/collections' \
  --header 'api-key: VOTRE-CLE-API'
```
3. Si "forbidden", générez une nouvelle clé API

### Erreur : "Erreur extraction PDF: ..."

**Causes possibles :**
- PDF protégé par mot de passe
- PDF corrompu
- Problème avec pdfjs-dist en serverless

**Solution :**
1. Testez avec un PDF simple et non protégé
2. Vérifiez les logs du serveur
3. Si problème persiste en production uniquement, vérifiez les limites Vercel (timeout 10s)

### Erreur : "OpenAI API error"

**Causes possibles :**
- Clé API invalide
- Quota dépassé ou crédits insuffisants
- Rate limit dépassé

**Solution :**
1. Vérifiez vos crédits sur https://platform.openai.com/account/billing
2. Vérifiez que la clé API est active
3. Vérifiez les limites de rate : https://platform.openai.com/account/limits

### Timeout en production (Vercel)

**Cause :** Les fonctions serverless Vercel ont un timeout de 10s (plan gratuit)

**Solution :**
- Plan gratuit : Limitez la taille des PDF (< 2MB)
- Plan Pro : Timeout de 60s, permet des PDFs plus gros
- Alternative : Utilisez un processing asynchrone avec queue

## Limites et quotas

### Plan gratuit Qdrant Cloud
- Stockage : 1 GB
- Requêtes : Illimitées
- Collections : Illimitées
- **Coût : Gratuit à vie**

### OpenAI (pay-as-you-go)
- Embeddings `text-embedding-3-small` : 0.02$ / 1M tokens (~50 000 pages)
- Chat `gpt-4o` : ~5$ / 1M tokens input

**Estimation de coût pour 100 documents :**
- Embeddings : ~0.50$
- Chat (500 questions) : ~2-3$
- **Total : ~3-4$ / mois pour usage modéré**

### Vercel (plan gratuit)
- Timeout fonction : 10 secondes
- Bande passante : 100 GB/mois
- Déploiements : Illimités

## Architecture du système

```
Upload PDF
    ↓
[Firebase Storage] ← Stockage du fichier original
    ↓
[pdfjs-dist] ← Extraction du texte
    ↓
[Chunking] ← Découpage en morceaux (1000 caractères)
    ↓
[OpenAI API] ← Génération des embeddings vectoriels
    ↓
[Qdrant] ← Indexation dans la base vectorielle
    ↓
[Firestore] ← Métadonnées du document
```

```
Question utilisateur
    ↓
[OpenAI API] ← Génération embedding de la question
    ↓
[Qdrant] ← Recherche des 5 chunks les plus similaires
    ↓
[OpenAI API] ← Génération de la réponse avec contexte
    ↓
Réponse à l'utilisateur
```

## Scripts de validation

### Test complet du système
```bash
npm run test:rag
```

### Diagnostic approfondi
```bash
npm run diagnose:rag
```

## Support et documentation

- **Qdrant** : https://qdrant.tech/documentation/
- **OpenAI** : https://platform.openai.com/docs
- **pdfjs-dist** : https://github.com/mozilla/pdf.js
- **Tesseract.js** : https://tesseract.projectnaptha.com/

## Notes importantes

1. **Ne commitez JAMAIS le fichier `.env.local`** (déjà dans .gitignore)
2. **Les clés API sont sensibles** - Ne les partagez pas publiquement
3. **Surveillez vos coûts OpenAI** - Consultez régulièrement le dashboard de billing
4. **Le plan gratuit Qdrant est suffisant** pour démarrer (1GB = ~10 000 documents)
5. **Tesseract.js peut être lent** en production (OCR ~3-5s par image)

## Prochaines étapes après configuration

1. Lancez `npm run test:rag` pour valider la configuration
2. Testez un upload en local
3. Déployez sur Vercel avec les variables configurées
4. Testez en production
5. Commencez à uploader vos documents réels !

