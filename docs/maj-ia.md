# Documentation technique et logique - Système IA Assistant

## Table des matières

1. [Architecture générale](#architecture-générale)
2. [Composants frontend](#composants-frontend)
3. [Système de boutons](#système-de-boutons)
4. [Système de prompts](#système-de-prompts)
5. [API Route - Backend](#api-route---backend)
6. [Flux de données](#flux-de-données)
7. [Comportements spécifiques](#comportements-spécifiques)
8. [Gestion des fichiers et images](#gestion-des-fichiers-et-images)
9. [Streaming des réponses](#streaming-des-réponses)

---

## Architecture générale

Le système IA est composé de **deux interfaces utilisateur** qui partagent la même logique backend :

1. **IA Outil** (`app/commun/outils/assistant-ia/page.tsx`) - Page dédiée avec historique et sauvegarde
2. **IA Drawer** (`components/assistant/AssistantDrawer.tsx`) - Assistant dans la sidebar (menu "Outils")

Toutes les trois utilisent la même **API route** (`app/api/assistant/chat/route.ts`) et le même système de prompts.

---

## Composants frontend

### 1. IA Outil - Page dédiée

**Fichier** : `app/commun/outils/assistant-ia/page.tsx`

**Caractéristiques** :
- Page complète avec onglets (Chat / Historique)
- Sauvegarde des conversations dans Firestore
- Export de conversations
- Recherche dans l'historique
- Interface pleine page

**États gérés** :
```typescript
- messages: Message[] - Historique de la conversation
- input: string - Texte saisi par l'utilisateur
- selectedMainButton: string | null - Bouton principal sélectionné
- selectedSubButton: string | null - Sous-bouton sélectionné
- isLoading: boolean - État de chargement
- selectedImages: ImageFile[] - Images sélectionnées
- selectedFiles: ProcessedFile[] - Fichiers sélectionnés
- savedConversations: SavedConversation[] - Conversations sauvegardées
```

**Fonctionnalités spécifiques** :
- Sauvegarde automatique des conversations
- Export JSON des conversations
- Filtrage par date dans l'historique
- Recherche textuelle dans l'historique

### 2. IA Drawer - Assistant sidebar

**Fichier** : `components/assistant/AssistantDrawer.tsx`

**Caractéristiques** :
- Drawer (tiroir) qui s'ouvre depuis la sidebar (menu "Outils")
- Géré par `AssistantWrapper.tsx` qui encapsule la logique de communication API
- Design WhatsApp-like (bulles de messages)

**Architecture** :
- `AssistantWrapper.tsx` : Gère l'état des messages et la communication API
- `AssistantDrawer.tsx` : Composant UI pur, reçoit les props (messages, onSendMessage, etc.)

**États gérés** (dans AssistantWrapper) :
```typescript
- messages: Message[]
- isLoading: boolean
- responseProgress: number - Progression de la réponse (0-100)
- isOpen: boolean - Drawer ouvert/fermé
```

**États locaux** (dans AssistantDrawer) :
```typescript
- input: string
- selectedMainButton: string | null
- selectedSubButton: string | null
- selectedImages: ImageFile[]
- selectedFiles: ProcessedFile[]
```

---

## Système de boutons

### Structure des boutons

**Fichier** : `lib/assistant/main-buttons.ts`

#### Boutons principaux (8 catégories)

```typescript
interface MainButton {
  id: string;              // Identifiant unique
  label: string;           // Libellé affiché
  icon: string;            // Emoji
  color: string;           // Classe Tailwind pour le fond
  borderColor: string;     // Classe Tailwind pour la bordure
  hasSubButtons: boolean;  // A-t-il des sous-boutons ?
  description?: string;    // Description optionnelle
}
```

**Boutons principaux disponibles** :
1. **commercial** (💼) - A des sous-boutons
2. **sinistre** (🚨) - Pas de sous-boutons
3. **sante** (💚) - A des sous-boutons
4. **prevoyance** (🟣) - A des sous-boutons
5. **secretariat** (📋) - Pas de sous-boutons
6. **community-manager** (📱) - Pas de sous-boutons
7. **avocat** (⚖️) - Pas de sous-boutons
8. **expert-comptable** (📊) - Pas de sous-boutons

#### Sous-boutons

```typescript
interface SubButton {
  id: string;              // Identifiant unique
  label: string;           // Libellé affiché
  mainButtonId: string;    // ID du bouton parent
  description?: string;    // Description optionnelle
}
```

**Sous-boutons disponibles** :

**Commercial** :
- `m-plus-3` - M+3
- `preterme-auto` - Préterme Auto
- `preterme-iard` - Préterme IARD
- `presentation-devis` - Présentation de devis
- `comparaison-devis` - Comparaison de devis
- `argument-commercial` - Argument commercial
- `explication-garanties` - Explication des garanties

**Santé** :
- `sante-individuel` - Individuel
- `sante-collectif` - Collectif

**Prévoyance** :
- `prevoyance-individuel` - Individuel
- `prevoyance-collectif` - Collectif

### Composants UI

#### MainButtonMenu

**Fichier** : `components/assistant/MainButtonMenu.tsx`

Affiche les 8 boutons principaux en style WhatsApp (bulles arrondies).

**Props** :
```typescript
interface MainButtonMenuProps {
  onSelect: (buttonId: string) => void;  // Callback quand un bouton est cliqué
  disabled?: boolean;                     // Désactiver tous les boutons
}
```

**Comportement** :
- Affiche tous les boutons de `MAIN_BUTTONS`
- Style bulle WhatsApp (fond blanc, bordure, arrondi)
- Animation au chargement (framer-motion)

#### SubButtonMenu

**Fichier** : `components/assistant/SubButtonMenu.tsx`

Affiche les sous-boutons d'un bouton principal.

**Props** :
```typescript
interface SubButtonMenuProps {
  mainButtonId: string;                  // ID du bouton principal
  onSelect: (subButtonId: string) => void; // Callback quand un sous-bouton est cliqué
  onBack: () => void;                    // Callback pour revenir au menu principal
  disabled?: boolean;
}
```

**Comportement** :
- Récupère les sous-boutons via `getSubButtonsByMainButtonId(mainButtonId)`
- Affiche un bouton "Retour" pour revenir au menu principal
- Style identique aux boutons principaux

### Logique de sélection

**Fonctions utilitaires** (`lib/assistant/main-buttons.ts`) :

```typescript
// Vérifie si un bouton principal nécessite un sous-bouton
requiresSubButton(mainButtonId: string): boolean

// Récupère les sous-boutons d'un bouton principal
getSubButtonsByMainButtonId(mainButtonId: string): SubButton[]

// Récupère un bouton principal par son ID
getMainButtonById(buttonId: string): MainButton | undefined

// Récupère un sous-bouton par son ID
getSubButtonById(subButtonId: string): SubButton | undefined
```

**Flow de sélection** :

1. **Aucun bouton sélectionné** :
   - Menu principal affiché (8 boutons)
   - Chat libre disponible (utilisateur peut taper directement)

2. **Bouton principal sélectionné (sans sous-boutons)** :
   - Exemples : sinistre, secretariat, avocat, expert-comptable, community-manager
   - Message "Bonjour" envoyé automatiquement pour déclencher le prompt système
   - Chat activé

3. **Bouton principal sélectionné (avec sous-boutons)** :
   - Menu de sous-boutons affiché
   - Chat non encore activé (en attente de sélection du sous-bouton)

4. **Sous-bouton sélectionné** :
   - Message "Bonjour" envoyé automatiquement
   - Chat activé avec le prompt système correspondant

---

## Système de prompts

### Architecture des prompts

**Fichier** : `lib/assistant/main-button-prompts.ts`

Le système utilise un **prompt système composé** de 3 parties :

```
System Prompt = Core Knowledge + Button Prompt + Formatting Rules
```

### 1. Core Knowledge (Connaissances de base)

**Source** : `app/api/assistant/chat/route.ts` (ligne ~163)

Contient :
- Identité de l'agence (Allianz Marseille, Nogaro & Boetti)
- Coordonnées des deux agences (Corniche, Rouvière)
- Liste complète de l'effectif avec contacts
- Numéros d'assistance Allianz
- Liens de devis en ligne
- Informations légales (SIREN, RCS, ACPR, RGPD, médiation)
- Règles de gestion des sinistres (conventions IRSA, IRCA, IRSI, Badinter, etc.)
- Règles réglementaires (ACPR, devoir de conseil)

**Récupération des données utilisateur** :
- Le prompt inclut dynamiquement les informations de l'utilisateur connecté (nom, prénom, fonction, téléphone, email)
- Récupération depuis Firestore (`users/{userId}`)
- Utilisé pour les signatures dans les mails/courriers

### 2. Button Prompt (Prompt spécifique au bouton)

**Fichier** : `lib/assistant/main-button-prompts.ts`

**Fonction principale** :
```typescript
getSystemPromptForButton(buttonId: string, subButtonId?: string): string
```

Cette fonction retourne le prompt spécifique selon le bouton/sous-bouton sélectionné.

**Structure des prompts** :

Chaque prompt contient :
1. **Rôle de l'IA** : "Tu es un expert [domaine]..."
2. **COMPORTEMENT INITIAL OBLIGATOIRE** : Ce que l'IA doit faire au premier message
3. **Expertise** : Domaines de connaissance
4. **Comportement** : Étapes, questions systématiques
5. **Posture** : Ton, approche
6. **Règles transversales** : Citations, articles de loi, etc.

**Types de comportements initiaux** :

#### A. Synthèse immédiate (M+3, Préterme Auto, Préterme IARD)

Pour ces 3 sous-boutons, l'IA fait une **synthèse complète** du process dès le premier message :

```
COMPORTEMENT INITIAL OBLIGATOIRE :
Dès le premier message, tu dois faire une SYNTHÈSE COMPLÈTE du process [X] 
sans attendre de question de l'utilisateur. Cette synthèse doit inclure :
1. DE QUOI IL S'AGIT
2. POURQUOI C'EST STRATÉGIQUE
3. SIGNES D'ALERTE
4. LA DÉMARCHE IMPOSÉE (étapes détaillées)
5. QUESTIONS SYSTÉMATIQUES À POSER

APRÈS LA SYNTHÈSE :
Une fois la synthèse complète présentée, tu proposes : 
"Souhaitez-vous que je vous explique un aspect particulier ? 
Je peux approfondir [aspects], ou répondre à vos questions spécifiques."
```

#### B. Questions contextuelles immédiates (Tous les autres boutons)

Pour tous les autres boutons, l'IA pose **immédiatement des questions contextuelles** :

```
COMPORTEMENT INITIAL OBLIGATOIRE :
Dès le premier message, tu dois IMMÉDIATEMENT poser cette question 
contextuelle sans attendre :
"[Question spécifique au domaine]"
```

**Exemples** :
- **Avocat** : "Quelle thématique juridique vous intéresse ? (Droit des sociétés, Droit commercial, Droit des assurances, Droit social, etc.)"
- **Expert-comptable** : "De quoi avez-vous besoin ? Une explication, un renseignement sur un poste comptable, sur une notion fiscale, un calcul, etc."
- **Sinistre** : "Quel type de sinistre vous concerne ? (Auto, Habitation, Professionnel, etc.)"
- **Secrétariat** : "Quelle tâche administrative souhaitez-vous réaliser ?"
- **Community Manager** : "Quel est votre objectif ? (Publication, campagne, conseil éditorial, etc.)"
- **Santé/Prévoyance général** : "Individuel ou Collectif ?"

### 3. Formatting Rules (Règles de formatage)

**Source** : `app/api/assistant/chat/route.ts` (ligne ~279)

Contient :
- Règles Markdown (titres, listes, emojis, gras)
- Format de signature pour mails/courriers (avec données utilisateur connecté)
- Exemples de formatage

### Construction du prompt système final

```typescript
// Dans app/api/assistant/chat/route.ts

let buttonPromptSection = "";
if (mainButton) {
  const buttonPrompt = getSystemPromptForButton(mainButton, subButton);
  if (buttonPrompt) {
    buttonPromptSection = `\n\n--- CONFIGURATION MÉTIER ---\n\n${buttonPrompt}\n\n---\n\n`;
  }
}

const systemPrompt = `${coreKnowledge}${buttonPromptSection}${formattingRules}`;
```

**Cas spéciaux** :
- Si `mainButton` n'est pas fourni : `buttonPromptSection` est vide, seul le `coreKnowledge` + `formattingRules` est utilisé (chat libre)

---

## API Route - Backend

### Endpoint principal

**Fichier** : `app/api/assistant/chat/route.ts`

**Route** : `POST /api/assistant/chat`

### Authentification

```typescript
const auth = await verifyAuth(request);
if (!auth.valid) {
  return NextResponse.json({ error: auth.error }, { status: 401 });
}
```

- Vérifie le token Firebase du client
- Récupère `userId` et `userEmail`

### Paramètres de la requête

```typescript
const {
  message,          // Texte du message utilisateur (string)
  images,           // Images en Base64 (string[])
  files,            // Fichiers traités (ProcessedFile[])
  history,          // Historique de conversation (Message[])
  model,            // Modèle OpenAI (default: "gpt-4o")
  mainButton,       // ID du bouton principal sélectionné (string?)
  subButton,        // ID du sous-bouton sélectionné (string?)
  stream            // Activer le streaming (boolean, default: false)
} = body;
```

### Vérifications préalables

1. **Rate Limiting** :
   - Limite de requêtes par jour par utilisateur
   - Différents types : texte seul, avec images, avec fichiers
   - Géré par `lib/assistant/rate-limiting.ts`

2. **Budget Limit** :
   - Vérification du budget mensuel OpenAI
   - Géré par `lib/assistant/budget-alerts.ts`

3. **Récupération données utilisateur** :
   - Récupère depuis Firestore : `users/{userId}`
   - Données : firstName, lastName, phone, role
   - Intégré dans le prompt pour les signatures

### Construction des messages OpenAI

```typescript
const messages: ChatCompletionMessageParam[] = [
  {
    role: "system",
    content: systemPrompt  // Core Knowledge + Button Prompt + Formatting Rules
  },
  ...history.slice(-20),  // Historique (limité à 20 messages)
  {
    role: "user",
    content: userContent   // Texte + images (multimodal si images présentes)
  }
];
```

**Support multimodal** :
- Si images présentes : modèle forcé à `gpt-4o` (vision)
- Images ajoutées au `userContent` avec type `image_url`
- Fichiers : texte extrait ajouté au message texte

### Streaming vs Non-streaming

#### Streaming (default)

```typescript
if (useStream) {
  // Création d'un ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      const openaiStream = await openai.chat.completions.create({
        model: modelToUse,
        messages: enrichedMessages,
        stream: true
      });
      
      for await (const chunk of openaiStream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ content })}\n\n`
          ));
        }
      }
      
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    }
  });
  
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" }
  });
}
```

**Format Server-Sent Events (SSE)** :
```
data: {"content":"Texte "}
data: {"content":"de la "}
data: {"content":"réponse"}
data: [DONE]
```

#### Non-streaming

```typescript
const completion = await openai.chat.completions.create({
  model: modelToUse,
  messages: enrichedMessages,
  stream: false
});

return NextResponse.json({
  response: completion.choices[0].message.content
});
```

### Monitoring et audit

Après chaque requête :
- **Log usage** : `logUsage()` - Tokens utilisés, durée, modèle, succès/échec
- **Log audit** : `logAction()` - Action utilisateur, métadonnées, IP
- **Retry logic** : `openaiWithRetry()` - Jusqu'à 3 tentatives avec backoff

---

## Flux de données

### Flux complet (avec bouton sélectionné)

```
1. Utilisateur sélectionne un bouton principal
   ↓
2. Frontend : selectedMainButton = "commercial"
   ↓
3. Si hasSubButtons = true :
   - Affiche SubButtonMenu
   - Utilisateur sélectionne sous-bouton
   - selectedSubButton = "m-plus-3"
   ↓
4. Frontend : Envoie automatiquement "Bonjour"
   (ou utilisateur tape directement un message)
   ↓
5. Frontend : handleSendMessage()
   - Construit conversationHistory
   - Appelle fetch("/api/assistant/chat", {
       message: "Bonjour",
       mainButton: "commercial",
       subButton: "m-plus-3",
       history: conversationHistory,
       stream: true
     })
   ↓
6. Backend : POST /api/assistant/chat
   - Vérifie auth, rate limit, budget
   - Récupère données utilisateur depuis Firestore
   - Construit coreKnowledge
   - Appelle getSystemPromptForButton("commercial", "m-plus-3")
   - Construit systemPrompt = coreKnowledge + buttonPrompt + formattingRules
   - Construit messages OpenAI avec historique
   ↓
7. Backend : Appelle OpenAI API
   - Modèle : gpt-4o (si images) ou gpt-4o (défaut)
   - Stream: true
   ↓
8. Backend : Stream SSE vers frontend
   data: {"content":"Synthèse "}
   data: {"content":"complète "}
   ...
   data: [DONE]
   ↓
9. Frontend : Reçoit chunks SSE
   - Met à jour le message assistant en temps réel
   - Scroll automatique vers le bas
   ↓
10. Conversation continue
    - Historique conservé dans l'état React
    - Chaque nouveau message inclut l'historique
```

### Flux chat libre (sans bouton)

```
1. Utilisateur tape directement un message
   ↓
2. Frontend : handleSendMessage()
   - mainButton = undefined
   - subButton = undefined
   ↓
3. Backend : getSystemPromptForButton(undefined, undefined)
   - Retourne "" (chaîne vide)
   ↓
4. Backend : systemPrompt = coreKnowledge + "" + formattingRules
   - Pas de prompt spécialisé
   - IA utilise uniquement les connaissances de base
   ↓
5. Réponse générique basée sur coreKnowledge uniquement
```

---

## Comportements spécifiques

### Comportement selon type de bouton

#### 1. Boutons avec synthèse (M+3, Préterme Auto, Préterme IARD)

**Sous-boutons concernés** :
- `commercial/m-plus-3`
- `commercial/preterme-auto`
- `commercial/preterme-iard`

**Comportement** :
1. Utilisateur clique sur le sous-bouton
2. Message "Bonjour" envoyé automatiquement
3. **IA répond immédiatement avec une synthèse complète** :
   - Explication du process
   - Pourquoi c'est stratégique
   - Signes d'alerte
   - Démarche imposée (étapes détaillées)
4. IA propose ensuite : "Souhaitez-vous approfondir un aspect particulier ?"

#### 2. Boutons avec questions immédiates

**Tous les autres boutons et sous-boutons**

**Comportement** :
1. Utilisateur sélectionne le bouton
2. Message "Bonjour" envoyé automatiquement
3. **IA répond immédiatement avec une question contextuelle** :
   - Avocat : "Quelle thématique juridique ?"
   - Expert-comptable : "De quoi avez-vous besoin ?"
   - Sinistre : "Quel type de sinistre ?"
   - etc.
4. Conversation guidée selon les réponses

### Chat libre (sans bouton)

**Caractéristiques** :
- Utilisateur peut taper directement sans sélectionner de bouton
- Textarea toujours actif (pas de restriction)
- Prompt système = Core Knowledge uniquement
- Pas de spécialisation métier
- Réponses génériques basées sur les connaissances de base de l'agence

**Utilisation** :
- Questions générales
- Informations sur l'agence
- Besoins non couverts par les boutons spécialisés

---

## Gestion des fichiers et images

### Images

**Fichier** : `lib/assistant/image-utils.ts`

**Traitement** :
1. Upload via input file ou drag & drop
2. Conversion en Base64 (data URL)
3. Stockage dans état React : `selectedImages: ImageFile[]`
4. Envoi à l'API comme tableau de strings Base64
5. API force le modèle à `gpt-4o` si images présentes (vision)

**Format** :
```typescript
interface ImageFile {
  id: string;
  file: File;
  preview: string;  // data URL
}
```

**API OpenAI** :
```typescript
content: [
  { type: "text", text: "Message texte" },
  { type: "image_url", image_url: { url: "data:image/...;base64,..." } }
]
```

### Fichiers

**Fichier** : `lib/assistant/file-processing.ts`

**Formats supportés** :
- PDF, DOC, DOCX, XLS, XLSX, TXT, CSV

**Traitement** :
1. Upload via input file
2. Extraction du texte selon le type :
   - PDF : Extraction via bibliothèque
   - Office : Extraction via bibliothèque
   - TXT/CSV : Lecture directe
3. Stockage dans état React : `selectedFiles: ProcessedFile[]`
4. Texte extrait ajouté au message utilisateur

**Format** :
```typescript
interface ProcessedFile {
  id: string;
  name: string;
  type: string;
  content?: string;  // Texte extrait
  error?: string;    // Message d'erreur si échec
}
```

**Limite** : `MAX_FILES_PER_MESSAGE = 5`

**Intégration dans le message** :
```typescript
let messageText = message || "";
if (files && files.length > 0) {
  const fileContents = files.map(f => 
    `\n\n--- Contenu du fichier "${f.name}" ---\n${f.content}`
  );
  messageText += fileContents.join("\n");
}
```

---

## Streaming des réponses

### Côté backend

**Format SSE (Server-Sent Events)** :
```typescript
// Chaque chunk de texte
data: {"content":"Texte "}

// Fin du stream
data: [DONE]
```

**Headers** :
```typescript
headers: {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive"
}
```

### Côté frontend

**Parsing SSE** :
```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n\n");
  buffer = lines.pop() || "";
  
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6);
      if (data === "[DONE]") {
        // Fin du stream
        break;
      }
      
      const parsed = JSON.parse(data);
      if (parsed.content) {
        // Accumuler le contenu
        accumulatedContent += parsed.content;
        // Mettre à jour le message en temps réel
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: accumulatedContent }
            : msg
        ));
      }
    }
  }
}
```

**Avantages** :
- Réponse visible en temps réel (typing effect)
- Meilleure UX (pas d'attente complète)
- Permet d'annuler si besoin

---

## Résumé des fichiers clés

### Frontend

- `app/commun/outils/assistant-ia/page.tsx` - Page dédiée IA
- `components/assistant/AssistantDrawer.tsx` - Drawer sidebar
- `components/assistant/AssistantWrapper.tsx` - Wrapper logique drawer
- `components/assistant/MainButtonMenu.tsx` - Menu boutons principaux
- `components/assistant/SubButtonMenu.tsx` - Menu sous-boutons
- `components/assistant/MarkdownRenderer.tsx` - Rendu Markdown des réponses

### Backend

- `app/api/assistant/chat/route.ts` - API route principale
- `lib/assistant/main-buttons.ts` - Définitions boutons
- `lib/assistant/main-button-prompts.ts` - Prompts système par bouton
- `lib/assistant/image-utils.ts` - Traitement images
- `lib/assistant/file-processing.ts` - Traitement fichiers

### Utilitaires

- `lib/assistant/rate-limiting.ts` - Limitation de requêtes
- `lib/assistant/budget-alerts.ts` - Alertes budget
- `lib/assistant/monitoring.ts` - Monitoring usage
- `lib/assistant/audit.ts` - Audit trail
- `lib/assistant/retry.ts` - Retry logic OpenAI

---

## Points d'évolution possibles

1. **RAG (Retrieval Augmented Generation)** : Actuellement non utilisé, logique métier dans les prompts
2. **Contexte dynamique** : Chargement sélectif de fichiers Markdown selon le contexte
3. **Multi-agents** : Séparation plus poussée des rôles (commercial, sinistre, etc.)
4. **Historique persistant** : Sauvegarde automatique dans Firestore pour toutes les interfaces
5. **Sessions** : Gestion de sessions de conversation avec contexte partagé

---

*Document généré le : 2025-01-XX*
*Version : 1.0*

