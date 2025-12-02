# Configuration Manuelle des Utilisateurs

Ce guide explique comment créer manuellement les documents utilisateurs dans Firestore sans utiliser le script de synchronisation.

## 📋 Méthode 1 : Via la Console Firebase (Recommandé)

### Étape 1 : Récupérer les UID

1. Allez dans [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez le projet `saas-27102025`
3. Cliquez sur **Authentication** dans le menu de gauche
4. Dans l'onglet **Users**, vous verrez tous les utilisateurs
5. **Copiez l'UID** de chaque utilisateur

### Étape 2 : Créer les documents Firestore

1. Dans la console Firebase, allez sur **Firestore Database**
2. Cliquez sur **Create database** si c'est la première fois
3. Choisissez le mode **Production mode** et sélectionnez une région
4. Dans la collection `users` (créez-la si elle n'existe pas), cliquez sur **Add document**

### Structure à créer pour chaque utilisateur

#### Administrateurs

**Document 1 : jeanmichel@allianz-nogaro.fr**
- **Document ID** : `[UID de jeanmichel]`
- **Champs** :
  ```json
  {
    "id": "[UID de jeanmichel]",
    "email": "jeanmichel@allianz-nogaro.fr",
    "role": "ADMINISTRATEUR",
    "active": true,
    "createdAt": "[Date actuelle en Timestamp]"
  }
  ```

**Document 2 : julien.boetti@allianz-nogaro.fr**
- **Document ID** : `[UID de julien]`
- **Champs** :
  ```json
  {
    "id": "[UID de julien]",
    "email": "julien.boetti@allianz-nogaro.fr",
    "role": "ADMINISTRATEUR",
    "active": true,
    "createdAt": "[Date actuelle en Timestamp]"
  }
  ```

#### CDC Commercial

**Documents 3-8** (gwendal, emma, joelle, astrid, corentin, donia) :
- **Document ID** : `[UID de l'utilisateur]`
- **Champs** :
  ```json
  {
    "id": "[UID de l'utilisateur]",
    "email": "email@allianz-nogaro.fr",
    "role": "CDC_COMMERCIAL",
    "active": true,
    "createdAt": "[Date actuelle en Timestamp]"
  }
  ```

### 📝 Liste des utilisateurs à créer

| Email | Rôle |
|-------|------|
| jeanmichel@allianz-nogaro.fr | ADMINISTRATEUR |
| julien.boetti@allianz-nogaro.fr | ADMINISTRATEUR |
| gwendal.clouet@allianz-nogaro.fr | CDC_COMMERCIAL |
| emma@allianz-nogaro.fr | CDC_COMMERCIAL |
| joelle.abikaram@allianz-nogaro.fr | CDC_COMMERCIAL |
| astrid.ulrich@allianz-nogaro.fr | CDC_COMMERCIAL |
| corentin.ulrich@allianz-nogaro.fr | CDC_COMMERCIAL |
| donia.sahraoui@allianz-nogaro.fr | CDC_COMMERCIAL |

## 🛠️ Méthode 2 : Via un Script Client-Side

Si vous préférez utiliser un script côté client, voici une alternative :

1. Créez une page temporaire dans votre application
2. Connectez-vous en tant qu'admin
3. Exécutez le script pour créer les utilisateurs

Cette méthode nécessite que vous soyez connecté à Firebase.

## ⚡ Méthode 3 : Via Firebase CLI

Si vous avez Firebase CLI installé :

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Initialiser Firestore (si pas déjà fait)
firebase init firestore

# Utiliser les règles et index déjà créés
```

## 🔍 Vérification

Après avoir créé les documents, vérifiez que tout fonctionne :

1. Allez sur `/login`
2. Connectez-vous avec un compte admin
3. Vous devriez être redirigé vers `/admin`
4. Connectez-vous avec un compte CDC
5. Vous devriez être redirigé vers `/dashboard`

## 📚 Ressources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Console](https://console.firebase.google.com)
- [Firebase CLI](https://firebase.google.com/docs/cli)
