# 📋 TODO - Assistant IA - Intégration OpenAI API

*Basé sur le document de spécification `bot-mcp-chatgpt.md`*

---

## 🎯 Vue d'ensemble

Développer un assistant IA interne pour l'agence avec :
- **Deux méthodes d'accès** : Page dédiée dans Outils + Bot flottant sur toutes les pages
- **Fonctionnalités complètes** : Chat, OCR, analyse de fichiers, streaming
- **Formatage élégant** : Markdown, syntax highlighting, tableaux
- **Sécurité renforcée** : Authentification, validation, rate limiting

---

## 📦 Phase 1 : Backend API

### Configuration initiale
- [ ] Créer la route API `/api/assistant`
- [ ] Configurer la clé API OpenAI (`OPENAI_API_KEY`) dans les variables d'environnement
- [ ] Installer le SDK OpenAI (`npm install openai`)
- [ ] Configurer le client OpenAI avec la clé API

### Implémentation API
- [ ] Implémenter l'authentification utilisateur via Firebase Auth (pattern identique aux autres routes API)
- [ ] Implémenter le client OpenAI avec gestion du streaming
- [ ] Gérer les messages texte avec historique conversationnel
- [ ] Implémenter le streaming des réponses (Server-Sent Events)
- [ ] Tester la connexion et les réponses simples

### Gestion des erreurs
- [ ] Gérer les erreurs Rate Limit (429) avec retry et backoff exponentiel
- [ ] Gérer les erreurs Quota Exceeded (429)
- [ ] Gérer les erreurs Invalid API Key (401)
- [ ] Gérer les erreurs Invalid Request (400)
- [ ] Gérer les erreurs Context Length Exceeded (400)
- [ ] Gérer les timeouts (60s requêtes normales, 120s fichiers)
- [ ] Gérer les erreurs réseau avec retry automatique
- [ ] Logger toutes les erreurs côté serveur pour debugging

---

## 🎨 Phase 2 : UI Chat

### Composant de chat réutilisable
- [ ] Créer le composant `ChatInterface` partagé
- [ ] Implémenter l'interface de chat de base (input, historique, envoi)
- [ ] Intégrer le support du streaming des réponses (Server-Sent Events)
- [ ] Implémenter le formatage élégant des réponses (Markdown, syntax highlighting, tableaux)

### Méthode 1 : Page dédiée
- [ ] Créer la page `/commun/outils/assistant-ia/page.tsx`
- [ ] Utiliser le composant `ChatInterface` en pleine page
- [ ] Ajouter l'outil dans la liste (`/commun/outils/page.tsx`)
  - [ ] Ajouter l'entrée dans le tableau `outils`
  - [ ] Choisir une icône appropriée (ex: `MessageSquare`, `Bot`, `Sparkles`)
  - [ ] Définir un nouveau schéma de couleurs (ex: orange/amber pour le 2ème outil)

### Méthode 2 : Bot flottant
- [ ] Créer le composant `FloatingAssistant.tsx`
- [ ] Implémenter le bouton/bulle flottant en bas à droite (état fermé)
- [ ] Implémenter la fenêtre de chat flottante (état ouvert)
- [ ] Ajouter les animations d'ouverture/fermeture avec `framer-motion`
- [ ] Intégrer dans le layout principal (`app/layout.tsx`)
- [ ] Implémenter la persistance de l'état dans localStorage
- [ ] Adapter le design responsive (mobile-friendly)
- [ ] Ajouter le support clavier (Escape pour fermer, Tab pour navigation)
- [ ] Ajouter les ARIA labels pour l'accessibilité
- [ ] Implémenter le focus trap dans la fenêtre ouverte

### Formatage élégant des réponses
- [ ] Intégrer `react-markdown` (déjà installé)
- [ ] Intégrer `remark-gfm` pour GitHub Flavored Markdown (déjà installé)
- [ ] Installer et configurer `DOMPurify` pour la sécurité (sanitization HTML)
- [ ] Installer `react-syntax-highlighter` ou `prism-react-renderer` pour le syntax highlighting
- [ ] Installer les thèmes correspondants (ex: `prism-themes`)
- [ ] Configurer les langages supportés (JS, TS, Python, SQL, JSON, YAML, Bash, etc.)
- [ ] Créer des composants React pour tableaux, citations, alertes
- [ ] Utiliser les composants UI existants (Card, Badge, Alert) pour cohérence
- [ ] Styliser avec Tailwind CSS pour cohérence visuelle
- [ ] Adapter les thèmes de syntax highlighting au thème sombre/clair de l'app
- [ ] Ajouter des boutons de copie pour les blocs de code
- [ ] Tester le rendu pendant le streaming
- [ ] Adapter le rendu pour la fenêtre flottante (scroll, taille)
- [ ] S'assurer de l'accessibilité (ARIA, navigation clavier, lecteurs d'écran)

---

## 🖼️ Phase 3 : Multimodalité

### Support des images
- [ ] Créer une zone de collage d'images (drag & drop)
- [ ] Ajouter un bouton d'upload d'images
- [ ] Implémenter le collage depuis le presse-papier (Ctrl+V / Cmd+V)
- [ ] Implémenter la prévisualisation des images avant envoi
- [ ] Convertir les images en Base64 pour Vision API
- [ ] Optimiser la résolution des images (max 2048x2048)
- [ ] Compresser les images (format WebP si possible, max 5MB)
- [ ] Utiliser le modèle `gpt-4o` ou `gpt-4-turbo` avec support vision
- [ ] Permettre l'envoi de texte avec images dans le même message

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
- [ ] Activer automatiquement l'OCR via Vision API pour les images
- [ ] Analyser et extraire le texte depuis les images
- [ ] Afficher le texte extrait (optionnel, pour debug)
- [ ] Gérer les coûts liés à l'OCR (surveiller la consommation de tokens)

---

## 📚 Phase 4 : Templates & Historique

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

## ⚡ Phase 5 : Optimisations

### Gestion d'erreurs robuste
- [ ] Implémenter la gestion complète des erreurs API OpenAI spécifiques
- [ ] Implémenter le retry automatique avec backoff exponentiel
- [ ] Créer des messages d'erreur clairs et actionnables pour l'utilisateur
- [ ] Gérer spécialement les fichiers volumineux
- [ ] Implémenter les timeouts (60s requêtes normales, 120s fichiers)
- [ ] Ajouter un indicateur de progression pour les requêtes longues

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
- [ ] Optimiser le streaming
- [ ] Implémenter le cache des réponses fréquentes (si pertinent)
- [ ] Implémenter la troncature intelligente de l'historique :
  - [ ] Garder les N derniers messages (ex: 10-20)
  - [ ] Résumer les anciens messages si conversation très longue
  - [ ] Utiliser un modèle plus petit pour le résumé (ex: gpt-3.5-turbo)
- [ ] Optimiser la compression des images :
  - [ ] Réduire la résolution avant envoi (max 2048x2048)
  - [ ] Optimiser le format (WebP si possible)
  - [ ] Limiter la taille (ex: max 5MB par image)
- [ ] Implémenter les timeouts et gestion des requêtes longues :
  - [ ] Timeout de 60s pour requêtes normales
  - [ ] Timeout de 120s pour requêtes avec fichiers
  - [ ] Indicateur de progression pour l'utilisateur

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

## 🧪 Tests et validation

### Tests unitaires
- [ ] Tester les fonctions utilitaires (formatage, validation, parsing)
- [ ] Tester la gestion des erreurs
- [ ] Tester la troncature de l'historique
- [ ] Tester la conversion des fichiers/images

### Tests d'intégration
- [ ] Tester la route API `/api/assistant` avec différents scénarios
- [ ] Tester l'authentification et l'autorisation
- [ ] Tester le streaming des réponses
- [ ] Tester l'upload de fichiers et images
- [ ] Tester la gestion des erreurs API OpenAI

### Tests E2E (End-to-End)
- [ ] Tester le flux complet : envoi message → réception réponse
- [ ] Tester l'upload de fichiers → analyse → réponse
- [ ] Tester l'upload d'images → OCR → réponse
- [ ] Tester le streaming en temps réel
- [ ] Tester le formatage Markdown des réponses
- [ ] Tester la gestion des erreurs côté UI

### Tests de performance
- [ ] Mesurer le temps de réponse moyen
- [ ] Tester avec des fichiers volumineux
- [ ] Tester avec des conversations longues
- [ ] Tester la charge (plusieurs utilisateurs simultanés)

### Tests de sécurité
- [ ] Tester que la clé API n'est jamais exposée côté client
- [ ] Tester la validation des fichiers (types MIME, taille)
- [ ] Tester l'authentification (accès non autorisé)
- [ ] Tester l'injection de code dans les messages
- [ ] Tester la sanitization du Markdown

---

## ❓ Questions ouvertes à résoudre

- [ ] **Modèle OpenAI** : Déterminer le modèle à utiliser (`gpt-4o`, `gpt-4-turbo`, ou autre ?)
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

---

*Dernière mise à jour : 27/10/2025*

