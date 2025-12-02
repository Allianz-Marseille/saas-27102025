# Configuration du Domaine Personnalisé : notre-saas-agence.com

Ce guide vous explique comment connecter votre domaine `notre-saas-agence.com` à votre application Vercel.

---

## 📋 Étape 1 : Ajouter le domaine dans Vercel

### 1.1 Accéder aux paramètres de domaines

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Ouvrez votre projet : `saas-27102025-4zjt` (ou `saas-allianz-marseille`)
3. Cliquez sur **Settings** → **Domains** (dans le menu de gauche)

### 1.2 Ajouter le domaine

1. Dans la section "Domains", cliquez sur **"Add domain"** ou **"+ Add"**
2. Entrez : `notre-saas-agence.com`
3. Cliquez sur **"Add"** ou **"Next"**

### 1.3 Configurer les DNS

Vercel va vous donner des instructions pour configurer les DNS. Vous devrez :

**Option A : Domaine racine (notre-saas-agence.com探店)**
- Ajouter un enregistrement **A** ou **CNAME** selon ce que Vercel recommande
- Vercel fournira l'adresse IP ou l'alias à utiliser

**Option B : Sous-domaine www (www.notre-saas-agence.com)**
- Ajouter un enregistrement **CNAME** pointant vers `cname.vercel-dns.com` ou l'URL fournie par Vercel

---

## 📋 Étape 2 : Configurer les DNS chez votre registrar

### 2.1 Accéder aux paramètres DNS

1. Connectez-vous à votre registrar (là où vous avez acheté le domaine)
   - Exemples : OVH, Gandi, Namecheap, GoDaddy, etc.

2. Allez dans la section **"DNS Management"** ou **"Paramètres DNS"**

### 2.2 Ajouter les enregistrements DNS

**Selon les instructions Vercel, vous devrez ajouter :**

#### Pour le domaine racine (notre-saas-agence.com) :

**Option 1 : Enregistrement A**
```
Type: A
Name: @ (ou laissez vide)
Value: [adresse IP fournie par Vercel]
TTL: 3600 (ou automatique)
```

**Option 2 : Enregistrement CNAME** (si supporté par votre registrar)
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com (ou l'alias fourni par Vercel)
TTL: 3600
```

#### Pour www (optionnel mais recommandé) :

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com (ou l'alias fourni par Vercel)
TTL: 3600
```

### 2.3 Sauvegard久了 les modifications

1. Sauvegardez les changements DNS
2. Les modifications peuvent prendre **5 minutes à 48 heures** pour se propager (généralement 15-30 minutes)

---

## 📋 Étape 3 : Vérifier dans Vercel

1. **Retournez dans Vercel** → Settings → Domains
2. Vercel va automatiquement vérifier la configuration DNS
3. Une fois validé, vous verrez un ✅ vert avec "Valid Configuration"
4. Un certificat SSL sera automatiquement généré (gratuit)

---

## 📋 Étape 4 : Ajouter le domaine dans Firebase Auth

⚠️ **IMPORTANT** : Vous devez ajouter ce domaine dans Firebase Auth pour que la connexion fonctionne.

### 4.1 Dans Firebase Console

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez le projet : `saas-27102025`
3. Allez dans **Authentication** → **Settings** (⚙️) → **Authorized domains**

### 4.2 Ajouter le domaine

1. Cliquez sur **"Add domain"**
2. Entrez : `notre-saas-agence.com`
3. Cliquez sur **"Add"**

### 4.3 Vérifier la liste complète

Assurez-vous que ces domaines sont présents :
- ✅ `localhost` (pour le dev local)
- ✅ `notre-saas-agence.com` (votre nouveau domaine)
- ✅ `saas-27102025-4zjt.vercel.app` (domaine Vercel par défaut)
- ✅ `www.notre-saas-agence.com` (si vous utilisez www)

---

## 📋 Étape 5 : Vérifier que tout fonctionne

1. **Attendez que les DNS se propagent** (vérifier avec : [whatsmydns.net](https://www.whatsmydns.net))
2. **Ouvrez** : `https://notre-saas-agence.com`
3. **Testez la connexion** avec un utilisateur
4. **Vérifiez la console** (F12) pour voir s'il n'y a plus d'erreurs

---

## 🔧 Dépannage

### Le domaine ne se charge pas

**Vérifications :**
1. Les DNS sont-ils correctement configurés ? (vérifier sur [whatsmydns.net](https://www.whatsmydns.net))
2. Les enregistrements DNS sont-ils sauvegardés ?
3. Avez-vous attendu assez longtemps ? (jusqu'à 48h parfois)

### Erreur SSL/Certificat

- Vercel génère automatiquement les certificats SSL (gratuit)
- Si l'erreur persiste, attendez quelques minutes que Vercel génère le certificat

### Erreur 400 Firebase Auth

- Vérifiez que `notre-saas-agence.com` est bien dans la liste des domaines autorisés Firebase
- Vérifiez aussi `www.notre-saas-agence.com` si vous l'utilisez

### Redirection www vers racine (ou inversement)

Dans Vercel → Settings → Domains, vous pouvez configurer la redirection automatique.

---

## ✅ Checklist finale

- [ ] Domaine ajouté dans Vercel
- [ ] DNS configurés chez le registrar
- [ ] DNS vérifiés dans Vercel (✅ vert)
- [ ] Certificat SSL généré (automatique)
- [ ] Domaine ajouté dans Firebase Auth (Authorized domains)
- [ ] Site accessible sur `https://notre-saas業-agence.com`
- [ ] Connexion fonctionne sans erreur 400

---

## 📚 Ressources

- [Documentation Vercel - Domaines](https://vercel.com/docs/concepts/projects/domains)
- [Vérifier la propagation DNS](https://www.whatsmydns.net)
- [Firebase Auth - Authorized domains](https://firebase.google.com/docs/auth/web/custom-domain)

---

## 🎉 C'est tout !

Une fois configuré, votre application sera accessible sur `https://notre-saas-agence.com` avec un certificat SSL gratuit !

