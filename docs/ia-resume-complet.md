# Résumé Complet - Système IA Assistant

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Stack technique](#stack-technique)
3. [Architecture](#architecture)
4. [Interfaces utilisateur](#interfaces-utilisateur)
5. [Design UI/UX](#design-uiux)
6. [Système de prompts](#système-de-prompts)
7. [Base de connaissances](#base-de-connaissances)
8. [Gestion des fichiers et images](#gestion-des-fichiers-et-images)
9. [Rate limiting et budget](#rate-limiting-et-budget)
10. [Monitoring et audit](#monitoring-et-audit)
11. [Flux de données](#flux-de-données)
12. [Points d'amélioration potentiels](#points-damélioration-potentiels)

---

## Vue d'ensemble

L'assistant IA est un système complet intégré à l'application SaaS de l'agence Allianz Marseille. Il permet aux utilisateurs d'obtenir de l'aide contextuelle sur les domaines métier de l'agence (assurance IARD, Santé, Prévoyance, Sinistres, etc.).

**Caractéristiques principales :**
- Assistant conversationnel avec OpenAI GPT-4o
- Interface WhatsApp-like (bulles de messages)
- Système de boutons guidés par domaine métier
- Support des images (OCR via Vision API)
- Support des fichiers (PDF, Word, Excel, TXT, CSV)
- Base de connaissances métier intégrée
- Rate limiting et contrôle budgétaire
- Monitoring complet des coûts et usages

---

## Stack technique

### Backend

**API Route :** `app/api/assistant/chat/route.ts`
- **Framework :** Next.js 14+ (App Router)
- **Runtime :** Node.js (Server-side)
- **Authentification :** Firebase Auth (vérification via `verifyAuth`)

**Modèle IA :**
- **Principal :** OpenAI GPT-4o
- **Pour images :** GPT-4o (Vision API)
- **Fallback :** GPT-4o par défaut
- **Configuration :**
  - Temperature : 0.7
  - Max tokens : 2000
  - Timeout : 60 secondes

**Bibliothèques principales :**
- `openai` : SDK OpenAI officiel
- `firebase-admin` : Accès Firestore côté serveur
- `pdf-parse` : Extraction texte PDF
- `mammoth` : Extraction texte Word (.docx)
- `xlsx` : Extraction texte Excel

### Frontend

**Framework :** Next.js 14+ (React 18+)
- **State Management :** Zustand (`lib/assistant/assistant-store.ts`)
- **Styling :** Tailwind CSS
- **Animations :** Framer Motion
- **UI Components :** Radix UI (Dialog, Button, Textarea, etc.)
- **Icons :** Lucide React

**Composants principaux :**
- `AssistantWrapper.tsx` : Wrapper global (gère l'état du drawer)
- `AssistantDrawer.tsx` : Drawer sidebar (interface principale)
- `AssistantCore.tsx` : Cœur de l'assistant (logique conversation)
- `MainButtonMenu.tsx` : Menu des rôles métier
- `SubButtonMenu.tsx` : Menu des modes/actions
- `MarkdownRenderer.tsx` : Rendu des réponses Markdown

### Base de données

**Firestore Collections :**
- `assistant_usage_logs` : Logs d'utilisation (tokens, coûts, durée)
- `assistant_rate_limits` : Compteurs de rate limiting par utilisateur
- `assistant_config` : Configuration (budget, limites)
- `assistant_conversations` : Conversations sauvegardées (page outils)
- `assistant_alerts` : Alertes budget

---

## Architecture

### Structure des fichiers

```
lib/assistant/
├── assistant-store.ts          # Store Zustand (état global)
├── main-buttons.ts             # Définitions boutons principaux/sous-boutons
├── main-button-prompts.ts     # Prompts système par bouton (2912 lignes)
├── knowledge-loader.ts         # Chargement base de connaissances
├── file-processing.ts          # Traitement fichiers (PDF, Word, Excel)
├── file-extraction.ts          # Extraction texte (OCR, parsing)
├── image-utils.ts              # Utilitaires images (base64, validation)
├── rate-limiting.ts            # Système de rate limiting
├── budget-alerts.ts            # Gestion budget et alertes
├── monitoring.ts               # Monitoring coûts et usage
├── retry.ts                    # Retry logic avec backoff
├── audit.ts                    # Audit trail des actions
├── conversations.ts            # Gestion conversations sauvegardées
└── templates.ts               # Templates de réponses

components/assistant/
├── AssistantWrapper.tsx        # Wrapper global (drawer state)
├── AssistantDrawer.tsx         # Drawer sidebar
├── AssistantCore.tsx           # Cœur conversationnel (803 lignes)
├── MainButtonMenu.tsx          # Menu rôles
├── SubButtonMenu.tsx           # Menu modes
├── MarkdownRenderer.tsx        # Rendu Markdown
├── QuickReplyButtons.tsx      # Boutons de réponse rapide
└── SearchBar.tsx              # Barre de recherche

app/
├── api/assistant/chat/route.ts # API route principale (594 lignes)
└── commun/outils/assistant-ia/ # Page outils complète (1710 lignes)
```

### Flux de données

```
Utilisateur → AssistantCore → API Route → OpenAI → Réponse streamée → AssistantCore → UI
```

**Détails :**
1. L'utilisateur saisit un message dans `AssistantCore`
2. Le message est envoyé à `/api/assistant/chat` avec l'historique
3. L'API route :
   - Vérifie l'authentification
   - Vérifie le rate limiting
   - Vérifie le budget
   - Charge la base de connaissances selon le contexte
   - Construit le prompt système enrichi
   - Appelle OpenAI avec retry logic
   - Stream la réponse ou retourne en bloc
4. La réponse est affichée dans `AssistantCore` avec rendu Markdown

---

## Interfaces utilisateur

### 1. Assistant Drawer (Sidebar)

**Fichier :** `components/assistant/AssistantDrawer.tsx`

**Caractéristiques :**
- Drawer (tiroir) qui s'ouvre depuis la sidebar (menu "Outils")
- Design WhatsApp-like avec bulles de messages
- Header avec gradient bleu/indigo/violet
- Bouton de réinitialisation de conversation
- Fermeture avec Escape ou clic sur overlay

**États gérés :**
- `isOpenDrawer` : Ouverture/fermeture (Zustand store)
- Messages partagés via le store Zustand
- Focus trap pour l'accessibilité

**Ouverture :**
- Depuis la sidebar via le store Zustand (`setIsOpenDrawer(true)`)
- Le drawer est toujours monté mais caché si `isOpen === false`

### 2. Page Outils IA

**Fichier :** `app/commun/outils/assistant-ia/page.tsx`

**Caractéristiques :**
- Page complète avec onglets (Chat / Historique)
- Sauvegarde automatique des conversations dans Firestore
- Export JSON des conversations
- Recherche dans l'historique (Ctrl+F / Cmd+F)
- Filtrage par date (aujourd'hui, semaine, mois)
- Nouveau chat (Ctrl+N / Cmd+N)

**Fonctionnalités spécifiques :**
- Gestion des conversations sauvegardées
- Recherche textuelle dans les messages
- Export de conversations
- Interface pleine page

**États locaux :**
- Messages, input, images, fichiers
- Conversations sauvegardées
- État de chargement, recherche, filtres

---

## Design UI/UX

### Style général

**Design :** WhatsApp-like (bulles de messages)
- Messages utilisateur : alignés à droite, fond bleu/violet
- Messages assistant : alignés à gauche, fond blanc/gris
- Typographie : Inter (Google Fonts)
- Couleurs : Gradient bleu → indigo → violet pour les accents

### Composants visuels

**Header du drawer :**
- Gradient : `from-blue-50 via-indigo-50 to-purple-50`
- Icône : MessageSquare dans un badge gradient
- Titre : "Assistant IA" avec gradient text
- Boutons : Réinitialiser (RotateCcw) et Fermer (X)

**Messages :**
- Bulles arrondies avec ombres légères
- Markdown rendu avec `MarkdownRenderer`
- Support des emojis, listes, liens, code
- Scroll automatique vers le bas

**Boutons métier :**
- 8 boutons principaux avec emojis et couleurs
- Sous-boutons affichés après sélection
- Design card avec hover effects
- Couleurs par domaine (bleu commercial, rouge sinistre, vert santé, etc.)

**Input zone :**
- Textarea auto-resize
- Boutons : Image, Fichier, Envoyer
- Drag & drop pour fichiers/images
- Support collage d'images depuis presse-papier

### Responsive

- Drawer : `w-full sm:max-w-2xl` (plein écran mobile, max 2xl desktop)
- Messages : `max-w-[75%]` sur desktop, ajusté sur mobile
- Header : Padding adaptatif `p-4 sm:p-6`

### Accessibilité

- Focus trap dans le drawer
- Fermeture avec Escape
- Labels ARIA (`aria-label`, `aria-modal`)
- Navigation clavier complète

---

## Système de prompts

### Architecture des prompts

Le système utilise un prompt système modulaire composé de :

1. **Core Knowledge** : Base de connaissances métier (toujours inclus)
2. **Button Prompt** : Prompt spécialisé selon le bouton/mode sélectionné
3. **Formatting Rules** : Règles de formatage (Markdown ou formel)

### Structure du prompt système

```
┌─────────────────────────────────────┐
│ Core Knowledge (base métier)        │
│ - Identité agence                    │
│ - Réglementation                     │
│ - Utilisateur connecté               │
│ - Domaines de maîtrise               │
└─────────────────────────────────────┘
           +
┌─────────────────────────────────────┐
│ Button Prompt (selon contexte)      │
│ - Commercial / Sinistre / Santé...   │
│ - Mode spécifique (M+3, Préterme...)│
│ - Chat libre                         │
└─────────────────────────────────────┘
           +
┌─────────────────────────────────────┐
│ Formatting Rules                     │
│ - Markdown ou style formel           │
│ - Sourcing obligatoire               │
│ - Signature pour mails/courriers     │
└─────────────────────────────────────┘
```

### Fichier des prompts

**Fichier :** `lib/assistant/main-button-prompts.ts` (2912 lignes)

**Fonctions principales :**
- `getStartPrompt()` : Prompt initial (bouton "Bonjour")
- `getFreeChatPrompt()` : Prompt chat libre
- `getSystemPromptForButton(buttonId, subButtonId?)` : Prompt selon le contexte

**Exemples de prompts spécialisés :**
- `getM3Prompt()` : Mode M+3 (clients à 3 mois)
- `getPretermeAutoPrompt()` : Préterme Auto (relance 45 jours)
- `getPresentationDevisPrompt()` : Présentation de devis
- `getExplicationGarantiesPrompt()` : Explication garanties
- Etc. (30+ prompts spécialisés)

### Enrichissement contextuel

**Base de connaissances chargée dynamiquement :**
- Core : `00-agence.md` + `90-compliance.md` (toujours)
- Commercial : `10-commercial.md` (si bouton commercial)
- Sinistre : `20-sinistres.md` (si bouton sinistre)
- Santé : `30-sante.md` (si bouton santé)

**Informations utilisateur injectées :**
- Nom, fonction, email, téléphone
- Utilisées pour les signatures de mails/courriers

---

## Base de connaissances

### Structure

```
docs/knowledge/
├── core/                    # Connaissances fondamentales
│   ├── effectif-agence.md
│   ├── identite-agence.md
│   ├── reglementation.md
│   └── ...
├── produits/               # Fiches produits
│   ├── assurance-iard.md
│   ├── assurance-sante.md
│   ├── assurance-vtm-allianz.md
│   └── ...
└── process/               # Processus internes
    ├── m-plus-3.md
    ├── preterme-auto.md
    ├── preterme-ird.md
    └── ...
```

### Chargement

**Fichier :** `lib/assistant/knowledge-loader.ts`

**Fonctions :**
- `loadCoreKnowledge()` : Charge toujours `00-agence.md` + `90-compliance.md`
- `loadRoleKnowledge(mainButton, subButton)` : Charge selon le contexte
- `loadKnowledgeForContext(mainButton, subButton)` : Combine core + role

**Principe :**
- Pas de vectorisation, pas d'embeddings
- Fichiers Markdown versionnés dans Git
- Chargement direct dans le system prompt
- Transparence totale (auditable)

### Contenu

**Core Knowledge :**
- Identité de l'agence (nom, coordonnées, effectif)
- Réglementation (sources officielles, liens)
- Domaines de maîtrise (IARD, VTM, Santé, Prévoyance, Sinistres)

**Produits :**
- Fiches produits détaillées par domaine
- Spécificités Allianz
- Processus de souscription

**Process :**
- Processus internes (M+3, Préterme, Leads)
- Scripts et argumentaires
- Templates de communication

---

## Gestion des fichiers et images

### Images

**Support :**
- Formats : JPEG, PNG, GIF, WebP
- Taille max : 20 MB par image
- Max : 10 images par message
- OCR : Via OpenAI Vision API (GPT-4o)

**Traitement :**
- Conversion en base64 (data URL)
- Validation du type MIME réel
- Compression si nécessaire
- Support collage depuis presse-papier

**Fichier :** `lib/assistant/image-utils.ts`

### Fichiers

**Formats supportés :**
- PDF (`.pdf`)
- Word (`.doc`, `.docx`)
- Excel (`.xls`, `.xlsx`)
- Texte (`.txt`)
- CSV (`.csv`)

**Limites :**
- Taille max : 20 MB par fichier
- Max : 10 fichiers par message

**Extraction :**
- **PDF :** `pdf-parse` (extraction texte)
- **Word :** `mammoth` (conversion HTML → texte)
- **Excel :** `xlsx` (parsing des cellules)
- **Images dans fichiers :** OCR via Vision API

**Sécurité :**
- Validation du type MIME réel (magic bytes)
- Quarantaine si extension valide mais type MIME suspect
- Rejet si type non supporté

**Fichier :** `lib/assistant/file-processing.ts` + `file-extraction.ts`

---

## Rate limiting et budget

### Rate limiting

**Fichier :** `lib/assistant/rate-limiting.ts`

**Limites par défaut :**
- **Texte :** 100 requêtes/jour
- **Images :** 50 requêtes/jour
- **Fichiers :** 20 requêtes/jour

**Fonctionnement :**
- Compteur par utilisateur et par type
- Reset quotidien (UTC)
- Stockage dans Firestore : `assistant_rate_limits/{userId}_{type}_{date}`
- Vérification avant chaque requête

**Types de requêtes :**
- `text` : Message texte seul
- `image` : Message avec images
- `file` : Message avec fichiers (prioritaire si les deux présents)

### Budget

**Fichier :** `lib/assistant/budget-alerts.ts`

**Configuration :**
- Budget mensuel : 100 $ par défaut
- Seuil d'avertissement : 80%
- Seuil critique : 95%
- Blocage à 100% : optionnel (désactivé par défaut)

**Fonctionnement :**
- Calcul du coût mensuel depuis `assistant_usage_logs`
- Vérification avant chaque requête
- Alertes automatiques (logs, future : notifications)

**Pricing OpenAI (par 1M tokens) :**
- GPT-4o : 2.50 $ input / 10.00 $ output
- GPT-4-turbo : 10.00 $ input / 30.00 $ output
- GPT-4 : 30.00 $ input / 60.00 $ output
- GPT-3.5-turbo : 0.50 $ input / 1.50 $ output

---

## Monitoring et audit

### Monitoring

**Fichier :** `lib/assistant/monitoring.ts`

**Données collectées :**
- Tokens input/output
- Coût calculé
- Modèle utilisé
- Durée de la requête
- Type de requête (text/image/file)
- Succès/échec
- Erreurs éventuelles

**Collections Firestore :**
- `assistant_usage_logs` : Tous les logs d'utilisation
- `assistant_config` : Configuration (budget, limites)

**Statistiques disponibles :**
- Par utilisateur (période donnée)
- Globales (tous utilisateurs, période donnée)
- Par modèle
- Par type de requête

### Audit

**Fichier :** `lib/assistant/audit.ts`

**Actions auditées :**
- Création de conversations
- Export de conversations
- Suppression de conversations
- Modifications de configuration

**Stockage :** Firestore `assistant_audit_logs`

---

## Flux de données

### Flux complet

```
┌─────────────┐
│  Utilisateur│
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ AssistantCore   │
│ (Frontend)      │
└──────┬──────────┘
       │ POST /api/assistant/chat
       │ { message, images, files, history, mainButton, subButton }
       ▼
┌─────────────────────────┐
│ API Route                │
│ 1. Vérification auth     │
│ 2. Rate limiting         │
│ 3. Budget check          │
│ 4. Load knowledge         │
│ 5. Build system prompt   │
│ 6. Call OpenAI           │
└──────┬───────────────────┘
       │
       ▼
┌─────────────┐
│   OpenAI    │
│   GPT-4o    │
└──────┬──────┘
       │ Stream ou bloc
       ▼
┌─────────────────┐
│ AssistantCore   │
│ (Update UI)     │
└─────────────────┘
```

### Gestion de l'historique

**Limitation :**
- Historique limité à 20 derniers messages (côté API)
- Stockage complet côté frontend (Zustand store)
- Sauvegarde optionnelle dans Firestore (page outils)

**Format :**
```typescript
{
  role: "user" | "assistant",
  content: string,
  images?: string[],
  files?: ProcessedFile[],
  timestamp: Date
}
```

### Streaming

**Mode streaming :**
- Activé par défaut (`stream: true`)
- Format : Server-Sent Events (SSE)
- Mise à jour progressive du message assistant
- Meilleure UX (pas d'attente de la réponse complète)

**Format SSE :**
```
data: {"type": "content", "content": "..."}
data: {"type": "content", "content": "..."}
data: [DONE]
```

---

## Points d'amélioration potentiels

### Performance

1. **Optimisation des prompts :**
   - Le prompt système peut être très long (base de connaissances + prompts spécialisés)
   - Considérer un système de RAG (Retrieval Augmented Generation) pour charger uniquement les connaissances pertinentes
   - Utiliser des embeddings pour la recherche sémantique

2. **Cache des connaissances :**
   - Les fichiers Markdown sont relus à chaque requête
   - Mettre en cache en mémoire avec invalidation sur changement

3. **Streaming amélioré :**
   - Actuellement fonctionnel mais pourrait être optimisé
   - Ajouter un indicateur de progression plus précis

### UX/UI

1. **Suggestions de réponses :**
   - Ajouter des suggestions contextuelles basées sur l'historique
   - Quick replies intelligentes

2. **Recherche améliorée :**
   - Recherche sémantique dans l'historique
   - Recherche dans la base de connaissances

3. **Personnalisation :**
   - Préférences utilisateur (ton, format, etc.)
   - Raccourcis personnalisés

### Fonctionnalités

1. **Multi-modales avancées :**
   - Support vidéo (extraction de frames)
   - Support audio (transcription)

2. **Intégrations :**
   - Connexion avec les données de l'app (actes, clients)
   - Génération automatique de documents depuis les données

3. **Templates avancés :**
   - Bibliothèque de templates réutilisables
   - Génération de templates depuis l'historique

### Sécurité

1. **Validation renforcée :**
   - Validation plus stricte des fichiers (scan antivirus)
   - Filtrage de contenu sensible

2. **Audit étendu :**
   - Logs plus détaillés des actions
   - Alertes sur comportements suspects

### Coûts

1. **Optimisation des tokens :**
   - Compression intelligente de l'historique
   - Résumé automatique des conversations longues
   - Utilisation de modèles moins coûteux quand approprié

2. **Prédiction de coût :**
   - Estimation du coût avant l'envoi
   - Alertes proactives sur le budget

---

## Conclusion

Le système IA est bien structuré avec une architecture modulaire, une base de connaissances maintenable, et des contrôles de coûts robustes. Les points d'amélioration identifiés concernent principalement l'optimisation des performances, l'enrichissement de l'UX, et l'ajout de fonctionnalités avancées.

**Forces actuelles :**
- ✅ Architecture claire et modulaire
- ✅ Base de connaissances versionnée et auditable
- ✅ Contrôles de coûts et rate limiting
- ✅ Support multi-média (images, fichiers)
- ✅ Interface utilisateur moderne et accessible

**Axes d'amélioration prioritaires :**
1. Optimisation des prompts (RAG, cache)
2. Enrichissement UX (suggestions, recherche sémantique)
3. Intégration avec les données de l'app
4. Optimisation des coûts (compression historique, modèles adaptatifs)

---

*Document généré le : 2025-01-24*
*Dernière mise à jour du code : 2025-01-24*

