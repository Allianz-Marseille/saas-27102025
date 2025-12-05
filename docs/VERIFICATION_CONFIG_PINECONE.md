# Vérification Configuration Pinecone Assistant

## ✅ Étape 1 : Variables d'environnement Vercel

### Vérifier dans Vercel → Settings → Environment Variables

- [ ] **`PINECONE_API_KEY`** est définie
- [ ] La clé commence par `pcsk_` 
- [ ] La clé est complète (pas tronquée)
- [ ] Scope : "All Environments" ou au moins "Production"

**Valeur visible dans Vercel :** `pcsk_6X408_9tGtePms2HHEFKDBWSA2oT...` (vérifier que c'est complet)

---

## ✅ Étape 2 : Project ID Pinecone

**Project ID :** `prj_kcqNaE60ERclhMMTQYfzrlkKwx29`

### Vérifications
- [ ] Ce Project ID correspond bien à votre projet dans le dashboard Pinecone
- [ ] La clé API appartient à ce projet

---

## ✅ Étape 3 : Nom de l'Assistant

**Nom de l'assistant :** `saas-allianz`

### Vérifications dans le dashboard Pinecone
- [ ] Aller dans "Assistant" → "Assistants"
- [ ] Vérifier que l'assistant `saas-allianz` existe
- [ ] Vérifier qu'il est actif (point vert visible)
- [ ] Copier le nom exact (respecter la casse et les tirets)

---

## ✅ Étape 4 : Configuration dans le code

### URL API utilisée actuellement
```
https://api.pinecone.io/assistant/assistants/saas-allianz/chat
```

### Headers utilisés
- `Api-Key`: {PINECONE_API_KEY}
- `Content-Type`: application/json
- `X-Pinecone-Api-Version`: 2025-01

### Format de requête
```json
{
  "messages": [
    {
      "role": "user",
      "content": "..."
    }
  ],
  "stream": false
}
```

---

## ✅ Étape 5 : Test manuel avec cURL

Pour vérifier que tout fonctionne, tester avec cURL :

```bash
curl -X POST "https://api.pinecone.io/assistant/assistants/saas-allianz/chat" \
  -H "Api-Key: pcsk_6X408_9tGtePms2HHEFKDBWSA2oT..." \
  -H "Content-Type: application/json" \
  -H "X-Pinecone-Api-Version: 2025-01" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Bonjour, qui êtes-vous ?"
      }
    ],
    "stream": false
  }'
```

**Résultat attendu :**
- Si `200 OK` : ✅ Tout fonctionne
- Si `401 Unauthorized` : ❌ Problème de clé API
- Si `404 Not Found` : ❌ Nom de l'assistant incorrect
- Si `400 Bad Request` : ❌ Format de requête incorrect

---

## 🔍 Erreur actuelle : "Problème d'authentification"

**Causes possibles :**

1. **Clé API incomplète ou incorrecte**
   - Vérifier que la clé complète est dans Vercel (pas juste les premiers caractères)
   - Vérifier que la clé commence bien par `pcsk_`

2. **Nom d'assistant incorrect**
   - Vérifier le nom exact dans le dashboard Pinecone
   - Respecter la casse et les tirets

3. **Project ID requis dans l'URL ?**
   - Peut-être que l'URL doit être : `https://api.pinecone.io/{project_id}/assistants/{name}/chat`
   - Ou avec le project ID dans les headers

4. **Version de l'API**
   - Vérifier que `2025-01` est la bonne version

---

## 📋 Checklist de vérification

- [ ] Clé API complète dans Vercel
- [ ] Nom de l'assistant exact : `saas-allianz`
- [ ] Project ID : `prj_kcqNaE60ERclhMMTQYfzrlkKwx29`
- [ ] Test cURL réussi
- [ ] Logs Vercel consultés pour voir l'erreur exacte

---

## 🔧 Prochaines actions

1. Tester avec cURL pour isoler le problème
2. Vérifier les logs Vercel pour voir l'erreur exacte
3. Si nécessaire, ajuster l'URL ou les headers selon la réponse

