# 🚀 Guide de test rapide - Routes API RAG

## Étape 1 : Lancer le serveur

```bash
npm run dev
```

Le serveur doit être accessible sur `http://localhost:3000`

## Étape 2 : Obtenir un token Firebase

1. Ouvrez `http://localhost:3000` dans votre navigateur
2. Connectez-vous avec votre compte
3. Ouvrez la console du navigateur (F12)
4. Exécutez :

```javascript
// Si vous utilisez Firebase directement
const token = await firebase.auth().currentUser?.getIdToken();
console.log("Token:", token);
```

5. **Copiez le token** (c'est une longue chaîne qui commence par `eyJ...`)

## Étape 3 : Lancer les tests

```bash
npm run test-rag-api VOTRE_TOKEN_ICI
```

**Exemple :**
```bash
npm run test-rag-api eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL2lkZW50aXR5dG9vbGtpdC5nb29nbGVhcGlzLmNvbS9nb29nbGUuaWRlbnRpdHkuaWRlbnRpdHl0b29sa2l0LnYxLklkZW50aXR5VG9vbGtpdCIsImV4cCI6MTcyMDAwMDAwMCwiaWF0IjoxNzE5OTk5OTk5fQ...
```

## Résultats attendus

Le script va tester :
- ✅ Liste des documents (GET)
- ✅ Chat RAG simple (POST)
- ✅ Chat RAG avec historique (POST)

## Tests manuels (optionnel)

### Test avec curl

**Liste des documents :**
```bash
curl -X GET http://localhost:3000/api/chat/documents \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

**Chat :**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Bonjour", "conversationHistory": []}'
```

## ⚠️ Notes importantes

- Le token expire après **1 heure**. Si les tests échouent avec une erreur 401, obtenez un nouveau token.
- Pour tester l'upload, vous devez être **admin** et utiliser un fichier de test.
- Voir `TESTING.md` pour plus de détails.

