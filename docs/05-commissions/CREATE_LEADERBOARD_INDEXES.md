# Création des Index Firestore pour le Leaderboard

## 🔥 Problème

Les classements affichent "Aucune donnée disponible" car les **index Firestore** sont manquants.

Les requêtes `where() + orderBy()` sur la collection `leaderboard` nécessitent des index composites.

---

## ✅ Solution Rapide : Via les Liens d'Erreur

### Étape 1 : Ouvrir la Console du Navigateur

1. Sur la page dashboard, appuyez sur **F12** (ou clic droit → Inspecter)
2. Allez dans l'onglet **Console**
3. Vous devriez voir des erreurs rouges : `FirebaseError: The query requires an index`

### Étape 2 : Cliquer sur les Liens

Chaque erreur contient un lien qui ressemble à :
```
https://console.firebase.google.com/v1/r/project/saas-27102025/firestore/in_m...
```

**Cliquez sur CHAQUE lien** (vous devriez en avoir 2) :
1. Un pour `monthKey + commissions`
2. Un pour `monthKey + process`

### Étape 3 : Créer les Index

Pour chaque lien :
1. La page Firebase s'ouvre avec la configuration pré-remplie
2. Cliquez sur **"Create Index"** (Créer l'index)
3. Attendez que le statut passe de "Building" à "Enabled" (1-2 minutes)

### Étape 4 : Rafraîchir le Dashboard

Une fois **tous les index créés** (statut "Enabled"), rafraîchissez votre dashboard.

✅ Les classements TOP 3 devraient s'afficher !

---

## 🛠️ Solution Alternative : Console Firebase

Si les liens ne fonctionnent pas, créez manuellement les index :

### 1. Aller sur Firebase Console

https://console.firebase.google.com/project/saas-27102025/firestore/indexes

### 2. Créer l'Index pour Commissions

Cliquez sur **"Create Index"**

**Configuration** :
- Collection ID: `leaderboard`
- Fields:
  - Field: `monthKey`, Order: `Ascending`
  - Field: `commissions`, Order: `Descending`
- Query scopes: `Collection`

Cliquez sur **"Create"**

### 3. Créer l'Index pour Process

Cliquez sur **"Create Index"**

**Configuration** :
- Collection ID: `leaderboard`
- Fields:
  - Field: `monthKey`, Order: `Ascending`
  - Field: `process`, Order: `Descending`
- Query scopes: `Collection`

Cliquez sur **"Create"**

### 4. (Optionnel) Créer l'Index pour CA

**Configuration** :
- Collection ID: `leaderboard`
- Fields:
  - Field: `monthKey`, Order: `Ascending`
  - Field: `ca`, Order: `Descending`
- Query scopes: `Collection`

Cliquez sur **"Create"**

---

## 📊 Vérification

### Dans Firebase Console

1. Allez sur : https://console.firebase.google.com/project/saas-27102025/firestore/indexes
2. Vérifiez que tous les index ont le statut **"Enabled"** (vert)
3. Vous devriez voir :
   - `leaderboard: monthKey (Asc), commissions (Desc)` ✅
   - `leaderboard: monthKey (Asc), process (Desc)` ✅
   - `leaderboard: monthKey (Asc), ca (Desc)` ✅ (optionnel)

### Dans le Dashboard

1. Rafraîchissez la page dashboard
2. Vérifiez la console du navigateur (F12) : **plus d'erreurs Firebase**
3. Les deux widgets de classement devraient afficher :

**Commissions Potentielles**
```
🏆 Top 3 du mois
🥇 Joelle         1330€
🥈 Astrid          830€
🥉 Donia           700€
```

**Classement Process**
```
🔥 Top 3 du mois
🥇 Joelle          59 process
🥈 Corentin        45 process
🥉 Donia           44 process
```

---

## ⏱️ Temps de Création des Index

- **Petit volume** (< 1000 documents) : 1-2 minutes
- **Volume moyen** (1000-10000 documents) : 5-10 minutes
- **Grand volume** (> 10000 documents) : 15-30 minutes

La collection `leaderboard` ne contient que 7 documents actuellement, donc **la création devrait prendre ~1 minute par index**.

---

## 🚀 Déploiement Automatique (Pour les Prochaines Fois)

Pour déployer les index via Firebase CLI :

### 1. S'authentifier

```bash
firebase login
```

### 2. Sélectionner le Projet

```bash
firebase use saas-27102025
```

### 3. Déployer les Index

```bash
firebase deploy --only firestore:indexes
```

Les index sont définis dans `firestore.indexes.json` et seront automatiquement créés.

---

## 📝 Index Créés

Le fichier `firestore.indexes.json` contient maintenant :

```json
{
  "collectionGroup": "leaderboard",
  "fields": [
    { "fieldPath": "monthKey", "order": "ASCENDING" },
    { "fieldPath": "commissions", "order": "DESCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "leaderboard",
  "fields": [
    { "fieldPath": "monthKey", "order": "ASCENDING" },
    { "fieldPath": "process", "order": "DESCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "leaderboard",
  "fields": [
    { "fieldPath": "monthKey", "order": "ASCENDING" },
    { "fieldPath": "ca", "order": "DESCENDING" }
  ]
}
```

---

## ✅ Checklist

- [ ] Cliquer sur les liens d'erreur dans la console du navigateur
- [ ] Créer l'index `monthKey + commissions`
- [ ] Créer l'index `monthKey + process`
- [ ] Attendre que les index soient "Enabled"
- [ ] Rafraîchir le dashboard
- [ ] Vérifier que les classements s'affichent

---

**Date** : 29 novembre 2025  
**Durée estimée** : 2-3 minutes  
**Fichiers modifiés** :
- `firestore.indexes.json` ✅
- `firebase.json` ✅ (créé)

