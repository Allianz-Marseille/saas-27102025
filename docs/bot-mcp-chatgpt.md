# **Bot MCP ChatGPT - Contournement limitation Allianz**

*Marseille le 27/10/2025*

---

<div class="section section-enjeux">

## 🎯 Enjeux

Allianz a mis en place une mesure de limitation qui **empêche de se connecter à ChatGPT depuis leur site**.

Cette restriction bloque l'utilisation de ChatGPT pour :
* L'assistance dans la rédaction de devis
* L'analyse de contrats
* La génération de réponses client
* Toute autre fonctionnalité ChatGPT utile au quotidien

👉 **Objectif** : Développer une fonctionnalité dans la section **Outils** de l'application qui permet de contourner cette limitation via un **client MCP (Model Context Protocol)**.

### Contexte d'intégration

* La sidebar de l'application contient déjà un bouton **"Outils"**
* La page `/commun/outils` existe avec actuellement **2 outils** :
  1. **Bénéficiaires effectifs** (Pappers)
  2. **Informations entreprise** (Societe.com)
* Le **ChatGPT Assistant** sera le **3ème outil** ajouté à cette liste

</div>

---

<div class="section section-solution">

## 💡 Solution proposée : Client MCP

### Concept

Développer un **client MCP** qui se connecte à ChatGPT et **autorise toutes les fonctionnalités** de ChatGPT, indépendamment des restrictions d'Allianz.

### Architecture envisagée

```
Application Next.js
    ↓
Client MCP (serveur intermédiaire)
    ↓
API ChatGPT (via MCP Protocol)
    ↓
Réponses ChatGPT complètes
```

### Avantages du MCP

* ✅ **Contournement des restrictions réseau** : Le client MCP agit comme un proxy/intermédiaire
* ✅ **Accès complet aux fonctionnalités ChatGPT** : Pas de limitation côté API
* ✅ **Intégration propre** : Le MCP peut être intégré comme un outil dans `/commun/outils`
* ✅ **Sécurité** : Les requêtes passent par notre infrastructure, pas directement depuis le navigateur

</div>

---

<div class="section section-reflexions">

## 🤔 Réflexions techniques

### 1. Architecture MCP

**Réflexion** : Le client MCP doit être un serveur séparé qui :
* Écoute les requêtes de l'application Next.js
* Se connecte à l'API ChatGPT via le protocole MCP
* Retourne les réponses formatées

**Commentaire** : 
- Le MCP peut être implémenté comme une **route API Next.js** (`/api/mcp-chatgpt`)
- Ou comme un **service séparé** (Node.js/Express) si besoin de plus de contrôle
- Pour commencer, une route API Next.js sera plus simple et intégrée

### 2. Authentification ChatGPT

**Réflexion** : Comment gérer l'authentification ChatGPT ?
* Utiliser une clé API OpenAI partagée ?
* Permettre à chaque utilisateur de connecter son propre compte ?
* Un compte ChatGPT dédié pour l'agence ?

**Décision** : 
- ✅ **Utiliser un compte ChatGPT existant** (déjà disponible)
- ✅ **Compte partagé** : Tous les utilisateurs de l'application utilisent le même compte ChatGPT
- ✅ **Accès via authentification utilisateur** : Seuls les utilisateurs connectés à l'application peuvent accéder à l'outil

**Commentaire** :
- **Avantages** :
  - Pas besoin de créer un nouveau compte ou une clé API
  - Utilisation du compte existant
  - Tous les utilisateurs bénéficient de l'outil sans configuration individuelle
- **Implémentation** :
  - Stocker les credentials du compte ChatGPT dans les variables d'environnement (sécurisé)
  - L'authentification se fait côté serveur (route API Next.js)
  - Les utilisateurs n'ont pas besoin de connaître les credentials
- **Note** : Si le compte ChatGPT utilise une authentification par session/cookies, il faudra gérer la persistance de session côté serveur

### 3. Interface utilisateur

**Réflexion** : Comment présenter l'outil dans `/commun/outils` ?

**Commentaire** :
- **Ajout dans la liste existante** : Ajouter le ChatGPT Assistant comme 3ème outil dans `/commun/outils/page.tsx`
  * Même structure que les outils existants (Bénéficiaires effectifs, Informations entreprise)
  * Même style de Card avec animations
  * Nouvelle couleur de schéma (ex: orange/amber pour le 3ème outil)
- **Page dédiée** : Créer `/commun/outils/chatgpt-assistant/page.tsx`
- **Interface de chat** : Similaire à ChatGPT avec toutes les fonctionnalités
  * Zone de chat avec historique des messages
  * Input pour les messages avec support multimédia
  * **Zone de collage d'images** : Drag & drop ou bouton pour coller/uploader des images
  * **Zone de téléversement de fichiers** : Support drag & drop pour un ou plusieurs fichiers
  * **Indicateur de connexion web** : Afficher si ChatGPT utilise la recherche web
  * Bouton d'envoi
  * Indicateur de chargement
  * **Prévisualisation des fichiers/images** : Afficher les fichiers/images avant envoi
  * Design cohérent avec le reste de l'application

### 4. Fonctionnalités ChatGPT à activer

**Réflexion** : Quelles fonctionnalités ChatGPT sont essentielles ?

**Objectif** : S'assurer que **toutes les fonctionnalités** de ChatGPT soient accessibles depuis le bot.

**Fonctionnalités de base** :
- ✅ **Chat classique** : Messages texte
- ✅ **Contexte conversationnel** : Mémoriser l'historique de la conversation
- ✅ **Streaming** : Affichage progressif des réponses (meilleure UX)
- ✅ **Gestion des erreurs** : Messages clairs en cas de problème

**Fonctionnalités avancées (OBLIGATOIRES)** :
- ✅ **Coller une image** : Permettre le collage d'images dans le chat
- ✅ **Lecture OCR** : Analyse et extraction de texte depuis les images
- ✅ **Connexion sur le web** : Accès à Internet pour rechercher des informations en temps réel
- ✅ **Téléversement de fichiers** : Support d'un ou plusieurs fichiers (PDF, Word, Excel, etc.)
- ✅ **Analyse de fichiers** : ChatGPT peut lire et analyser le contenu des fichiers téléversés

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
- 🔄 **Plugins/Extensions** : Utiliser des plugins ChatGPT disponibles (si supportés)
- 🔄 **Mode voix** : Si disponible dans ChatGPT (pour dictée vocale)
- 🔄 **Suggestions de réponses** : Proposer des réponses rapides basées sur le contexte

**Commentaire** :
- Les fonctionnalités avancées sont **essentielles** pour un usage complet de ChatGPT
- Les fonctionnalités supplémentaires améliorent la productivité et l'expérience utilisateur
- Le client MCP doit supporter le format multimédia (images, fichiers)
- L'interface utilisateur doit permettre le drag & drop et le collage d'images
- La connexion web nécessite que le compte ChatGPT ait accès à cette fonctionnalité (ChatGPT Plus/Pro)
- Les templates de prompts sont particulièrement utiles pour standardiser les usages dans l'agence

### 5. Sécurité et limitations

**Réflexion** : Comment sécuriser l'outil ?

**Commentaire** :
- ✅ **Authentification utilisateur** : Seuls les utilisateurs connectés peuvent accéder
- ✅ **Rate limiting** : Limiter le nombre de requêtes par utilisateur/jour
- ✅ **Validation des inputs** : Sanitizer les messages avant envoi
- ✅ **Logs** : Tracer l'utilisation pour monitoring
- ⚠️ **Coûts** : Surveiller la consommation API OpenAI (peut être coûteux)

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
  - **Recommandation** : Commencer par Option 1, ajouter Option 2 en Phase 4
- **Structure de stockage** (si Option 2) :
  * Collection `chatgpt_conversations`
  * Document par conversation avec :
    - `userId` : ID de l'utilisateur
    - `title` : Titre de la conversation (généré ou manuel)
    - `messages` : Array des messages (user + assistant)
    - `files` : Références aux fichiers uploadés (si stockés)
    - `createdAt` : Date de création
    - `updatedAt` : Date de dernière mise à jour
    - `tags` : Tags pour organisation (optionnel)

### 7. Intégration MCP Protocol

**Réflexion** : Comment implémenter le protocole MCP ?

**Commentaire** :
- Le **MCP (Model Context Protocol)** est un protocole standardisé pour connecter des applications aux modèles LLM
- Utiliser une bibliothèque MCP existante si disponible
- Ou implémenter un client MCP simple qui :
  * Formate les requêtes selon le protocole MCP
  * Gère les réponses streaming
  * Gère les erreurs et reconnexions
  * **Support des fichiers multimédias** : Images, PDF, documents
  * **Support de la recherche web** : Activation et gestion des requêtes web
- **Bibliothèque potentielle** : `@modelcontextprotocol/sdk` (à vérifier)

### 8. Gestion des fichiers et images

**Réflexion** : Comment gérer les fichiers et images côté serveur ?

**Commentaire** :
- **Upload côté client** : Les fichiers/images sont uploadés vers notre serveur (route API Next.js)
- **Stockage temporaire** : Stocker les fichiers dans un storage temporaire (Firebase Storage ou système de fichiers)
- **Conversion/Formatage** : Convertir les fichiers en format compatible avec ChatGPT API
  * Images : Base64 ou URL selon l'API
  * PDF/Documents : Extraction du texte ou conversion en format texte
- **Envoi à ChatGPT** : Transmettre les fichiers via l'API ChatGPT avec le message
- **Nettoyage** : Supprimer les fichiers temporaires après traitement
- **Limites** :
  * Taille maximale par fichier (ex: 10-20 MB)
  * Nombre maximum de fichiers par message (ex: 5-10 fichiers)
  * Types de fichiers acceptés (PDF, DOCX, XLSX, images, TXT, etc.)

### 9. OCR et analyse d'images

**Réflexion** : Comment gérer l'OCR et l'analyse d'images ?

**Commentaire** :
- **OCR natif ChatGPT** : ChatGPT peut analyser les images et extraire le texte (Vision API)
- **Activation automatique** : Détecter automatiquement les images et activer l'analyse
- **Format des images** : S'assurer que les images sont dans un format supporté (PNG, JPG, WebP)
- **Résolution** : Optimiser la résolution des images (pas trop grande, pas trop petite)
- **Combinaison texte + image** : Permettre d'envoyer du texte avec des images dans le même message

### 10. Connexion web et recherche

**Réflexion** : Comment activer et gérer la recherche web ?

**Commentaire** :
- **Activation** : Le compte ChatGPT doit avoir accès à la fonctionnalité de recherche web (ChatGPT Plus/Pro)
- **Indicateur visuel** : Afficher quand ChatGPT utilise la recherche web
- **Gestion des résultats** : Afficher les sources et liens utilisés par ChatGPT
- **Performance** : La recherche web peut ralentir les réponses (gérer les timeouts)
- **Erreurs** : Gérer les cas où la recherche web échoue (fallback sur réponse sans web)

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
  * Analyse comparative par ChatGPT
  * Mise en évidence des différences
  * Génération d'un rapport de comparaison
- **Analyse de données** :
  * Support des fichiers Excel/CSV
  * Extraction et analyse des données
  * Génération de visualisations (si ChatGPT le supporte)
  * Réponses basées sur les données

</div>

---

<div class="section section-chemins">

## 🧭 Plan d'implémentation

### Phase 1 : Setup de base
1. ✅ Créer la route API `/api/mcp-chatgpt` (ou `/api/chatgpt`)
2. ✅ Configurer les credentials du compte ChatGPT dans les variables d'environnement
3. ✅ Implémenter un client MCP basique pour se connecter au compte ChatGPT
4. ✅ Gérer l'authentification/session du compte ChatGPT côté serveur
5. ✅ Tester la connexion et les réponses simples

### Phase 2 : Interface utilisateur
1. ✅ Créer la page `/commun/outils/chatgpt-assistant/page.tsx`
2. ✅ **Ajouter l'outil dans la liste** (`/commun/outils/page.tsx`) :
   * Ajouter l'entrée dans le tableau `outils`
   * Choisir une icône appropriée (ex: `MessageSquare`, `Bot`, `Sparkles`)
   * Définir un nouveau schéma de couleurs (ex: orange/amber)
3. ✅ Implémenter l'interface de chat de base (input, historique, envoi)
4. ✅ Ajouter le streaming des réponses

### Phase 2.5 : Fonctionnalités avancées (OBLIGATOIRE)
1. ✅ **Support des images** :
   * Zone de collage d'images (drag & drop, bouton upload, collage depuis presse-papier)
   * Prévisualisation des images avant envoi
   * Conversion des images en format compatible avec l'API ChatGPT
2. ✅ **Support des fichiers** :
   * Zone de téléversement (drag & drop, bouton upload)
   * Support de plusieurs fichiers simultanés
   * Prévisualisation des fichiers téléversés
   * Validation des types de fichiers acceptés (PDF, Word, Excel, images, etc.)
3. ✅ **Lecture OCR** :
   * Activation automatique de l'OCR pour les images
   * Affichage du texte extrait (optionnel, pour debug)
4. ✅ **Connexion web** :
   * Activation de la recherche web dans ChatGPT
   * Indicateur visuel quand ChatGPT utilise le web
   * Gestion des résultats de recherche web

### Phase 3 : Améliorations
1. ✅ Gestion d'erreurs robuste (notamment pour les fichiers volumineux)
2. ✅ Rate limiting (avec gestion spéciale pour les fichiers/images)
3. ✅ Logs et monitoring
4. ✅ **Gestion des fichiers volumineux** :
   * Limite de taille par fichier
   * Compression si nécessaire
   * Indicateur de progression pour les uploads
5. ✅ (Optionnel) Stockage des conversations avec fichiers/images

### Phase 4 : Fonctionnalités supplémentaires (RECOMMANDÉES)
1. ✅ **Historique et recherche** :
   * Sauvegarder les conversations dans Firestore
   * Interface de recherche dans l'historique
   * Filtres par date, utilisateur, tags
2. ✅ **Templates de prompts** :
   * Créer une bibliothèque de prompts pour l'agence
   * Interface pour sélectionner/appliquer un template
   * Prompts personnalisables par l'utilisateur
3. ✅ **Export et partage** :
   * Export PDF/Word des conversations
   * Génération de lien de partage (si stockage activé)
   * Copie rapide du texte de la conversation
4. ✅ **Analyse avancée** :
   * Résumé automatique de documents longs
   * Comparaison de deux documents
   * Analyse de données Excel/CSV avec visualisation
5. ✅ **Améliorations UX** :
   * Suggestions de réponses rapides
   * Mode sombre/clair
   * Raccourcis clavier
   * Notifications (si conversations sauvegardées)

### Phase 5 : Optimisations
1. ✅ Cache des réponses fréquentes (si pertinent)
2. ✅ Personnalisation de l'interface
3. ✅ Performance : Optimisation du chargement et du streaming
4. ✅ Analytics : Suivi de l'utilisation par fonctionnalité

</div>

---

<div class="section section-limitations">

## ⚠️ Limitations et considérations

### Techniques
* **Limites du compte ChatGPT** : Le compte partagé peut avoir des limites d'utilisation (nombre de messages/jour, etc.)
* **Gestion de session** : Si le compte utilise une authentification par session, il faut gérer la persistance et le renouvellement
* **Concurrence** : Plusieurs utilisateurs simultanés peuvent utiliser le même compte (à gérer si nécessaire)
* **Latence** : Les réponses peuvent prendre quelques secondes (encore plus avec fichiers/images/recherche web)
* **Dépendance externe** : Dépendance à ChatGPT (disponibilité, changements)
* **Taille des fichiers** : Les fichiers volumineux peuvent ralentir les réponses et augmenter les coûts
* **Stockage temporaire** : Besoin d'espace de stockage pour les fichiers uploadés (Firebase Storage ou autre)
* **Recherche web** : Nécessite un compte ChatGPT avec accès à cette fonctionnalité (ChatGPT Plus/Pro)
* **OCR** : Peut être coûteux en tokens selon la taille et le nombre d'images

### Légales/Éthiques
* ⚠️ **Contournement de restriction** : S'assurer que le contournement est légal et éthique
* ⚠️ **Données sensibles** : Ne pas envoyer de données clients sensibles à ChatGPT
* ⚠️ **Politique d'entreprise** : Vérifier que l'utilisation de ChatGPT est autorisée par Allianz (même via contournement)

### Sécurité
* 🔒 **Credentials** : Ne jamais exposer les credentials du compte ChatGPT côté client
* 🔒 **Session** : Gérer la session ChatGPT de manière sécurisée côté serveur
* 🔒 **Validation** : Valider et sanitizer tous les inputs (texte, fichiers, images)
* 🔒 **Validation des fichiers** : 
  * Vérifier les types MIME réels (pas seulement l'extension)
  * Scanner les fichiers pour détecter les malwares (si possible)
  * Limiter les types de fichiers acceptés
* 🔒 **Authentification** : Limiter l'accès aux utilisateurs connectés à l'application
* 🔒 **Rate limiting** : Limiter l'utilisation pour éviter la surcharge du compte partagé
* 🔒 **Données sensibles dans les fichiers** : Avertir les utilisateurs de ne pas envoyer de données clients sensibles
* 🔒 **Nettoyage des fichiers** : Supprimer les fichiers temporaires après traitement pour éviter les fuites de données

</div>

---

<div class="section section-alternatives">

## 🔄 Alternatives à considérer

### Alternative 1 : API OpenAI directe (sans MCP)
* **Avantage** : Plus simple, pas besoin d'implémenter MCP
* **Inconvénient** : Moins flexible, pas de standardisation

### Alternative 2 : Proxy simple
* **Avantage** : Très simple à implémenter
* **Inconvénient** : Moins de fonctionnalités, moins robuste

### Alternative 3 : Service externe
* **Avantage** : Pas de maintenance
* **Inconvénient** : Coûts supplémentaires, moins de contrôle

**Recommandation** : 
- Utiliser le compte ChatGPT existant via un client MCP ou une bibliothèque de scraping/automation
- Implémenter via route API Next.js pour la sécurité
- Le MCP permet de standardiser l'accès et d'ajouter des fonctionnalités avancées si nécessaire

</div>

---

<div class="section section-questions">

## ❓ Questions ouvertes

1. **Limites du compte** : Quelles sont les limites d'utilisation du compte ChatGPT (messages/jour, etc.) ?
2. **Usage** : Combien d'utilisateurs simultanés prévus ? (pour gérer la charge sur le compte partagé)
3. **Cas d'usage** : Quels sont les principaux cas d'usage ChatGPT dans l'agence ?
4. **Compliance** : Le contournement est-il autorisé par la direction ?
5. **Priorité** : Quelle est la priorité de cette fonctionnalité vs autres développements ?
6. **Authentification compte** : Le compte ChatGPT utilise-t-il une authentification par session/cookies ou par clé API ?
7. **Type de compte** : Le compte ChatGPT est-il un compte Plus/Pro avec accès à la recherche web ?
8. **Types de fichiers** : Quels types de fichiers sont les plus utilisés dans l'agence ? (PDF, Word, Excel, images, etc.)
9. **Taille des fichiers** : Quelle est la taille moyenne des fichiers à analyser ? (pour définir les limites)
10. **Stockage** : Où stocker les fichiers temporaires ? (Firebase Storage, système de fichiers, autre ?)
11. **Templates** : Quels sont les cas d'usage les plus fréquents pour créer des templates de prompts ?
12. **Historique** : Faut-il sauvegarder toutes les conversations ou seulement certaines ?
13. **Partage** : Les conversations doivent-elles être partageables entre utilisateurs de l'agence ?
14. **Export** : Quels formats d'export sont les plus utiles ? (PDF, Word, Excel, autre ?)

</div>

---

<div class="section section-next-steps">

## 🚀 Prochaines étapes

1. **Validation** : Valider l'approche avec l'équipe
2. **Vérification du compte** : Vérifier que le compte ChatGPT a accès à toutes les fonctionnalités (recherche web, Vision/OCR, fichiers)
3. **Setup compte** : Configurer les credentials du compte ChatGPT existant dans les variables d'environnement
4. **POC** : Développer un Proof of Concept simple pour tester :
   * La connexion au compte ChatGPT
   * L'envoi de messages texte
   * L'upload d'images avec OCR
   * L'upload de fichiers
   * La recherche web
5. **Test** : Tester depuis le réseau Allianz pour confirmer le contournement de la limitation
6. **Développement** : Implémenter la solution complète (API + Interface avec toutes les fonctionnalités)
7. **Intégration** : Ajouter l'outil dans la liste des outils existants

</div>

---

