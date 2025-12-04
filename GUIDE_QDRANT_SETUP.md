# 🚀 Guide Qdrant Cloud - Configuration en 5 minutes

## Étape 1 : Créer un compte Qdrant Cloud

1. Allez sur **https://cloud.qdrant.io/**

2. Cliquez sur **"Sign Up"** (ou "Get Started")

3. Inscrivez-vous avec :
   - Votre email professionnel
   - Ou via GitHub / Google

4. Vérifiez votre email et confirmez votre compte

---

## Étape 2 : Créer votre premier cluster

1. Une fois connecté, cliquez sur **"Create Cluster"** ou **"New Cluster"**

2. Configurez le cluster :
   ```
   Cluster Name: allianz-rag-production
   Cloud Provider: AWS (recommandé)
   Region: eu-central-1 (Frankfurt) ou eu-west-3 (Paris)
   Plan: Free (1GB) - Largement suffisant pour démarrer
   ```

3. Cliquez sur **"Create"**

4. ⏳ Attendez 1-2 minutes que le cluster soit provisionné
   - Status passera de "Creating" → "Running"

---

## Étape 3 : Récupérer les credentials

1. **Récupérer l'URL** :
   - Cliquez sur votre cluster dans la liste
   - Vous verrez **"Cluster URL"** ou **"REST Endpoint"**
   - Format : `https://xxxxx-xxxxx.eu-central-1.aws.cloud.qdrant.io:6333`
   - 📋 Copiez cette URL complète

2. **Générer une API Key** :
   - Dans la page du cluster, allez dans **"API Keys"** ou **"Settings"**
   - Cliquez sur **"Create API Key"** ou **"Generate New Key"**
   - Donnez-lui un nom : `nextjs-app`
   - 📋 Copiez la clé (format : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
   - ⚠️ **IMPORTANT** : Sauvegardez-la immédiatement, elle ne sera plus visible !

---

## Étape 4 : Ajouter dans votre projet

1. **Ouvrez votre fichier `.env.local`** (à la racine du projet)

2. **Ajoutez ces deux lignes** (remplacez par vos vraies valeurs) :

```env
# Qdrant Vector Database
QDRANT_URL=https://xxxxx-xxxxx.eu-central-1.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

3. **Sauvegardez le fichier**

---

## Étape 5 : Redémarrer votre serveur

1. **Arrêtez le serveur Next.js** :
   - Dans le terminal où `npm run dev` tourne
   - Appuyez sur `Ctrl+C` (ou `Cmd+C` sur Mac)

2. **Relancez le serveur** :
   ```bash
   npm run dev
   ```

3. Vous devriez voir dans les logs :
   ```
   [Qdrant] Connected successfully
   [Qdrant] Collection 'rag_documents' ready
   ```

---

## Étape 6 : Tester la connexion

Dans un nouveau terminal, exécutez :

```bash
npx tsx scripts/test-rag-search.ts
```

**Résultat attendu** :
```
🔍 Test de recherche RAG

📝 Requête de test: "codes firme agents différenciés pro"

❌ Aucun résultat trouvé

Causes possibles:
1. Aucun document indexé dans Qdrant  ← C'est normal !
```

C'est **normal** de ne pas avoir de résultats car aucun document n'est encore indexé dans Qdrant.

---

## Étape 7 : Ré-indexer vos documents

1. **Ouvrez votre application** : http://localhost:3000

2. **Connectez-vous en tant qu'admin**

3. **Allez dans Admin > Outils > Chatbot**

4. **Pour chaque document existant** :
   - Cliquez sur l'icône 🗑️ (Supprimer)
   - Confirmez la suppression
   
5. **Re-uploadez vos documents** :
   - Cliquez sur **"Importer des documents"** (en haut)
   - Sélectionnez vos PDFs (ou drag & drop)
   - Ajoutez des tags si souhaité
   - Cliquez sur **"Uploader"**
   - Attendez la fin du traitement (barre de progression)

6. **Vérifiez les KPIs** :
   ```
   📄 Documents indexés : 4
   🔢 Chunks vectorisés : ~XXX
   ```

---

## Étape 8 : Tester le chatbot

1. **Ouvrez le chat** :
   - Cliquez sur le bouton flottant violet en bas à droite
   - Ou allez sur la page du chatbot

2. **Posez une question** sur vos documents :
   ```
   "Quels sont les codes firme pour les agents différenciés pro ?"
   ```

3. **Résultat attendu** :
   - Le bot devrait maintenant **citer vos documents**
   - Répondre avec les informations exactes des PDFs
   - Afficher les sources utilisées

---

## ✅ Checklist finale

- [ ] Compte Qdrant Cloud créé
- [ ] Cluster "Running" (vert)
- [ ] URL copiée dans `.env.local`
- [ ] API Key copiée dans `.env.local`
- [ ] Serveur redémarré (`npm run dev`)
- [ ] Test de connexion réussi
- [ ] Documents re-uploadés
- [ ] Chatbot répond avec contexte

---

## 🆘 Problèmes courants

### Erreur "Connection refused"
- Vérifiez que l'URL contient bien `:6333` à la fin
- Vérifiez que le cluster est en status "Running"

### Erreur "Unauthorized"
- Vérifiez que l'API Key est correcte
- Pas d'espaces avant/après dans `.env.local`

### Le bot ne trouve toujours pas les documents
- Vérifiez que les documents sont bien ré-uploadés APRÈS la config Qdrant
- Vérifiez les KPIs "Chunks vectorisés" > 0

### Erreur pendant l'upload
- Vérifiez les logs du serveur dans le terminal
- Vérifiez que OpenAI API Key est aussi configurée

---

## 📊 Monitoring

### Dashboard Qdrant Cloud

Dans votre dashboard Qdrant Cloud, vous pouvez :
- Voir le nombre de vecteurs stockés
- Monitorer l'utilisation (Storage, Requests)
- Voir les performances de recherche

### Logs Next.js

Dans le terminal où tourne `npm run dev`, vous verrez :
```
[Qdrant] Creating collection 'rag_documents'...
[Qdrant] Collection created successfully
[Qdrant] Upserting 42 vectors...
[Qdrant] Vectors upserted successfully
```

---

## 🎉 Félicitations !

Votre système RAG est maintenant **pleinement opérationnel** !

Le chatbot peut désormais :
- ✅ Rechercher dans vos documents
- ✅ Répondre avec un contexte précis
- ✅ Citer ses sources
- ✅ Fournir des informations fiables et traçables

---

## 📈 Prochaines étapes (optionnel)

1. **Ajouter plus de documents** : Le Free tier permet 1GB
2. **Tester les tags** : Organiser vos documents par catégorie
3. **Former vos équipes** : Montrer comment utiliser le chatbot
4. **Monitorer l'usage** : Voir quelles questions reviennent souvent

Si besoin d'aide : consultez https://qdrant.tech/documentation/

