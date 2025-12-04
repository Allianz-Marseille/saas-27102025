# Système RAG (Retrieval Augmented Generation)

## Vue d'ensemble

Le système RAG implémenté permet au chatbot de l'application de répondre aux questions en se basant sur des documents internes (PDFs, images) uploadés par les administrateurs. Cette approche combine la puissance des LLM (GPT-4) avec une base de connaissances spécifique à l'entreprise.

### Principe de fonctionnement

```
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 1: INDEXATION                         │
└─────────────────────────────────────────────────────────────────┘

Document PDF/Image
       ↓
Extraction texte (Document AI / pdf-parse / Tesseract OCR)
       ↓
Découpage en chunks (1000 caractères, overlap 200)
       ↓
Génération embeddings (OpenAI text-embedding-3-small)
       ↓
Stockage vecteurs (Qdrant) + Métadonnées (Firestore) + Fichier (Storage)


┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 2: RECHERCHE                          │
└─────────────────────────────────────────────────────────────────┘

Question utilisateur
       ↓
Génération embedding de la question
       ↓
Recherche similarité vectorielle (Qdrant)
       ↓
Récupération top 5 chunks les plus pertinents
       ↓
Contexte enrichi envoyé à GPT-4
       ↓
Réponse générée avec citations des sources
```

---

## Architecture et composants

### 1. **Base de données vectorielle - Qdrant**

**Rôle** : Stockage et recherche des vecteurs (embeddings)

- **Collection** : `rag_documents`
- **Dimension des vecteurs** : 1536 (OpenAI text-embedding-3-small)
- **Distance** : Cosine similarity
- **Hébergement** : Qdrant Cloud (Europe-West3)

**Structure d'un point Qdrant :**
```typescript
{
  id: "uuid-v4",                    // ID unique du chunk
  vector: [0.123, -0.456, ...],     // Embedding 1536 dimensions
  payload: {
    documentId: "uuid-document",    // ID du document parent
    chunkIndex: 0,                  // Position du chunk dans le document
    text: "Contenu du chunk...",    // Texte original
    filename: "document.pdf",       // Nom du fichier
    fileType: "pdf",                // Type (pdf ou image)
    metadata: {}                    // Métadonnées additionnelles
  }
}
```

---

### 2. **Génération d'embeddings - OpenAI**

**Modèle** : `text-embedding-3-small`
- Dimension : 1536
- Performance : Rapide et économique
- Multilingue (français/anglais)

**Batch processing** : Les embeddings sont générés par lots pour optimiser les performances et réduire les coûts.

---

### 3. **Extraction de texte**

#### Pour les PDFs

**Méthode principale** : Google Document AI
- API Document Processing
- Haute précision OCR
- Support des PDFs complexes
- Location : Europe (RGPD compliant)

**Fallback** : pdf-parse (Node.js)
- Utilisé si Document AI échoue
- Extraction des PDFs simples
- Plus limité mais fiable

#### Pour les images

**Méthode** : Tesseract.js
- OCR open-source
- Langues : Français + Anglais (`fra+eng`)
- Score de confiance retourné
- Seuil minimum : 60%

---

### 4. **Stockage**

#### Firebase Storage
- Stockage des fichiers originaux
- Dossier : `rag-documents/`
- Nommage : `{uuid}.{extension}`
- Fichiers publics (URLs directes)

#### Firestore
- Collection : `rag_documents`
- Métadonnées des documents :
  ```typescript
  {
    id: string;
    filename: string;
    fileType: "pdf" | "image";
    imageType?: "png" | "jpg" | "jpeg" | "webp";
    uploadedBy: string;          // userId de l'admin
    uploadedAt: Timestamp;
    fileUrl: string;             // URL Firebase Storage
    fileSize: number;            // Taille en bytes
    chunkCount: number;          // Nombre de chunks créés
    ocrConfidence?: number;      // Score OCR (images uniquement)
    qdrantCollectionId: string;  // Nom de la collection
    metadata: {
      originalName: string;
      traceId: string;          // ID de traçabilité
    };
  }
  ```

---

### 5. **Chunking (découpage)**

**Paramètres** :
- **Taille des chunks** : 1000 caractères
- **Overlap** : 200 caractères (chevauchement entre chunks)
- **Stratégie de coupure** : Coupure intelligente sur espaces, points, sauts de ligne

**Pourquoi le chunking ?**
- Les embeddings fonctionnent mieux sur des textes courts et cohérents
- Permet de retrouver précisément les passages pertinents
- Optimise la qualité des réponses du LLM

---

## Workflow d'upload de document

### Étapes détaillées

```
1. Validation du fichier
   ├─ Type MIME (PDF, PNG, JPG, JPEG, WEBP)
   ├─ Taille max : PDF 10MB, Images 5MB
   └─ Vérification permissions admin

2. Vérification système
   ├─ Connexion Qdrant
   ├─ Connexion OpenAI
   ├─ Firebase Storage disponible
   └─ Google Cloud configuré

3. Upload vers Firebase Storage
   ├─ Génération UUID pour le document
   ├─ Sauvegarde du fichier
   └─ Obtention de l'URL publique

4. Extraction du texte
   ├─ PDF → Document AI (+ fallback pdf-parse)
   └─ Image → Tesseract OCR

5. Découpage en chunks
   └─ Application de la stratégie de chunking

6. Génération des embeddings
   └─ OpenAI batch processing pour tous les chunks

7. Création collection Qdrant
   └─ Si première fois uniquement

8. Indexation dans Qdrant
   └─ Upsert de tous les points vectoriels

9. Sauvegarde métadonnées Firestore
   └─ Document dans collection rag_documents

10. ✅ Upload terminé avec succès
```

### Gestion des erreurs et rollback

En cas d'échec à n'importe quelle étape, un **rollback automatique** est effectué :
- Suppression du fichier Storage
- Suppression des vecteurs Qdrant
- Suppression des métadonnées Firestore

Chaque opération est tracée avec un **traceId unique** pour faciliter le debugging.

---

## Workflow de recherche et réponse

### 1. Question utilisateur

L'utilisateur pose une question dans le chatbot.

### 2. Génération de l'embedding de la question

La question est transformée en vecteur de 1536 dimensions avec le même modèle que l'indexation.

### 3. Recherche vectorielle dans Qdrant

```typescript
{
  vector: [embedding de la question],
  limit: 5,                        // Top 5 résultats
  score_threshold: 0.7            // Score minimum de similarité
}
```

**Qdrant retourne** : Les 5 chunks les plus similaires avec leur score de pertinence.

### 4. Construction du contexte

Les chunks pertinents sont assemblés avec leurs métadonnées (nom du fichier, type).

### 5. Génération de la réponse avec GPT-4

**Prompt système** :
- Contexte professionnel (assurances Allianz)
- Instructions de style (structuré, pédagogique, aéré)
- Contrainte d'utiliser uniquement les sources fournies

**Prompt utilisateur** :
```
Contexte (documents) :
- [Chunk 1 du document X]
- [Chunk 2 du document Y]
- ...

Question : [Question de l'utilisateur]

Répondre en citant les sources utilisées.
```

### 6. Réponse enrichie

Le chatbot retourne :
- La réponse générée
- Les sources utilisées (noms des documents)
- Le score de confiance (si disponible)

---

## Mode fallback (sans documents)

Si **aucun document n'est indexé** ou si **aucune correspondance n'est trouvée** :
- Le chatbot bascule en mode "IA classique"
- Utilise les connaissances générales de GPT-4 sur les assurances
- Reste dans le contexte professionnel d'Allianz
- Indique qu'il n'a pas de documents spécifiques

---

## Configuration requise

### Variables d'environnement

```bash
# Qdrant
QDRANT_URL=https://your-cluster.qdrant.io:6333
QDRANT_API_KEY=your-api-key

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o

# Firebase
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
FIREBASE_ADMIN_SDK_JSON=...

# Google Cloud
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_DOCUMENT_AI_PROCESSOR_ID=your-processor-id
GOOGLE_DOCUMENT_AI_LOCATION=eu
GOOGLE_PRIVATE_KEY=...
GOOGLE_CLIENT_EMAIL=...
GOOGLE_CLIENT_ID=...
GOOGLE_PRIVATE_KEY_ID=...
GOOGLE_CLIENT_CERT_URL=...
```

### Limites et quotas

| Ressource | Limite |
|-----------|--------|
| Taille max PDF | 10 MB |
| Taille max Image | 5 MB |
| Types autorisés | PDF, PNG, JPG, JPEG, WEBP |
| Chunks par document | Illimité |
| Documents par admin | 50 (configurable) |
| Recherche top-k | 5 chunks |
| Score minimum | 0.7 (70% de similarité) |

---

## Utilisation

### 1. Importer des documents (Admin uniquement)

1. Accéder à **Admin** → **Outils** → **Gestion Chatbot**
2. Cliquer sur **Importer des documents**
3. Sélectionner un ou plusieurs fichiers (PDF ou images)
4. Patienter pendant l'indexation
5. Les documents apparaissent dans la liste

### 2. Utiliser le chatbot

1. Cliquer sur le bouton chatbot (coin inférieur droit)
2. Poser une question en langage naturel
3. Le chatbot répond en se basant sur les documents indexés
4. Les sources sont citées en bas de la réponse

### 3. Supprimer un document

1. Dans la liste des documents
2. Cliquer sur l'icône de suppression
3. Confirmer la suppression
4. Le document est supprimé de tous les systèmes (Storage, Qdrant, Firestore)

---

## Scripts de diagnostic et maintenance

### Test complet du système

```bash
npm run test:rag
# ou
npx tsx scripts/test-rag-system.ts
```

Vérifie :
- Configuration des variables d'environnement
- Connexion Qdrant
- Connexion OpenAI
- Firebase Admin SDK
- Google Document AI

### Diagnostic Qdrant

```bash
npx tsx scripts/diagnose-qdrant.ts
```

Teste :
- Connexion à Qdrant
- État de la collection
- Insertion/suppression d'un point de test

### Diagnostic RAG complet

```bash
npx tsx scripts/diagnose-rag-system.ts
```

Vérifie l'ensemble de la chaîne RAG.

---

## Performances et optimisations

### Indexation
- **Temps moyen PDF (5 pages)** : 10-15 secondes
- **Temps moyen Image** : 5-10 secondes
- **Batch embeddings** : Jusqu'à 50 chunks en parallèle

### Recherche
- **Latence Qdrant** : ~300-600ms
- **Génération réponse GPT-4** : 2-5 secondes
- **Temps total** : ~3-6 secondes

### Optimisations appliquées
- Retry avec backoff exponentiel (résilience réseau)
- Batch processing des embeddings
- Caching des connexions clients
- Import dynamique des librairies lourdes
- Logging structuré avec traceId

---

## Troubleshooting

### Erreur : "Bad Request" lors de l'upload

**Cause** : Format d'ID Qdrant invalide  
**Solution** : Utiliser des UUID v4 (corrigé dans `lib/rag/pdf-processor.ts`)

### Erreur : "Cannot use undefined as Firestore value"

**Cause** : Champs optionnels undefined envoyés à Firestore  
**Solution** : Construction conditionnelle de l'objet (corrigé dans `app/api/chat/upload/route.ts`)

### Erreur : "Aucun texte extrait"

**Causes possibles** :
- PDF protégé par mot de passe
- PDF scanné de mauvaise qualité
- Image illisible pour l'OCR

**Solution** : Essayer un autre fichier ou améliorer la qualité du scan

### Pas de réponse pertinente

**Causes possibles** :
- Pas de documents indexés
- Question trop vague
- Documents non pertinents

**Solution** :
- Vérifier qu'il y a des documents indexés
- Reformuler la question plus précisément
- Ajouter des documents couvrant le sujet

---

## Architecture technique

### Stack technologique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Runtime | Node.js | 20.x |
| Framework | Next.js | 15.x (App Router) |
| Language | TypeScript | 5.x |
| Vector DB | Qdrant | Cloud |
| LLM | OpenAI GPT-4 | gpt-4o |
| Embeddings | OpenAI | text-embedding-3-small |
| OCR PDFs | Google Document AI | v1 |
| OCR Images | Tesseract.js | 5.x |
| PDF Fallback | pdf-parse | 1.1.1 |
| Storage | Firebase Storage | Admin SDK |
| Database | Firestore | Admin SDK |

### Structure des fichiers

```
lib/rag/
├── types.ts                  # Types TypeScript
├── qdrant-client.ts          # Client Qdrant
├── embeddings.ts             # Génération embeddings OpenAI
├── pdf-processor.ts          # Extraction texte + chunking
└── chat-service.ts           # Service de recherche et chat

app/api/chat/
├── route.ts                  # Endpoint principal chat
├── upload/route.ts           # Upload documents
├── documents/route.ts        # Liste documents
├── documents/[id]/route.ts   # Suppression document
├── analyze-document/route.ts # Analyse PDF ponctuelle
└── analyze-image/route.ts    # Analyse image ponctuelle

components/chatbot/
├── floating-chat-button.tsx  # Bouton + interface chat
├── pdf-upload-dialog.tsx     # Modal d'upload
├── pdf-list.tsx              # Liste des documents
├── chat-message.tsx          # Message de chat
└── chat-input.tsx            # Input utilisateur

scripts/
├── test-rag-system.ts        # Test complet système
├── diagnose-qdrant.ts        # Diagnostic Qdrant
└── diagnose-rag-system.ts    # Diagnostic RAG complet
```

---

## Évolutions futures possibles

### Court terme
- [ ] Upload en masse (plusieurs fichiers)
- [ ] Prévisualisation des documents
- [ ] Statistiques d'usage du chatbot
- [ ] Feedback sur les réponses

### Moyen terme
- [ ] Support d'autres formats (DOCX, XLSX, TXT)
- [ ] Catégorisation automatique des documents
- [ ] Recherche par tags/métadonnées
- [ ] Export des conversations

### Long terme
- [ ] Fine-tuning du modèle sur données spécifiques
- [ ] Multi-tenancy (plusieurs agences)
- [ ] Recherche hybride (vectorielle + full-text)
- [ ] Analyse de sentiment des conversations

---

## Conformité et sécurité

### RGPD
- Hébergement Europe (Qdrant Cloud Europe-West3)
- Google Document AI location EU
- Pas de stockage de données personnelles dans les documents
- Traçabilité complète avec traceId

### Sécurité
- Authentification Firebase requise
- Restriction admin pour l'upload
- Validation stricte des fichiers
- Sanitization des inputs
- Rollback automatique en cas d'erreur
- Logs structurés pour audit

### Coûts estimés (usage moyen)

| Service | Coût mensuel estimé |
|---------|---------------------|
| Qdrant Cloud | ~20-50€ (selon volume) |
| OpenAI (embeddings) | ~5-10€ (50 documents) |
| OpenAI (GPT-4) | ~30-50€ (500 questions/mois) |
| Google Document AI | ~15€ (100 PDFs) |
| Firebase Storage | <5€ |
| **Total** | **~75-130€/mois** |

---

## Support et contact

Pour toute question ou problème :
1. Vérifier les logs avec le traceId
2. Exécuter les scripts de diagnostic
3. Consulter cette documentation
4. Contacter l'équipe technique

---

*Dernière mise à jour : Décembre 2024*

