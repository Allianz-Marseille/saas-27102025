# Déploiement Vercel - Variables d'environnement Google Cloud

## Variables à ajouter sur Vercel

Allez sur : **https://vercel.com/votre-projet/settings/environment-variables**

### 1. GOOGLE_APPLICATION_CREDENTIALS_BASE64

```
GOOGLE_APPLICATION_CREDENTIALS_BASE64=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiZ2VuLWxhbmctY2xpZW50LTAwMzA1ODQ2NTIiLAogICJwcml2YXRlX2tleV9pZCI6ICI3NDdjM2MyOWNjYWUwMDhhZmIzZDA1NjE2ZDlkNjU3M2UzZTIxN2VlIiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdlFJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLY3dnZ1NqQWdFQUFvSUJBUUM0c0pLVjdDcXZuVVE5XG5ML0N1NFBCMWg4Vmd6VUVBYWxhdVJCd0Q1bUxnMy9DcjNKTjRyNHZKWW9HdmJTdlM1WGNyOHlZTEhOaDBXOXhZXG4rbnEvOXgxY3ZsdG9LLzZ4MmtvaUhsdUpCaE5vZUZZUzlKR2N5NUpZWUhuS1RvK1MxZVNhYy9pWXhVS0pHaCtiXG5Vd0grQ3d4MEZLZXI2YWc0L09QckJaS3ZwVWRsRUVQbkhkU0dCNENRMWJCbW5PNzVDRklQNWZQQ0xkQytnczFKXG4wT0t3elQ2c2d3bEJxaWQyenY5bjZvWC92dXNiSHl1OW1LR3M2S01JQ3gyY3p5cnVvTDJsbzFkczFsdXBPSlpIXG40MXA3S0xETkNHWGxQUm9uRU9DK0lNVHoxMGQvUVF4UHBKajVDVWVtTCtoUkdWbjNKamdwWHMvMVZJdXR6MEJaXG5IV0ZpekRQeEFnTUJBQUVDZ2dFQURMdjZBM1hTOUtSZ2srSjJFeXpGejZqQ29udk1oMUdOcy9yVXZxMFlOTDZrXG5Hc2w4N3BXV0N4YnNiN0xVa25oSmFRR2RKaWVCUWphaVFRMVdRTjJ5UzlhQk9YUE5IaWk1czFRS0JpN2gwREo1XG41dGt2b0JMR1BxczZRb2w3cTBsdHQzdVhFTHVMTEtaZE53bTRhYktMMDRZb0VIbXVKRzNGYmt0R1U2K085bWdVXG5KQVRWZGlGb0tPempRK2RvR3drVCt4dXlJTGtCWW9OTTgydVVTYTQxdDBxaHR4WVp4VzBDWjR2NDRRcG5hWitnXG4yaUpYNGpHM2RKRmdKamluS1RuaXkrVGZ6Q0NOUjZWVHpFMjhESlZoNWg0ZmZmMnpuK25VMnVyQ1k5S0RrZ3JjXG5kQmRPeUxaZVNNaXg4dVdyMHRxbjhObnBhcmZQZytwNmdnV1d2WmpRZFFLQmdRRDdyaFNNMFBYUGwvNFBWNm9oXG56R1lBNktCYmpsV1c5WHNaL0FpQTQxVW5tRjhobW5LM2VzcTRaUStWczJQMkdOSkJ5ZFZ1UFI1a1U0eDkyRENyXG5mMnRWdXA1bkhhaE5qTTBBVWRXM05hdVQxdlV3WFVMU1VQNUErQ2pjTzgyanBIMENFbFR3MFltcWQvUG5pS3RQXG5kL1pFRVFEamp1WXJtUGNYSzAxUG8vSjBMUUtCZ1FDNzNDQ0Y1bVNTZGJkMEpQMm1ZblUvcmZ0M0VMSzZ5R0haXG43YlpGQ1YyTjNZeTU5dWpCTlgxQlJabG80aEtkTWc1MG0vdG1SODAxODBMcDh3NnRWSDZBUDYxaWsvY0pUR25OXG43VDN0c2Z1WGNkVDRRVEZ3azhiNk5KcmFnakhRSUNRYitYdWdaRWRDUG9KVENhRm1BUDZKRjN1akJ3QXZ2bVI2XG41cEQ4VlpuRlZRS0JnR2YxeFZsUmEyZ2YwWHNHN0NqZjVIYVZvTCtROEx2VmxNN3I4NXRCekVmNXdib0FzVWdtXG4rWnZuYXVPY1lUc2pqNTVMUDlVMGU5eFhRcDRzOGhXMUlXSWRIeGRiQWMxZXpzTkdDbkNPUTl4aW00OHB4dE5YXG5UMThJNHQvdCtBaVRobXVYcE95QXNVdndGcGphTkdFMEhVNktjNEtMNFhtNnlyNFFUZlFLdGJqVkFvR0JBTGJnXG5CVEVVSlZlR0RMNmR1K2FhOWpTMWM1Um14dmFaVnRoRlZpaENnN1kwdEdmYitwMExLeEc5WlNmNjI4LzNDS2R2XG5xUDNhYStSWEdRNlJzL243eE9Hb0cydFpTeVRjSkN0NUJjNDhjd1RzcFR1K2l4aGlZMUx5bnNTVDlWWDcwK3IvXG5wTjl3ZndYM3YvcUI1NEphK1c0UFZDWlNERlp0NjNiUXVOZExwVk81QW9HQURlVUk4OGRHdGEwaDFRaWxJSk5ZXG5VZ1ZXcHdRWGYxbnNKa0wycEdoSjlpRDMvYzJGMURSV1Znci9zMERrUkEzVnR5aldBOWU0R0tiS3BmbmlFYy9kXG5jYjlGbjB3dFJnc21CY2ZPZ3NhVGY4Z3cvMXF6RTFGbWtJL1NCYWM1UkF2K3NmQWtEdU1IT01tZ1d6eDZpTmNwXG5rZmJ2emhUdFlkWUFmbjV2UTZpbzFLRT1cbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJhbGxpYW56LXJhZy1zZXJ2aWNlQGdlbi1sYW5nLWNsaWVudC0wMDMwNTg0NjUyLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAiY2xpZW50X2lkIjogIjExMjM1OTE4NzM2MDQ3MzE4MDQyNCIsCiAgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwKICAidG9rZW5fdXJpIjogImh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIiwKICAiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS9jZXJ0cyIsCiAgImNsaWVudF94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvYWxsaWFuei1yYWctc2VydmljZSU0MGdlbi1sYW5nLWNsaWVudC0wMDMwNTg0NjUyLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAidW5pdmVyc2VfZG9tYWluIjogImdvb2dsZWFwaXMuY29tIgp9Cg==
```

### 2. GOOGLE_CLOUD_PROJECT

```
GOOGLE_CLOUD_PROJECT=gen-lang-client-0030584652
```

### 3. GOOGLE_DOCUMENT_AI_PROCESSOR_ID

```
GOOGLE_DOCUMENT_AI_PROCESSOR_ID=4a2fd5a9ffae6d21
```

### 4. GOOGLE_DOCUMENT_AI_LOCATION

```
GOOGLE_DOCUMENT_AI_LOCATION=eu
```

## Procédure d'ajout sur Vercel

1. **Allez dans les settings du projet :**
   ```
   https://vercel.com/[votre-compte]/[nom-projet]/settings/environment-variables
   ```

2. **Pour chaque variable :**
   - Cliquez sur "Add New"
   - **Name:** Copiez le nom exact (ex: `GOOGLE_APPLICATION_CREDENTIALS_BASE64`)
   - **Value:** Collez la valeur correspondante
   - **Environments:** Sélectionnez **Production, Preview, Development**
   - Cliquez sur "Save"

3. **Redéployez l'application :**
   - Allez dans l'onglet "Deployments"
   - Cliquez sur les 3 points du dernier déploiement
   - Cliquez sur "Redeploy"

## Vérification

Après le déploiement, testez :

1. **Upload de PDF (Admin) :**
   - Allez sur `/admin/outils`
   - Uploadez un PDF de test
   - Vérifiez dans les logs Vercel que Document AI est appelé

2. **Analyse d'image (Chatbot) :**
   - Collez une image dans le chatbot
   - Vérifiez que Vision AI extrait le texte

## Logs à surveiller

Dans les logs Vercel, vous devriez voir :

```
[Document AI] Début extraction PDF...
[Document AI] Extraction réussie en Xms - Y caractères
```

ou

```
[Vision AI] Début analyse...
[Vision AI] Analyse réussie en Xms - Y caractères
```

## Coûts estimés

- **Document AI :** $1.50 / 1000 pages (~$1.50/mois)
- **Vision AI :** $1.50 / 1000 images (~$0.08/mois)
- **Total :** ~$2/mois

## Troubleshooting

### Erreur "GOOGLE_APPLICATION_CREDENTIALS_BASE64 est requis"

➡️ Vérifiez que la variable est bien ajoutée sur Vercel et redéployez.

### Erreur "Impossible d'extraire le texte du PDF"

➡️ Vérifiez que le processor Document AI existe et est actif dans la console Google Cloud.

### Erreur 403 "Permission denied"

➡️ Vérifiez que le compte de service a bien les rôles `Document AI API User` et `Cloud Vision API User`.

