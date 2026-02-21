# Vérification pas à pas — Erreur 405 sur /api/chat

Diagnostic du message "Erreur 405 (Méthode refusée)" sur le chat Bob test.

---

## Légende des icônes

| Icône | Signification |
|-------|---------------|
| ⬜ | À vérifier |
| ✅ | Vérifié OK |
| ❌ | Échec — à corriger |

---

## 1. Déploiement à jour

- [x] ✅ Vercel → **Deployments** : le dernier build est **Ready** (vert)
- [x] ✅ Le commit déployé = `d4ec799` _(fix chat fallback auth REST API)_
- [x] ✅ Production Current

**Résultat :** ✅

---

## 2. Variables d'environnement (Vercel)

- [x] ✅ **NEXT_PUBLIC_FIREBASE_API_KEY** présente — ⚠️ triangle orange visible, vérifier si valeur exacte (Firebase Console)
- [x] ✅ **MISTRAL_API_KEY** présente
- [x] ✅ **MISTRAL_AGENT_BOB** = `ag_019c62882e31752fa5f7ef4914a71c35`
- [x] ✅ **FIREBASE_SERVICE_ACCOUNT_BASE64** présente et complète
- [x] ✅ All Environments

**Résultat :** ✅ (attention au triangle sur API_KEY)

**Note :** Si le triangle signifie "redéploiement requis", faire un Redeploy après avoir sauvegardé.

---

## 3. Méthode HTTP — Vérifier que c'est bien POST

- [x] ✅ La requête est bien **POST** (`POST https://notre-saas-agence.com/api/chat 405`)
- [x] ✅ Le client envoie correctement

**Résultat :** ✅ — Le problème est côté serveur, pas client

---

## 4. URL de la requête

- [x] ✅ URL : `https://notre-saas-agence.com/api/chat`
- [x] ✅ **Test Vercel direct** : `saas-allianz-marseille-git-main-...vercel.app` → **405 aussi** (pas un problème de proxy/CDN)

**Résultat :** ✅ — Le souci vient de l'app ou de la config Vercel

---

## 5. Headers et Payload

- [ ] ⬜ **Request Headers** : `Authorization: Bearer eyJ...` présent
- [ ] ⬜ **Request Headers** : `Content-Type: application/json`
- [ ] ⬜ Onglet **Payload** : `message`, `botId`, `history` présents

**Résultat :** ⬜

---

## 6. Logs Vercel

- [ ] ⬜ Vercel → projet → **Logs** (ou **Functions**)
- [ ] ⬜ Filtrer sur `/api/chat` ou "chat"
- [ ] ⬜ Rechercher : `"Démarrage de la route /api/chat"`
  - **Si visible** : la route est appelée, le 405 vient du code
  - **Si absent** : la requête n'arrive pas ou la fonction crash avant
- [ ] ⬜ Rechercher : `FUNCTION_INVOCATION_FAILED`, stack traces, erreurs Firebase

**Résultat :** ⬜

---

## 7. Test direct (cURL)

Remplacer `TON_DOMAINE` et `TON_TOKEN` puis exécuter :

```bash
curl -X POST "https://TON_DOMAINE.vercel.app/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TON_TOKEN" \
  -d '{"message":"test","botId":"bob","history":[]}'
```

**Token :** copier la valeur après `Bearer ` dans l'onglet Network (Request Headers).

- [ ] ⬜ Commande exécutée
- [ ] ⬜ Résultat : 405 / 401 / 200 / stream / erreur ?

**Résultat :** ⬜

---

## 8. (Optionnel) Endpoint de diagnostic

Si une route `/api/chat/health` a été créée :

- [ ] ⬜ `GET https://TON_DOMAINE/api/chat/health` → 200 OK
- [ ] ⬜ Confirme que les fonctions Next.js répondent

**Résultat :** ⬜

---

## Synthèse

| Étape | Statut |
|-------|--------|
| 1. Déploiement | ✅ |
| 2. Variables d'env | ✅ |
| 3. Méthode POST | ✅ |
| 4. URL | ✅ |
| 5. Headers/Payload | ⬜ |
| 6. Logs | ⬜ |
| 7. cURL | ⬜ |
| 8. Health (si applicable) | ⬜ |

**Blocage identifié à l'étape :** _____

**Action corrective :** _____

---

## ⚠️ Nouvelle découverte — Production

Sur `https://saas-allianz-marseille.vercel.app/login` : **"Firebase not initialized"**

Cela indique que les variables **NEXT_PUBLIC_FIREBASE_*** ne sont pas correctement chargées en Production :
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**À faire :**
1. Vercel → Settings → Environment Variables
2. Vérifier que TOUTES ces variables sont assignées à **Production** (pas seulement Preview)
3. Si tu les as modifiées : **Redeploy** (elles sont injectées au build)
