# **Assistant IA - Intégration OpenAI API**

*Marseille le 27/10/2025*

---

## 🎯 Enjeux

L'agence a besoin d'un **assistant IA interne** pour améliorer la productivité quotidienne dans :
* L'assistance dans la rédaction de devis
* L'analyse de contrats
* La génération de réponses client
* Toute autre tâche nécessitant une assistance IA

👉 **Objectif** : Développer une fonctionnalité dans la section **Outils** de l'application qui fournit un **assistant IA professionnel** via l'API OpenAI officielle.

### Contexte d'intégration

* La sidebar de l'application contient déjà un bouton **"Outils"**
* La page `/commun/outils` existe avec actuellement **1 outil** :
  1. **Informations entreprise** (Pappers)
* L'**Assistant IA** sera accessible de **deux manières** :
  1. **Carte "outil"** : 2ème outil ajouté dans `/commun/outils` (page dédiée)
  2. **Bot flottant** : Bulle en bas à droite présente sur toutes les pages

### Séparation Chatbot / RAG

**Important** : Le système est divisé en deux composants distincts :

1. **Chatbot standard** (accessible à tous les utilisateurs connectés) :
   * Accessible depuis la **bulle flottante** en bas de page (toutes les pages)
   * Accessible depuis la **page Outils** (`/commun/outils/assistant-ia`)
   * Utilise l'API OpenAI directement sans contexte enrichi
   * Fonctionnalités : Chat, OCR, analyse de fichiers, streaming

2. **RAG (Retrieval-Augmented Generation)** (accessible uniquement aux administrateurs) :
   * Accessible **uniquement depuis la page Outils** (`/commun/outils/assistant-ia`)
   * **Restriction** : Seuls les utilisateurs avec le rôle `ADMINISTRATEUR` peuvent :
     * Utiliser le mode RAG (réponses enrichies avec contexte métier)
     * Uploader des PDF pour mettre à jour la base de connaissances
   * Le RAG enrichit les réponses avec du contexte récupéré depuis une base de connaissances vectorielle
   * Les administrateurs peuvent gérer la base de connaissances (ajout, modification, suppression de documents)

---

## 💡 Solution proposée : Assistant IA via OpenAI API

### Concept

Développer un **assistant IA interne** qui utilise l'**API OpenAI officielle** pour fournir toutes les fonctionnalités nécessaires à l'agence, de manière stable, sécurisée et conforme.

### Architecture envisagée

```
UI Chat (Next.js / React)
    ↓
API Route /api/assistant (Server only)
    ↓
OpenAI Responses API
    ↓
Réponses multimodales (texte, images, fichiers)
```

### Avantages de l'API OpenAI

* ✅ **Stabilité et conformité** : Utilisation de l'API officielle, garantie de pérennité
* ✅ **Accès complet aux fonctionnalités** : Chat, Vision (OCR), analyse de fichiers, streaming
* ✅ **Intégration propre** : Route API Next.js suivant le pattern existant (comme Pappers/Societe.com)
* ✅ **Sécurité** : Clé API côté serveur uniquement, authentification Firebase Auth
* ✅ **Scalabilité** : Gestion native de la charge et des limites par l'API OpenAI

---

## 🤔 Réflexions techniques

### 1. Architecture API OpenAI

**Réflexion** : L'assistant IA doit être implémenté comme une route API Next.js qui :
* Écoute les requêtes de l'application Next.js
* Se connecte à l'API OpenAI via le SDK officiel
* Retourne les réponses formatées en streaming

**Commentaire** : 
- Implémentation comme **route API Next.js** (`/api/assistant`)
- Pattern similaire aux routes existantes (`/api/pappers`, `/api/societe`)
- Utilisation du SDK OpenAI officiel (`openai`)
- Clé API stockée dans `OPENAI_API_KEY` (variables d'environnement)
- Authentification utilisateur via Firebase Auth (comme les autres routes API)

### 2. Configuration API OpenAI

**Réflexion** : Comment gérer l'authentification et la configuration de l'API OpenAI ?

**Décision** : 
- ✅ **Clé API OpenAI partagée** : Une clé API pour toute l'agence
- ✅ **Stockage sécurisé** : Clé API dans les variables d'environnement côté serveur uniquement
- ✅ **Accès via authentification utilisateur** : Seuls les utilisateurs connectés à l'application peuvent accéder à l'outil

**Commentaire** :
- **Avantages** :
  - Configuration centralisée et simple
  - Tous les utilisateurs bénéficient de l'outil sans configuration individuelle
  - Gestion des coûts centralisée
- **Implémentation** :
  - Stocker la clé API dans `OPENAI_API_KEY` (variables d'environnement)
  - L'authentification se fait côté serveur (route API Next.js)
  - Vérification de l'authentification utilisateur via Firebase Auth (pattern identique aux autres routes API)
  - Les utilisateurs n'ont jamais accès à la clé API
- **Modèle recommandé** : `gpt-4o` ou `gpt-4-turbo` pour les meilleures performances

### 3. Interface utilisateur

**Réflexion** : Comment présenter l'assistant IA aux utilisateurs ?

**Objectif** : Fournir **deux méthodes d'accès** pour maximiser l'accessibilité et l'utilisation de l'assistant IA.

#### Méthode 1 : Accès via la section Outils

- **Ajout dans la liste existante** : Ajouter l'Assistant IA comme 2ème outil dans `/commun/outils/page.tsx`
  * Même structure que les outils existants (Informations entreprise)
  * Même style de Card avec animations
  * Nouvelle couleur de schéma (ex: orange/amber pour le 2ème outil)
- **Page dédiée** : Créer `/commun/outils/assistant-ia/page.tsx`
  * Interface de chat complète en pleine page
  * Toutes les fonctionnalités disponibles
  * Navigation via le menu Outils

#### Méthode 2 : Bot flottant (bulle) sur toutes les pages

- **Composant flottant** : Créer un composant `FloatingAssistant` présent sur toutes les pages
- **Position** : En bas à droite de l'écran (fixed position)
- **Design** :
  * **État fermé** : Bouton/bulle avec icône (ex: `MessageSquare`, `Bot`, `Sparkles`)
    * Animation au survol (scale, glow)
    * Badge de notification si nouveau message (optionnel)
    * Style cohérent avec le thème de l'application
  * **État ouvert** : Fenêtre de chat flottante
    * Taille adaptative (ex: 400x600px par défaut, redimensionnable)
    * Positionnable par drag & drop (optionnel)
    * Bouton de fermeture/minimisation
    * Header avec titre "Assistant IA"
    * Zone de chat avec historique
    * Input en bas avec toutes les fonctionnalités
- **Comportement** :
  * Persistance de l'état (ouvert/fermé) dans le localStorage
  * Historique partagé avec la page dédiée (même collection Firestore)
  * Animation d'ouverture/fermeture fluide
  * Responsive : s'adapte sur mobile (plein écran ou adaptatif)
- **Intégration** :
  * Ajouter le composant dans le layout principal (`app/layout.tsx`)
  * Disponible sur toutes les pages sauf exceptions (login, etc.)
  * Z-index élevé pour rester au-dessus du contenu

#### Interface de chat commune

Les deux méthodes d'accès partagent la même interface de chat avec :
- Zone de chat avec historique des messages
- Input pour les messages avec support multimédia
- **Zone de collage d'images** : Drag & drop ou bouton pour coller/uploader des images
- **Zone de téléversement de fichiers** : Support drag & drop pour un ou plusieurs fichiers
- Bouton d'envoi
- Indicateur de chargement
- **Prévisualisation des fichiers/images** : Afficher les fichiers/images avant envoi
- **Formatage élégant des réponses** : Support Markdown complet avec rendu professionnel
- Design cohérent avec le reste de l'application

**Avantages des deux méthodes** :
- ✅ **Accessibilité maximale** : L'assistant est accessible depuis n'importe quelle page
- ✅ **Flexibilité** : Les utilisateurs choisissent leur méthode préférée
- ✅ **Productivité** : Le bot flottant permet d'utiliser l'assistant sans quitter la page actuelle
- ✅ **Découvrabilité** : La carte dans Outils permet de découvrir la fonctionnalité

**Implémentation technique du bot flottant** :

- **Composant** : `components/assistant/FloatingAssistant.tsx`
- **Intégration** : Ajouter dans `app/layout.tsx` (après `<Toaster />`)
- **État** : Utiliser `useState` pour open/closed, `useEffect` pour localStorage
- **Position** : `fixed bottom-4 right-4` (ou `bottom-6 right-6` pour plus d'espace)
- **Z-index** : `z-50` ou supérieur pour rester au-dessus du contenu
- **Responsive** : 
  * Desktop : Fenêtre flottante 400x600px
  * Mobile : Plein écran ou adaptatif selon préférence
- **Animations** : Utiliser `framer-motion` (déjà dans le projet) pour les transitions
- **Accessibilité** : 
  * Support clavier (Escape pour fermer, Tab pour navigation)
  * ARIA labels pour les lecteurs d'écran
  * Focus trap dans la fenêtre ouverte

### 3.5. Formatage élégant des réponses

**Réflexion** : Comment rendre les réponses de l'assistant IA élégantes et professionnelles ?

**Objectif** : Fournir un rendu riche et professionnel des réponses, similaire à ChatGPT, pour améliorer la lisibilité et l'expérience utilisateur.

**Formats de réponse à supporter** :

- ✅ **Markdown complet** :
  * **Titres** : H1 à H6 avec hiérarchie visuelle claire
  * **Texte formaté** : Gras, italique, souligné, barré
  * **Listes** : Listes à puces et numérotées avec indentation
  * **Listes de tâches** : Checkboxes interactives (optionnel)
  * **Citations** : Blocs de citation avec style distinct
  * **Liens** : Liens cliquables avec prévisualisation (optionnel)
  * **Séparateurs** : Lignes horizontales pour structurer

- ✅ **Code et syntaxe** :
  * **Blocs de code** : Avec syntax highlighting (prism.js ou highlight.js)
  * **Code inline** : Texte monospace avec fond coloré
  * **Langages supportés** : JavaScript, TypeScript, Python, SQL, JSON, YAML, Bash, etc.
  * **Copie rapide** : Bouton de copie pour chaque bloc de code

- ✅ **Tableaux** :
  * **Tableaux Markdown** : Rendu avec bordures et style professionnel
  * **Tableaux responsives** : Scroll horizontal sur mobile si nécessaire
  * **Alignement** : Colonnes alignées (gauche, centre, droite)
  * **Style alterné** : Lignes alternées pour meilleure lisibilité

- ✅ **Éléments visuels** :
  * **Alertes/Notes** : Blocs d'information, warning, erreur avec icônes
  * **Badges** : Tags et badges pour catégoriser l'information
  * **Emojis** : Support des emojis pour rendre les réponses plus vivantes (optionnel)

- ✅ **Structure avancée** :
  * **Accordéons** : Sections repliables pour les réponses longues
  * **Onglets** : Si l'assistant génère plusieurs sections (optionnel)
  * **Timeline** : Pour afficher des étapes ou processus

**Implémentation technique** :

- **Bibliothèque Markdown** : 
  * ✅ `react-markdown` (déjà installé dans le projet)
  * ✅ `remark-gfm` (déjà installé) pour GitHub Flavored Markdown (tableaux, listes de tâches, etc.)
  * ✅ `rehype-raw` (déjà installé) pour le HTML brut si nécessaire
  * ⚠️ Ajouter `DOMPurify` pour la sécurité (sanitization du HTML)
- **Syntax highlighting** : 
  * Installer `react-syntax-highlighter` ou `prism-react-renderer`
  * Installer les thèmes correspondants (ex: `prism-themes` pour Prism)
  * Configurer les langages supportés (JS, TS, Python, SQL, JSON, YAML, Bash, etc.)
- **Composants personnalisés** : 
  * Créer des composants React pour chaque type d'élément (tableaux, citations, alertes)
  * Utiliser les composants UI existants (Card, Badge, Alert) pour cohérence
- **Thème cohérent** : 
  * Utiliser les couleurs et styles de l'application (Tailwind CSS)
  * Adapter les thèmes de syntax highlighting au thème sombre/clair de l'app
- **Accessibilité** : 
  * S'assurer que le contenu est accessible (ARIA, navigation clavier)
  * Support des lecteurs d'écran pour le contenu Markdown

**Commentaire** :
- Le formatage élégant améliore significativement la lisibilité des réponses
- Les tableaux sont particulièrement utiles pour les devis, comparatifs, et analyses
- Le code avec syntax highlighting est essentiel pour les réponses techniques
- Les alertes/notes permettent de mettre en évidence des informations importantes
- Le rendu doit être fluide même pendant le streaming

### 4. Fonctionnalités de l'assistant IA

**Réflexion** : Quelles fonctionnalités sont essentielles pour l'assistant IA ?

**Objectif** : S'assurer que **toutes les fonctionnalités nécessaires** soient accessibles depuis l'assistant.

**Fonctionnalités de base** :
- ✅ **Chat classique** : Messages texte
- ✅ **Contexte conversationnel** : Mémoriser l'historique de la conversation
- ✅ **Streaming** : Affichage progressif des réponses (meilleure UX)
- ✅ **Gestion des erreurs** : Messages clairs en cas de problème

**Fonctionnalités avancées (OBLIGATOIRES)** :
- ✅ **Coller une image** : Permettre le collage d'images dans le chat
- ✅ **Lecture OCR** : Analyse et extraction de texte depuis les images via Vision API
- ✅ **Téléversement de fichiers** : Support d'un ou plusieurs fichiers (PDF, Word, Excel, etc.)
- ✅ **Analyse de fichiers** : L'assistant peut lire et analyser le contenu des fichiers téléversés

**Fonctionnalités supplémentaires (RECOMMANDÉES)** :
- 🔄 **Historique des conversations** : Sauvegarder et rechercher dans les conversations passées
- 🔄 **Templates de prompts** : Prompts pré-configurés pour les cas d'usage courants de l'agence
  * Rédaction de devis
  * Analyse de contrats
  * Génération de réponses client
  * Rédaction d'emails professionnels
- 🔄 **Export de conversations** : Exporter les conversations en PDF, Word, ou texte
- 🔄 **Partage de conversations** : Partager des conversations avec des collègues (lien ou export)
- 🔄 **Résumé de documents longs** : Résumer automatiquement des contrats ou documents volumineux
- 🔄 **Comparaison de documents** : Comparer deux versions de contrats ou documents
- 🔄 **Analyse de données structurées** : Analyser des fichiers Excel/CSV avec tableaux de données
- 🔄 **Génération de tableaux** : Créer des tableaux formatés (devis, comparatifs, etc.)
- 🔄 **Traduction** : Traduire des documents ou messages
- 🔄 **Génération de code** : Créer des scripts, formules Excel, requêtes SQL si nécessaire
- 🔄 **Mode voix** : Si disponible via l'API OpenAI (pour dictée vocale)
- 🔄 **Suggestions de réponses** : Proposer des réponses rapides basées sur le contexte

**Commentaire** :
- Les fonctionnalités avancées sont **essentielles** pour un usage complet de l'assistant IA
- Les fonctionnalités supplémentaires améliorent la productivité et l'expérience utilisateur
- L'API OpenAI supporte nativement le format multimédia (images via Vision API, fichiers via File API)
- L'interface utilisateur doit permettre le drag & drop et le collage d'images
- Le streaming est supporté nativement par le SDK OpenAI pour une meilleure UX
- Les templates de prompts sont particulièrement utiles pour standardiser les usages dans l'agence

### 5. Sécurité et conformité

**Réflexion** : Comment sécuriser l'outil et garantir la conformité ?

**Commentaire** :
- ✅ **Authentification utilisateur** : Seuls les utilisateurs connectés via Firebase Auth peuvent accéder
- ✅ **Clé API sécurisée** : Clé API stockée côté serveur uniquement, jamais exposée au client
- ✅ **Rate limiting** : Limiter le nombre de requêtes par utilisateur/jour pour contrôler les coûts
- ✅ **Validation des inputs** : Sanitizer et valider tous les messages, fichiers et images avant envoi
- ✅ **Validation des fichiers** : 
  * Vérifier les types MIME réels (pas seulement l'extension)
  * Limiter les types de fichiers acceptés
  * Limiter la taille des fichiers
- ✅ **Logs** : Tracer l'utilisation pour monitoring et audit
- ✅ **Données sensibles** : Avertir les utilisateurs de ne pas envoyer de données clients sensibles
- ✅ **Nettoyage des fichiers** : Supprimer les fichiers temporaires après traitement
- ⚠️ **Coûts** : Surveiller la consommation API OpenAI (tokens utilisés, coûts par requête)

### 6. Stockage des conversations

**Réflexion** : Faut-il sauvegarder les conversations ?

**Commentaire** :
- **Option 1** : Pas de stockage (plus simple, moins de coûts)
  - Chaque session est indépendante
  - Pas de persistance entre les sessions
  - Pas d'historique
- **Option 2** : Stockage Firestore (plus complexe, meilleure UX)
  - Sauvegarder les conversations par utilisateur
  - Permettre de reprendre une conversation
  - Historique consultable et recherchable
  - Partage de conversations possible
  - Export de conversations
  - **Recommandation** : Commencer par Option 1, ajouter Option 2 en Phase 5
- **Structure de stockage** (si Option 2) :
  * Collection `assistant_conversations`
  * Document par conversation avec :
    - `userId` : ID de l'utilisateur
    - `title` : Titre de la conversation (généré ou manuel)
    - `messages` : Array des messages (user + assistant)
    - `files` : Références aux fichiers uploadés (si stockés)
    - `createdAt` : Date de création
    - `updatedAt` : Date de dernière mise à jour
    - `tags` : Tags pour organisation (optionnel)

### 7. Intégration OpenAI SDK

**Réflexion** : Comment implémenter l'intégration avec l'API OpenAI ?

**Commentaire** :
- Utiliser le **SDK OpenAI officiel** (`openai`) pour Node.js
- Installation : `npm install openai`
- Configuration du client :
  * Initialiser avec la clé API depuis les variables d'environnement
  * Configurer le modèle par défaut (`gpt-4o` ou `gpt-4-turbo`)
  * Gérer le streaming des réponses pour une meilleure UX
- Fonctionnalités supportées :
  * **Chat complet** : Messages texte avec historique conversationnel
  * **Vision API** : Analyse d'images avec OCR natif
  * **File API** : Upload et analyse de fichiers (PDF, Word, Excel, etc.)
  * **Streaming** : Réponses en temps réel via Server-Sent Events
- Gestion des erreurs :
  * Gérer les erreurs API (rate limits, tokens, etc.)
  * Retry automatique pour les erreurs temporaires
  * Messages d'erreur clairs pour l'utilisateur

### 7.6. Gestion des erreurs spécifiques OpenAI

**Réflexion** : Comment gérer les erreurs spécifiques de l'API OpenAI ?

**Types d'erreurs à gérer** :

- ✅ **Rate Limit (429)** :
  * Détecter le header `Retry-After` si présent
  * Afficher un message clair : "Trop de requêtes. Réessayez dans X secondes."
  * Implémenter un backoff exponentiel pour les retries
  * Limiter le nombre de retries (ex: 3 max)

- ✅ **Quota Exceeded (429)** :
  * Message : "Quota API dépassé. Contactez l'administrateur."
  * Logger l'erreur pour monitoring
  * Ne pas retry automatiquement (erreur permanente)

- ✅ **Invalid API Key (401)** :
  * Message : "Erreur de configuration API. Contactez l'administrateur."
  * Logger l'erreur côté serveur uniquement (ne pas exposer la clé)
  * Vérifier la configuration au démarrage

- ✅ **Invalid Request (400)** :
  * Parser le message d'erreur OpenAI
  * Afficher un message utilisateur-friendly
  * Logger les détails pour debug

- ✅ **Context Length Exceeded (400)** :
  * Détecter l'erreur "context_length_exceeded"
  * Message : "Conversation trop longue. Créer une nouvelle conversation."
  * Proposer de tronquer l'historique automatiquement

- ✅ **Timeout** :
  * Définir un timeout (ex: 60 secondes pour requêtes normales, 120s pour fichiers)
  * Message : "La requête a pris trop de temps. Réessayez."
  * Logger pour identifier les problèmes de performance

- ✅ **Network Errors** :
  * Retry automatique avec backoff
  * Message : "Problème de connexion. Nouvelle tentative..."
  * Limiter les retries (ex: 2-3 max)

**Commentaire** :
- Toutes les erreurs doivent être loggées côté serveur pour debugging
- Les messages utilisateur doivent être clairs et actionnables
- Ne jamais exposer les détails techniques ou la clé API dans les messages d'erreur

### 7.5. Structure des données et formats

**Réflexion** : Quels formats de données utiliser pour les messages et réponses ?

**Structure des messages** :

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
  timestamp: Date;
  files?: FileReference[];
  images?: ImageReference[];
}

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string; // Base64 data URL
  };
}

interface FileReference {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string; // Si stocké dans Firebase Storage
}
```

**Format des réponses API** :

- **Streaming** : Server-Sent Events (SSE) avec chunks de texte
- **Format des chunks** : `data: {"choices": [{"delta": {"content": "..."}}]}\n\n`
- **Fin de stream** : `[DONE]` ou chunk avec `finish_reason`

**Gestion de l'historique** :

- **Format conversationnel** : Array de messages avec rôles
- **Limite de tokens** : Tronquer l'historique si nécessaire (garder les N derniers messages)
- **Résumé intelligent** : Pour conversations très longues, résumer les anciens messages

**Commentaire** :
- La structure doit être compatible avec l'API OpenAI Chat Completions
- Le streaming nécessite un parsing spécial des chunks SSE
- L'historique doit être géré intelligemment pour éviter de dépasser les limites de tokens

### 8. Gestion des fichiers et images

**Réflexion** : Comment gérer les fichiers et images côté serveur ?

**Commentaire** :
- **Upload côté client** : Les fichiers/images sont uploadés vers notre serveur (route API Next.js)
- **Stockage temporaire** : Stocker les fichiers dans un storage temporaire (Firebase Storage ou système de fichiers)
- **Conversion/Formatage** : Convertir les fichiers en format compatible avec l'API OpenAI
  * Images : Base64 pour Vision API (modèles avec support vision)
  * PDF/Documents : Utiliser File API d'OpenAI ou extraction texte côté serveur
  * Fichiers volumineux : Découper si nécessaire selon les limites de l'API
- **Envoi à l'API OpenAI** : Transmettre les fichiers via l'API OpenAI avec le message
- **Nettoyage** : Supprimer les fichiers temporaires après traitement
- **Limites** :
  * Taille maximale par fichier (ex: 10-20 MB)
  * Nombre maximum de fichiers par message (ex: 5-10 fichiers)
  * Types de fichiers acceptés (PDF, DOCX, XLSX, images, TXT, etc.)

### 9. OCR et analyse d'images

**Réflexion** : Comment gérer l'OCR et l'analyse d'images ?

**Commentaire** :
- **OCR via Vision API** : L'API OpenAI Vision peut analyser les images et extraire le texte
- **Modèles supportés** : Utiliser `gpt-4o` ou `gpt-4-turbo` qui supportent nativement la vision
- **Activation automatique** : Détecter automatiquement les images et utiliser le modèle vision
- **Format des images** : S'assurer que les images sont dans un format supporté (PNG, JPG, WebP)
- **Résolution** : Optimiser la résolution des images (pas trop grande pour limiter les coûts, pas trop petite pour la qualité)
- **Combinaison texte + image** : Permettre d'envoyer du texte avec des images dans le même message
- **Coûts** : L'analyse d'images consomme plus de tokens, surveiller la consommation

### 10. Limitations de l'API OpenAI

**Réflexion** : Quelles sont les limitations de l'API OpenAI standard ?

**Commentaire** :
- **Recherche web** : Non disponible via l'API standard (fonctionnalité réservée à ChatGPT Plus/Pro web uniquement)
- **Alternatives** : 
  * Utiliser des outils externes si nécessaire (webhooks, plugins)
  * Intégrer des sources de données spécifiques si besoin
- **Limites de tokens** : 
  * Limites par modèle (ex: 128k tokens pour gpt-4-turbo)
  * Gérer les conversations longues (tronquer l'historique si nécessaire)
- **Rate limits** : 
  * Limites de requêtes par minute/heure selon le plan OpenAI
  * Implémenter un rate limiting côté application pour éviter les erreurs
- **Coûts** : 
  * Coûts par token (input + output)
  * Images et fichiers volumineux augmentent les coûts
  * Surveiller la consommation régulièrement

### 11. Templates de prompts

**Réflexion** : Comment implémenter les templates de prompts pour l'agence ?

**Commentaire** :
- **Bibliothèque de templates** : Créer une collection de prompts pré-configurés
- **Cas d'usage typiques** :
  * "Rédiger un email de relance client"
  * "Analyser un contrat d'assurance et extraire les points clés"
  * "Générer un devis personnalisé basé sur les besoins"
  * "Résumer une conversation téléphonique avec un client"
  * "Comparer deux offres d'assurance"
- **Interface** : 
  * Menu déroulant ou sidebar avec les templates
  * Prévisualisation du template
  * Variables personnalisables (ex: nom client, type de contrat)
- **Stockage** : Templates dans Firestore ou fichier de configuration
- **Personnalisation** : Permettre aux utilisateurs de créer leurs propres templates

### 12. Export et partage de conversations

**Réflexion** : Comment permettre l'export et le partage des conversations ?

**Commentaire** :
- **Export PDF** : Générer un PDF formaté avec la conversation
  * Inclure les fichiers/images si pertinents
  * En-tête avec date, utilisateur, titre
  * Formatage professionnel
- **Export Word** : Export en format .docx pour édition
- **Export texte** : Export simple en .txt
- **Partage** : 
  * Générer un lien de partage (si stockage activé)
  * Permissions : partage interne uniquement (utilisateurs de l'app)
  * Option de partage en lecture seule
- **Bibliothèques** : 
  * PDF : `pdfkit` ou `puppeteer` pour génération
  * Word : `docx` pour génération de documents Word

### 13. Analyse avancée de documents

**Réflexion** : Comment implémenter l'analyse avancée (résumé, comparaison) ?

**Commentaire** :
- **Résumé de documents longs** :
  * Détecter automatiquement les documents volumineux
  * Proposer un résumé structuré (points clés, conclusions)
  * Conserver les références aux sections originales
- **Comparaison de documents** :
  * Upload de deux documents
  * Analyse comparative par l'assistant IA
  * Mise en évidence des différences
  * Génération d'un rapport de comparaison
- **Analyse de données** :
  * Support des fichiers Excel/CSV
  * Extraction et analyse des données via File API
  * Réponses basées sur les données extraites
  * Génération de tableaux formatés si nécessaire

---

## 🔍 RAG - Base de connaissances (Admin uniquement)

### Vue d'ensemble

Le système RAG (Retrieval-Augmented Generation) permet d'enrichir les réponses de l'assistant IA avec du contexte métier récupéré depuis une base de connaissances vectorielle. Cette fonctionnalité est **uniquement accessible aux administrateurs**.

### Architecture RAG

```
Requête utilisateur
    ↓
Génération embedding de la requête
    ↓
Recherche vectorielle (similarité cosinus)
    ↓
Récupération des chunks pertinents
    ↓
Construction du contexte enrichi
    ↓
Génération de réponse avec OpenAI + contexte
    ↓
Réponse avec sources citées
```

### Structure des fichiers

- `lib/assistant/types.ts` : Types TypeScript pour le RAG
- `lib/assistant/embeddings.ts` : Génération d'embeddings avec OpenAI
- `lib/assistant/vector-search.ts` : Recherche vectorielle dans Firestore
- `lib/assistant/rag.ts` : Fonctions principales RAG
- `app/api/assistant/rag/route.ts` : Route API pour le chat RAG
- `app/api/assistant/rag/upload/route.ts` : Route API pour upload de PDF (admin uniquement)
- `app/api/assistant/rag/documents/route.ts` : Route API pour gérer les documents (admin uniquement)
- `scripts/index-rag-documents.ts` : Script d'indexation de documents

### Installation et configuration

1. Installer les dépendances :
```bash
npm install openai pdf-parse
```

2. Configurer la clé API OpenAI dans `.env.local` :
```
OPENAI_API_KEY=sk-...
```

### Indexation de documents

Pour indexer des documents dans la base RAG :

1. Modifier le script `scripts/index-rag-documents.ts` pour ajouter vos documents
2. Exécuter le script :
```bash
npm run index:rag
```

Le script va :
- Découper les documents en chunks (environ 500 tokens avec overlap de 50 tokens)
- Générer les embeddings pour chaque chunk avec `text-embedding-3-small`
- Stocker les chunks dans Firestore (collection `rag_chunks`)
- Créer les métadonnées dans la collection `rag_documents`

### Utilisation de l'API RAG

#### Endpoint

`POST /api/assistant/rag`

#### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Body

```json
{
  "message": "Quelle est la procédure pour souscrire une assurance ?",
  "useRAG": true,
  "model": "gpt-4o"
}
```

#### Réponse

```json
{
  "success": true,
  "response": "La procédure pour souscrire une assurance...",
  "sources": ["Guide des procédures d'assurance"],
  "sourcesWithScores": [
    {
      "title": "Guide des procédures d'assurance",
      "score": 0.85,
      "documentId": "doc-123"
    }
  ],
  "usedRAG": true,
  "context": "Contexte utilisé pour le mode debug"
}
```

### Structure Firestore

#### Collection `rag_chunks`

Chaque document contient :
- `content` : Le texte du chunk
- `embedding` : Le vecteur d'embedding (array de nombres, 1536 dimensions)
- `metadata` :
  - `documentId` : ID du document source
  - `documentTitle` : Titre du document
  - `documentType` : Type de document (guide, faq, etc.)
  - `chunkIndex` : Index du chunk dans le document
  - `createdAt` : Date de création
  - `source` : Source du document
  - `tags` : Tags pour filtrage

#### Collection `rag_documents`

Documents sources indexés :
- `title` : Titre du document
- `type` : Type de document
- `source` : Source
- `tags` : Tags
- `createdAt` : Date d'indexation
- `chunkCount` : Nombre de chunks

### Configuration

Les paramètres par défaut dans `lib/assistant/vector-search.ts` :

- `topK` : 5 (nombre de chunks à récupérer)
- `minScore` : 0.7 (score de similarité minimum)
- `embeddingModel` : "text-embedding-3-small"

### Notes techniques

- La recherche vectorielle utilise la similarité cosinus
- Les chunks font environ 500 tokens avec un overlap de 50 tokens
- Pour de grandes collections (>1000 documents), considérer une base vectorielle dédiée (Pinecone, Qdrant)
- Le modèle d'embedding utilisé est `text-embedding-3-small` (1536 dimensions)
- La recherche se fait actuellement sur tous les chunks (pour de grandes collections, optimiser avec une base vectorielle dédiée)

### Améliorations futures

- [ ] Utiliser une base vectorielle dédiée (Pinecone, Qdrant) pour de meilleures performances
- [ ] Implémenter le reranking pour améliorer la pertinence
- [ ] Ajouter un système de mise à jour automatique des documents
- [ ] Dashboard de monitoring des recherches
- [ ] Support de différents types de documents (Word, Excel, etc.)

---

## 🧭 Plan d'implémentation

### Phase 1 : Backend API
1. ✅ Créer la route API `/api/assistant/chat`
2. ✅ Configurer la clé API OpenAI (`OPENAI_API_KEY`) dans les variables d'environnement
3. ✅ Installer et configurer le SDK OpenAI (`openai`)
4. ✅ Implémenter le client OpenAI avec gestion du streaming
5. ✅ Gérer l'authentification utilisateur via Firebase Auth (pattern identique aux autres routes API)
6. ✅ Tester la connexion et les réponses simples

### Phase 2 : UI Chat
1. ✅ **Composant de chat réutilisable** :
   * Créer un composant `ChatInterface` partagé
   * Interface de chat de base (input, historique, envoi)
   * Support du streaming des réponses (Server-Sent Events)
   * Formatage élégant des réponses (Markdown, syntax highlighting, tableaux)
   
2. ✅ **Méthode 1 : Page dédiée** :
   * Créer la page `/commun/outils/assistant-ia/page.tsx`
   * Utiliser le composant `ChatInterface` en pleine page
   * Ajouter l'outil dans la liste (`/commun/outils/page.tsx`) :
     * Ajouter l'entrée dans le tableau `outils`
     * Choisir une icône appropriée (ex: `Bot`)
     * Définir un nouveau schéma de couleurs (ex: orange/amber pour le 2ème outil)

3. ⏳ **Méthode 2 : Bot flottant** :
   * Créer le composant `FloatingAssistant`
   * Bouton/bulle flottant en bas à droite (état fermé)
   * Fenêtre de chat flottante (état ouvert)
   * Animations d'ouverture/fermeture
   * Intégrer dans le layout principal (`app/layout.tsx`)
   * Persistance de l'état dans localStorage
   * Responsive design (mobile-friendly)

4. ⏳ **Formatage élégant des réponses** :
   * Intégrer une bibliothèque Markdown (`react-markdown`)
   * Implémenter le syntax highlighting pour les blocs de code
   * Créer des composants pour tableaux, citations, alertes
   * Styliser avec Tailwind CSS pour cohérence visuelle
   * Ajouter boutons de copie pour les blocs de code
   * Tester le rendu pendant le streaming
   * Adapter le rendu pour la fenêtre flottante (scroll, taille)

### Phase 3 : Multimodalité
1. ⏳ **Support des images** :
   * Zone de collage d'images (drag & drop, bouton upload, collage depuis presse-papier)
   * Prévisualisation des images avant envoi
   * Conversion des images en Base64 pour Vision API
   * Utilisation du modèle `gpt-4o` ou `gpt-4-turbo` avec support vision
2. ⏳ **Support des fichiers** :
   * Zone de téléversement (drag & drop, bouton upload)
   * Support de plusieurs fichiers simultanés
   * Prévisualisation des fichiers téléversés
   * Validation des types de fichiers acceptés (PDF, Word, Excel, images, etc.)
   * Upload vers OpenAI File API ou extraction texte côté serveur
3. ⏳ **Lecture OCR** :
   * Activation automatique de l'OCR via Vision API pour les images
   * Analyse et extraction de texte depuis les images
   * Affichage du texte extrait (optionnel, pour debug)

### Phase 4 : RAG - Base de connaissances (Admin uniquement)
1. ✅ **Gestion de la base de connaissances** :
   * Interface admin pour uploader des PDF dans la base RAG
   * Route API `/api/assistant/rag/upload` (admin uniquement)
   * Validation et traitement des PDF uploadés
   * Extraction du texte depuis les PDF
   * Génération automatique des embeddings et indexation
   * Interface pour visualiser/gérer les documents indexés
   * Possibilité de supprimer des documents de la base

2. ✅ **Intégration RAG dans le chat** :
   * Toggle "Mode RAG" dans la page Outils (visible uniquement pour les admins)
   * Route API `/api/assistant/rag` avec vérification du rôle admin
   * Affichage des sources utilisées dans les réponses RAG
   * Affichage des scores de confiance
   * Mode debug pour voir le contexte utilisé
   * Indicateur visuel quand le mode RAG est actif

3. ✅ **Sécurité et permissions** :
   * Vérification du rôle `ADMINISTRATEUR` pour toutes les fonctionnalités RAG
   * Route API `/api/assistant/rag` : vérifie `verifyAdmin()` avant traitement
   * Route API `/api/assistant/rag/upload` : admin uniquement
   * Route API `/api/assistant/rag/documents` : admin uniquement
   * Interface UI : masquer les options RAG pour les non-admins

### Phase 5 : Templates & Historique
1. ⏳ **Historique et recherche** :
   * Sauvegarder les conversations dans Firestore (collection `assistant_conversations`)
   * Interface de recherche dans l'historique
   * Filtres par date, utilisateur, tags
   * Reprendre une conversation existante
2. ⏳ **Templates de prompts** :
   * Créer une bibliothèque de prompts pour l'agence
   * Interface pour sélectionner/appliquer un template
   * Prompts personnalisables par l'utilisateur
   * Stockage dans Firestore ou fichier de configuration
3. ⏳ **Export et partage** :
   * Export PDF/Word des conversations
   * Génération de lien de partage (si stockage activé)
   * Copie rapide du texte de la conversation
4. ⏳ **Analyse avancée** :
   * Résumé automatique de documents longs
   * Comparaison de deux documents
   * Analyse de données Excel/CSV

### Phase 6 : Optimisations
1. ✅ **Gestion d'erreurs robuste** :
   * Gestion des erreurs API OpenAI spécifiques (rate limits, quota, context length, etc.)
   * Retry automatique avec backoff exponentiel
   * Messages d'erreur clairs et actionnables pour l'utilisateur
   * Gestion spéciale pour les fichiers volumineux
   * Timeout et gestion des requêtes longues
2. ⏳ **Rate limiting** :
   * Limiter le nombre de requêtes par utilisateur/jour
   * Gestion spéciale pour les fichiers/images (plus coûteux)
   * Affichage des limites restantes à l'utilisateur
3. ⏳ **Logs et monitoring** :
   * Tracer l'utilisation pour monitoring
   * Suivi des coûts (tokens utilisés, coûts par requête)
   * Analytics par fonctionnalité
   * **Alertes budget** : Notifier si le budget mensuel est dépassé
   * **Métriques à suivre** :
     - Tokens utilisés par jour/semaine/mois
     - Coûts par jour/semaine/mois
     - Nombre de requêtes par utilisateur
     - Taux d'erreur
     - Temps de réponse moyen
   * **Dashboard de monitoring** (optionnel) : Interface admin pour visualiser les métriques
4. ⏳ **Performance** :
   * Optimisation du streaming
   * Cache des réponses fréquentes (si pertinent)
   * **Troncature intelligente de l'historique** :
     * Garder les N derniers messages (ex: 10-20)
     * Résumer les anciens messages si conversation très longue
     * Utiliser un modèle plus petit pour le résumé (ex: gpt-3.5-turbo)
   * **Compression des images** :
     * Réduire la résolution avant envoi (max 2048x2048)
     * Optimiser le format (WebP si possible)
     * Limiter la taille (ex: max 5MB par image)
   * **Timeout et requêtes longues** :
     * Timeout de 60s pour requêtes normales
     * Timeout de 120s pour requêtes avec fichiers
     * Indicateur de progression pour l'utilisateur
5. ⏳ **Améliorations UX** :
   * Suggestions de réponses rapides
   * Raccourcis clavier
   * Indicateur de progression pour les uploads
   * Notifications (si conversations sauvegardées)

---

## ⚠️ Limitations et considérations

### Techniques
* **Limites de l'API OpenAI** : 
  * Rate limits selon le plan OpenAI (requêtes par minute/heure)
  * Limites de tokens par modèle (ex: 128k pour gpt-4-turbo)
  * Gestion de la concurrence : plusieurs utilisateurs simultanés partagent les mêmes limites
* **Latence** : Les réponses peuvent prendre quelques secondes (encore plus avec fichiers/images)
* **Dépendance externe** : Dépendance à l'API OpenAI (disponibilité, changements de pricing)
* **Taille des fichiers** : Les fichiers volumineux peuvent ralentir les réponses et augmenter les coûts
* **Stockage temporaire** : Besoin d'espace de stockage pour les fichiers uploadés (Firebase Storage ou autre)
* **OCR** : Peut être coûteux en tokens selon la taille et le nombre d'images
* **Coûts** : 
  * Coûts par token (input + output)
  * Images et fichiers volumineux augmentent significativement les coûts
  * Surveiller régulièrement la consommation

### Conformité et éthique
* ⚠️ **Données sensibles** : Ne pas envoyer de données clients sensibles à l'API OpenAI
* ⚠️ **Politique d'entreprise** : Vérifier que l'utilisation de l'API OpenAI est autorisée par Allianz
* ⚠️ **RGPD** : S'assurer que les données envoyées respectent les réglementations en vigueur

### Sécurité
* 🔒 **Clé API** : Ne jamais exposer la clé API OpenAI côté client (stockage serveur uniquement)
* 🔒 **Authentification** : Limiter l'accès aux utilisateurs connectés via Firebase Auth
* 🔒 **Validation** : Valider et sanitizer tous les inputs (texte, fichiers, images)
* 🔒 **Validation des fichiers** : 
  * Vérifier les types MIME réels (pas seulement l'extension)
  * Limiter les types de fichiers acceptés
  * Limiter la taille des fichiers
* 🔒 **Rate limiting** : Limiter l'utilisation par utilisateur pour contrôler les coûts
* 🔒 **Données sensibles** : Avertir les utilisateurs de ne pas envoyer de données clients sensibles
* 🔒 **Nettoyage des fichiers** : Supprimer les fichiers temporaires après traitement pour éviter les fuites de données
* 🔒 **Logs** : Tracer l'utilisation pour audit et monitoring (sans stocker de données sensibles)
* 🔒 **Audit trail** : 
  * Logger toutes les actions (création conversation, envoi message, upload fichier)
  * Stocker userId, timestamp, action, métadonnées (sans contenu sensible)
  * Collection Firestore `assistant_audit_logs` pour traçabilité
* 🔒 **Validation renforcée des fichiers** :
  * Scanner les fichiers pour détecter les malwares (si service disponible)
  * Vérifier la signature MIME réelle (pas seulement l'extension)
  * Limiter strictement les types de fichiers acceptés
  * Quarantaine temporaire pour fichiers suspects

---

## 🔄 Approche technique retenue

**Solution choisie** : API OpenAI officielle via SDK Node.js

**Avantages** :
* ✅ **Stabilité** : API officielle, garantie de pérennité et de support
* ✅ **Conformité** : Solution légale et conforme, pas de contournement
* ✅ **Fonctionnalités complètes** : Chat, Vision (OCR), analyse de fichiers, streaming
* ✅ **Sécurité** : Clé API côté serveur uniquement, authentification Firebase Auth
* ✅ **Scalabilité** : Gestion native de la charge par l'API OpenAI
* ✅ **Intégration simple** : Pattern identique aux autres routes API (Pappers, Societe.com)

**Implémentation** :
- Route API Next.js `/api/assistant/chat` (server-side uniquement)
- Route API Next.js `/api/assistant/rag` (server-side uniquement, admin uniquement)
- SDK OpenAI officiel (`openai`)
- Authentification utilisateur via Firebase Auth
- Streaming des réponses pour une meilleure UX

---

## ❓ Questions ouvertes

1. **Modèle OpenAI** : Quel modèle utiliser ? (`gpt-4o`, `gpt-4-turbo`, ou autre ?)
2. **Budget API** : Quel budget mensuel est alloué pour l'utilisation de l'API OpenAI ?
3. **Usage** : Combien d'utilisateurs simultanés prévus ? (pour dimensionner les rate limits)
4. **Cas d'usage** : Quels sont les principaux cas d'usage de l'assistant IA dans l'agence ?
5. **Priorité** : Quelle est la priorité de cette fonctionnalité vs autres développements ?
6. **Types de fichiers** : Quels types de fichiers sont les plus utilisés dans l'agence ? (PDF, Word, Excel, images, etc.)
7. **Taille des fichiers** : Quelle est la taille moyenne des fichiers à analyser ? (pour définir les limites)
8. **Stockage** : Où stocker les fichiers temporaires ? (Firebase Storage, système de fichiers, autre ?)
9. **Templates** : Quels sont les cas d'usage les plus fréquents pour créer des templates de prompts ?
10. **Historique** : Faut-il sauvegarder toutes les conversations ou seulement certaines ?
11. **Partage** : Les conversations doivent-elles être partageables entre utilisateurs de l'agence ?
12. **Export** : Quels formats d'export sont les plus utiles ? (PDF, Word, Excel, autre ?)
13. **Rate limiting** : Quelles limites par utilisateur/jour sont appropriées ? (pour contrôler les coûts)
14. **Monitoring** : Quel niveau de monitoring et d'analytics est nécessaire ?

---

## 🚀 Prochaines étapes

1. **Validation** : Valider l'approche avec l'équipe
2. **Configuration API** : 
   * Créer un compte OpenAI ou utiliser un compte existant
   * Générer une clé API
   * Configurer `OPENAI_API_KEY` dans les variables d'environnement
3. **Choix du modèle** : Déterminer le modèle à utiliser (`gpt-4o` recommandé pour meilleures performances)
4. **POC** : Développer un Proof of Concept simple pour tester :
   * La connexion à l'API OpenAI
   * L'envoi de messages texte avec streaming
   * L'upload d'images avec Vision API (OCR)
   * L'upload et l'analyse de fichiers
5. **Développement** : Implémenter la solution complète (API + Interface avec toutes les fonctionnalités)
6. **Intégration** : 
   * Ajouter l'outil dans la liste des outils existants (`/commun/outils/page.tsx`)
   * Intégrer le bot flottant dans le layout principal (`app/layout.tsx`)
7. **Tests** : Tester toutes les fonctionnalités et valider la performance (page dédiée + bot flottant)

---

## 🧪 Tests et validation

### Tests unitaires

**Objectifs** :
- Tester les fonctions utilitaires (formatage, validation, parsing)
- Tester la gestion des erreurs
- Tester la troncature de l'historique
- Tester la conversion des fichiers/images

**Outils** : Jest, Vitest, ou framework de test Next.js

### Tests d'intégration

**Objectifs** :
- Tester la route API `/api/assistant/chat` avec différents scénarios
- Tester la route API `/api/assistant/rag` avec différents scénarios
- Tester l'authentification et l'autorisation
- Tester le streaming des réponses
- Tester l'upload de fichiers et images
- Tester la gestion des erreurs API OpenAI

**Outils** : Tests API avec `supertest` ou tests E2E

### Tests E2E (End-to-End)

**Objectifs** :
- Tester le flux complet : envoi message → réception réponse
- Tester l'upload de fichiers → analyse → réponse
- Tester l'upload d'images → OCR → réponse
- Tester le streaming en temps réel
- Tester le formatage Markdown des réponses
- Tester la gestion des erreurs côté UI

**Outils** : Playwright, Cypress, ou framework E2E Next.js

### Tests de performance

**Objectifs** :
- Mesurer le temps de réponse moyen
- Tester avec des fichiers volumineux
- Tester avec des conversations longues
- Tester la charge (plusieurs utilisateurs simultanés)

### Tests de sécurité

**Objectifs** :
- Tester que la clé API n'est jamais exposée côté client
- Tester la validation des fichiers (types MIME, taille)
- Tester l'authentification (accès non autorisé)
- Tester l'injection de code dans les messages
- Tester la sanitization du Markdown
- Tester l'accès RAG (admin uniquement)

### Scénarios de test prioritaires

1. ✅ **Chat simple** : Envoi message texte → réception réponse
2. ⏳ **Streaming** : Vérifier que le streaming fonctionne correctement
3. ⏳ **Images** : Upload image → OCR → réponse avec analyse
4. ⏳ **Fichiers** : Upload PDF → analyse → réponse
5. ✅ **Erreurs** : Tester tous les types d'erreurs (rate limit, quota, etc.)
6. ⏳ **Formatage** : Vérifier le rendu Markdown (tableaux, code, etc.)
7. ⏳ **Historique** : Tester la gestion de l'historique long
8. ✅ **Authentification** : Tester l'accès non autorisé
9. ✅ **RAG** : Tester le mode RAG avec recherche vectorielle

---

## 📊 Monitoring et coûts

### Suivi des coûts

**Métriques à collecter** :

- **Tokens utilisés** :
  * Tokens input par requête
  * Tokens output par requête
  * Total tokens par jour/semaine/mois
  * Par utilisateur (optionnel)

- **Coûts** :
  * Coût par requête (calculé selon le modèle utilisé)
  * Coût total par jour/semaine/mois
  * Coût par utilisateur (optionnel)
  * Coût par fonctionnalité (chat, images, fichiers, RAG)

- **Utilisation** :
  * Nombre de requêtes par jour/semaine/mois
  * Nombre de requêtes par utilisateur
  * Taux d'utilisation (requêtes réussies vs échouées)

**Implémentation** :

- Logger chaque requête dans Firestore (collection `assistant_usage_logs`)
- Calculer les coûts en temps réel (selon pricing OpenAI)
- Stocker les métriques agrégées (par jour/semaine/mois)

### Alertes budget

**Seuils à configurer** :

- ⚠️ **Avertissement** : 80% du budget mensuel atteint
- 🚨 **Alerte critique** : 95% du budget mensuel atteint
- 🔴 **Blocage** : 100% du budget mensuel atteint (optionnel)

**Notifications** :

- Email à l'administrateur
- Notification dans l'interface admin
- Affichage dans le dashboard de monitoring

### Dashboard de monitoring (optionnel)

**Fonctionnalités** :

- Graphiques de consommation (tokens, coûts)
- Graphiques d'utilisation (requêtes par jour)
- Liste des utilisateurs les plus actifs
- Taux d'erreur
- Temps de réponse moyen
- Alertes et notifications

**Implémentation** : Page admin `/admin/assistant-monitoring`

### Optimisation des coûts

**Recommandations** :

- Utiliser `gpt-4o` pour meilleur rapport qualité/prix
- Limiter la taille des images (compression)
- Tronquer l'historique pour réduire les tokens input
- Mettre en cache les réponses fréquentes (si pertinent)
- Limiter le nombre de requêtes par utilisateur/jour

---

*Dernière mise à jour : 27/10/2025*

