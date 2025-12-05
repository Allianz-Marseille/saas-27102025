# Statut de l'intégration Pinecone MCP

## 🔴 Problème actuel

L'erreur **"Method not found"** persiste, ce qui signifie que :

1. ✅ L'API accepte les requêtes HTTP (pas d'erreur 401/403)
2. ✅ Le format JSON-RPC 2.0 est reconnu (sinon erreur Parse)
3. ❌ **AUCUNE méthode JSON-RPC testée n'est reconnue**
4. ❌ **AUCUN format REST direct testé ne fonctionne**

## Formats testés (tous échouent)

### Formats directs REST (testés en priorité)
- `{ message: "..." }`
- `{ query: "..." }`
- `{ input: "..." }`
- `{ prompt: "..." }`
- `{ text: "..." }`
- `{ message: "...", conversation: [] }`

### Méthodes JSON-RPC 2.0 (testées en fallback)
- `assistant/chat`
- `assistant/message`
- `assistant/query`
- `chat`
- `message`
- `query`
- `send`
- `send_message`
- `invoke`
- `call`

## Configuration actuelle

- **URL**: `https://prod-1-data.ke.pinecone.io/mcp/assistants/saas-allianz`
- **Headers**: 
  - `Content-Type: application/json`
  - `Accept: application/json, text/event-stream`
  - `Authorization: Bearer pcsk_...`
- **Méthode HTTP**: POST

## Solutions possibles

### Option 1 : Documentation officielle (RECOMMANDÉ)
- Consulter la documentation Pinecone MCP dans le dashboard
- Section "Assistant" → Documentation API MCP
- Obtenir un exemple cURL fonctionnel

### Option 2 : SDK Pinecone (ALTERNATIVE)
Utiliser le SDK officiel au lieu de l'API HTTP directe :

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const assistant = pc.assistant.Assistant({
  assistantName: "saas-allianz"
});
```

### Option 3 : Support Pinecone
Contacter le support Pinecone pour obtenir :
- La documentation exacte de l'API MCP
- Un exemple de requête fonctionnelle
- Les méthodes JSON-RPC disponibles

## Logs disponibles

Les logs Vercel contiennent tous les détails :
- Formats testés (dans l'ordre)
- Réponses exactes de l'API
- Erreurs détaillées
- Temps de réponse

## Prochaines étapes

1. ✅ Code mis à jour pour tester tous les formats
2. ✅ Logs complets en production
3. ⏳ **EN ATTENTE** : Documentation Pinecone MCP ou exemple fonctionnel
4. ⏳ **EN ATTENTE** : Réponse du support Pinecone

