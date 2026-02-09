# Plan : Amélioration de la Knowledge Base (Storage + Enrichissement IA)

## 1. Contexte et objectif

Actuellement, les PDF ne sont pas stockés. Objectifs :

- Archiver les PDF dans Firebase Storage lors de l'ingest
- Créer une API d'aperçu (URL signée)
- Créer une API d'enrichissement IA (Titre, Résumé, Re-embedding)

---

## 2. Tâches par fichier

### A. Ingest

**Fichier** : `app/api/admin/knowledge-base/ingest/route.ts`

- Modifier la logique pour uploader le PDF sur Firebase Storage : `knowledge-base/{knowledgeBaseId}/{docId}.pdf`
- Ajouter le champ `storagePath` dans le document Firestore
- S'assurer que `contentType: 'application/pdf'` est défini lors de l'upload
- **Remplacement** : si `docId` fourni, récupérer l'ancien `storagePath`, supprimer le fichier existant, puis uploader le nouveau. Gérer gracieusement l'absence d'ancien fichier (documents créés avant archivage)

---

### B. Preview API

**Fichier** : `app/api/admin/knowledge-base/documents/[docId]/preview/route.ts`

- Créer une route `GET` qui génère une URL signée via `file.getSignedUrl` (valide 1h)
- Vérifier admin (`verifyAdmin()`)
- Récupérer `storagePath` depuis Firestore
- Gérer le cas où `storagePath` est absent (anciens documents) : 404 ou `{ error: "Aperçu non disponible" }`
- Retourner `{ url: string }` en JSON

---

### C. Enrich API

**Fichier** : `app/api/admin/knowledge-base/documents/[docId]/enrich/route.ts`

- Créer une route `POST` qui :
  1. Récupère `content` et `title` actuels depuis Firestore
  2. Génère un titre court (max 80 car.) et un résumé (3–5 phrases) via OpenAI
  3. Recalcule l'embedding en formatant le texte ainsi : `TITRE: [titre] | RESUME: [résumé] | CONTENU: [content]`
  4. Met à jour Firestore avec `title`, `summary`, `embedding` et `updatedAt` (une seule opération atomique)

---

### D. Interface Admin

**Fichier** : `app/admin/knowledge-base/page.tsx`

- Ajouter le bouton **Aperçu** : ouvre l'URL signée dans un nouvel onglet ou iframe
- Ajouter le bouton **Enrichir avec l'IA** : état de chargement (toast ou spinner)
- Afficher le résumé dans l'UI (colonne tableau ou tooltip)

---

## 3. Contraintes

- Utiliser `firebase-admin` côté serveur pour Storage et Firestore
- Supprimer le fichier Storage lors de la **suppression** d'un document (si `storagePath` existe)
- Supprimer l'ancien fichier Storage lors du **remplacement** d'un document (ingest avec docId)
- **Format structuré pour le re-embedding** : `TITRE: [titre] | RESUME: [résumé] | CONTENU: [content]`
- **Gestion des fichiers orphelins** : toujours nettoyer Storage lors de suppression ou remplacement

---

## 4. Modifications annexes

- **GET documents** : étendre la réponse pour inclure `storagePath` et `summary`
- **DELETE document** : modifier `app/api/admin/knowledge-base/documents/[docId]/route.ts` pour supprimer le fichier Storage avant de supprimer le document Firestore

---

## 5. Ordre d'implémentation

1. Modifier ingest (upload Storage, `storagePath`, `contentType`, suppression ancien)
2. Créer GET `/documents/[docId]/preview`
3. Étendre GET documents (retourner `storagePath` et `summary`)
4. Créer POST `/documents/[docId]/enrich`
5. Modifier DELETE pour supprimer le fichier Storage
6. Bouton Aperçu + bouton Enrichir + affichage résumé dans la page admin
