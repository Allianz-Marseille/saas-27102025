# TODO - Implémentation RAG Chatbot

## Phase 1 : Composants UI du chatbot

### Composants de base
- [x] Créer `components/chatbot/chat-message.tsx`
  - [x] Affichage messages user et assistant
  - [x] Formatage markdown avec react-markdown
  - [x] Styles aérés (paragraphes espacés, listes, titres)
  - [x] Bouton copier avec animation check
  - [x] Indicateur de sources (badges)
  - [x] Animations d'apparition (fade-in + slide)

- [x] Créer `components/chatbot/chat-input.tsx`
  - [x] Input avec glassmorphism
  - [x] Bouton d'envoi avec gradient
  - [x] Support Enter pour envoyer
  - [x] Auto-select après réponse (useEffect + focus)
  - [x] Validation visuelle
  - [x] Loading state

- [x] Refactoriser `components/chatbot/floating-chat-button.tsx`
  - [x] Utiliser les nouveaux composants chat-message et chat-input
  - [x] Intégrer le formatage markdown
  - [x] Ajouter le bouton copier
  - [x] Implémenter l'auto-select de l'input

## Phase 2 : Upload et gestion des documents

### Traitement des fichiers
- [x] Compléter `lib/rag/pdf-processor.ts`
  - [x] Vérifier extractTextFromPDF fonctionne
  - [x] Implémenter extractTextFromImage avec Tesseract.js
  - [x] Implémenter chunkText avec overlap
  - [x] Pipeline complet processPDFForIndexing
  - [x] Pipeline complet processImageForIndexing

### Composants admin
- [ ] Créer `components/chatbot/pdf-upload-dialog.tsx`
  - [ ] Dialog avec drag & drop
  - [ ] Support PDF et images (PNG, JPG, JPEG, WEBP)
  - [ ] Indicateur de progression
  - [ ] Preview du fichier
  - [ ] Validation (taille, type)
  - [ ] Animation de succès

- [ ] Créer `components/chatbot/pdf-list.tsx`
  - [ ] Liste des documents indexés
  - [ ] Affichage métadonnées (nom, type, date, chunks)
  - [ ] Actions : télécharger, supprimer
  - [ ] Badge type de fichier (PDF/Image)
  - [ ] Animations (stagger, hover)

### API Routes
- [ ] Compléter `app/api/chat/upload/route.ts`
  - [x] Vérification authentification admin
  - [x] Récupération du fichier
  - [ ] Upload vers Firebase Storage
  - [ ] Appel à pdf-processor selon type
  - [ ] Génération embeddings
  - [ ] Indexation dans Qdrant
  - [ ] Sauvegarde métadonnées dans Firestore
  - [ ] Gestion erreurs complète

- [ ] Compléter `app/api/chat/documents/route.ts`
  - [x] Vérification authentification admin
  - [ ] Récupération depuis Firestore
  - [ ] Formatage des données
  - [ ] Filtrage par admin

- [ ] Créer `app/api/chat/documents/[id]/route.ts`
  - [ ] DELETE : Supprimer document
  - [ ] Suppression de Qdrant, Storage et Firestore
  - [ ] Vérification rôle admin

## Phase 3 : Intégration RAG complète

- [ ] Activer le RAG dans `app/api/chat/route.ts`
  - [ ] Utiliser chat-service au lieu d'OpenAI direct
  - [ ] Gérer l'historique de conversation
  - [ ] Formatage des réponses avec prompt système

- [ ] Améliorer `lib/rag/chat-service.ts`
  - [ ] Activer la recherche vectorielle (ne plus retourner [] en cas d'erreur)
  - [ ] Gérer les cas sans documents (fallback intelligent)
  - [ ] Prompt système pour formatage aéré

- [ ] Créer collection Firestore `rag_documents`
  - [ ] Schéma complet avec tous les champs
  - [ ] Index pour requêtes efficaces

## Phase 4 : Intégration dans les pages admin

- [ ] Compléter `app/admin/outils/chatbot/page.tsx`
  - [ ] Intégrer pdf-upload-dialog
  - [ ] Intégrer pdf-list
  - [ ] Statistiques réelles (depuis Firestore)
  - [ ] Actions fonctionnelles

## Phase 5 : Formatage et UX

### Dépendances
- [x] Installer react-markdown
  ```bash
  npm install react-markdown remark-gfm
  ```
  - [x] react-markdown déjà installé (v10.1.0)
  - [x] remark-gfm installé

### Styles et fonctionnalités
- [ ] Styles markdown personnalisés
  - [ ] Paragraphes espacés (margin-bottom: 1rem)
  - [ ] Listes avec espacement (margin-bottom: 0.5rem)
  - [ ] Titres avec hiérarchie visuelle
  - [ ] Line-height: 1.7 pour lisibilité

- [ ] Implémenter bouton copier
  - [ ] Icône copier visible au hover
  - [ ] Animation check après copie
  - [ ] Toast de confirmation
  - [ ] Copie du texte markdown complet

- [ ] Implémenter auto-select input
  - [ ] useEffect qui détecte nouvelle réponse
  - [ ] Focus automatique avec délai 100-200ms
  - [ ] Transition smooth

## Phase 6 : Documentation

- [ ] Créer `docs/08-rag-chatbot/README.md`
  - [ ] Vue d'ensemble du système
  - [ ] Architecture
  - [ ] Guide d'utilisation

- [ ] Créer `docs/08-rag-chatbot/ARCHITECTURE.md`
  - [ ] Architecture technique détaillée
  - [ ] Flux de données
  - [ ] Schémas Firestore

- [ ] Créer `docs/08-rag-chatbot/SETUP.md`
  - [ ] Installation des dépendances
  - [ ] Configuration Qdrant
  - [ ] Configuration OpenAI
  - [ ] Variables d'environnement

- [ ] Créer `docs/08-rag-chatbot/USAGE.md`
  - [ ] Guide utilisateur
  - [ ] Guide admin (upload documents)

## Notes importantes

- **OCR Tesseract.js** : Peut être lent côté client, considérer worker threads
- **Taille des chunks** : Optimiser selon performance (1000 chars avec overlap 200)
- **Limites upload** : 10MB PDF, 5MB images
- **Sécurité** : Validation stricte des types de fichiers
- **Performance** : Indexation asynchrone pour ne pas bloquer l'upload

## État actuel

### ✅ Déjà fait
- Infrastructure de base : qdrant-client, embeddings, pdf-processor, chat-service, types
- pdf-processor.ts complet : extraction PDF, OCR images, chunking avec overlap
- Bulle flottante fonctionnelle (floating-chat-button.tsx) - mais tout dans un seul fichier
- API /api/chat simplifiée (OpenAI direct, sans RAG complet)
- Pages /admin/outils et /dashboard/outils
- Dépendances installées (@qdrant/js, pdf-parse, tesseract.js, react-markdown)
- Configuration rag-config.ts
- API routes upload et documents : structure de base avec auth admin (TODOs à compléter)

### 🔄 En cours
- Aucun

### ⏳ À faire
- Toutes les phases ci-dessus

