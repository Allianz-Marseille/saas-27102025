# Configuration Google Cloud AI - Guide pas à pas

## 📋 Checklist rapide

- [ ] Créer projet Google Cloud
- [ ] Activer la facturation ($300 crédit gratuit)
- [ ] Activer Document AI API
- [ ] Activer Vision AI API
- [ ] Créer compte de service
- [ ] Télécharger clé JSON
- [ ] Créer processeur Document AI
- [ ] Configurer variables d'environnement

---

## Étape 1 : Créer un projet Google Cloud

### 1.1 Aller sur la console

**Lien :** https://console.cloud.google.com/

### 1.2 Créer le projet

1. Cliquez sur le sélecteur de projet (en haut à gauche)
2. Cliquez sur **"Nouveau projet"**
3. Nom du projet : `allianz-rag` (ou autre nom)
4. Cliquez sur **"Créer"**
5. Attendez quelques secondes

### 1.3 Activer la facturation

**Lien :** https://console.cloud.google.com/billing

1. Sélectionnez votre projet
2. Cliquez sur **"Associer un compte de facturation"**
3. Créez un compte de facturation si nécessaire
4. **Ajoutez une carte bancaire**
   - ⚠️ Vous ne serez pas facturé immédiatement
   - ✅ Vous avez **$300 de crédit gratuit** pour 3 mois
   - ✅ Les APIs ne factureront rien sans votre autorisation

---

## Étape 2 : Activer les APIs

### 2.1 Document AI (pour vectorisation admin)

**Lien direct :** https://console.cloud.google.com/apis/library/documentai.googleapis.com

1. Assurez-vous que votre projet est sélectionné (en haut)
2. Cliquez sur **"Activer"**
3. Attendez ~30 secondes

### 2.2 Vision AI (pour analyse chatbot)

**Lien direct :** https://console.cloud.google.com/apis/library/vision.googleapis.com

1. Assurez-vous que votre projet est sélectionné
2. Cliquez sur **"Activer"**
3. Attendez ~30 secondes

---

## Étape 3 : Créer un compte de service

### 3.1 Aller sur IAM

**Lien :** https://console.cloud.google.com/iam-admin/serviceaccounts

### 3.2 Créer le compte

1. Cliquez sur **"+ Créer un compte de service"**
2. **Nom du compte de service :** `allianz-rag-service`
3. **Description :** `Service pour extraction PDF et OCR`
4. Cliquez sur **"Créer et continuer"**

### 3.3 Ajouter les rôles

**Rôles nécessaires :**

1. Dans "Accorder à ce compte de service l'accès au projet" :
   - Recherchez : `Document AI API User`
   - Cliquez sur **"+ Ajouter un autre rôle"**
   - Recherchez : `Cloud Vision API User`
2. Cliquez sur **"Continuer"**
3. Cliquez sur **"OK"** (pas besoin d'accès utilisateur)

### 3.4 Créer et télécharger la clé JSON

1. Dans la liste des comptes de service, cliquez sur `allianz-rag-service`
2. Allez dans l'onglet **"Clés"**
3. Cliquez sur **"Ajouter une clé"** → **"Créer une clé"**
4. Sélectionnez **"JSON"**
5. Cliquez sur **"Créer"**
6. **Le fichier JSON se télécharge automatiquement**
7. ⚠️ **Sauvegardez ce fichier en sécurité** (ne le commitez JAMAIS dans git)

---

## Étape 4 : Créer un processeur Document AI

### 4.1 Aller sur Document AI

**Lien :** https://console.cloud.google.com/ai/document-ai/processors

### 4.2 Créer le processeur

1. Cliquez sur **"Créer un processeur"**
2. **Type de processeur :**
   - Recherchez : `Document OCR`
   - Sélectionnez **"Document OCR"**
3. **Nom du processeur :** `allianz-pdf-ocr`
4. **Région :** Sélectionnez **"EU"** (Europe)
5. Cliquez sur **"Créer"**

### 4.3 Récupérer le Processor ID

1. Cliquez sur le processeur que vous venez de créer
2. En haut, vous verrez une URL comme :
   ```
   projects/123456789/locations/eu/processors/abc123def456
   ```
3. **Copiez la partie après `/processors/`** : `abc123def456`
4. C'est votre **PROCESSOR_ID**

---

## Étape 5 : Configurer les variables d'environnement

### 5.1 Convertir le fichier JSON en Base64

**Sur Mac/Linux :**
```bash
cat chemin/vers/votre-service-account.json | base64 | tr -d '\n'
```

**Sur Windows (PowerShell) :**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("chemin\vers\votre-service-account.json"))
```

### 5.2 Ajouter dans `.env.local`

Créez ou modifiez le fichier `.env.local` à la racine du projet :

```bash
# Google Cloud Project ID (trouvable dans la console)
GOOGLE_CLOUD_PROJECT=allianz-rag

# Service Account en Base64 (résultat de la commande ci-dessus)
GOOGLE_APPLICATION_CREDENTIALS_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW...

# Document AI Processor
GOOGLE_DOCUMENT_AI_PROCESSOR_ID=abc123def456
GOOGLE_DOCUMENT_AI_LOCATION=eu
```

### 5.3 Ajouter sur Vercel

**Vercel → Settings → Environment Variables**

Ajoutez les **4 mêmes variables** :
1. `GOOGLE_CLOUD_PROJECT`
2. `GOOGLE_APPLICATION_CREDENTIALS_BASE64`
3. `GOOGLE_DOCUMENT_AI_PROCESSOR_ID`
4. `GOOGLE_DOCUMENT_AI_LOCATION`

Pour chaque variable :
- Environnements : **Production**, **Preview**, **Development**

---

## Récapitulatif des informations nécessaires

À la fin de cette configuration, vous devez avoir :

| Variable | Exemple | Où la trouver |
|----------|---------|---------------|
| `GOOGLE_CLOUD_PROJECT` | `allianz-rag` | Console → Sélecteur de projet |
| `GOOGLE_APPLICATION_CREDENTIALS_BASE64` | `eyJ0eXBlI...` | Fichier JSON → Base64 |
| `GOOGLE_DOCUMENT_AI_PROCESSOR_ID` | `abc123def456` | Document AI → Processeur |
| `GOOGLE_DOCUMENT_AI_LOCATION` | `eu` | Document AI → Région |

---

## Vérification rapide

### Test de configuration

Une fois le code implémenté, vous pourrez tester avec :

```bash
npm run test:rag
```

Cela vérifiera :
- ✅ Connexion à Google Cloud
- ✅ Accès Document AI
- ✅ Accès Vision AI
- ✅ Extraction de texte fonctionnelle

---

## Coûts estimés

### Facturation mensuelle attendue

| Service | Usage | Tarif | Coût/mois |
|---------|-------|-------|-----------|
| Document AI | 100 PDFs × 10 pages | $1.50/1000 pages | ~$1.50 |
| Vision AI | 50 analyses | $1.50/1000 images | ~$0.08 |
| **TOTAL** | | | **~$1.58/mois** |

### Crédit gratuit

- ✅ **$300 de crédit gratuit** pendant 3 mois
- ✅ Aucun frais jusqu'à épuisement du crédit
- ✅ Alerte email quand 50%, 90% et 100% du crédit est utilisé

---

## Support

### Liens utiles

- **Console :** https://console.cloud.google.com/
- **Documentation Document AI :** https://cloud.google.com/document-ai/docs
- **Documentation Vision AI :** https://cloud.google.com/vision/docs
- **Support Google Cloud :** https://cloud.google.com/support

### Problèmes courants

**Erreur : "API not enabled"**
→ Retournez sur https://console.cloud.google.com/apis et activez l'API

**Erreur : "Permission denied"**
→ Vérifiez que les rôles sont bien ajoutés au compte de service

**Erreur : "Invalid credentials"**
→ Régénérez la clé JSON et convertissez-la à nouveau en Base64

---

## Prochaines étapes

Une fois cette configuration terminée :

1. ✅ Dites-moi que c'est fait
2. ✅ Je lance l'implémentation du code
3. ✅ On teste en local
4. ✅ On déploie en production

**Temps estimé : 15 minutes** ⏱️

