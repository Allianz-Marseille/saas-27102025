# 🔍 Guide de Vérification - Configuration Pinecone

## ✅ Checklist de Vérification

### 1. Variables d'Environnement Locales (`.env.local`)

Vérifiez que votre fichier `.env.local` contient :

```env
PINECONE_API_KEY=pcsk_6X4o8_9tGtePms2HHEFKDBwSA2oTyLANR9zXc5DEgZRyGT5J42LYvWo4gypEqdc78V5NQ
PINECONE_PROJECT_ID=prj_kcqNaE60ERclhMMTQYfzrlkKwx29
```

**✅ Format de la clé :** Doit commencer par `pcsk_`

### 2. Variables d'Environnement Vercel (Production)

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet `saas-allianz-marseille`
3. Allez dans **Settings** → **Environment Variables**
4. Vérifiez que vous avez :

   | Variable | Valeur | Environnement |
   |----------|--------|---------------|
   | `PINECONE_API_KEY` | `pcsk_6X4o8_9tGtePms2HHEFKDBwSA2oTyLANR9zXc5DEgZRyGT5J42LYvWo4gypEqdc78V5NQ` | Production, Preview, Development |
   | `PINECONE_PROJECT_ID` | `prj_kcqNaE60ERclhMMTQYfzrlkKwx29` | Production, Preview, Development (optionnel) |

5. **⚠️ IMPORTANT :** Si vous modifiez des variables, **redéployez** votre application !

### 3. Configuration Assistant Pinecone

- **Nom de l'assistant :** `saas-allianz`
- **Project ID :** `prj_kcqNaE60ERclhMMTQYfzrlkKwx29`
- **URL API Chat :** `https://api.pinecone.io/assistant/assistants/saas-allianz/chat`

### 4. Test Local

Exécutez le script de vérification :

```bash
# Charger les variables d'environnement
source .env.local

# Lancer le script de test
npx ts-node scripts/check-pinecone-config.ts
```

Ou testez directement via curl :

```bash
curl -X POST "https://api.pinecone.io/assistant/assistants/saas-allianz/chat" \
  -H "Api-Key: pcsk_6X4o8_9tGtePms2HHEFKDBwSA2oTyLANR9zXc5DEgZRyGT5J42LYvWo4gypEqdc78V5NQ" \
  -H "Content-Type: application/json" \
  -H "X-Pinecone-Api-Version: 2025-01" \
  -d '{
    "messages": [{"role": "user", "content": "test"}],
    "stream": false
  }'
```

### 5. Test en Production

1. Ouvrez votre application en production
2. Ouvrez le chatbot
3. Envoyez un message (ex: "Bonjour")
4. Vérifiez les logs Vercel :
   - Allez dans **Logs** dans le dashboard Vercel
   - Filtrez par route : `/api/assistant/chat`
   - Vérifiez les erreurs dans "Contains Console Level"

### 6. Diagnostic des Erreurs

#### Erreur : "Authentication problem with the AI assistant"

**Causes possibles :**
1. ❌ `PINECONE_API_KEY` non définie dans Vercel
2. ❌ Clé API incorrecte ou tronquée
3. ❌ Clé API invalide (expirée ou révoquée)
4. ❌ Nom de l'assistant incorrect
5. ❌ Variables non redéployées après modification

**Solution :**
1. Vérifiez les variables dans Vercel (étape 2)
2. Redéployez l'application
3. Vérifiez les logs Vercel pour les détails de l'erreur

#### Erreur : "Method not found" (-32601)

**Cause :** Vous utilisez l'endpoint MCP au lieu de l'API Chat standard.

**Solution :** Le code utilise maintenant l'API Chat standard. Vérifiez que vous avez la dernière version déployée.

#### Erreur : 401 Unauthorized

**Causes possibles :**
1. Clé API invalide
2. Clé API expirée
3. Clé API non associée au bon projet

**Solution :**
1. Vérifiez que la clé commence bien par `pcsk_`
2. Vérifiez que la clé complète est dans Vercel (sans espaces)
3. Générez une nouvelle clé API dans Pinecone si nécessaire

### 7. Vérification Rapide dans Vercel

Pour vérifier rapidement si les variables sont bien chargées en production, vous pouvez :

1. Utiliser la route de test : `/api/admin/test-pinecone-chat` (nécessite authentification admin)
2. Vérifier les logs lors d'un appel au chatbot
3. Utiliser Vercel CLI : `vercel env ls`

---

## 📝 Notes Importantes

- ⚠️ **Ne commitez JAMAIS** `.env.local` dans git
- 🔒 Les variables d'environnement Vercel sont différentes de `.env.local`
- 🔄 **Toujours redéployer** après modification des variables
- 🧪 Testez d'abord en local avant de déployer

---

## 🆘 Support

Si le problème persiste :
1. Vérifiez les logs Vercel complets
2. Testez avec curl (étape 4)
3. Vérifiez la console Pinecone pour l'état de l'assistant
4. Contactez le support Pinecone si nécessaire

