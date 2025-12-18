# 📋 TODO - Assistant IA - Intégration OpenAI API

*Planification de l'implémentation de l'assistant IA avec RAG*

---

## 🎯 Vue d'ensemble

Développer un assistant IA interne pour l'agence avec :
- **Deux méthodes d'accès** : Page dédiée dans Outils + Bot flottant sur toutes les pages
- **Fonctionnalités complètes** : Chat, OCR, analyse de fichiers, streaming
- **Formatage élégant** : Markdown, syntax highlighting, tableaux
- **Sécurité renforcée** : Authentification, validation, rate limiting
- **RAG (Admin uniquement)** : Base de connaissances vectorielle pour enrichir les réponses

### ⚠️ Séparation Chatbot / RAG

**Important** : Le système est divisé en deux composants distincts :

1. **Chatbot standard** (accessible à tous les utilisateurs connectés) :
   - Accessible depuis la **bulle flottante** en bas de page (toutes les pages)
   - Accessible depuis la **page Outils** (`/commun/outils/assistant-ia`)
   - Utilise l'API OpenAI directement sans contexte enrichi
   - Fonctionnalités : Chat, OCR, analyse de fichiers, streaming

2. **RAG (Retrieval-Augmented Generation)** (accessible uniquement aux administrateurs) :
   - Accessible **uniquement depuis la page Outils** (`/commun/outils/assistant-ia`)
   - **Restriction** : Seuls les utilisateurs avec le rôle `ADMINISTRATEUR` peuvent :
     * Utiliser le mode RAG (réponses enrichies avec contexte métier)
     * Uploader des PDF pour mettre à jour la base de connaissances
     * Gérer les documents indexés
   - Le RAG enrichit les réponses avec du contexte récupéré depuis une base de connaissances vectorielle

---

## 📦 Phase 1 : Backend API

### Configuration initiale
- [x] Installer le SDK OpenAI (`npm install openai`)
- [x] Créer la route API `/api/assistant/chat`
- [ ] Configurer la clé API OpenAI (`OPENAI_API_KEY`) dans les variables d'environnement (à faire par l'admin)
- [x] Configurer le client OpenAI avec la clé API

### Implémentation API
- [x] Implémenter l'authentification utilisateur via Firebase Auth (pattern identique aux autres routes API)
- [x] Implémenter le client OpenAI avec gestion des réponses
- [x] Gérer les messages texte avec historique conversationnel
- [x] Implémenter le streaming des réponses (Server-Sent Events) - ✅ Implémenté pour /api/assistant/chat et /api/assistant/rag
- [x] Tester la connexion et les réponses simples

### Gestion des erreurs
- [x] Gérer les erreurs Rate Limit (429) avec retry et backoff exponentiel
- [x] Gérer les erreurs Quota Exceeded (429)
- [x] Gérer les erreurs Invalid API Key (401)
- [x] Gérer les erreurs Invalid Request (400)
- [x] Gérer les erreurs Context Length Exceeded (400) - ✅ Détection et message clair
- [x] Gérer les timeouts (60s requêtes normales, 120s fichiers) - ✅ Timeout 60s implémenté
- [ ] Gérer les erreurs réseau avec retry automatique
- [x] Logger toutes les erreurs côté serveur pour debugging

---

## 🎨 Phase 2 : UI Chat

### Composant de chat réutilisable
- [x] Créer l'interface de chat de base (input, historique, envoi)
- [x] Créer le composant `ChatInterface` partagé (réutilisable) - ✅ MarkdownRenderer créé et utilisé
- [x] Intégrer le support du streaming des réponses (Server-Sent Events)
- [x] Implémenter le formatage élégant des réponses (Markdown, syntax highlighting, tableaux)

### Méthode 1 : Page dédiée
- [x] Créer la page `/commun/outils/assistant-ia/page.tsx`
- [x] Ajouter l'outil dans la liste (`/commun/outils/page.tsx`)
  - [x] Ajouter l'entrée dans le tableau `outils`
  - [x] Choisir une icône appropriée (`Bot`)
  - [x] Définir un nouveau schéma de couleurs (orange/amber pour le 2ème outil)
- [x] Utiliser le composant `ChatInterface` partagé en pleine page - ✅ MarkdownRenderer intégré

### Méthode 2 : Bot flottant
- [x] Créer le composant `FloatingAssistant.tsx`
- [x] Implémenter le bouton/bulle flottant en bas à droite (état fermé)
- [x] Implémenter la fenêtre de chat flottante (état ouvert)
- [x] Ajouter les animations d'ouverture/fermeture avec `framer-motion`
- [x] Intégrer dans le layout principal (`app/layout.tsx`)
- [x] Implémenter la persistance de l'état dans localStorage
- [x] Adapter le design responsive (mobile-friendly) - Taille fixe 400px, max-height responsive
- [x] Ajouter le support clavier (Escape pour fermer, Tab pour navigation) - Escape pour fermer, Enter pour envoyer
- [x] Ajouter les ARIA labels pour l'accessibilité
- [ ] Implémenter le focus trap dans la fenêtre ouverte - À améliorer
- [ ] Ajouter le support des images dans le bot flottant (drag & drop, collage, upload) - ⚠️ Actuellement uniquement dans la page dédiée

### Formatage élégant des réponses
- [x] Intégrer `react-markdown` (déjà installé)
- [x] Intégrer `remark-gfm` pour GitHub Flavored Markdown (déjà installé)
- [x] Installer et configurer `DOMPurify` pour la sécurité (sanitization HTML)
- [x] Installer `react-syntax-highlighter` ou `prism-react-renderer` pour le syntax highlighting
- [x] Installer les thèmes correspondants (ex: `prism-themes`)
- [x] Configurer les langages supportés (JS, TS, Python, SQL, JSON, YAML, Bash, etc.)
- [x] Créer des composants React pour tableaux, citations, alertes
- [x] Utiliser les composants UI existants (Card, Badge, Alert) pour cohérence
- [x] Styliser avec Tailwind CSS pour cohérence visuelle
- [x] Adapter les thèmes de syntax highlighting au thème sombre/clair de l'app
- [x] Ajouter des boutons de copie pour les blocs de code
- [x] Tester le rendu pendant le streaming - ✅ Fonctionne avec le streaming SSE
- [x] Adapter le rendu pour la fenêtre flottante (scroll, taille) - Prêt pour le bot flottant
- [ ] S'assurer de l'accessibilité (ARIA, navigation clavier, lecteurs d'écran) - À améliorer

---

## 🖼️ Phase 3 : Multimodalité

### Support des images
- [x] Créer une zone de collage d'images (drag & drop) - ✅ Implémenté dans la page dédiée uniquement
- [x] Ajouter un bouton d'upload d'images - ✅ Implémenté dans la page dédiée uniquement
- [x] Implémenter le collage depuis le presse-papier (Ctrl+V / Cmd+V) - ✅ Implémenté dans la page dédiée uniquement
- [x] Implémenter la prévisualisation des images avant envoi - ✅ Implémenté dans la page dédiée uniquement
- [x] Convertir les images en Base64 pour Vision API - ✅ Implémenté
- [x] Optimiser la résolution des images (max 2048x2048) - ✅ Implémenté
- [x] Compresser les images (format JPEG, max 5MB) - ✅ Implémenté
- [x] Utiliser le modèle `gpt-4o` ou `gpt-4-turbo` avec support vision - ✅ gpt-4o automatique si images
- [x] Permettre l'envoi de texte avec images dans le même message - ✅ Support complet dans la page dédiée
- [ ] Ajouter le support des images dans le bot flottant - ⚠️ À implémenter

### Support des fichiers
- [ ] Créer une zone de téléversement (drag & drop)
- [ ] Ajouter un bouton d'upload de fichiers
- [ ] Implémenter le support de plusieurs fichiers simultanés
- [ ] Implémenter la prévisualisation des fichiers téléversés
- [ ] Valider les types de fichiers acceptés (PDF, Word, Excel, images, TXT, etc.)
- [ ] Vérifier les types MIME réels (pas seulement l'extension)
- [ ] Limiter la taille des fichiers (ex: 10-20 MB par fichier)
- [ ] Limiter le nombre de fichiers par message (ex: 5-10 fichiers)
- [ ] Upload vers OpenAI File API ou extraction texte côté serveur
- [ ] Stocker les fichiers temporairement (Firebase Storage ou système de fichiers)
- [ ] Nettoyer les fichiers temporaires après traitement

### Lecture OCR
- [x] Activer automatiquement l'OCR via Vision API pour les images - ✅ Via gpt-4o avec images
- [x] Analyser et extraire le texte depuis les images - ✅ L'assistant peut analyser et extraire le texte automatiquement
- [ ] Afficher le texte extrait (optionnel, pour debug) - Optionnel, l'assistant répond directement
- [ ] Gérer les coûts liés à l'OCR (surveiller la consommation de tokens) - À surveiller

---

## 🔍 Phase 4 : RAG - Base de connaissances (Admin uniquement)

### Préparation des données
- [ ] Identifier les sources de données (documents, FAQ, procédures, etc.)
- [x] Créer une structure de stockage pour les documents
- [x] Préparer les documents pour l'indexation (nettoyage, formatage)
- [x] Définir les métadonnées à associer aux documents (type, date, auteur, tags)

### Vectorisation
- [x] Choisir un modèle d'embeddings (OpenAI text-embedding-3-small)
- [x] Installer les dépendances nécessaires (OpenAI SDK, pdf-parse)
- [x] Créer un script d'indexation pour vectoriser les documents
- [x] Implémenter le chunking des documents (découpage en morceaux pertinents)
- [x] Générer les embeddings pour chaque chunk
- [x] Stocker les embeddings dans Firestore

### Base vectorielle
- [x] Choisir la solution de stockage (Firestore)
- [x] Configurer la base vectorielle
- [x] Créer les collections nécessaires (`rag_chunks`, `rag_documents`)
- [x] Implémenter l'insertion des vecteurs avec métadonnées
- [x] Implémenter la recherche par similarité (similarité cosinus)

### Recherche sémantique
- [x] Implémenter la fonction de recherche par similarité
- [x] Convertir les requêtes utilisateur en embeddings
- [x] Rechercher les chunks les plus pertinents (top-k)
- [x] Calculer les scores de similarité
- [ ] Filtrer les résultats par métadonnées si nécessaire

### Reranking (optionnel)
- [ ] Implémenter un reranking pour améliorer la pertinence
- [ ] Utiliser un modèle de reranking (ex: Cohere rerank)
- [ ] Optimiser l'ordre des résultats

### Contexte enrichi
- [x] Construire le contexte à partir des chunks récupérés
- [x] Limiter la taille du contexte (respecter les limites de tokens)
- [x] Formater le contexte pour l'injection dans le prompt
- [x] Ajouter les sources/citations pour traçabilité

### Gestion de la base de connaissances
- [x] Créer la route API `/api/assistant/rag/upload` (admin uniquement)
- [x] Vérifier le rôle `ADMINISTRATEUR` avec `verifyAdmin()` avant traitement
- [x] Interface admin pour uploader des PDF dans la base RAG
- [x] Validation et traitement des PDF uploadés
- [x] Extraction du texte depuis les PDF
- [x] Génération automatique des embeddings et indexation
- [x] Interface pour visualiser/gérer les documents indexés
- [x] Possibilité de supprimer des documents de la base
- [x] Route API `/api/assistant/rag/documents` pour gérer les documents (GET/DELETE)

### Intégration RAG dans le chat
- [x] Créer la route API `/api/assistant/rag` avec vérification du rôle admin
- [x] Intégrer la recherche vectorielle avant l'appel OpenAI
- [x] Construire le prompt avec le contexte récupéré
- [x] Appeler l'API OpenAI avec le prompt enrichi
- [x] Retourner la réponse avec les sources utilisées
- [x] Retourner les scores de similarité avec les sources
- [x] Toggle "Mode RAG" dans la page Outils (visible uniquement pour les admins)
- [x] Affichage des sources utilisées dans les réponses RAG
- [x] Affichage des scores de confiance
- [x] Créer des liens vers les documents sources
- [x] Indicateur visuel quand le mode RAG est actif
- [x] Mode debug pour voir le contexte utilisé

### Prompt engineering
- [x] Créer un prompt système pour le chatbot RAG
- [x] Définir les instructions pour utiliser le contexte récupéré
- [x] Ajouter des instructions pour citer les sources
- [x] Gérer les cas où aucune information pertinente n'est trouvée

### Sécurité et permissions
- [x] Vérification du rôle `ADMINISTRATEUR` pour toutes les fonctionnalités RAG
- [x] Route API `/api/assistant/rag` : vérifie `verifyAdmin()` avant traitement
- [x] Route API `/api/assistant/rag/upload` : admin uniquement
- [x] Route API `/api/assistant/rag/documents` : admin uniquement
- [x] Interface UI : masquer les options RAG pour les non-admins
- [x] Messages d'erreur clairs si un non-admin tente d'accéder au RAG

### Gestion des erreurs RAG
- [x] Gérer les erreurs de recherche vectorielle
- [x] Gérer les cas où aucun résultat n'est trouvé
- [x] Logger les requêtes et résultats pour amélioration

### Amélioration UX RAG
- [x] Indicateur de recherche en cours
- [x] Affichage du nombre de sources trouvées
- [x] Option pour forcer une nouvelle recherche (recherche à chaque message)
- [ ] Historique des recherches effectuées

---

## 📚 Phase 5 : Templates & Historique

### Historique et recherche
- [ ] Créer la collection Firestore `assistant_conversations`
- [ ] Définir la structure de stockage (userId, title, messages, files, createdAt, updatedAt, tags)
- [ ] Implémenter la sauvegarde des conversations dans Firestore
- [ ] Créer l'interface de recherche dans l'historique
- [ ] Implémenter les filtres par date, utilisateur, tags
- [ ] Implémenter la reprise d'une conversation existante
- [ ] Générer automatiquement un titre pour chaque conversation

### Templates de prompts
- [ ] Créer une bibliothèque de prompts pour l'agence
- [ ] Créer les templates de base :
  - [ ] "Rédiger un email de relance client"
  - [ ] "Analyser un contrat d'assurance et extraire les points clés"
  - [ ] "Générer un devis personnalisé basé sur les besoins"
  - [ ] "Résumer une conversation téléphonique avec un client"
  - [ ] "Comparer deux offres d'assurance"
- [ ] Créer l'interface pour sélectionner/appliquer un template
- [ ] Implémenter la prévisualisation du template
- [ ] Permettre les variables personnalisables (ex: nom client, type de contrat)
- [ ] Stocker les templates dans Firestore ou fichier de configuration
- [ ] Permettre aux utilisateurs de créer leurs propres templates

### Export et partage
- [ ] Implémenter l'export PDF des conversations
  - [ ] Inclure les fichiers/images si pertinents
  - [ ] Ajouter un en-tête avec date, utilisateur, titre
  - [ ] Formatage professionnel
- [ ] Implémenter l'export Word (.docx) pour édition
- [ ] Implémenter l'export texte (.txt)
- [ ] Générer un lien de partage (si stockage activé)
- [ ] Permettre le partage interne uniquement (utilisateurs de l'app)
- [ ] Ajouter l'option de partage en lecture seule
- [ ] Implémenter la copie rapide du texte de la conversation

### Analyse avancée
- [ ] Détecter automatiquement les documents volumineux
- [ ] Proposer un résumé structuré (points clés, conclusions)
- [ ] Conserver les références aux sections originales
- [ ] Implémenter la comparaison de deux documents
  - [ ] Upload de deux documents
  - [ ] Analyse comparative par l'assistant IA
  - [ ] Mise en évidence des différences
  - [ ] Génération d'un rapport de comparaison
- [ ] Implémenter l'analyse de données Excel/CSV
  - [ ] Support des fichiers Excel/CSV
  - [ ] Extraction et analyse des données via File API
  - [ ] Réponses basées sur les données extraites
  - [ ] Génération de tableaux formatés si nécessaire

---

## ⚡ Phase 6 : Optimisations

### Gestion d'erreurs robuste
- [x] Implémenter la gestion complète des erreurs API OpenAI spécifiques - ✅ Rate limit, quota, context length, timeout, invalid key
- [x] Implémenter le retry automatique avec backoff exponentiel - ✅ Implémenté
- [x] Créer des messages d'erreur clairs et actionnables pour l'utilisateur - ✅ Messages détaillés avec détails en dev
- [ ] Gérer spécialement les fichiers volumineux - ⚠️ Support fichiers pas encore implémenté
- [x] Implémenter les timeouts (60s requêtes normales, 120s fichiers) - ✅ Timeout 60s implémenté pour requêtes normales
- [ ] Ajouter un indicateur de progression pour les requêtes longues - ⚠️ À améliorer (loader présent mais pas de progression)

### Rate limiting
- [ ] Implémenter la limitation du nombre de requêtes par utilisateur/jour
- [ ] Gérer spécialement les fichiers/images (plus coûteux)
- [ ] Afficher les limites restantes à l'utilisateur
- [ ] Créer une interface pour visualiser l'utilisation

### Logs et monitoring
- [ ] Tracer l'utilisation pour monitoring
- [ ] Suivre les coûts (tokens utilisés, coûts par requête)
- [ ] Créer des analytics par fonctionnalité
- [ ] Implémenter les alertes budget :
  - [ ] Avertissement à 80% du budget mensuel
  - [ ] Alerte critique à 95% du budget mensuel
  - [ ] Blocage à 100% du budget mensuel (optionnel)
- [ ] Logger chaque requête dans Firestore (collection `assistant_usage_logs`)
- [ ] Calculer les coûts en temps réel (selon pricing OpenAI)
- [ ] Stocker les métriques agrégées (par jour/semaine/mois)
- [ ] Créer un dashboard de monitoring (optionnel) : `/admin/assistant-monitoring`
  - [ ] Graphiques de consommation (tokens, coûts)
  - [ ] Graphiques d'utilisation (requêtes par jour)
  - [ ] Liste des utilisateurs les plus actifs
  - [ ] Taux d'erreur
  - [ ] Temps de réponse moyen
  - [ ] Alertes et notifications

### Performance
- [x] Optimiser le streaming - ✅ Streaming SSE optimisé avec chunks progressifs
- [ ] Implémenter le cache des réponses fréquentes (si pertinent) - À évaluer
- [ ] Implémenter la troncature intelligente de l'historique :
  - [ ] Garder les N derniers messages (ex: 10-20) - ⚠️ Historique non sauvegardé actuellement
  - [ ] Résumer les anciens messages si conversation très longue
  - [ ] Utiliser un modèle plus petit pour le résumé (ex: gpt-3.5-turbo)
- [x] Optimiser la compression des images :
  - [x] Réduire la résolution avant envoi (max 2048x2048) - ✅ Implémenté
  - [ ] Optimiser le format (WebP si possible) - ⚠️ JPEG actuellement
  - [x] Limiter la taille (ex: max 5MB par image) - ✅ Compression JPEG 0.9
- [x] Implémenter les timeouts et gestion des requêtes longues :
  - [x] Timeout de 60s pour requêtes normales - ✅ Implémenté
  - [ ] Timeout de 120s pour requêtes avec fichiers - À implémenter quand support fichiers ajouté
  - [ ] Indicateur de progression pour l'utilisateur - ⚠️ Loader présent mais pas de progression détaillée

### Améliorations UX
- [ ] Ajouter des suggestions de réponses rapides
- [ ] Implémenter les raccourcis clavier
- [ ] Ajouter un indicateur de progression pour les uploads
- [ ] Ajouter des notifications (si conversations sauvegardées)
- [ ] Améliorer l'accessibilité globale

### Audit trail et sécurité
- [ ] Créer la collection Firestore `assistant_audit_logs`
- [ ] Logger toutes les actions (création conversation, envoi message, upload fichier)
- [ ] Stocker userId, timestamp, action, métadonnées (sans contenu sensible)
- [ ] Implémenter la validation renforcée des fichiers :
  - [ ] Scanner les fichiers pour détecter les malwares (si service disponible)
  - [ ] Vérifier la signature MIME réelle (pas seulement l'extension)
  - [ ] Limiter strictement les types de fichiers acceptés
  - [ ] Quarantaine temporaire pour fichiers suspects
- [ ] Avertir les utilisateurs de ne pas envoyer de données clients sensibles

---

## 🔄 Phase 7 : Maintenance et amélioration RAG

### Mise à jour de la base
- [ ] Créer un système de mise à jour automatique
- [ ] Script pour réindexer les documents modifiés
- [ ] Gestion des versions de documents
- [ ] Notification des changements importants

### Monitoring RAG
- [ ] Tracer les recherches effectuées
- [ ] Mesurer la pertinence des résultats
- [ ] Analyser les requêtes sans résultats
- [ ] Dashboard de statistiques RAG

### Optimisation RAG
- [ ] Ajuster les paramètres de recherche (top-k, seuil de similarité)
- [ ] Optimiser la taille des chunks
- [ ] Améliorer le prompt système
- [ ] Tester différents modèles d'embeddings
- [ ] Considérer une base vectorielle dédiée (Pinecone, Qdrant) pour de grandes collections

---

## 🧪 Tests et validation

### Tests unitaires
- [ ] Tester les fonctions utilitaires (formatage, validation, parsing)
- [ ] Tester la gestion des erreurs
- [ ] Tester la troncature de l'historique
- [ ] Tester la conversion des fichiers/images
- [ ] Tester la génération d'embeddings
- [ ] Tester la recherche par similarité
- [ ] Tester la construction du contexte
- [ ] Tester le formatage des prompts

### Tests d'intégration
- [x] Tester la route API `/api/assistant/chat` avec différents scénarios
- [x] Tester la route API `/api/assistant/rag` avec différents scénarios
- [x] Tester l'authentification et l'autorisation
- [x] Tester le streaming des réponses - ✅ Streaming SSE implémenté et fonctionnel
- [x] Tester l'upload d'images - ✅ Fonctionnel dans la page dédiée
- [ ] Tester l'upload de fichiers (PDF, Word, Excel, etc.) - ⚠️ Pas encore implémenté
- [x] Tester la gestion des erreurs API OpenAI - ✅ Erreurs spécifiques gérées (rate limit, quota, context length, timeout)
- [x] Tester le flux complet : requête → recherche → réponse - ✅ RAG fonctionnel
- [x] Tester avec différents types de questions - ✅ Testé manuellement
- [x] Tester les cas limites (aucun résultat, résultats multiples) - ✅ Géré dans le code
- [ ] Tester les performances (latence) - À mesurer

### Tests E2E (End-to-End)
- [x] Tester le flux complet : envoi message → réception réponse - ✅ Fonctionnel
- [ ] Tester l'upload de fichiers → analyse → réponse - ⚠️ Support fichiers pas encore implémenté
- [x] Tester l'upload d'images → OCR → réponse - ✅ Fonctionnel dans la page dédiée
- [x] Tester le streaming en temps réel - ✅ Streaming SSE fonctionnel
- [x] Tester le formatage Markdown des réponses - ✅ MarkdownRenderer fonctionnel
- [x] Tester la gestion des erreurs côté UI - ✅ Messages d'erreur clairs affichés
- [ ] Tester avec des utilisateurs réels - À faire
- [ ] Collecter les retours sur la pertinence - À faire
- [ ] Ajuster selon les retours - À faire

### Tests de performance
- [ ] Mesurer le temps de réponse moyen - À mesurer
- [ ] Tester avec des fichiers volumineux - ⚠️ Support fichiers pas encore implémenté
- [ ] Tester avec des conversations longues - ⚠️ Historique non sauvegardé (session uniquement)
- [ ] Tester la charge (plusieurs utilisateurs simultanés) - À tester

### Tests de sécurité
- [x] Tester que la clé API n'est jamais exposée côté client
- [ ] Tester la validation des fichiers (types MIME, taille)
- [x] Tester l'authentification (accès non autorisé)
- [x] Tester l'accès RAG (admin uniquement)
- [ ] Tester l'injection de code dans les messages
- [ ] Tester la sanitization du Markdown

---

## ❓ Questions ouvertes à résoudre

- [x] **Modèle OpenAI** : Déterminer le modèle à utiliser (`gpt-4o`, `gpt-4-turbo`, ou autre ?) - ✅ `gpt-4o` choisi et implémenté
- [ ] **Budget API** : Définir le budget mensuel alloué pour l'utilisation de l'API OpenAI
- [ ] **Usage** : Déterminer le nombre d'utilisateurs simultanés prévus (pour dimensionner les rate limits)
- [ ] **Cas d'usage** : Identifier les principaux cas d'usage de l'assistant IA dans l'agence
- [ ] **Priorité** : Définir la priorité de cette fonctionnalité vs autres développements
- [ ] **Types de fichiers** : Identifier les types de fichiers les plus utilisés dans l'agence
- [ ] **Taille des fichiers** : Déterminer la taille moyenne des fichiers à analyser (pour définir les limites)
- [ ] **Stockage** : Déterminer où stocker les fichiers temporaires (Firebase Storage, système de fichiers, autre ?)
- [ ] **Templates** : Identifier les cas d'usage les plus fréquents pour créer des templates de prompts
- [ ] **Historique** : Déterminer si toutes les conversations doivent être sauvegardées ou seulement certaines
- [ ] **Partage** : Déterminer si les conversations doivent être partageables entre utilisateurs de l'agence
- [ ] **Export** : Identifier les formats d'export les plus utiles (PDF, Word, Excel, autre ?)
- [ ] **Rate limiting** : Définir les limites par utilisateur/jour appropriées (pour contrôler les coûts)
- [ ] **Monitoring** : Déterminer le niveau de monitoring et d'analytics nécessaire

---

## 📝 Notes

- **Approche technique retenue** : API OpenAI officielle via SDK Node.js
- **Modèle recommandé** : `gpt-4o` pour meilleur rapport qualité/prix
- **Sécurité** : Clé API côté serveur uniquement, authentification Firebase Auth
- **Conformité** : Vérifier que l'utilisation de l'API OpenAI est autorisée par Allianz
- **RGPD** : S'assurer que les données envoyées respectent les réglementations en vigueur
- **RAG** : Utilise Firestore pour le stockage vectoriel (considérer Pinecone/Qdrant pour grandes collections)

## ✅ État actuel de l'implémentation

### Fonctionnalités complètement implémentées
- ✅ Backend API (chat standard et RAG)
- ✅ Streaming SSE pour les réponses
- ✅ Interface de chat (page dédiée + bot flottant)
- ✅ Formatage Markdown élégant avec syntax highlighting
- ✅ Support des images dans la page dédiée (drag & drop, collage, upload, OCR)
- ✅ RAG complet (upload PDF, indexation, recherche vectorielle, réponses enrichies)
- ✅ Gestion des erreurs API OpenAI spécifiques
- ✅ Authentification et autorisation (admin pour RAG)

### Fonctionnalités partiellement implémentées
- ⚠️ **Images** : Support complet dans la page dédiée, mais pas encore dans le bot flottant
- ⚠️ **Fichiers** : Upload PDF pour RAG uniquement, pas de support général des fichiers (Word, Excel, etc.)
- ⚠️ **Historique** : Historique de session uniquement, pas de sauvegarde dans Firestore
- ⚠️ **Accessibilité** : ARIA labels présents, mais focus trap à améliorer

### Fonctionnalités à implémenter
- ⏳ Support des fichiers généraux (Word, Excel, etc.) dans le chat
- ⏳ Support des images dans le bot flottant
- ⏳ Sauvegarde de l'historique des conversations
- ⏳ Templates de prompts
- ⏳ Export et partage de conversations
- ⏳ Rate limiting par utilisateur
- ⏳ Monitoring et analytics
- ⏳ Dashboard de monitoring

---

*Dernière mise à jour : 27/10/2025*

