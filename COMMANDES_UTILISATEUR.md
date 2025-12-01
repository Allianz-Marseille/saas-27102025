# Commandes pour l'utilisateur GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2

## 📋 Informations complètes de l'utilisateur

```bash
# Récupérer toutes les informations (Auth, Firestore, Actes, Logs, Leaderboard)
npm run get-user-info GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2

# Ou avec ts-node directement
npx ts-node --project tsconfig.scripts.json scripts/get-user-info.ts GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2
```

## 🔐 Firebase Auth

```bash
# Voir les informations Firebase Auth (via Firebase CLI)
firebase auth:export users.json --project saas-27102025
# Puis chercher l'UID dans le fichier JSON

# Ou via script Node.js
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.auth().getUser('GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2').then(user => console.log(JSON.stringify(user, null, 2)));
"
```

## 📄 Firestore - Récupérer les données utilisateur

```bash
# Via Firebase CLI
firebase firestore:get users/GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2 --project saas-27102025

# Via script Node.js
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('users').doc('GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2').get().then(doc => console.log(JSON.stringify(doc.data(), null, 2)));
"
```

## 📝 Actes créés par cet utilisateur

```bash
# Via script Node.js - Tous les actes
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('acts')
  .where('userId', '==', 'GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2')
  .orderBy('dateSaisie', 'desc')
  .get()
  .then(snapshot => {
    console.log('Total actes:', snapshot.size);
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(\`- [\${data.kind}] \${data.clientNom} - \${data.dateSaisie?.toDate?.()?.toLocaleDateString('fr-FR')}\`);
    });
  });
"

# Actes d'un mois spécifique (ex: décembre 2024)
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('acts')
  .where('userId', '==', 'GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2')
  .where('moisKey', '==', '2024-12')
  .get()
  .then(snapshot => {
    console.log('Actes décembre 2024:', snapshot.size);
    snapshot.docs.forEach(doc => console.log(JSON.stringify(doc.data(), null, 2)));
  });
"
```

## 🏥 Actes santé créés par cet utilisateur

```bash
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('health_acts')
  .where('userId', '==', 'GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2')
  .orderBy('dateSaisie', 'desc')
  .get()
  .then(snapshot => {
    console.log('Total actes santé:', snapshot.size);
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(\`- [\${data.kind}] \${data.clientNom} - \${data.dateSaisie?.toDate?.()?.toLocaleDateString('fr-FR')}\`);
    });
  });
"
```

## 📊 Logs de cet utilisateur

```bash
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('logs')
  .where('userId', '==', 'GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2')
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get()
  .then(snapshot => {
    console.log('Total logs:', snapshot.size);
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(\`- [\${data.action}] \${data.message} - \${data.timestamp?.toDate?.()?.toLocaleString('fr-FR')}\`);
    });
  });
"
```

## 🏆 Stats Leaderboard

```bash
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('leaderboard')
  .where('userId', '==', 'GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2')
  .orderBy('monthKey', 'desc')
  .get()
  .then(snapshot => {
    console.log('Total entrées leaderboard:', snapshot.size);
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(\`\nMois: \${data.monthKey}\`);
      console.log(\`  CA: \${data.ca || 0} €\`);
      console.log(\`  Commissions: \${data.commissions || 0} €\`);
      console.log(\`  Actes: \${data.actsCount || 0}\`);
      console.log(\`  Process: \${data.process || 0}\`);
    });
  });
"
```

## ✏️ Modifier les données utilisateur

```bash
# Modifier le rôle
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('users').doc('GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2').update({
  role: 'ADMINISTRATEUR' // ou 'CDC_COMMERCIAL'
}).then(() => console.log('Rôle modifié avec succès'));
"

# Désactiver l'utilisateur
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('users').doc('GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2').update({
  active: false
}).then(() => console.log('Utilisateur désactivé'));
"

# Réactiver l'utilisateur
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('users').doc('GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2').update({
  active: true
}).then(() => console.log('Utilisateur réactivé'));
"
```

## 🗑️ Supprimer les données (ATTENTION - Irréversible)

```bash
# Supprimer tous les actes de cet utilisateur (ATTENTION!)
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('acts')
  .where('userId', '==', 'GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2')
  .get()
  .then(snapshot => {
    const batch = admin.firestore().batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    return batch.commit();
  })
  .then(() => console.log('Actes supprimés'));
"

# Supprimer l'utilisateur de Firestore (ATTENTION!)
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('users').doc('GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2').delete()
  .then(() => console.log('Utilisateur supprimé de Firestore'));
"

# Supprimer l'utilisateur de Firebase Auth (ATTENTION!)
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.auth().deleteUser('GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2')
  .then(() => console.log('Utilisateur supprimé de Firebase Auth'));
"
```

## 📈 Statistiques rapides

```bash
# Compter les actes par type
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('acts')
  .where('userId', '==', 'GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2')
  .get()
  .then(snapshot => {
    const stats = {};
    snapshot.docs.forEach(doc => {
      const kind = doc.data().kind || 'N/A';
      stats[kind] = (stats[kind] || 0) + 1;
    });
    console.log('Répartition des actes:');
    Object.entries(stats).forEach(([kind, count]) => {
      console.log(\`  \${kind}: \${count}\`);
    });
  });
"
```

## 🔍 Recherche dans les actes

```bash
# Trouver les actes avec un numéro de contrat spécifique
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('acts')
  .where('userId', '==', 'GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2')
  .where('numeroContrat', '==', 'NUMERO_A_CHERCHER')
  .get()
  .then(snapshot => {
    console.log('Actes trouvés:', snapshot.size);
    snapshot.docs.forEach(doc => console.log(JSON.stringify(doc.data(), null, 2)));
  });
"

# Trouver les actes d'un client spécifique
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('acts')
  .where('userId', '==', 'GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2')
  .where('clientNom', '==', 'NOM_DU_CLIENT')
  .get()
  .then(snapshot => {
    console.log('Actes trouvés:', snapshot.size);
    snapshot.docs.forEach(doc => console.log(JSON.stringify(doc.data(), null, 2)));
  });
"
```

---

## 🚀 Commande principale recommandée

Pour obtenir toutes les informations d'un coup, utilisez le script dédié :

```bash
npm run get-user-info GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2
```

Ou pour un autre utilisateur :

```bash
npm run get-user-info <USER_ID>
```

**Alternative avec ts-node directement :**
```bash
npx ts-node --project tsconfig.scripts.json scripts/get-user-info.ts GmVSMggoZ3TJ9b4whpFvgJ6Aa7i2
```

