# Déploiement Vercel - Variables d'environnement Google Cloud

> **Note :** Nous utilisons des variables séparées au lieu d'une seule variable Base64 pour éviter les problèmes de troncature sur Vercel.

## Variables à ajouter sur Vercel

Allez sur : **https://vercel.com/votre-projet/settings/environment-variables**

### Étape 1 : Supprimer l'ancienne variable (si elle existe)

Si vous aviez déjà configuré `GOOGLE_APPLICATION_CREDENTIALS_BASE64`, **supprimez-la** avant de continuer.

### Étape 2 : Ajouter les nouvelles variables

#### 1. GOOGLE_CLOUD_PROJECT

```
GOOGLE_CLOUD_PROJECT=gen-lang-client-0030584652
```

#### 2. GOOGLE_PRIVATE_KEY_ID

```
GOOGLE_PRIVATE_KEY_ID=747c3c29ccae008afb3d05616d9d6573e3e217ee
```

#### 3. GOOGLE_PRIVATE_KEY

**Important :** Copiez la clé EN ENTIER, avec les retours à la ligne.

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC4sJKV7CqvnUQ9
L/Cu4PB1h8VgzUEAalauRBwD5mLg3/Cr3JN4r4vJYoGvbSvS5Xcr8yYLHNh0W9xY
+nq/9x1cvltoK/6x2koiHluJBhNoeFYS9JGcy5JYYHnKTo+S1eSac/iYxUKJGh+b
UwH+Cwx0FKer6ag4/OPrBZKvpUdlEEPnHdSGB4CQ1bBmnO75CFIP5fPCLdC+gs1J
0OKwzT6sgwlBqid2zv9n6oX/vusbHyu9mKGs6KMICx2czyruoL2lo1ds1lupOJZH
41p7KLDNCGXlPRonEOC+IMTz10d/QQxPpJj5CUemL+hRGVn3JjgpXs/1VIutz0BZ
HWFizDPxAgMBAAECggEADLv6A3XS9KRgk+J2EyzFz6jConvMh1GNs/rUvq0YNL6k
Gsl87pWWCxbsb7LUknhJaQGdJieBQjaiQQ1WQN2yS9aBOXPNHii5s1QKBi7h0DJ5
5tkvoBLGPqs6Qol7q0ltt3uXELuLLKZdNwm4abKL04YoEHmuJG3FbktGU6+O9mgU
JATVdiFoKOzjQ+doGwkT+xuyILkBYoNM82uUSa41t0qhtxYZxW0CZ4v44QpnaZ+g
2iJX4jG3dJFgJjinKTniy+TfzCCNR6VTzE28DJVh5h4fff2zn+nU2urCY9KDkgrc
dBdOyLZeSMix8uWr0tqn8NnparfPg+p6ggWWvZjQdQKBgQD7rhSM0PXPl/4PV6oh
zGYA6KBbjlWW9XsZ/AiA41UnmF8hmnK3esq4ZQ+Vs2P2GNJBydVuPR5kU4x92DCr
f2tVup5nHahNjM0AUdW3NauT1vUwXULSUP5A+CjcO82jpH0CElTw0Ymqd/PniKtP
d/ZEEQDjjuYrmPcXK01Po/J0LQKBgQC73CCF5mSSdbd0JP2mYnU/rft3ELK6yGHZ
7bZFCV2N3Yy59ujBNX1BRZlo4hKdMg50m/tmR80180Lp8w6tVH6AP61ik/cJTGnN
7T3tsfuXcdT4QTFwk8b6NJragjHQICQb+XugZEdCPoJTCaFmAP6JF3ujBwAvvmR6
5pD8VZnFVQKBgGf1xVlRa2gf0XsG7Cjf5HaVoL+Q8LvVlM7r85tBzEf5wboAsUgm
+ZvnauOcYTsjj55LP9U0e9xXQp4s8hW1IWIdHxdbAc1ezsNGCnCOQ9xim48pxtNX
T18I4t/t+AiThmuXpOyAsUvwFpjaNGE0HU6Kc4KL4Xm6yr4QTfQKtbjVAoGBALbg
BTEUJVeGDL6du+aa9jS1c5RmxvaZVthFVihCg7Y0tGfb+p0LKxG9ZSf628/3CKdv
qP3aa+RXGQ6Rs/n7xOGoG2tZSyTcJCt5Bc48cwTspTu+ixhiY1LynsST9VX70+r/
pN9wfwX3v/qB54Ja+W4PVCZSDFZt63bQuNdLpVO5AoGADeUI88dGta0h1QilIJNY
UgVWpwQXf1nsJkL2pGhJ9iD3/c2F1DRWVgr/s0DkRA3VtyjWA9e4GKbKpfniEc/d
cb9Fn0wtRgsmBcfOgsaTf8gw/1qzE1FmkI/SBac5RAv+sfAkDuMHOMmgWzx6iNcp
kfbvzhTtYdYAfn5vQ6io1KE=
-----END PRIVATE KEY-----
```

#### 4. GOOGLE_CLIENT_EMAIL

```
GOOGLE_CLIENT_EMAIL=allianz-rag-service@gen-lang-client-0030584652.iam.gserviceaccount.com
```

#### 5. GOOGLE_CLIENT_ID

```
GOOGLE_CLIENT_ID=112359187360473180424
```

#### 6. GOOGLE_CLIENT_CERT_URL

```
GOOGLE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/allianz-rag-service%40gen-lang-client-0030584652.iam.gserviceaccount.com
```

#### 7. GOOGLE_DOCUMENT_AI_PROCESSOR_ID

```
GOOGLE_DOCUMENT_AI_PROCESSOR_ID=4a2fd5a9ffae6d21
```

#### 8. GOOGLE_DOCUMENT_AI_LOCATION

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
   - **Name:** Copiez le nom exact (ex: `GOOGLE_CLOUD_PROJECT`)
   - **Value:** Collez la valeur correspondante
   - **Environments:** Sélectionnez **Production, Preview, Development**
   - Cliquez sur "Save"
   - **Important pour `GOOGLE_PRIVATE_KEY` :** Vérifiez que les retours à la ligne sont préservés

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

### Erreur "Credentials Google Cloud manquants"

➡️ Vérifiez que vous avez bien ajouté les 8 variables sur Vercel et redéployez.

### Erreur "Credentials Google Cloud incomplets"

➡️ Vérifiez particulièrement `GOOGLE_PRIVATE_KEY` - elle doit contenir la clé complète avec `-----BEGIN PRIVATE KEY-----` et `-----END PRIVATE KEY-----`.

### Erreur "Impossible d'extraire le texte du PDF"

➡️ Vérifiez que le processor Document AI existe et est actif dans la console Google Cloud.

### Erreur 403 "Permission denied"

➡️ Vérifiez que le compte de service a bien les rôles `Document AI API User` et `Cloud Vision API User`.

