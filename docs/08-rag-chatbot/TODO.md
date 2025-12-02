# TODO - Implémentation RAG Chatbot

## Phase 1 : Composants UI du chatbot

### Composants de base
- [ ] Créer `components/chatbot/chat-message.tsx`
  - [ ] Affichage messages user et assistant
  - [ ] Formatage markdown avec react-markdown
  - [ ] Styles aérés (paragraphes espacés, listes, titres)
  - [ ] Bouton copier avec animation check
  - [ ] Indicateur de sources (badges)
  - [ ] Animations d'apparition (fade-in + slide)

- [ ] Créer `components/chatbot/chat-input.tsx`
  - [ ] Input avec glassmorphism
  - [ ] Bouton d'envoi avec gradient
  - [ ] Support Enter pour envoyer
  - [ ] Auto-select après réponse (useEffect + focus)
  - [ ] Validation visuelle
  - [ ] Loading state

- [ ] Refactoriser `components/chatbot/floating-chat-button.tsx`
  - [ ] Utiliser les nouveaux composants chat-message et chat-input
  - [ ] Intégrer le formatage markdown
  - [ ] Ajouter le bouton copier
  - [ ] Implémenter l'auto-select de l'input

## Phase 2 : Upload et gestion des documents

### Traitement des fichiers
- [ ] Compléter `lib/rag/pdf-processor.ts`
  - [ ] Vérifier extractTextFromPDF fonctionne
  - [ ] Implémenter extractTextFromImage avec Tesseract.js
  - [ ] Implémenter chunkText avec overlap
  - [ ] Pipeline complet processPDFForIndexing
  - [ ] Pipeline complet processImageForIndexing

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
  - [ ] Upload vers Firebase Storage
  - [ ] Appel à pdf-processor selon type
  - [ ] Génération embeddings
  - [ ] Indexation dans Qdrant
  - [ ] Sauvegarde métadonnées dans Firestore
  - [ ] Gestion erreurs complète

- [ ] Compléter `app/api/chat/documents/route.ts`
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
- [ ] Installer react-markdown
  ```bash
  npm install react-markdown remark-gfm
  ```

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
- Bulle flottante fonctionnelle (floating-chat-button.tsx)
- API /api/chat simplifiée (OpenAI direct, sans RAG complet)
- Pages /admin/outils et /dashboard/outils
- Dépendances installées (@qdrant/js, pdf-parse, tesseract.js)
- Configuration rag-config.ts

### 🔄 En cours
- Aucun

### ⏳ À faire
- Toutes les phases ci-dessus

