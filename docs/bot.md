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

### Architecture

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

## 🏗️ Architecture technique

### Backend

**Routes API Next.js** :
- `/api/assistant/chat` : Chat standard (tous utilisateurs)
- `/api/assistant/rag` : Chat avec RAG (admin uniquement)
- `/api/assistant/rag/upload` : Upload de PDF pour RAG (admin uniquement)
- `/api/assistant/rag/documents` : Gestion des documents RAG (admin uniquement)

**SDK et dépendances** :
- SDK OpenAI officiel (`openai`)
- Authentification Firebase Auth (pattern identique aux autres routes API)
- Clé API stockée dans `OPENAI_API_KEY` (variables d'environnement)

**Modèle recommandé** : `gpt-4o` pour meilleur rapport qualité/prix

### Frontend

**Composants** :
- `components/assistant/FloatingAssistant.tsx` : Bot flottant accessible partout
- `components/assistant/MarkdownRenderer.tsx` : Rendu Markdown élégant
- `app/commun/outils/assistant-ia/page.tsx` : Page dédiée avec interface complète

**Intégration** :
- Bot flottant intégré dans `app/layout.tsx`
- Page dédiée accessible via `/commun/outils/assistant-ia`
- Carte outil dans `/commun/outils/page.tsx`

### RAG (Base de connaissances)

**Structure** :
- `lib/assistant/embeddings.ts` : Génération d'embeddings
- `lib/assistant/vector-search.ts` : Recherche vectorielle
- `lib/assistant/rag.ts` : Logique RAG principale
- `lib/assistant/types.ts` : Types TypeScript

**Stockage** :
- Firestore : Collections `rag_chunks` et `rag_documents`
- Embeddings : OpenAI `text-embedding-3-small` (1536 dimensions)
- Recherche : Similarité cosinus, top-k=5, seuil=0.7

---

## 🎨 Interface utilisateur

### Méthode 1 : Page dédiée

**Localisation** : `/commun/outils/assistant-ia`

**Fonctionnalités** :
- Interface de chat complète en pleine page
- Support du mode RAG (toggle visible uniquement pour les admins)
- Upload de PDF pour la base RAG (admin uniquement)
- Gestion des documents indexés (admin uniquement)
- Formatage Markdown élégant des réponses
- Support images et fichiers

### Méthode 2 : Bot flottant

**Localisation** : Toutes les pages (intégré dans `app/layout.tsx`)

**Design** :
- **État fermé** : Bouton/bulle en bas à droite avec icône
- **État ouvert** : Fenêtre de chat flottante (400x600px desktop, adaptatif mobile)
- Animations fluides avec `framer-motion`
- Persistance de l'état dans localStorage

**Fonctionnalités** :
- Chat standard uniquement (pas de RAG)
- Support images et fichiers
- Formatage Markdown élégant
- Responsive et accessible

### Interface de chat commune

**Éléments** :
- Zone de chat avec historique des messages
- Input pour les messages avec support multimédia
- Zone de collage d'images (drag & drop, bouton upload, collage depuis presse-papier)
- Zone de téléversement de fichiers (drag & drop, bouton upload)
- Prévisualisation des fichiers/images avant envoi
- Formatage élégant des réponses (Markdown, syntax highlighting, tableaux)
- Indicateurs de chargement et streaming

---

## ⚙️ Fonctionnalités

### Fonctionnalités de base

- ✅ **Chat classique** : Messages texte avec historique conversationnel
- ✅ **Streaming** : Affichage progressif des réponses (Server-Sent Events)
- ✅ **Formatage Markdown** : Rendu professionnel avec syntax highlighting
- ✅ **Gestion des erreurs** : Messages clairs et actionnables

### Fonctionnalités avancées

- ✅ **Support images** : Upload, drag & drop, collage depuis presse-papier
- ✅ **OCR automatique** : Analyse et extraction de texte depuis les images via Vision API
- ✅ **Support fichiers** : Upload et analyse de fichiers (PDF, Word, Excel, etc.)
- ✅ **RAG (Admin)** : Réponses enrichies avec contexte métier depuis base de connaissances

### Fonctionnalités supplémentaires (à implémenter)

- 🔄 **Historique des conversations** : Sauvegarder et rechercher dans les conversations passées
- 🔄 **Templates de prompts** : Prompts pré-configurés pour cas d'usage courants
- 🔄 **Export de conversations** : Export PDF/Word des conversations
- 🔄 **Partage de conversations** : Partager des conversations avec des collègues
- 🔄 **Analyse avancée** : Résumé de documents, comparaison, analyse de données Excel/CSV

---

## 🔒 Sécurité et conformité

### Authentification

- ✅ Authentification obligatoire via Firebase Auth
- ✅ Vérification du rôle `ADMINISTRATEUR` pour les fonctionnalités RAG
- ✅ Clé API OpenAI stockée côté serveur uniquement (jamais exposée au client)

### Validation

- ✅ Validation des inputs (texte, fichiers, images)
- ✅ Vérification des types MIME réels (pas seulement l'extension)
- ✅ Limitation des types de fichiers acceptés
- ✅ Limitation de la taille des fichiers (ex: 20 MB max)

### Monitoring et audit

- ✅ Logs de toutes les actions pour audit
- ⏳ Suivi des coûts (tokens utilisés, coûts par requête)
- ⏳ Rate limiting par utilisateur/jour
- ⏳ Alertes budget (80%, 95%, 100%)

### Conformité

- ⚠️ **Données sensibles** : Avertir les utilisateurs de ne pas envoyer de données clients sensibles
- ⚠️ **Politique d'entreprise** : Vérifier que l'utilisation de l'API OpenAI est autorisée par Allianz
- ⚠️ **RGPD** : S'assurer que les données envoyées respectent les réglementations en vigueur

---

## 🔍 RAG - Base de connaissances (Admin uniquement)

### Vue d'ensemble

Le système RAG (Retrieval-Augmented Generation) permet d'enrichir les réponses de l'assistant IA avec du contexte métier récupéré depuis une base de connaissances vectorielle.

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

### Configuration

**Paramètres par défaut** :
- Modèle d'embedding : `text-embedding-3-small` (1536 dimensions)
- Top-K : 5 chunks
- Seuil de similarité : 0.7
- Taille des chunks : 500 tokens avec overlap de 50 tokens

**Stockage Firestore** :
- Collection `rag_chunks` : Chunks vectorisés avec embeddings
- Collection `rag_documents` : Métadonnées des documents indexés

### Utilisation

**Endpoint** : `POST /api/assistant/rag`

**Headers** :
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** :
```json
{
  "message": "Quelle est la procédure pour souscrire une assurance ?",
  "useRAG": true,
  "model": "gpt-4o",
  "stream": true
}
```

**Réponse** :
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
  "usedRAG": true
}
```

---

## 🧭 Plan d'implémentation

### Phase 1 : Backend API

**Objectif** : Créer les routes API pour le chat standard et le RAG

**Tâches** :
1. ✅ Installer le SDK OpenAI (`npm install openai`)
2. ✅ Créer la route API `/api/assistant/chat`
3. ⏳ Configurer la clé API OpenAI (`OPENAI_API_KEY`) dans les variables d'environnement (à faire par l'admin)
4. ✅ Configurer le client OpenAI avec la clé API
5. ✅ Implémenter l'authentification utilisateur via Firebase Auth
6. ✅ Implémenter le client OpenAI avec gestion des réponses
7. ✅ Gérer les messages texte avec historique conversationnel
8. ✅ Implémenter le streaming des réponses (Server-Sent Events)
9. ✅ Gérer les erreurs API OpenAI spécifiques (rate limits, quota, context length, timeouts)
10. ✅ Logger toutes les erreurs côté serveur pour debugging

### Phase 2 : UI Chat

**Objectif** : Créer l'interface utilisateur pour le chat

**Tâches** :
1. ✅ Créer l'interface de chat de base (input, historique, envoi)
2. ✅ Créer le composant `MarkdownRenderer` pour le formatage élégant
3. ✅ Intégrer le support du streaming des réponses (Server-Sent Events)
4. ✅ Implémenter le formatage élégant des réponses (Markdown, syntax highlighting, tableaux)
5. ✅ Créer la page `/commun/outils/assistant-ia/page.tsx`
6. ✅ Ajouter l'outil dans la liste (`/commun/outils/page.tsx`)
7. ✅ Créer le composant `FloatingAssistant.tsx`
8. ✅ Implémenter le bouton/bulle flottant en bas à droite
9. ✅ Implémenter la fenêtre de chat flottante
10. ✅ Ajouter les animations d'ouverture/fermeture avec `framer-motion`
11. ✅ Intégrer dans le layout principal (`app/layout.tsx`)
12. ✅ Implémenter la persistance de l'état dans localStorage
13. ✅ Adapter le design responsive (mobile-friendly)
14. ✅ Ajouter le support clavier (Escape pour fermer, Enter pour envoyer)
15. ✅ Ajouter les ARIA labels pour l'accessibilité

### Phase 3 : Multimodalité

**Objectif** : Ajouter le support des images et fichiers

**Tâches** :
1. ✅ Créer une zone de collage d'images (drag & drop)
2. ✅ Ajouter un bouton d'upload d'images
3. ✅ Implémenter le collage depuis le presse-papier (Ctrl+V / Cmd+V)
4. ✅ Implémenter la prévisualisation des images avant envoi
5. ✅ Convertir les images en Base64 pour Vision API
6. ✅ Optimiser la résolution des images (max 2048x2048)
7. ✅ Compresser les images (format JPEG, max 5MB)
8. ✅ Utiliser le modèle `gpt-4o` automatiquement si images présentes
9. ✅ Permettre l'envoi de texte avec images dans le même message
10. ✅ Activer automatiquement l'OCR via Vision API pour les images
11. ⏳ Créer une zone de téléversement de fichiers (drag & drop)
12. ⏳ Ajouter un bouton d'upload de fichiers
13. ⏳ Implémenter le support de plusieurs fichiers simultanés
14. ⏳ Implémenter la prévisualisation des fichiers téléversés
15. ⏳ Valider les types de fichiers acceptés (PDF, Word, Excel, images, TXT, etc.)
16. ⏳ Vérifier les types MIME réels (pas seulement l'extension)
17. ⏳ Limiter la taille des fichiers (ex: 10-20 MB par fichier)
18. ⏳ Limiter le nombre de fichiers par message (ex: 5-10 fichiers)
19. ⏳ Upload vers OpenAI File API ou extraction texte côté serveur
20. ⏳ Stocker les fichiers temporairement (Firebase Storage ou système de fichiers)
21. ⏳ Nettoyer les fichiers temporaires après traitement

### Phase 4 : RAG - Base de connaissances (Admin uniquement)

**Objectif** : Implémenter le système RAG pour enrichir les réponses avec du contexte métier

**Tâches** :
1. ✅ Choisir un modèle d'embeddings (OpenAI text-embedding-3-small)
2. ✅ Installer les dépendances nécessaires (OpenAI SDK, pdf-parse)
3. ✅ Créer un script d'indexation pour vectoriser les documents
4. ✅ Implémenter le chunking des documents (découpage en morceaux pertinents)
5. ✅ Générer les embeddings pour chaque chunk
6. ✅ Stocker les embeddings dans Firestore
7. ✅ Choisir la solution de stockage (Firestore)
8. ✅ Configurer la base vectorielle
9. ✅ Créer les collections nécessaires (`rag_chunks`, `rag_documents`)
10. ✅ Implémenter l'insertion des vecteurs avec métadonnées
11. ✅ Implémenter la recherche par similarité (similarité cosinus)
12. ✅ Implémenter la fonction de recherche par similarité
13. ✅ Convertir les requêtes utilisateur en embeddings
14. ✅ Rechercher les chunks les plus pertinents (top-k)
15. ✅ Calculer les scores de similarité
16. ✅ Construire le contexte à partir des chunks récupérés
17. ✅ Limiter la taille du contexte (respecter les limites de tokens)
18. ✅ Formater le contexte pour l'injection dans le prompt
19. ✅ Ajouter les sources/citations pour traçabilité
20. ✅ Créer la route API `/api/assistant/rag/upload` (admin uniquement)
21. ✅ Vérifier le rôle `ADMINISTRATEUR` avec `verifyAdmin()` avant traitement
22. ✅ Interface admin pour uploader des PDF dans la base RAG
23. ✅ Validation et traitement des PDF uploadés
24. ✅ Extraction du texte depuis les PDF
25. ✅ Génération automatique des embeddings et indexation
26. ✅ Interface pour visualiser/gérer les documents indexés
27. ✅ Possibilité de supprimer des documents de la base
28. ✅ Route API `/api/assistant/rag/documents` pour gérer les documents (GET/DELETE)
29. ✅ Créer la route API `/api/assistant/rag` avec vérification du rôle admin
30. ✅ Intégrer la recherche vectorielle avant l'appel OpenAI
31. ✅ Construire le prompt avec le contexte récupéré
32. ✅ Appeler l'API OpenAI avec le prompt enrichi
33. ✅ Retourner la réponse avec les sources utilisées
34. ✅ Retourner les scores de similarité avec les sources
35. ✅ Toggle "Mode RAG" dans la page Outils (visible uniquement pour les admins)
36. ✅ Affichage des sources utilisées dans les réponses RAG
37. ✅ Affichage des scores de confiance
38. ✅ Créer des liens vers les documents sources
39. ✅ Indicateur visuel quand le mode RAG est actif
40. ✅ Mode debug pour voir le contexte utilisé
41. ✅ Créer un prompt système pour le chatbot RAG
42. ✅ Définir les instructions pour utiliser le contexte récupéré
43. ✅ Ajouter des instructions pour citer les sources
44. ✅ Gérer les cas où aucune information pertinente n'est trouvée
45. ✅ Vérification du rôle `ADMINISTRATEUR` pour toutes les fonctionnalités RAG
46. ✅ Route API `/api/assistant/rag` : vérifie `verifyAdmin()` avant traitement
47. ✅ Route API `/api/assistant/rag/upload` : admin uniquement
48. ✅ Route API `/api/assistant/rag/documents` : admin uniquement
49. ✅ Interface UI : masquer les options RAG pour les non-admins
50. ✅ Messages d'erreur clairs si un non-admin tente d'accéder au RAG
51. ✅ Gérer les erreurs de recherche vectorielle
52. ✅ Gérer les cas où aucun résultat n'est trouvé
53. ✅ Logger les requêtes et résultats pour amélioration
54. ✅ Indicateur de recherche en cours
55. ✅ Affichage du nombre de sources trouvées
56. ✅ Option pour forcer une nouvelle recherche (recherche à chaque message)

### Phase 5 : Templates & Historique

**Objectif** : Ajouter l'historique des conversations et les templates de prompts

**Tâches** :
1. ⏳ Créer la collection Firestore `assistant_conversations`
2. ⏳ Définir la structure de stockage (userId, title, messages, files, createdAt, updatedAt, tags)
3. ⏳ Implémenter la sauvegarde des conversations dans Firestore
4. ⏳ Créer l'interface de recherche dans l'historique
5. ⏳ Implémenter les filtres par date, utilisateur, tags
6. ⏳ Implémenter la reprise d'une conversation existante
7. ⏳ Générer automatiquement un titre pour chaque conversation
8. ⏳ Créer une bibliothèque de prompts pour l'agence
9. ⏳ Créer les templates de base :
   - "Rédiger un email de relance client"
   - "Analyser un contrat d'assurance et extraire les points clés"
   - "Générer un devis personnalisé basé sur les besoins"
   - "Résumer une conversation téléphonique avec un client"
   - "Comparer deux offres d'assurance"
10. ⏳ Créer l'interface pour sélectionner/appliquer un template
11. ⏳ Implémenter la prévisualisation du template
12. ⏳ Permettre les variables personnalisables (ex: nom client, type de contrat)
13. ⏳ Stocker les templates dans Firestore ou fichier de configuration
14. ⏳ Permettre aux utilisateurs de créer leurs propres templates
15. ⏳ Implémenter l'export PDF des conversations
16. ⏳ Implémenter l'export Word (.docx) pour édition
17. ⏳ Implémenter l'export texte (.txt)
18. ⏳ Générer un lien de partage (si stockage activé)
19. ⏳ Permettre le partage interne uniquement (utilisateurs de l'app)
20. ⏳ Ajouter l'option de partage en lecture seule
21. ⏳ Implémenter la copie rapide du texte de la conversation
22. ⏳ Détecter automatiquement les documents volumineux
23. ⏳ Proposer un résumé structuré (points clés, conclusions)
24. ⏳ Conserver les références aux sections originales
25. ⏳ Implémenter la comparaison de deux documents
26. ⏳ Implémenter l'analyse de données Excel/CSV

### Phase 6 : Optimisations

**Objectif** : Optimiser les performances, la sécurité et l'expérience utilisateur

**Tâches** :
1. ✅ Implémenter la gestion complète des erreurs API OpenAI spécifiques
2. ✅ Implémenter le retry automatique avec backoff exponentiel
3. ✅ Créer des messages d'erreur clairs et actionnables pour l'utilisateur
4. ✅ Implémenter les timeouts (60s requêtes normales, 120s fichiers)
5. ⏳ Gérer spécialement les fichiers volumineux
6. ⏳ Ajouter un indicateur de progression pour les requêtes longues
7. ⏳ Implémenter la limitation du nombre de requêtes par utilisateur/jour
8. ⏳ Gérer spécialement les fichiers/images (plus coûteux)
9. ⏳ Afficher les limites restantes à l'utilisateur
10. ⏳ Créer une interface pour visualiser l'utilisation
11. ⏳ Tracer l'utilisation pour monitoring
12. ⏳ Suivre les coûts (tokens utilisés, coûts par requête)
13. ⏳ Créer des analytics par fonctionnalité
14. ⏳ Implémenter les alertes budget :
    - Avertissement à 80% du budget mensuel
    - Alerte critique à 95% du budget mensuel
    - Blocage à 100% du budget mensuel (optionnel)
15. ⏳ Logger chaque requête dans Firestore (collection `assistant_usage_logs`)
16. ⏳ Calculer les coûts en temps réel (selon pricing OpenAI)
17. ⏳ Stocker les métriques agrégées (par jour/semaine/mois)
18. ⏳ Créer un dashboard de monitoring (optionnel) : `/admin/assistant-monitoring`
19. ⏳ Optimiser le streaming
20. ⏳ Implémenter le cache des réponses fréquentes (si pertinent)
21. ⏳ Implémenter la troncature intelligente de l'historique :
    - Garder les N derniers messages (ex: 10-20)
    - Résumer les anciens messages si conversation très longue
    - Utiliser un modèle plus petit pour le résumé (ex: gpt-3.5-turbo)
22. ⏳ Optimiser la compression des images :
    - Réduire la résolution avant envoi (max 2048x2048)
    - Optimiser le format (WebP si possible)
    - Limiter la taille (ex: max 5MB par image)
23. ⏳ Ajouter des suggestions de réponses rapides
24. ⏳ Implémenter les raccourcis clavier
25. ⏳ Ajouter un indicateur de progression pour les uploads
26. ⏳ Ajouter des notifications (si conversations sauvegardées)
27. ⏳ Améliorer l'accessibilité globale
28. ⏳ Créer la collection Firestore `assistant_audit_logs`
29. ⏳ Logger toutes les actions (création conversation, envoi message, upload fichier)
30. ⏳ Stocker userId, timestamp, action, métadonnées (sans contenu sensible)
31. ⏳ Implémenter la validation renforcée des fichiers :
    - Scanner les fichiers pour détecter les malwares (si service disponible)
    - Vérifier la signature MIME réelle (pas seulement l'extension)
    - Limiter strictement les types de fichiers acceptés
    - Quarantaine temporaire pour fichiers suspects

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

## 🧪 Tests et validation

### Tests unitaires

**Objectifs** :
- Tester les fonctions utilitaires (formatage, validation, parsing)
- Tester la gestion des erreurs
- Tester la troncature de l'historique
- Tester la conversion des fichiers/images
- Tester la génération d'embeddings
- Tester la recherche par similarité
- Tester la construction du contexte
- Tester le formatage des prompts

**Outils** : Jest, Vitest, ou framework de test Next.js

### Tests d'intégration

**Objectifs** :
- Tester la route API `/api/assistant/chat` avec différents scénarios
- Tester la route API `/api/assistant/rag` avec différents scénarios
- Tester l'authentification et l'autorisation
- Tester le streaming des réponses
- Tester l'upload de fichiers et images
- Tester la gestion des erreurs API OpenAI
- Tester le flux complet : requête → recherche → réponse
- Tester avec différents types de questions
- Tester les cas limites (aucun résultat, résultats multiples)
- Tester les performances (latence)

**Outils** : Tests API avec `supertest` ou tests E2E

### Tests E2E (End-to-End)

**Objectifs** :
- Tester le flux complet : envoi message → réception réponse
- Tester l'upload de fichiers → analyse → réponse
- Tester l'upload d'images → OCR → réponse
- Tester le streaming en temps réel
- Tester le formatage Markdown des réponses
- Tester la gestion des erreurs côté UI
- Tester avec des utilisateurs réels
- Collecter les retours sur la pertinence
- Ajuster selon les retours

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
2. ✅ **Streaming** : Vérifier que le streaming fonctionne correctement
3. ✅ **Images** : Upload image → OCR → réponse avec analyse
4. ⏳ **Fichiers** : Upload PDF → analyse → réponse
5. ✅ **Erreurs** : Tester tous les types d'erreurs (rate limit, quota, etc.)
6. ✅ **Formatage** : Vérifier le rendu Markdown (tableaux, code, etc.)
7. ⏳ **Historique** : Tester la gestion de l'historique long
8. ✅ **Authentification** : Tester l'accès non autorisé
9. ✅ **RAG** : Tester le mode RAG avec recherche vectorielle

---

*Dernière mise à jour : 27/10/2025*
