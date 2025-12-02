# Guide de test des routes API RAG

## Prérequis

1. **Serveur Next.js lancé** :
   ```bash
   npm run dev
   ```

2. **Token Firebase** : Vous devez obtenir un token d'authentification Firebase depuis le navigateur.

## Obtenir un token Firebase

### Méthode 1 : Depuis la console du navigateur

1. Connectez-vous à l'application sur `http://localhost:3000`
2. Ouvrez la console du navigateur (F12)
3. Exécutez cette commande :
   ```javascript
   // Si vous utilisez Firebase directement
   await firebase.auth().currentUser?.getIdToken()
   
   // Ou si vous utilisez le hook useAuth
   // Dans la console React DevTools, accédez au composant qui utilise useAuth
   ```

4. Copiez le token retourné

### Méthode 2 : Depuis le code de l'application

Ajoutez temporairement ce code dans un composant pour afficher le token :

```typescript
import { useAuth } from "@/lib/firebase/use-auth";

// Dans votre composant
const { user } = useAuth();

useEffect(() => {
  if (user) {
    user.getIdToken().then(token => {
      console.log("Token:", token);
    });
  }
}, [user]);
```

## Tests automatiques

### Script de test

Un script de test est disponible pour tester les routes API :

```bash
npm run test-rag-api <token> [userId]
```

**Exemple :**
```bash
npm run test-rag-api eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Tests effectués

Le script teste automatiquement :

1. ✅ **GET /api/chat/documents** - Liste des documents
2. ✅ **POST /api/chat** - Chat RAG (question simple)
3. ✅ **POST /api/chat** - Chat RAG (avec historique)

### Tests manuels

#### 1. Liste des documents

```bash
curl -X GET http://localhost:3000/api/chat/documents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2. Chat RAG

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Bonjour, pouvez-vous me dire ce que vous savez sur les assurances ?",
    "conversationHistory": []
  }'
```

#### 3. Upload de fichier (Admin uniquement)

```bash
curl -X POST http://localhost:3000/api/chat/upload \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@test.pdf" \
  -F "title=Document de test" \
  -F "description=Description du document"
```

**Note :** Remplacez `test.pdf` par le chemin vers un fichier PDF ou image de test.

#### 4. Supprimer un document (Admin uniquement)

```bash
curl -X DELETE http://localhost:3000/api/chat/documents/DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Tests avec Postman ou Insomnia

### Configuration

1. Créez une nouvelle requête
2. URL : `http://localhost:3000/api/chat/...`
3. Headers :
   - `Authorization: Bearer YOUR_TOKEN`
   - `Content-Type: application/json` (pour POST)

### Collection de tests

#### Test 1 : Liste des documents
- **Method** : GET
- **URL** : `http://localhost:3000/api/chat/documents`
- **Headers** : `Authorization: Bearer YOUR_TOKEN`

#### Test 2 : Chat
- **Method** : POST
- **URL** : `http://localhost:3000/api/chat`
- **Headers** : 
  - `Authorization: Bearer YOUR_TOKEN`
  - `Content-Type: application/json`
- **Body** (JSON) :
  ```json
  {
    "query": "Votre question ici",
    "conversationHistory": []
  }
  ```

#### Test 3 : Upload (Admin)
- **Method** : POST
- **URL** : `http://localhost:3000/api/chat/upload`
- **Headers** : `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body** (form-data) :
  - `file`: [Sélectionner un fichier PDF ou image]
  - `title`: "Titre du document" (optionnel)
  - `description`: "Description" (optionnel)

## Vérification des résultats

### Réponses attendues

#### GET /api/chat/documents
```json
{
  "documents": [...],
  "count": 0
}
```

#### POST /api/chat
```json
{
  "message": "Réponse du chatbot...",
  "sources": ["doc1", "doc2"],
  "searchResults": [...],
  "metadata": {
    "model": "gpt-4o",
    "tokensUsed": 150,
    "responseTime": 1234
  }
}
```

#### POST /api/chat/upload
```json
{
  "documentId": "uuid-here",
  "filename": "test.pdf",
  "fileUrl": "https://storage.googleapis.com/...",
  "chunkCount": 10,
  "success": true,
  "ocrConfidence": 0.95
}
```

## Dépannage

### Erreur 401 (Non authentifié)
- Vérifiez que le token est valide
- Vérifiez que le token n'a pas expiré (les tokens Firebase expirent après 1 heure)
- Obtenez un nouveau token

### Erreur 403 (Accès refusé)
- Pour les routes admin, vérifiez que votre utilisateur a le rôle `ADMINISTRATEUR`
- Vérifiez dans Firestore que `users/{userId}.role === "ADMINISTRATEUR"`

### Erreur 500 (Erreur serveur)
- Vérifiez les logs du serveur Next.js
- Vérifiez que toutes les variables d'environnement sont configurées
- Vérifiez que Qdrant et OpenAI sont accessibles

### Le serveur ne répond pas
- Vérifiez que `npm run dev` est lancé
- Vérifiez que le serveur écoute sur le port 3000
- Vérifiez l'URL dans le script de test (`API_BASE_URL`)

## Tests d'intégration complets

Pour tester le flux complet :

1. **Upload un document** (admin)
2. **Vérifier qu'il apparaît dans la liste** (GET /api/chat/documents)
3. **Poser une question** (POST /api/chat) qui devrait utiliser le document
4. **Vérifier les sources** dans la réponse
5. **Supprimer le document** (DELETE /api/chat/documents/[id])
6. **Vérifier qu'il n'apparaît plus** dans la liste

