# 🔍 Diagnostic RAG - Problème identifié

## ❌ Problème

Votre chatbot ne peut pas accéder aux documents RAG car **les variables d'environnement Qdrant ne sont pas configurées**.

### Erreur détectée
```
Configuration Qdrant manquante. Vérifiez QDRANT_URL et QDRANT_API_KEY.
```

## 📋 Variables d'environnement manquantes

Dans votre fichier `.env.local`, il manque :
- `QDRANT_URL` : L'URL de votre instance Qdrant
- `QDRANT_API_KEY` : La clé API pour s'authentifier

---

## ✅ Solutions possibles

### Option 1 : Utiliser Qdrant Cloud (Recommandé)

Qdrant Cloud offre un tier gratuit de 1GB parfait pour commencer.

#### Étapes :

1. **Créer un compte Qdrant Cloud** : https://cloud.qdrant.io/

2. **Créer un cluster** :
   - Type : Free tier (1GB)
   - Région : Europe (Paris ou Amsterdam recommandé)
   - Nom : `allianz-rag` (ou autre nom)

3. **Récupérer les credentials** :
   - Une fois le cluster créé, aller dans "Settings"
   - Noter l'URL : `https://xxxxx.eu-central.aws.cloud.qdrant.io:6333`
   - Générer une API Key

4. **Ajouter dans `.env.local`** :
   ```env
   QDRANT_URL=https://xxxxx.eu-central.aws.cloud.qdrant.io:6333
   QDRANT_API_KEY=votre-api-key-ici
   ```

5. **Redémarrer le serveur** :
   ```bash
   npm run dev
   ```

---

### Option 2 : Utiliser Qdrant local avec Docker

Si vous préférez héberger Qdrant localement.

#### Étapes :

1. **Lancer Qdrant avec Docker** :
   ```bash
   docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
   ```

2. **Ajouter dans `.env.local`** :
   ```env
   QDRANT_URL=http://localhost:6333
   QDRANT_API_KEY=your-secure-key-here
   ```
   
   Note : Pour une instance locale, l'API key peut être une valeur arbitraire si vous n'avez pas configuré d'authentification.

3. **Redémarrer le serveur** :
   ```bash
   npm run dev
   ```

---

## 🧪 Vérification

Une fois configuré, testez avec :

```bash
npx tsx scripts/test-rag-search.ts
```

Vous devriez voir :
- ✅ Connexion Qdrant réussie
- ✅ Collection créée ou trouvée
- ✅ Recherche fonctionnelle

---

## 📤 Ré-indexation des documents

Si vous avez déjà uploadé des documents avant cette configuration :

1. Les métadonnées sont dans Firestore ✓
2. Les fichiers sont dans Firebase Storage ✓
3. Mais les **vecteurs ne sont pas dans Qdrant** ✗

**Solution** : Supprimez et ré-uploadez vos documents via l'interface admin une fois Qdrant configuré. Le système créera automatiquement les vecteurs.

---

## 🎯 Résultat attendu

Après configuration, votre chatbot pourra :
- ✅ Rechercher dans les documents indexés
- ✅ Répondre avec le contexte des PDFs uploadés
- ✅ Citer les sources pertinentes

---

## 📊 Architecture actuelle

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Chat       │
│  /api/chat      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  RAG Service (chat-service.ts)      │
│  ├─ searchRelevantContexts()        │
│  └─ generateResponse()              │
└──────────┬──────────────────────────┘
           │
           ├──────────┬──────────────┐
           ▼          ▼              ▼
    ┌──────────┐ ┌────────┐   ┌──────────┐
    │  Qdrant  │ │ OpenAI │   │Firestore │
    │ (Vecteurs)│ │(Embed) │   │(Metadata)│
    └──────────┘ └────────┘   └──────────┘
         ❌          ✓             ✓
    Pas configuré
```

---

## 🆘 Besoin d'aide ?

Si vous rencontrez des problèmes :
1. Vérifiez les logs : `npm run dev` et regardez la console
2. Testez la connexion : `npx tsx scripts/test-rag-search.ts`
3. Vérifiez les variables : `npx tsx scripts/diagnose-qdrant.ts`

