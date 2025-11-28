# 🔥 Déployer les règles Firestore manuellement

## ⚠️ IMPORTANT : Les règles doivent être déployées !

Les règles Firestore ont été modifiées dans `firestore.rules` mais **doivent être déployées manuellement** sur Firebase.

## 📋 Marche à suivre :

### 1. Aller sur la Console Firebase
🔗 https://console.firebase.google.com/

### 2. Sélectionner votre projet
Cliquer sur le projet correspondant

### 3. Aller dans Firestore Database
- Dans le menu latéral gauche, cliquer sur **"Firestore Database"**
- Cliquer sur l'onglet **"Règles"** (Rules)

### 4. Copier les règles
Ouvrir le fichier `firestore.rules` dans votre projet et **copier tout le contenu**

### 5. Coller dans Firebase Console
- **Supprimer** tout le contenu actuel dans l'éditeur de la console
- **Coller** le nouveau contenu des règles
- Cliquer sur **"Publier"** (Publish)

### 6. Attendre la confirmation
Un message de succès devrait apparaître : "Règles publiées avec succès"

---

## 📝 Règles à déployer :

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMINISTRATEUR';
    }
    
    // Helper function to check if user is CDC
    function isCDC() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'CDC_COMMERCIAL';
    }
    
    // Helper function to check if user is Commercial Santé Individuel
    function isCommercialSante() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'COMMERCIAL_SANTE_INDIVIDUEL';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if false; // Only server-side
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Acts collection
    match /acts/{actId} {
      allow read: if isAuthenticated();
      allow create: if isCDC();
      allow update: if isCDC() && resource.data.userId == request.auth.uid;
      allow delete: if isAdmin() || (isCDC() && resource.data.userId == request.auth.uid);
    }
    
    // Companies collection
    match /companies/{companyId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Commission rules collection
    match /commissionRules/{ruleId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Health acts collection (Santé Individuelle)
    match /health_acts/{actId} {
      allow read: if isAuthenticated();
      allow create: if isCommercialSante();
      allow update: if isAdmin() || (isCommercialSante() && resource.data.userId == request.auth.uid);
      allow delete: if isAdmin() || (isCommercialSante() && resource.data.userId == request.auth.uid);
    }
    
    // Logs collection
    match /logs/{logId} {
      allow read: if isAdmin(); // Only admins can read logs
      allow create: if isAuthenticated(); // Any authenticated user can create logs
      allow update: if false; // Logs are immutable
      allow delete: if false; // Logs cannot be deleted to preserve audit trail
    }
  }
}
```

---

## ✅ Après le déploiement :

1. Rafraîchir la page de l'application
2. Réessayer de créer un acte de santé
3. L'erreur "Missing or insufficient permissions" devrait disparaître

---

## 🔍 Vérifier que les règles sont bien déployées :

Dans la console Firebase, vous devriez voir dans l'éditeur de règles :
- ✅ `isCommercialSante()` dans les fonctions helper
- ✅ `match /health_acts/{actId}` avec `allow create: if isCommercialSante();`
- ✅ `allow update: if isAdmin() || (isCommercialSante() && resource.data.userId == request.auth.uid);`

Si ces lignes ne sont pas présentes, les règles n'ont pas été déployées !

