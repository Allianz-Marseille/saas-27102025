# Guide de Vérification des Règles Firebase

Ce guide vous explique comment vérifier que les règles Firestore et Storage sont correctement synchronisées et fonctionnent.

---

## 1. Vérification via Firebase Console

### Firestore Rules

1. **Accéder aux règles** :
   - Firebase Console → Firestore Database → Règles
   - Vérifier que le contenu correspond à `firestore.rules`

2. **Vérifier la syntaxe** :
   - Cliquer sur "Publier" (même si déjà publié)
   - Si aucune erreur n'apparaît, la syntaxe est correcte

### Storage Rules

1. **Accéder aux règles** :
   - Firebase Console → Storage → Règles
   - Vérifier que le contenu correspond à `storage.rules`

2. **Vérifier la syntaxe** :
   - Cliquer sur "Publier"
   - Si aucune erreur n'apparaît, la syntaxe est correcte

### Firestore Indexes

1. **Accéder aux index** :
   - Firebase Console → Firestore Database → Indexes

2. **Vérifier tous les index requis** :
   
   **✅ Tous les index sont maintenant déployés et activés** (13 index au total) :
   
   **Index RAG** (4 index) :
   - ✅ `rag_chunks` : `metadata.documentId` ↑ + `metadata.chunkIndex` ↑
   - ✅ `rag_documents` : `isActive` ↑ + `createdAt` ↓
   - ✅ `rag_documents` : `category` ↑ + `createdAt` ↓
   - ✅ `rag_documents` : `status` ↑ + `createdAt` ↓
   
   **Index autres collections** (9 index) :
   - ✅ `acts` : `userId` ↑ + `moisKey` ↓
   - ✅ `acts` : `moisKey` ↓ + `dateEffet` ↓
   - ✅ `logs` : `userId` ↑ + `timestamp` ↓
   - ✅ `logs` : `level` ↑ + `timestamp` ↓
   - ✅ `logs` : `action` ↑ + `timestamp` ↓
   - ✅ `leaderboard` : `monthKey` ↑ + `commissions` ↓
   - ✅ `leaderboard` : `monthKey` ↑ + `process` ↓
   - ✅ `leaderboard` : `monthKey` ↑ + `ca` ↓
   - ✅ `agency_commissions` : `year` ↑ + `month` ↑

3. **Pour recréer les index** (si nécessaire) :
   - Via Firebase CLI :
     ```bash
     firebase deploy --only firestore:indexes
     ```
   - Manuellement dans la console :
     - Cliquer sur "Ajouter un index"
     - Remplir les champs selon `firestore.indexes.json`
     - Attendre que le statut passe à "Enabled" (peut prendre plusieurs minutes)

---

## 2. Tests Manuels via l'Application

### Test 1 : Lecture RAG Documents (utilisateur authentifié)

1. Se connecter en tant qu'utilisateur normal (non-admin)
2. Accéder à l'interface d'upload RAG (doit être accessible uniquement aux admins)
3. Essayer de lister les documents RAG via l'API :
   ```bash
   # Dans la console du navigateur (F12)
   fetch('/api/assistant/rag/documents', {
     headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
   })
   ```
   - ✅ **Attendu** : Liste des documents (lecture autorisée)
   - ❌ **Erreur** : "Permission denied" → règles incorrectes

### Test 2 : Upload RAG Document (non-admin)

1. Se connecter en tant qu'utilisateur normal
2. Essayer d'uploader un document :
   ```bash
   const formData = new FormData();
   formData.append('file', file);
   formData.append('title', 'Test');
   
   fetch('/api/assistant/rag/upload', {
     method: 'POST',
     body: formData,
     headers: { 'Authorization': 'Bearer USER_TOKEN' }
   })
   ```
   - ✅ **Attendu** : Erreur 403 "Accès administrateur requis" (côté serveur)
   - ❌ **Si erreur Firestore** : "Permission denied" → règles trop permissives

### Test 3 : Lecture Storage (utilisateur authentifié)

1. Se connecter en tant qu'utilisateur normal
2. Essayer de lire un fichier dans Storage :
   ```javascript
   // Dans la console du navigateur
   import { getStorage, ref, getDownloadURL } from 'firebase/storage';
   const storage = getStorage();
   const fileRef = ref(storage, 'knowledge-base/pdf/test.pdf');
   getDownloadURL(fileRef)
     .then(url => console.log('✅ Lecture autorisée:', url))
     .catch(err => console.error('❌ Erreur:', err));
   ```
   - ✅ **Attendu** : URL de téléchargement (lecture autorisée)
   - ❌ **Erreur** : "storage/unauthorized" → règles incorrectes

### Test 4 : Upload Storage (non-admin)

1. Se connecter en tant qu'utilisateur normal
2. Essayer d'uploader un fichier :
   ```javascript
   import { getStorage, ref, uploadBytes } from 'firebase/storage';
   const storage = getStorage();
   const fileRef = ref(storage, 'knowledge-base/pdf/test.pdf');
   uploadBytes(fileRef, fileBlob)
     .then(() => console.log('❌ Upload autorisé (ne devrait pas)'))
     .catch(err => {
       if (err.code === 'storage/unauthorized') {
         console.log('✅ Upload bloqué (correct)');
       }
     });
   ```
   - ✅ **Attendu** : Erreur "storage/unauthorized" (upload bloqué)
   - ❌ **Si upload réussi** : Règles trop permissives

---

## 3. Tests Automatisés (Optionnel)

### Script de Test Node.js

Créer un fichier `scripts/test-firebase-rules.ts` :

```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialiser Firebase Admin
const app = initializeApp({
  credential: cert(require('../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json'))
});

const db = getFirestore();
const storage = getStorage();

async function testFirestoreRules() {
  console.log('🧪 Test des règles Firestore...\n');

  // Test 1 : Lecture rag_documents (devrait fonctionner avec Admin SDK)
  try {
    const docs = await db.collection('rag_documents').limit(1).get();
    console.log('✅ Lecture rag_documents : OK');
  } catch (error) {
    console.error('❌ Lecture rag_documents :', error);
  }

  // Test 2 : Création rag_documents (devrait fonctionner avec Admin SDK)
  try {
    const testDoc = db.collection('rag_documents').doc('test-' + Date.now());
    await testDoc.set({
      title: 'Test',
      type: 'test',
      status: 'indexed',
      isActive: true,
      uploadedBy: 'test-user',
      chunkCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await testDoc.delete();
    console.log('✅ Création rag_documents : OK');
  } catch (error) {
    console.error('❌ Création rag_documents :', error);
  }
}

async function testStorageRules() {
  console.log('\n🧪 Test des règles Storage...\n');

  // Test : Upload dans knowledge-base/pdf/ (devrait fonctionner avec Admin SDK)
  try {
    const bucket = storage.bucket();
    const file = bucket.file('knowledge-base/pdf/test-' + Date.now() + '.pdf');
    await file.save(Buffer.from('test'), {
      metadata: { contentType: 'application/pdf' }
    });
    await file.delete();
    console.log('✅ Upload Storage : OK');
  } catch (error) {
    console.error('❌ Upload Storage :', error);
  }
}

async function main() {
  await testFirestoreRules();
  await testStorageRules();
  console.log('\n✅ Tests terminés');
  process.exit(0);
}

main().catch(console.error);
```

---

## 4. Vérification des Index Firestore

### Via Firebase Console

1. Aller dans Firestore Database → Indexes
2. **✅ Tous les index suivants sont maintenant déployés et activés** (13 index au total) :

**rag_chunks** (1 index) ✅ :
- `metadata.documentId` (ASC) + `metadata.chunkIndex` (ASC)

**rag_documents** (3 index) ✅ :
- `isActive` (ASC) + `createdAt` (DESC)
- `category` (ASC) + `createdAt` (DESC)
- `status` (ASC) + `createdAt` (DESC)

**leaderboard** (3 index) ✅ :
- `monthKey` (ASC) + `commissions` (DESC)
- `monthKey` (ASC) + `process` (DESC)
- `monthKey` (ASC) + `ca` (DESC)

**acts** (2 index) ✅ :
- `userId` (ASC) + `moisKey` (DESC)
- `moisKey` (DESC) + `dateEffet` (DESC)

**logs** (3 index) ✅ :
- `userId` (ASC) + `timestamp` (DESC)
- `level` (ASC) + `timestamp` (DESC)
- `action` (ASC) + `timestamp` (DESC)

**agency_commissions** (1 index) ✅ :
- `year` (ASC) + `month` (ASC)

### Via CLI Firebase

**Afficher les index configurés** :
```bash
firebase firestore:indexes
```

**Déployer les index** :
```bash
# Déployer tous les index définis dans firestore.indexes.json
firebase deploy --only firestore:indexes
```

Cette commande va :
1. Comparer les index dans `firestore.indexes.json` avec ceux dans Firebase
2. Créer automatiquement les index manquants
3. Les index seront en statut "Building" puis "Enabled" (peut prendre plusieurs minutes)

**✅ Note** : Tous les index sont maintenant déployés et activés (13 index au total).

**Vérifier le statut des index** :
```bash
firebase firestore:indexes
```

Ou via la console Firebase → Firestore Database → Indexes

---

## 5. Checklist Complète

- [ ] Firestore Rules copiées dans Firebase Console
- [ ] Storage Rules copiées dans Firebase Console
- [x] **Index Firestore créés et "Enabled"** (13 index au total) :
  - [x] `rag_chunks` : 1 index ✅
  - [x] `rag_documents` : 3 index ✅
  - [x] `leaderboard` : 3 index ✅
  - [x] `acts` : 2 index ✅
  - [x] `logs` : 3 index ✅
  - [x] `agency_commissions` : 1 index ✅
- [ ] Test lecture `rag_documents` : ✅ OK
- [ ] Test création `rag_documents` (non-admin) : ❌ Bloqué
- [ ] Test lecture Storage `knowledge-base/pdf/` : ✅ OK
- [ ] Test upload Storage (non-admin) : ❌ Bloqué

---

## 6. Dépannage

### Erreur "Permission denied" sur lecture

- Vérifier que l'utilisateur est bien authentifié
- Vérifier que les règles Firestore sont bien publiées
- Vérifier la syntaxe des règles (pas d'erreur dans la console)

### Index "Building" depuis longtemps

- Les index peuvent prendre plusieurs minutes à se créer
- Vérifier qu'il n'y a pas d'erreur dans la console
- Si > 1h, recréer l'index manuellement

### Erreur Storage "unauthorized"

- Vérifier que les règles Storage sont bien publiées
- Vérifier le chemin du fichier (`knowledge-base/pdf/...`)
- Vérifier que l'utilisateur est authentifié

---

*Document créé le : 2025*

