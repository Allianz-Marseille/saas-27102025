# 🔑 Guide de Création d'une Clé API Pinecone pour l'API Chat

## ⚠️ Problème Identifié

L'erreur `Invalid JWT format` indique que vous utilisez peut-être un **Access Token** ou une clé au format incorrect pour l'API Chat de Pinecone Assistant.

## 📋 Types de Clés Pinecone

### 1. Access Token (pour Admin API)
- **Format** : Token JWT
- **Utilisation** : `Authorization: Bearer $PINECONE_ACCESS_TOKEN`
- **Usage** : Opérations Admin API (créer des clés API, gérer les projets, etc.)
- **⚠️ NE PAS utiliser pour l'API Chat**

### 2. Clé API (pour Control/Data Plane)
- **Format** : `pckey_<public-label>_<unique-key>`
- **Utilisation** : `Api-Key: $PINECONE_API_KEY`
- **Usage** : API Chat, opérations de données, requêtes
- **✅ C'est ce format qu'il faut utiliser pour l'API Chat**

## 🔧 Créer une Clé API Valide

### Prérequis
1. Un **Access Token** Pinecone (pour créer des clés API)
2. Votre **Project ID** : `prj_kcqNaE60ERclhMMTQYfzrlkKwx29`

### Étape 1 : Obtenir votre Access Token

L'Access Token se trouve dans :
- Pinecone Console → Settings → API Keys
- Ou généré via OAuth/authentication

### Étape 2 : Créer une Clé API

```bash
PINECONE_PROJECT_ID="prj_kcqNaE60ERclhMMTQYfzrlkKwx29"
PINECONE_ACCESS_TOKEN="YOUR_ACCESS_TOKEN"

curl -X POST "https://api.pinecone.io/admin/projects/$PINECONE_PROJECT_ID/api-keys" \
     -H "X-Pinecone-Api-Version: 2025-04" \
     -H "Authorization: Bearer $PINECONE_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{ 
           "name": "saas-allianz-chat-api-key", 
           "roles": ["ProjectEditor"] 
         }'
```

**Réponse attendue :**
```json
{
  "key": "pckey_<public-label>_<unique-key>"
}
```

### Étape 3 : Utiliser la Clé API Complète

⚠️ **IMPORTANT** : Utilisez **toute la chaîne** retournée, par exemple :
```
pckey_example-label_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**Ne copiez pas seulement une partie !**

## 📝 Rôles Disponibles

- `ProjectEditor` (par défaut) - Peut modifier les ressources du projet
- `ProjectViewer` - Lecture seule sur le projet
- `ControlPlaneEditor` - Modifications au niveau Control Plane
- `ControlPlaneViewer` - Lecture seule Control Plane
- `DataPlaneEditor` - Modifications au niveau Data Plane
- `DataPlaneViewer` - Lecture seule Data Plane

Pour l'API Chat, `ProjectEditor` ou `ProjectViewer` suffit généralement.

## ✅ Vérifier vos Clés API Existantes

```bash
PINECONE_PROJECT_ID="prj_kcqNaE60ERclhMMTQYfzrlkKwx29"
PINECONE_ACCESS_TOKEN="YOUR_ACCESS_TOKEN"

curl -X GET "https://api.pinecone.io/admin/projects/$PINECONE_PROJECT_ID/api-keys" \
     -H "Authorization: Bearer $PINECONE_ACCESS_TOKEN" \
     -H "X-Pinecone-Api-Version: 2025-04"
```

Cela liste toutes les clés API du projet avec leurs noms et rôles.

## 🔄 Mettre à Jour la Configuration

Une fois que vous avez votre clé API au format `pckey_...` :

1. **Local (.env.local)** :
   ```env
   PINECONE_API_KEY=pckey_<public-label>_<unique-key>
   PINECONE_PROJECT_ID=prj_kcqNaE60ERclhMMTQYfzrlkKwx29
   ```

2. **Vercel (Production)** :
   - Allez dans Settings → Environment Variables
   - Mettez à jour `PINECONE_API_KEY` avec la nouvelle clé
   - Redéployez l'application

## 🧪 Tester la Clé API

Utilisez la route de test admin :

```bash
curl -X POST "https://votre-app.vercel.app/api/admin/test-pinecone-chat" \
  -H "Content-Type: application/json" \
  -H "Cookie: votre-session-admin" \
  -d '{"message": "test"}'
```

Ou testez directement avec curl :

```bash
PINECONE_API_KEY="pckey_..."
PINECONE_PROJECT_ID="prj_kcqNaE60ERclhMMTQYfzrlkKwx29"

curl -X POST "https://api.pinecone.io/assistant/assistants/saas-allianz/chat" \
  -H "Api-Key: $PINECONE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Pinecone-Api-Version: 2025-01" \
  -d '{
    "messages": [{"role": "user", "content": "test"}],
    "stream": false
  }'
```

## 🆘 Dépannage

### Erreur : "Invalid JWT format"
- ✅ **Cause** : Vous utilisez un Access Token au lieu d'une Clé API
- ✅ **Solution** : Créez une Clé API avec la commande ci-dessus

### Erreur : "x-project-id header required"
- ✅ **Cause** : L'API nécessite l'en-tête `x-project-id`
- ✅ **Solution** : Assurez-vous que `PINECONE_PROJECT_ID` est configuré et que le code inclut l'en-tête

### Erreur : "Invalid API Key"
- ✅ **Cause** : La clé est incomplète, expirée, ou au mauvais format
- ✅ **Solution** : Vérifiez que vous utilisez la clé complète `pckey_...` (pas seulement une partie)

### Erreur : "Unauthorized"
- ✅ **Cause** : La clé n'a pas les permissions nécessaires
- ✅ **Solution** : Vérifiez les rôles de la clé API (au moins `ProjectViewer`)

## 📚 Références

- [Créer une Clé API](https://docs.pinecone.io/reference/api/2025-04/admin/create_api_key)
- [Lister les Clés API](https://docs.pinecone.io/reference/api/2025-04/admin/list_api_keys)
- [Authentification Pinecone](https://docs.pinecone.io/reference/api/2025-04/admin-assistant/authentication)

