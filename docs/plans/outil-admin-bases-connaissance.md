# Plan : outil admin de gestion des bases de connaissance RAG

## Contexte

- **Bots actuels avec RAG** : Bob (`bob_knowledge`), Sinistro (`sinistro_knowledge`), Pauline (`pauline_knowledge`)
- **Bots sans RAG** : Nina (secrétaire)
- **Chaîne actuelle** : PDFs extraits en `.md` → scripts de migration → Firestore. Pour l’outil admin : embeddings générés dans l’API via OpenAI (option A).
- **Objectif** : interface admin pour visualiser, enrichir et gérer les bases RAG (upload PDF, suppression, mise à jour), extensible aux futurs bots

---

## 1. Navigation et accès

### Bouton sidebar "Base de connaissance"

- **Libellé exact** : "Base de connaissance"
- **Route** : `/admin/knowledge-base`
- **Icône** : `BookOpen` (lucide-react)
- **Emplacement** : après "Agents IA", avant le séparateur (block Commerciaux / Santé / … / Agents IA / **Base de connaissance** | séparateur | Commissions / …)
- **Accès** : uniquement si connecté en tant qu'admin (`RouteGuard allowedRoles={["ADMINISTRATEUR"]}` sur le layout admin — déjà en place)
- **Pages à modifier** :
  - [`components/admin/admin-sidebar.tsx`](components/admin/admin-sidebar.tsx) : ajouter l'entrée dans `adminNavItems`
  - [`app/admin/layout.tsx`](app/admin/layout.tsx) : ajouter l'entrée dans `adminNavItems` (pour le menu mobile)

### Cohérence de design

- Réutiliser les mêmes composants que les autres pages admin : `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`, etc.
- Même structure de page : titre + description, contenu en Cards
- Même palette (gradients slate, bordures, dark mode) que [`app/admin/users/page.tsx`](app/admin/users/page.tsx)
- Le menu mobile (`NavigationItems`) et la sidebar desktop partagent la même liste `adminNavItems` pour garantir une navigation cohérente

---

## 2. Registre centralisé des bases de connaissance

**Fichier** : `lib/knowledge/registry.ts` (nouveau)

```ts
export interface KnowledgeBaseConfig {
  id: string;                    // pauline | bob | sinistro | ...
  name: string;                  // "Pauline (Produits Particuliers)"
  firestoreCollection: string;   // pauline_knowledge
  botId?: string;                // id du bot associé (pour affichage)
}

export const KNOWLEDGE_BASES: KnowledgeBaseConfig[] = [
  { id: "pauline", name: "Pauline — Produits Particuliers", firestoreCollection: "pauline_knowledge", botId: "pauline" },
  { id: "bob", name: "Bob — Santé & Prévoyance", firestoreCollection: "bob_knowledge", botId: "bob" },
  { id: "sinistro", name: "Sinistro — Sinistres", firestoreCollection: "sinistro_knowledge", botId: "sinistro" },
];

export function getKnowledgeBases(): KnowledgeBaseConfig[] { ... }
export function getKnowledgeBaseById(id: string): KnowledgeBaseConfig | undefined { ... }
```

**Extensibilité** : ajouter un nouveau bot avec RAG = ajouter une entrée dans ce tableau + créer l'index Firestore (voir section 6).

---

## 3. API d'ingestion (upload PDF → RAG)

**Fichier** : `app/api/admin/knowledge-base/ingest/route.ts` (nouveau)

- **Méthode** : `POST`
- **Auth** : `verifyAdmin()` (rôle ADMINISTRATEUR)
- **Body** : `FormData` avec `file` (PDF), `knowledgeBaseId` (string), `docId` (string, optionnel — pour mise à jour)
- **Flux** :
  1. Valider `knowledgeBaseId` via le registre
  2. Vérifier taille (max 20 Mo, aligné sur `extract/route.ts`)
  3. Extraire le texte avec `pdf-parse` (réutiliser la logique de `extract/route.ts`)
  4. Si `docId` fourni : l’utiliser pour overwrite (mise à jour). Sinon : générer un slug unique (basé sur le nom du fichier, max ~80 caractères)
  5. Générer l'embedding via **OpenAI text-embedding-3-small** (content tronqué si nécessaire, ex. 8 000 caractères) — voir section 6
  6. Construire le payload `{ title, content, updatedAt, embedding }` et écrire dans la collection Firestore (`set` avec `merge: true` pour mise à jour)
  7. (Optionnel) Upload du PDF dans Storage `knowledge-base/{knowledgeBaseId}/{filename}` pour archivage

**Réponse** : `{ success: true, docId, title, charsExtracted, updated?: boolean }` ou erreur 4xx/5xx.

---

## 4. API documents : liste, suppression, mise à jour

### 4.1 Liste des documents

**Fichier** : `app/api/admin/knowledge-base/documents/route.ts` (nouveau)

- **Méthode** : `GET`
- **Query** : `?knowledgeBaseId=pauline`
- **Auth** : `verifyAdmin()`
- **Flux** : requête Firestore sur la collection, retourne `{ documents: [{ id, title, updatedAt, contentLength, sourceFileName? }] }`

### 4.2 Suppression

**Fichier** : `app/api/admin/knowledge-base/documents/[docId]/route.ts` (nouveau)

- **Méthode** : `DELETE`
- **Params** : `docId` (segment de route)
- **Query** : `?knowledgeBaseId=pauline` (obligatoire pour identifier la collection)
- **Auth** : `verifyAdmin()`
- **Flux** : suppression du document dans la collection Firestore
- **Réponse** : `{ success: true }` ou erreur

### 4.3 Mise à jour (remplacement)

**Option** : réutiliser l’API ingest avec un paramètre `docId` optionnel.

- **Méthode** : `POST` sur `/api/admin/knowledge-base/ingest`
- **Body** : `FormData` avec `file` (PDF), `knowledgeBaseId`, et `docId` (optionnel)
- **Si `docId` fourni** : overwrite du document existant (payload `{ title, content, updatedAt, embedding }` régénéré via OpenAI)
- **Si `docId` absent** : comportement actuel (création avec slug auto)

---

## 5. Page admin `/admin/knowledge-base`

**Fichier** : `app/admin/knowledge-base/page.tsx` (nouveau)

- **Route** : accessible via le bouton "Base de connaissance" de la sidebar
- **Structure** :
  - Titre de page : "Base de connaissance"
  - Sous-titre : description courte (ex. "Consulter et gérer les bases RAG des agents IA")
  - Pour chaque base (Pauline, Bob, Sinistro) :
    - **Liste des documents** : tableau avec colonnes (titre, date de mise à jour, taille du contenu, actions)
    - **Actions par ligne** : "Mettre à jour" (réouvre l’upload avec ce doc cible), "Supprimer" (avec confirmation)
    - **Zone d’upload** : ajout d’un nouveau PDF
- **Visualisation** : l’admin voit les PDFs intégrés (titres, métadonnées) ; le contenu texte peut être prévisualisé en modal (optionnel) ou via un lien "Aperçu"
- **Design** : Cards, gradients slate, cohérent avec `admin/users`, `admin/logs`
- **Feedback** : toast succès/erreur après upload, suppression, mise à jour ; indicateur de chargement

---

## 6. Extensions Firebase et embeddings

### 6.1 Index vectoriel Firestore (déjà en place)

- Les index sont définis dans [`firestore.indexes.json`](firestore.indexes.json) : `pauline_knowledge`, `bob_knowledge`, `sinistro_knowledge` avec champ `embedding` (dimension 1536).
- **Pas d’extension requise** pour l’index : `firebase deploy --only firestore` suffit.
- Pour un nouveau bot : ajouter une entrée dans `firestore.indexes.json` sur le même modèle.

### 6.2 Génération des embeddings (option A retenue)

- **Choix** : génération des embeddings **dans l'API** via **OpenAI text-embedding-3-small**.
- L'API ingest appelle OpenAI pour le contenu extrait (tronqué à 8 000 caractères si nécessaire).
- Elle écrit `{ title, content, updatedAt, embedding }` dans Firestore.
- **Aucune extension Firebase** à installer.
- **Cohérence** : même modèle que le RAG (requêtes via `pauline-rag.ts`, `bob-rag.ts`, etc.).
- **Coût** : usage de l'API OpenAI pour chaque document ingéré ou mis à jour.

---

## 7. Storage Firebase

**Règles** : modifier `storage.rules` pour supporter le chemin par base :

```
match /knowledge-base/{baseId}/{fileName} {
  allow read: if isAuthenticated();
  allow write: if isAdmin();
}
```

---

## 8. Extensibilité : ajout d'un nouveau bot avec RAG

Lorsqu'un nouveau bot sera créé :

1. Créer la collection Firestore `xxx_knowledge` (implicite à la première écriture)
2. Ajouter l'index vectoriel dans `firestore.indexes.json` (même structure que `pauline_knowledge`)
3. Ajouter l'entrée dans `KNOWLEDGE_BASES` du registre
4. Implémenter la logique RAG dans `app/api/assistant/chat/route.ts`
5. Le bouton "Base de connaissance" affichera automatiquement la nouvelle base dans la liste

---

## 9. Utilitaires partagés

**Fichier** : `lib/knowledge/extract-pdf.ts` (nouveau)

- `extractTextFromPdfBuffer(buffer: Buffer): Promise<string>` — encapsule `pdf-parse`
- `slugFromFilename(filename: string, maxLength?: number): string` — génération de slug pour docId/title

---

## 10. Ordre d'implémentation

| Étape | Tâche |
|-------|-------|
| 1 | Créer `lib/knowledge/registry.ts` et `lib/knowledge/extract-pdf.ts` |
| 2 | Créer `POST /api/admin/knowledge-base/ingest` (extraction PDF + embedding OpenAI + support `docId` pour mise à jour) |
| 3 | Créer `GET /api/admin/knowledge-base/documents` et `DELETE /api/admin/knowledge-base/documents/[docId]` |
| 4 | Créer la page `app/admin/knowledge-base/page.tsx` (liste, suppression, mise à jour par base) |
| 5 | Ajouter le bouton "Base de connaissance" dans `admin-sidebar.tsx` et `admin/layout.tsx` |
| 6 | Mettre à jour `storage.rules` |
