# Plan d'implémentation : Chatbot RAG pour l'agence

## Vue d'ensemble

Création d'un système de chatbot RAG permettant à tous les utilisateurs d'interroger une base de connaissances spécifique à l'agence. Les admins peuvent uploader des **PDFs et des images** (avec OCR) qui sont indexés dans Qdrant, et tous les utilisateurs peuvent poser des questions via deux interfaces : un menu "Outils" dans la sidebar et une bulle flottante sur toutes les pages.

**Fonctionnalités clés** :
- Upload de PDFs et d'images (PNG, JPG, JPEG, WEBP) avec OCR automatique
- Réponses aérées, claires, complètes et pédagogiques
- Copie de chaque réponse du bot en un clic
- Auto-select de l'input après chaque réponse pour fluidité

## Architecture technique

- **Base vectorielle** : Qdrant Cloud (solution recommandée pour démarrage rapide, maintenance minimale)
  - Plan gratuit disponible (1 Go) pour les tests
  - Scaling automatique selon les besoins
  - Alternative : Qdrant auto-hébergé possible si volume important (nécessite expertise DevOps)
- **LLM** : OpenAI GPT-4o (via API)
- **Embeddings** : OpenAI text-embedding-3-small ou text-embedding-ada-002
- **Stockage PDF** : Firebase Storage
- **Métadonnées** : Firestore (références aux PDFs, métadonnées d'indexation)

## Informations nécessaires

**Important** : Au fur et à mesure du développement, il sera nécessaire de demander les informations suivantes :

- URL et clé API Qdrant Cloud (après création du compte)
- Clé API OpenAI
- Configuration spécifique souhaitée (taille des chunks, nombre de résultats, etc.)
- Préférences d'interface utilisateur
- Autres paramètres selon les besoins identifiés

## Structure des fichiers

### Documentation

- `docs/08-rag-chatbot/README.md` - Documentation principale du système RAG
- `docs/08-rag-chatbot/ARCHITECTURE.md` - Architecture technique détaillée
- `docs/08-rag-chatbot/SETUP.md` - Guide d'installation et configuration
- `docs/08-rag-chatbot/USAGE.md` - Guide d'utilisation pour les utilisateurs

### Composants UI

- `components/chatbot/chatbot-window.tsx` - Fenêtre principale du chatbot
- `components/chatbot/chat-message.tsx` - Composant pour afficher un message
- `components/chatbot/chat-input.tsx` - Zone de saisie avec envoi
- `components/chatbot/floating-chat-button.tsx` - Bulle flottante pour accès rapide
- `components/chatbot/pdf-upload-dialog.tsx` - Dialog d'upload PDF (admin uniquement)
- `components/chatbot/pdf-list.tsx` - Liste des PDFs indexés (admin)

### Pages

- `app/outils/page.tsx` - Page "Outils" avec charte et accès au chatbot
- `app/outils/layout.tsx` - Layout pour la page outils (si nécessaire)

### API Routes

- `app/api/chat/route.ts` - Endpoint pour les requêtes de chat (POST)
- `app/api/chat/upload/route.ts` - Endpoint pour upload PDF (admin uniquement)
- `app/api/chat/documents/route.ts` - Endpoint pour lister les documents (GET)
- `app/api/chat/documents/[id]/route.ts` - Endpoint pour supprimer un document (DELETE, admin)

### Services et utilitaires

- `lib/rag/qdrant-client.ts` - Client Qdrant pour connexion et opérations
- `lib/rag/embeddings.ts` - Service pour générer les embeddings (OpenAI)
- `lib/rag/pdf-processor.ts` - Service pour extraire le texte des PDFs et créer les chunks
- `lib/rag/chat-service.ts` - Service principal pour le RAG (recherche + génération)
- `lib/rag/types.ts` - Types TypeScript pour le système RAG

### Modifications des composants existants

- `components/dashboard/commercial-sidebar.tsx` - Ajouter item "Outils" dans menuItems
- `components/admin/admin-sidebar.tsx` - Ajouter item "Outils" dans navItems
- `app/layout.tsx` - Ajouter FloatingChatButton dans le layout root
- `app/dashboard/layout.tsx` - S'assurer que FloatingChatButton est accessible
- `app/admin/layout.tsx` - S'assurer que FloatingChatButton est accessible

### Configuration

- `.env.example` - Ajouter variables QDRANT_URL, QDRANT_API_KEY, OPENAI_API_KEY
- `lib/config/rag-config.ts` - Configuration centralisée pour RAG

## Étapes d'implémentation

### Phase 1 : Infrastructure et configuration

1. Créer le dossier de documentation `docs/08-rag-chatbot/`
2. Ajouter les variables d'environnement dans `.env.example`
3. Installer les dépendances : `@qdrant/js`, `openai`, `pdf-parse`, `langchain` (optionnel)
4. Créer `lib/config/rag-config.ts` avec la configuration
5. Créer `lib/rag/types.ts` avec les types TypeScript

### Phase 2 : Services backend

1. Créer `lib/rag/qdrant-client.ts` - Client Qdrant avec méthodes :

   - `connect()` - Connexion à Qdrant
   - `createCollection()` - Créer la collection si elle n'existe pas
   - `upsertVectors()` - Ajouter/mettre à jour des vecteurs
   - `search()` - Recherche vectorielle
   - `deleteVectors()` - Supprimer des vecteurs

2. Créer `lib/rag/embeddings.ts` - Service OpenAI pour embeddings :

   - `generateEmbedding(text: string)` - Générer un embedding

3. Créer `lib/rag/pdf-processor.ts` - Traitement des PDFs et images :

   - `extractTextFromPDF(buffer: Buffer)` - Extraire le texte des PDFs
   - `extractTextFromImage(buffer: Buffer)` - OCR pour extraire le texte des images
   - `chunkText(text: string, chunkSize: number, overlap: number)` - Découper en chunks
   - `processPDFForIndexing(file: File)` - Pipeline complet pour PDFs
   - `processImageForIndexing(file: File)` - Pipeline complet pour images (OCR)
   - **Formats supportés** : PDF, PNG, JPG, JPEG, WEBP
   - **OCR** : Utiliser Tesseract.js ou API cloud (Google Vision, AWS Textract)

4. Créer `lib/rag/chat-service.ts` - Service RAG principal :

   - `searchRelevantContexts(query: string, limit: number)` - Recherche vectorielle
   - `generateResponse(query: string, contexts: string[])` - Génération avec OpenAI
   - `chat(query: string, conversationHistory?: Message[])` - Méthode principale
   - **Formatage des réponses** : Les réponses doivent être aérées, claires, complètes et pédagogiques
     - Utiliser des paragraphes courts (2-3 phrases max)
     - Espacer les paragraphes avec des sauts de ligne
     - Utiliser des listes à puces pour les informations structurées
     - Utiliser des titres/sous-titres (markdown) pour organiser le contenu
     - Ajouter des exemples concrets quand pertinent
     - Utiliser un ton pédagogique et accessible

### Phase 3 : API Routes

1. `app/api/chat/route.ts` :

   - POST : Recevoir la question, appeler chat-service, retourner la réponse
   - Gérer l'historique de conversation (optionnel, stocké en session ou Firestore)
   - **Prompt engineering** : Configurer le prompt système pour OpenAI avec instructions de formatage
     - Demander des réponses aérées avec paragraphes courts
     - Utiliser des listes à puces pour structurer l'information
     - Utiliser des titres markdown (##, ###) pour organiser
     - Ton pédagogique et accessible
     - Exemples concrets quand pertinent
     - Format : "Répondez de manière claire, complète et pédagogique. Utilisez des paragraphes courts, des listes à puces, et structurez votre réponse avec des titres si nécessaire."

2. `app/api/chat/upload/route.ts` :

   - Vérifier le rôle admin (middleware)
   - Recevoir le fichier (PDF ou image)
   - Détecter le type de fichier (PDF, PNG, JPG, JPEG, WEBP)
   - Appeler pdf-processor ou image-processor selon le type
   - Pour les images : utiliser OCR pour extraire le texte
   - Générer les embeddings
   - Indexer dans Qdrant
   - Stocker le fichier dans Firebase Storage
   - Enregistrer les métadonnées dans Firestore (avec type: 'pdf' | 'image')

3. `app/api/chat/documents/route.ts` :

   - GET : Lister tous les documents indexés (admin) ou seulement les métadonnées publiques

4. `app/api/chat/documents/[id]/route.ts` :

   - DELETE : Supprimer un document (admin uniquement)
   - Supprimer de Qdrant, Firebase Storage et Firestore

### Phase 4 : Composants UI

#### Design et effets visuels

**Style général** : Moderne, sympa, fun avec des effets "wow"

- **Palette de couleurs** : Gradients bleu-violet-rose (cohérent avec le reste de l'app)
- **Animations** : Framer Motion pour transitions fluides, GSAP pour effets avancés
- **Glassmorphism** : Effets de verre dépoli (backdrop-blur) pour modernité
- **Micro-interactions** : Hover effects, pulse animations, shimmer effects
- **Typographie** : Hiérarchie claire, emojis pour rendre plus friendly

#### Composants détaillés

1. `components/chatbot/chatbot-window.tsx` :

   - **Design** : Drawer/Modal avec glassmorphism et gradient de fond
   - **Animations** :
     - Apparition en slide depuis le bas avec spring animation
     - Backdrop avec fade-in
     - Messages qui apparaissent avec stagger (un après l'autre)
   - **Effets** :
     - Gradient animé en arrière-plan (subtle)
     - Shimmer effect sur le header
     - Scroll smooth avec indicateur visuel
   - **Fonctionnalités** :
     - Historique de conversation avec scroll automatique
     - Intégration avec ChatMessage et ChatInput
     - Gestion de l'état (loading avec skeleton, erreurs avec toast animé)
     - **Auto-select de l'input après réponse** :
       - Détecter quand une nouvelle réponse du bot est reçue
       - Automatiquement focus l'input (smooth transition)
       - Permet de taper directement sans cliquer
       - Utiliser `useEffect` avec dépendance sur les messages
       - Délai léger (100-200ms) pour ne pas être brusque

2. `components/chatbot/chat-message.tsx` :

   - **Design** :
     - Messages utilisateur : Bulles avec gradient bleu-violet, alignées à droite
     - Messages bot : Bulles avec glassmorphism, alignées à gauche
     - Avatar animé pour le bot (icône avec pulse effect)
   - **Animations** :
     - Apparition avec fade-in + slide
     - Typing indicator animé (3 points qui rebondissent)
     - Hover effect avec scale léger
   - **Effets** :
     - Markdown formaté avec syntax highlighting pour code
     - **Formatage aéré des réponses** :
       - Paragraphes espacés (margin-bottom entre chaque)
       - Listes à puces avec espacement généreux
       - Titres/sous-titres avec hiérarchie visuelle claire
       - Espacement entre sections (exemples, explications)
       - Typographie lisible (line-height confortable, 1.6-1.8)
     - Indicateur de sources avec badges colorés (quels PDFs/images utilisés)
     - **Bouton copier pour chaque réponse** :
       - Icône copier visible au hover ou toujours visible
       - Animation de check après copie
       - Feedback visuel (toast ou animation inline)
       - Copie du texte complet de la réponse
   - **Micro-interactions** :
     - Bouton copier avec animation de check
     - Liens avec hover effect coloré

3. `components/chatbot/chat-input.tsx` :

   - **Design** :
     - Input avec glassmorphism et border gradient
     - Bouton d'envoi avec gradient animé et icône
     - Focus state avec glow effect
   - **Animations** :
     - Input qui s'agrandit légèrement au focus
     - Bouton avec pulse effect quand prêt à envoyer
     - Loading state avec spinner animé
   - **Effets** :
     - Placeholder animé (texte qui glisse)
     - Validation visuelle en temps réel
     - Support Enter pour envoyer avec feedback haptique (optionnel)
   - **Auto-select après réponse** :
     - Après réception d'une réponse du bot, l'input est automatiquement sélectionné (focus)
     - Permet de taper directement sans cliquer
     - Utiliser `useEffect` pour détecter nouvelle réponse et `inputRef.current?.focus()`
     - Transition smooth pour ne pas être brusque

4. `components/chatbot/floating-chat-button.tsx` :

   - **Design** :
     - Bouton circulaire avec gradient bleu-violet-rose
     - Ombre portée avec glow effect
     - Badge de notification avec animation pulse
   - **Animations** :
     - Apparition depuis le bas avec bounce effect
     - Hover avec scale + rotation légère
     - Pulse continu subtil pour attirer l'attention
     - Badge qui apparaît avec scale animation
   - **Effets** :
     - Ripple effect au clic
     - Transition smooth vers la fenêtre de chat
     - Position fixe en bas à droite, responsive
   - **Micro-interactions** :
     - Icône qui change (chat fermé → chat ouvert)
     - Badge avec compteur animé

5. `components/chatbot/pdf-upload-dialog.tsx` :

   - **Design** :
     - Dialog avec glassmorphism et backdrop blur
     - Zone de drop avec border gradient animé
     - Indicateur de progression avec gradient bar
   - **Animations** :
     - Dialog qui apparaît avec scale + fade
     - Zone de drop avec pulse effect quand fichier survolé
     - Barre de progression animée (gradient qui bouge)
     - Success animation avec checkmark animé
   - **Effets** :
     - Drag & drop avec feedback visuel (border qui change de couleur)
     - Preview du fichier avec icône animée
     - Validation avec feedback coloré (vert/rouge)
   - **Formats supportés** :
     - **PDFs** : .pdf
     - **Images** : .png, .jpg, .jpeg, .webp (avec OCR)
     - Affichage du type de fichier avec icône appropriée
   - **OCR pour images** :
     - Indicateur visuel que l'OCR est en cours
     - Preview de l'image pendant le traitement
     - Feedback sur la qualité de l'extraction OCR
   - **Micro-interactions** :
     - Bouton de sélection avec hover effect
     - Icône de fichier qui tourne pendant l'upload
     - Badge indiquant le type de fichier (PDF/Image)

6. `components/chatbot/pdf-list.tsx` :

   - **Design** :
     - Cards avec glassmorphism et hover effect
     - Gradient subtil sur chaque card
     - Badges pour métadonnées (date, chunks, type)
   - **Animations** :
     - Liste qui apparaît avec stagger (cards une par une)
     - Hover avec lift effect (scale + shadow)
     - Suppression avec slide-out animation
   - **Effets** :
     - Icône adaptée selon le type (PDF ou Image)
     - Badges avec pulse effect pour info importante
     - Bouton supprimer avec confirmation animée
     - Badge indiquant le type de fichier (PDF/Image)
   - **Micro-interactions** :
     - Cards cliquables avec ripple effect
     - Tooltips avec fade-in
     - Preview de l'image si c'est une image (hover ou clic)

### Phase 5 : Pages et navigation

1. `app/outils/page.tsx` :

   - **Design** :
     - Hero section avec gradient animé en arrière-plan
     - Cards avec glassmorphism pour chaque section
     - Typographie avec hiérarchie visuelle claire
   - **Contenu** :
     - Charte d'utilisation du chatbot (présentée de manière visuelle)
     - Section explicative sur le RAG avec illustrations/icônes animées
     - Bouton CTA pour ouvrir le chatbot avec gradient et hover effect
     - Section admin avec upload PDF et liste des documents
   - **Animations** :
     - Hero avec parallax effect subtil
     - Cards qui apparaissent avec stagger
     - Boutons avec hover effects et transitions
   - **Effets** :
     - Background avec gradient animé (subtle)
     - Sections avec séparateurs visuels animés
     - Icons avec pulse effects pour attirer l'attention

2. Modifier les sidebars :

   - Ajouter "Outils" avec icône `Wrench` ou `Bot` dans `commercial-sidebar.tsx`
   - Ajouter "Outils" dans `admin-sidebar.tsx`
   - Lien vers `/outils`

3. Ajouter FloatingChatButton dans `app/layout.tsx` :

   - Rendre visible sur toutes les pages (sauf login)
   - Utiliser RouteGuard pour vérifier l'authentification

### Phase 6 : Firestore structure

Créer la collection `rag_documents` avec le schéma :

```typescript
{
  id: string;
  filename: string;
  fileType: 'pdf' | 'image'; // Type de fichier
  imageType?: 'png' | 'jpg' | 'jpeg' | 'webp'; // Si image
  uploadedBy: string; // userId
  uploadedAt: Timestamp;
  fileUrl: string; // Firebase Storage URL
  fileSize: number;
  chunkCount: number;
  qdrantCollectionId: string;
  ocrConfidence?: number; // Score de confiance OCR (si image)
  metadata?: {
    title?: string;
    description?: string;
  }
}
```

## Formatage des réponses du chatbot

### Principes de formatage

Les réponses du chatbot doivent être **aérées, claires, complètes et pédagogiques** :

- **Aération** :
  - Paragraphes courts (2-3 phrases maximum)
  - Espacement généreux entre les paragraphes (margin-bottom)
  - Sauts de ligne entre les sections
  - Listes à puces avec espacement entre items

- **Clarté** :
  - Structure avec titres/sous-titres (markdown ##, ###)
  - Hiérarchie visuelle claire
  - Information organisée logiquement
  - Phrases courtes et directes

- **Complétude** :
  - Réponses exhaustives sur le sujet
  - Exemples concrets quand pertinent
  - Contextualisation des informations
  - Références aux sources utilisées

- **Pédagogie** :
  - Ton accessible et bienveillant
  - Explications progressives (du simple au complexe)
  - Analogies et métaphores pour faciliter la compréhension
  - Reformulation si nécessaire

### Implémentation technique

1. **Prompt système OpenAI** :
   ```
   "Vous êtes un assistant intelligent qui répond aux questions de manière claire, complète et pédagogique. 
   Vos réponses doivent être :
   - Aérées : utilisez des paragraphes courts (2-3 phrases) avec des sauts de ligne entre chaque
   - Structurées : utilisez des titres markdown (##, ###) et des listes à puces pour organiser l'information
   - Complètes : donnez des réponses exhaustives avec des exemples concrets
   - Pédagogiques : utilisez un ton accessible, des explications progressives et des analogies si pertinent"
   ```

2. **CSS pour le formatage** :
   - `line-height: 1.7` pour la lisibilité
   - `margin-bottom: 1rem` entre paragraphes
   - `margin-bottom: 0.5rem` entre items de liste
   - Espacement généreux pour les titres (margin-top/bottom)

3. **Composant de rendu markdown** :
   - Utiliser `react-markdown` ou équivalent
   - Styles personnalisés pour h2, h3, p, ul, li
   - Espacement cohérent dans tout le message

## Design et UX

### Principes de design

- **Modernité** : Glassmorphism, gradients animés, effets de profondeur
- **Fun** : Animations fluides, micro-interactions, feedback visuel immédiat
- **Wow factor** : Effets subtils mais impressionnants (shimmer, pulse, glow)
- **Cohérence** : Palette de couleurs alignée avec le reste de l'application (bleu-violet-rose)
- **Accessibilité** : Contraste suffisant, animations respectueuses (prefers-reduced-motion)

### Bibliothèques d'animation

- **Framer Motion** : Transitions principales, animations de layout, stagger effects
- **GSAP** : Effets avancés (parallax, animations complexes)
- **CSS Animations** : Micro-interactions, hover effects, keyframes
- **Tailwind CSS** : Utilities pour gradients, shadows, backdrop-blur

### Palette de couleurs

- **Primaire** : Bleu (#3B82F6) → Violet (#8B5CF6) → Rose (#EC4899)
- **Accent** : Gradients animés pour CTA et éléments importants
- **Background** : Glassmorphism avec backdrop-blur (rgba(255, 255, 255, 0.1))
- **Text** : Hiérarchie claire avec contrastes adaptés au thème clair/sombre

### Effets visuels spécifiques

- **Glassmorphism** : backdrop-blur(10px) + border semi-transparent
- **Gradient animé** : Background avec gradient-x animation (3s infinite)
- **Shimmer effect** : Animation de brillance sur les éléments de chargement
- **Pulse effect** : Animation pulse pour attirer l'attention (boutons, badges)
- **Glow effect** : Box-shadow animé pour les éléments en focus
- **Ripple effect** : Effet de vague au clic sur les boutons
- **Stagger animation** : Apparition séquentielle des éléments (messages, cards)

### Composants de design réutilisables

- Gradient buttons avec hover effects et transitions
- Glass cards avec backdrop-blur et border gradient
- Animated badges et chips avec pulse effect
- Loading skeletons avec shimmer animation
- Toast notifications avec slide-in animations
- Floating action buttons avec bounce effect

## Sécurité

- Vérifier le rôle admin pour upload/delete (middleware dans API routes)
- Valider les types de fichiers (PDF, PNG, JPG, JPEG, WEBP uniquement)
- Limiter la taille des fichiers (ex: 10MB max pour PDF, 5MB max pour images)
- Sanitizer les inputs utilisateur avant recherche
- Rate limiting sur l'API chat (éviter abus)
- Validation des images (vérifier que c'est bien une image, pas un fichier renommé)
- Limiter le nombre de fichiers uploadés par admin (ex: 50 max)

## Design et UX

### Principes de design

- **Modernité** : Glassmorphism, gradients animés, effets de profondeur
- **Fun** : Animations fluides, micro-interactions, feedback visuel immédiat
- **Wow factor** : Effets subtils mais impressionnants (shimmer, pulse, glow)
- **Cohérence** : Palette de couleurs alignée avec le reste de l'application
- **Accessibilité** : Contraste suffisant, animations respectueuses (prefers-reduced-motion)

### Bibliothèques d'animation

- **Framer Motion** : Transitions principales, animations de layout
- **GSAP** : Effets avancés (parallax, complex animations)
- **CSS Animations** : Micro-interactions, hover effects
- **Tailwind CSS** : Utilities pour gradients, shadows, backdrop-blur

### Palette de couleurs

- **Primaire** : Bleu (#3B82F6) → Violet (#8B5CF6) → Rose (#EC4899)
- **Accent** : Gradients animés pour CTA et éléments importants
- **Background** : Glassmorphism avec backdrop-blur
- **Text** : Hiérarchie claire avec contrastes adaptés

### Composants de design réutilisables

- Gradient buttons avec hover effects
- Glass cards avec backdrop-blur
- Animated badges et chips
- Loading skeletons avec shimmer
- Toast notifications avec slide-in animations

## Tests et validation

- Tester l'upload PDF avec différents formats
- Tester la recherche avec diverses questions
- Vérifier que seuls les admins peuvent uploader
- Tester la bulle flottante sur différentes pages
- Vérifier la responsivité mobile
- **Tests UX** :
  - Vérifier la fluidité des animations sur différents devices
  - Tester les micro-interactions
  - Valider l'accessibilité (contraste, keyboard navigation)
  - Tester avec prefers-reduced-motion activé

## Dépendances à installer

```bash
npm install @qdrant/js openai pdf-parse
npm install -D @types/pdf-parse

# Pour l'OCR (choisir une option) :
# Option 1 : Tesseract.js (client-side, gratuit)
npm install tesseract.js

# Option 2 : API cloud (recommandé pour production)
# - Google Cloud Vision API (via @google-cloud/vision)
# - AWS Textract (via @aws-sdk/client-textract)
# - Azure Computer Vision (via @azure/cognitiveservices-computervision)
```

## Variables d'environnement

```env
# Qdrant Cloud
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_api_key_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o
```

## Checklist d'implémentation

- [ ] Créer le dossier docs/08-rag-chatbot/ avec README.md, ARCHITECTURE.md, SETUP.md, USAGE.md
- [ ] Ajouter variables QDRANT et OPENAI dans .env.example et créer lib/config/rag-config.ts
- [ ] Installer dépendances @qdrant/js, openai, pdf-parse
- [ ] Créer lib/rag/types.ts avec tous les types TypeScript nécessaires
- [ ] Créer lib/rag/qdrant-client.ts avec méthodes connect, createCollection, upsertVectors, search, deleteVectors
- [ ] Créer lib/rag/embeddings.ts pour générer les embeddings avec OpenAI
- [ ] Créer lib/rag/pdf-processor.ts pour extraire texte et créer chunks
- [ ] Créer lib/rag/chat-service.ts avec recherche vectorielle et génération de réponse
- [ ] Créer app/api/chat/route.ts pour gérer les requêtes de chat
- [ ] Créer app/api/chat/upload/route.ts pour upload PDF (admin uniquement)
- [ ] Créer app/api/chat/documents/route.ts et [id]/route.ts pour lister/supprimer documents
- [ ] Créer components/chatbot/chatbot-window.tsx avec historique et gestion état
- [ ] Créer components/chatbot/chat-message.tsx et chat-input.tsx
- [ ] Créer components/chatbot/floating-chat-button.tsx avec animation
- [ ] Créer components/chatbot/pdf-upload-dialog.tsx et pdf-list.tsx pour admin
- [ ] Créer app/outils/page.tsx avec charte et accès au chatbot
- [ ] Ajouter item 'Outils' dans commercial-sidebar.tsx et admin-sidebar.tsx
- [ ] Ajouter FloatingChatButton dans app/layout.tsx avec RouteGuard
- [ ] Créer collection rag_documents dans Firestore avec le schéma défini

## Améliorations futures

### Priorité haute (impact utilisateur immédiat)

#### 1. Historique de conversation persistant

**Objectif** : Permettre aux utilisateurs de retrouver leurs conversations précédentes

**Implémentation** :
- Créer collection Firestore `chat_conversations` :
  ```typescript
  {
    id: string;
    userId: string;
    title: string; // Première question ou titre généré
    messages: Message[]; // Array de messages
    createdAt: Timestamp;
    updatedAt: Timestamp;
    documentCount: number; // Nombre de documents référencés
  }
  ```
- Composant `conversation-history.tsx` :
  - Liste des conversations récentes
  - Recherche dans l'historique
  - Reprendre une conversation
  - Supprimer une conversation
- API route `app/api/chat/conversations/route.ts` :
  - GET : Lister les conversations de l'utilisateur
  - POST : Créer une nouvelle conversation
  - PUT : Mettre à jour une conversation
  - DELETE : Supprimer une conversation

**Avantage** : Continuité, référence, productivité

#### 2. Suggestions de questions

**Objectif** : Aider les utilisateurs à démarrer avec des questions pertinentes

**Implémentation** :
- Générer des suggestions basées sur :
  - Titres des documents indexés
  - Questions fréquentes (si historique activé)
  - Catégories de documents
- Composant `question-suggestions.tsx` :
  - Afficher 3-5 suggestions au démarrage
  - Suggestions contextuelles pendant la conversation
  - Clic sur suggestion → envoi automatique
- API route `app/api/chat/suggestions/route.ts` :
  - Analyser les documents indexés
  - Générer des questions suggérées
  - Retourner les suggestions formatées

**Avantage** : Aide à démarrer, découvrabilité

#### 3. Feedback utilisateur (like/dislike)

**Objectif** : Améliorer les réponses grâce au feedback utilisateur

**Implémentation** :
- Ajouter boutons thumbs up/down sur chaque message bot
- Collection Firestore `chat_feedback` :
  ```typescript
  {
    id: string;
    messageId: string;
    conversationId: string;
    userId: string;
    rating: 'positive' | 'negative';
    comment?: string; // Commentaire optionnel
    createdAt: Timestamp;
  }
  ```
- Composant `message-feedback.tsx` :
  - Boutons like/dislike avec animation
  - Dialog pour commentaire (optionnel)
  - Feedback visuel après envoi
- API route `app/api/chat/feedback/route.ts` :
  - POST : Enregistrer le feedback
  - Analyser les feedbacks pour améliorer les prompts

**Avantage** : Amélioration continue, qualité des réponses

### Priorité moyenne (expérience utilisateur)

#### 4. Export de conversation

**Objectif** : Permettre l'export et le partage des conversations

**Implémentation** :
- Bouton "Exporter" dans `chatbot-window.tsx`
- Formats supportés :
  - **PDF** : Avec mise en forme, sources, date
  - **Markdown** : Format lisible, facile à partager
  - **TXT** : Format simple
- Composant `export-dialog.tsx` :
  - Sélection du format
  - Options (inclure sources, date, etc.)
  - Téléchargement direct
- Service `lib/rag/export-service.ts` :
  - Génération PDF avec jsPDF
  - Génération Markdown
  - Génération TXT

**Avantage** : Partage, archivage, documentation

#### 5. Mode conversationnel amélioré

**Objectif** : Améliorer le contexte multi-tours de conversation

**Implémentation** :
- Modifier `chat-service.ts` pour inclure l'historique complet
- Gérer le contexte conversationnel :
  - Références aux messages précédents
  - Compréhension des pronoms ("il", "cela", etc.)
  - Continuité thématique
- Option "Continuer" si réponse tronquée
- Limite de contexte (ex: 10 derniers messages)

**Avantage** : Conversations plus naturelles, meilleure compréhension

#### 6. Statistiques d'utilisation (admin)

**Objectif** : Dashboard d'analytics pour les admins

**Implémentation** :
- Page `app/admin/chatbot-stats/page.tsx` :
  - Métriques clés :
    - Nombre de questions par jour/semaine/mois
    - Questions les plus fréquentes
    - Documents les plus consultés
    - Taux de satisfaction (si feedback activé)
    - Temps de réponse moyen
  - Graphiques avec Recharts
  - Filtres par période
- Collection Firestore `chat_analytics` :
  - Agréger les données quotidiennement
  - Stocker les métriques calculées
- API route `app/api/chat/stats/route.ts` :
  - Calculer les statistiques
  - Retourner les données formatées

**Avantage** : Suivi, optimisation, insights

### Priorité basse (nice to have)

#### 7. Recherche dans l'historique

**Objectif** : Permettre de retrouver facilement des conversations

**Implémentation** :
- Barre de recherche dans `conversation-history.tsx`
- Recherche full-text dans :
  - Titres de conversations
  - Contenu des messages
  - Mots-clés
- Filtres :
  - Par date (dernière semaine, mois, etc.)
  - Par document référencé
  - Par rating (si feedback activé)

**Avantage** : Productivité, retrouvabilité

#### 8. Partage de conversation

**Objectif** : Permettre le partage de conversations avec d'autres utilisateurs

**Implémentation** :
- Bouton "Partager" dans `chatbot-window.tsx`
- Générer un lien de partage (lecture seule)
- Collection Firestore `shared_conversations` :
  ```typescript
  {
    id: string;
    conversationId: string;
    sharedBy: string; // userId
    shareToken: string; // Token unique
    expiresAt: Timestamp;
    createdAt: Timestamp;
  }
  ```
- Page publique `app/share/[token]/page.tsx` :
  - Afficher la conversation en lecture seule
  - Design épuré, sans possibilité d'interaction

**Avantage** : Collaboration, documentation

#### 9. Notifications

**Objectif** : Améliorer l'expérience asynchrone

**Implémentation** :
- Notification si réponse longue (>30s)
- Badge sur la bulle flottante avec nombre de nouvelles réponses
- Notification toast quand réponse reçue (si fenêtre fermée)
- Préférences utilisateur pour activer/désactiver

**Avantage** : Meilleure expérience asynchrone

#### 10. Amélioration continue avec feedback

**Objectif** : Utiliser les feedbacks pour améliorer automatiquement le système

**Implémentation** :
- Analyser les feedbacks négatifs :
  - Identifier les patterns de problèmes
  - Ajuster les prompts système
  - Retraiter les documents problématiques
- Job périodique (cron) :
  - Analyser les feedbacks de la semaine
  - Générer un rapport pour les admins
  - Suggestions d'amélioration

**Avantage** : Amélioration progressive, qualité

### Améliorations techniques

#### 11. Cache des réponses fréquentes

**Objectif** : Réduire les coûts et améliorer les performances

**Implémentation** :
- Cache Redis ou Firestore pour les questions fréquentes
- Détecter les questions similaires (embeddings)
- Retourner la réponse mise en cache si similarité > 0.95
- TTL du cache : 7 jours

**Avantage** : Performance, réduction des coûts API

#### 12. Streaming des réponses

**Objectif** : Afficher la réponse au fur et à mesure

**Implémentation** :
- Utiliser OpenAI Streaming API
- Afficher les tokens au fur et à mesure
- Animation de typing pendant le streaming
- Meilleure perception de la vitesse

**Avantage** : Expérience plus fluide, perception de rapidité

#### 13. Gestion des erreurs améliorée

**Objectif** : Messages d'erreur clairs et actions de récupération

**Implémentation** :
- Messages d'erreur contextuels :
  - "Impossible de se connecter à Qdrant" → Suggestion de réessayer
  - "Document trop volumineux" → Limite claire affichée
  - "OCR échoué" → Suggestion de réessayer avec meilleure qualité
- Retry automatique pour erreurs temporaires
- Fallback : Message d'excuse + suggestion d'action

**Avantage** : Robustesse, meilleure UX en cas d'erreur

## Roadmap d'implémentation des améliorations

### Phase 1 (Post-MVP) - Priorité haute
1. Historique de conversation persistant
2. Suggestions de questions
3. Feedback utilisateur

### Phase 2 - Priorité moyenne
4. Export de conversation
5. Mode conversationnel amélioré
6. Statistiques d'utilisation

### Phase 3 - Priorité basse
7. Recherche dans l'historique
8. Partage de conversation
9. Notifications
10. Amélioration continue

### Phase 4 - Techniques
11. Cache des réponses
12. Streaming des réponses
13. Gestion des erreurs améliorée

