# Fonctionnalités du Bot IA - Documentation Complète

*Dernière mise à jour : 2025*

---

## Table des matières

1. [Introduction](#introduction)
2. [Accès au Bot IA](#accès-au-bot-ia)
3. [Fonctionnalités communes (Tous les utilisateurs)](#fonctionnalités-communes-tous-les-utilisateurs)
4. [Fonctionnalités Administrateur](#fonctionnalités-administrateur)
5. [Détails techniques](#détails-techniques)
6. [Limitations connues](#limitations-connues)
7. [Vision et fonctionnalités potentielles](#vision-et-fonctionnalités-potentielles)

---

## Introduction

### Vue d'ensemble

Le Bot IA est un assistant intelligent intégré à l'application Allianz qui utilise l'API OpenAI pour fournir des réponses contextuelles et des analyses de documents. Il est accessible à tous les utilisateurs connectés et offre des fonctionnalités avancées pour les administrateurs.

### Architecture

Le bot fonctionne selon une architecture client-serveur :

```
Interface utilisateur (React/Next.js)
    ↓
Routes API Next.js (/api/assistant/*)
    ↓
OpenAI API (GPT-4o)
    ↓
Réponses multimodales (texte, images, fichiers)
```

### Deux modes d'accès

1. **Page dédiée** : `/commun/outils/assistant-ia`
   - Interface complète avec toutes les fonctionnalités
   - Historique des conversations
   - Gestion des templates
   - Mode RAG (admin uniquement)

2. **Bot flottant** : Accessible depuis toutes les pages
   - Bouton flottant en bas à droite
   - Chat rapide sans RAG
   - Interface minimale et rapide

---

## Accès au Bot IA

### Pour tous les utilisateurs

- **Page dédiée** : Menu "Outils" → "Assistant IA"
- **Bot flottant** : Bouton rond avec icône robot en bas à droite de toutes les pages

### Authentification requise

- Connexion Firebase obligatoire
- Rôle utilisateur standard : accès aux fonctionnalités de base
- Rôle administrateur : accès complet incluant RAG et gestion de la base de connaissances

---

## Fonctionnalités communes (Tous les utilisateurs)

### 1. Chat standard avec OpenAI

**Description** : Conversation textuelle avec l'assistant IA utilisant le modèle GPT-4o d'OpenAI.

**Comment l'utiliser** :
- Taper votre message dans la zone de texte
- Appuyer sur Entrée ou cliquer sur le bouton d'envoi
- Les réponses s'affichent en temps réel (streaming)

**Fonctionnalités** :
- Streaming des réponses (affichage progressif)
- Formatage Markdown élégant (tableaux, code, listes)
- Historique de conversation dans la session
- Support du contexte conversationnel

**Limitations** :
- Maximum 2000 tokens par réponse
- Timeout de 60 secondes par requête
- Rate limiting selon le type de requête (voir section technique)

---

### 2. Support des images

**Description** : Upload et analyse d'images avec OCR automatique via l'API Vision d'OpenAI.

**Comment l'utiliser** :
1. **Upload direct** : Cliquer sur le bouton "Image" et sélectionner une image
2. **Drag & Drop** : Glisser-déposer une image dans la zone de chat
3. **Collage** : Copier une image (Ctrl+C / Cmd+C) et coller dans le chat (Ctrl+V / Cmd+V)

**Types d'images acceptés** :
- JPEG, PNG, GIF, WebP
- Taille maximale : 20 MB par image
- Résolution optimisée automatiquement (max 2048x2048)

**Fonctionnalités** :
- OCR automatique (extraction de texte depuis les images)
- Analyse du contenu visuel
- Support de plusieurs images par message
- Prévisualisation avant envoi

**Exemples d'utilisation** :
- Scanner un document et demander une analyse
- Prendre une photo d'un contrat et poser des questions
- Analyser un graphique ou un tableau

---

### 3. Support des fichiers

**Description** : Upload et analyse de fichiers (PDF, Word, Excel, TXT, CSV) avec extraction automatique du texte.

**Comment l'utiliser** :
1. Cliquer sur le bouton "Fichier"
2. Sélectionner un ou plusieurs fichiers
3. Le texte est automatiquement extrait et ajouté au message

**Types de fichiers acceptés** :
- **PDF** (.pdf) - Extraction de texte complète
- **Word** (.docx) - ⚠️ À venir (pas encore implémenté)
- **Excel** (.xlsx) - ⚠️ À venir (pas encore implémenté)
- **Texte** (.txt, .csv) - Lecture directe

**Limitations** :
- Taille maximale : 20 MB par fichier
- Maximum 10 fichiers par message
- Les anciens formats (.doc, .xls) ne sont pas supportés

**Fonctionnalités** :
- Extraction automatique du texte
- Validation du type MIME réel (sécurité)
- Gestion des erreurs avec messages clairs
- Prévisualisation des fichiers avant envoi

**Note importante** : 
- ✅ Les PDF sont maintenant correctement traités. Le texte est extrait côté serveur via l'API `/api/assistant/files/extract`.

---

### 4. Streaming des réponses

**Description** : Affichage progressif des réponses en temps réel pour une meilleure expérience utilisateur.

**Fonctionnement** :
- Les réponses arrivent par chunks via Server-Sent Events (SSE)
- Affichage progressif au fur et à mesure de la génération
- Indicateur de chargement pendant la génération

**Avantages** :
- Réactivité perçue améliorée
- Pas d'attente de la réponse complète
- Expérience plus fluide

---

### 5. Formatage Markdown

**Description** : Rendu élégant des réponses avec support complet du Markdown.

**Éléments supportés** :
- **Texte** : Gras, italique, souligné
- **Listes** : Ordonnées et non ordonnées
- **Tableaux** : Formatage automatique
- **Code** : Blocs de code avec syntax highlighting
- **Liens** : Liens cliquables
- **Citations** : Blocs de citation

**Exemple** :
```markdown
# Titre
**Texte en gras** et *texte en italique*

- Liste à puces
- Élément 2

| Colonne 1 | Colonne 2 |
|-----------|-----------|
| Donnée 1  | Donnée 2  |
```

---

### 6. Historique des conversations

**Description** : Sauvegarde et gestion de vos conversations passées.

**Fonctionnalités** :
- **Sauvegarder** : Bouton "Sauvegarder" pour enregistrer la conversation actuelle
- **Charger** : Reprendre une conversation sauvegardée
- **Rechercher** : Recherche par titre ou contenu
- **Filtrer** : Par date (aujourd'hui, cette semaine, ce mois)
- **Supprimer** : Supprimer une conversation sauvegardée
- **Exporter** : Export en TXT, PDF ou Word

**Stockage** :
- Conversations stockées dans Firestore
- Accessibles uniquement par l'utilisateur qui les a créées
- Titre généré automatiquement à partir du premier message

**Limitations** :
- Historique limité à la session en cours (non sauvegardé automatiquement)
- Sauvegarde manuelle requise pour conserver les conversations

---

### 7. Templates de prompts

**Description** : Bibliothèque de prompts pré-configurés pour les cas d'usage courants.

**Fonctionnalités** :
- **Sélection** : Choisir un template depuis la bibliothèque
- **Variables** : Remplir les variables personnalisables (ex: nom client, type de contrat)
- **Application** : Appliquer le template directement dans le chat

**Templates disponibles** :
- Rédaction d'emails professionnels
- Analyse de contrats
- Génération de devis
- Résumé de conversations
- Comparaison d'offres

**Utilisation** :
1. Cliquer sur le bouton "Templates"
2. Sélectionner un template
3. Remplir les variables si nécessaire
4. Le prompt est automatiquement inséré dans le champ de saisie

---

### 8. Export de conversations

**Description** : Export de vos conversations dans différents formats.

**Formats disponibles** :
- **TXT** : Fichier texte simple
- **PDF** : Document PDF formaté
- **Word** : Document .docx éditable

**Comment exporter** :
1. Ouvrir une conversation sauvegardée
2. Cliquer sur "Exporter"
3. Choisir le format souhaité
4. Le fichier est téléchargé automatiquement

---

## Fonctionnalités Administrateur

Les fonctionnalités suivantes sont **uniquement accessibles aux utilisateurs avec le rôle ADMINISTRATEUR**.

### 1. Mode RAG (Retrieval-Augmented Generation)

**Description** : Mode avancé qui enrichit les réponses avec du contexte métier récupéré depuis une base de connaissances vectorielle.

**Comment l'activer** :
1. Aller sur la page `/commun/outils/assistant-ia`
2. Activer le toggle "Mode RAG" en haut à droite
3. Le mode RAG est maintenant actif pour toutes vos questions

**Fonctionnement** :
```
Question utilisateur
    ↓
Génération d'embedding de la question
    ↓
Recherche vectorielle dans la base de connaissances
    ↓
Récupération des chunks pertinents (top 5, score > 0.7)
    ↓
Construction du contexte enrichi
    ↓
Génération de réponse avec OpenAI + contexte
    ↓
Réponse avec sources citées
```

**Avantages** :
- Réponses plus précises basées sur votre documentation métier
- Citations des sources utilisées
- Scores de confiance pour chaque source
- Contexte spécifique à votre agence

**Sources affichées** :
- Titre du document source
- Score de similarité (pourcentage)
- Lien cliquable vers le document dans la base de connaissances

**Limitations** :
- Nécessite d'avoir indexé des documents dans la base de connaissances
- Recherche uniquement dans les documents indexés
- Si aucun document pertinent n'est trouvé, le bot utilise ses connaissances générales

---

### 2. Mode Debug

**Description** : Mode de débogage qui affiche le contexte utilisé pour générer les réponses RAG.

**Comment l'activer** :
1. Activer le mode RAG
2. Activer le toggle "Debug" à côté du toggle RAG
3. Les réponses afficheront une section "Contexte utilisé (Debug)"

**Fonctionnalités** :
- Affichage du contexte textuel récupéré depuis la base de connaissances
- Visualisation des chunks utilisés
- Aide au débogage des réponses RAG

**Utilisation** :
- Utile pour comprendre pourquoi une réponse a été générée
- Permet de vérifier la pertinence du contexte récupéré
- Aide à améliorer la base de connaissances

**Note** : Le mode Debug n'est disponible que lorsque le mode RAG est activé.

---

### 3. Gestion de la base de connaissances

**Description** : Interface pour gérer les documents indexés dans la base de connaissances RAG.

**Accès** : Onglet "Base de connaissances" dans la page Assistant IA

**Fonctionnalités** :

#### 3.1. Upload de documents PDF

**Comment uploader** :
1. Aller dans l'onglet "Base de connaissances"
2. Cliquer sur "Choisir un fichier PDF"
3. Sélectionner un fichier PDF (max 20 MB)
4. Le document est automatiquement indexé

**Processus d'indexation** :
1. Upload du PDF
2. Extraction du texte complet
3. Découpage en chunks de 500 tokens (avec overlap de 50 tokens)
4. Génération d'embeddings pour chaque chunk (1536 dimensions)
5. Stockage dans Firestore (collections `rag_chunks` et `rag_documents`)

**Informations affichées** :
- Titre du document
- Type de document
- Nombre de chunks créés
- Date d'indexation

**Limitations** :
- Uniquement les fichiers PDF
- Taille maximale : 20 MB
- Un seul fichier à la fois

#### 3.2. Liste des documents indexés

**Affichage** :
- Liste de tous les documents indexés
- Informations : titre, type, nombre de chunks, date
- Bouton de suppression pour chaque document

**Fonctionnalités** :
- Visualisation de tous les documents
- Suppression de documents obsolètes
- Navigation vers un document depuis les sources d'une réponse

#### 3.3. Suppression de documents

**Comment supprimer** :
1. Trouver le document dans la liste
2. Cliquer sur l'icône poubelle
3. Confirmer la suppression

**Effets** :
- Suppression du document et de tous ses chunks
- Les réponses futures ne pourront plus utiliser ce document
- Action irréversible

---

### 4. Visualisation des sources

**Description** : Affichage des sources utilisées dans les réponses RAG avec scores de confiance.

**Fonctionnalités** :
- **Liste des sources** : Titre de chaque document utilisé
- **Score de similarité** : Pourcentage de pertinence (0-100%)
- **Barre de progression** : Visualisation graphique du score
- **Lien cliquable** : Navigation vers le document dans la base de connaissances

**Affichage** :
- Section dédiée sous chaque réponse RAG
- Sources triées par score décroissant
- Mise en évidence visuelle (couleur orange)

**Exemple** :
```
Sources utilisées :
📄 Guide des procédures d'assurance    85% [████████████████]
📄 Contrat type Allianz                72% [████████████]
```

---

## Détails techniques

### 1. Rate Limiting

**Description** : Système de limitation du nombre de requêtes par utilisateur pour contrôler les coûts.

**Limites par défaut** :
- **Requêtes texte** : 100 par jour
- **Requêtes avec images** : 50 par jour (plus coûteuses)
- **Requêtes avec fichiers** : 20 par jour (encore plus coûteuses)

**Fonctionnement** :
- Compteur par type de requête et par utilisateur
- Réinitialisation quotidienne (minuit UTC)
- Blocage automatique si limite atteinte

**Messages d'erreur** :
- Affichage du nombre de requêtes restantes
- Date et heure de réinitialisation
- Type de requête concerné

**Gestion** :
- Les limites sont stockées dans Firestore (`assistant_rate_limits`)
- Document par utilisateur, type et jour
- Incrémentation automatique à chaque requête

---

### 2. Budget et Monitoring

**Description** : Système de suivi et d'alertes pour le budget mensuel de l'API OpenAI.

**Configuration par défaut** :
- Budget mensuel : 100 USD
- Seuil d'avertissement : 80% (80 USD)
- Seuil critique : 95% (95 USD)
- Blocage à 100% : Activé

**Fonctionnalités** :
- Calcul automatique des coûts par requête
- Suivi mensuel des dépenses
- Alertes automatiques aux administrateurs
- Blocage des requêtes si budget dépassé

**Monitoring** :
- Logs de toutes les requêtes dans Firestore (`assistant_usage_logs`)
- Métriques : tokens input/output, coûts, durée, succès/échec
- Dashboard de monitoring (à venir)

**Coûts estimés** (selon modèle OpenAI) :
- GPT-4o : ~$0.005 par 1K tokens input, ~$0.015 par 1K tokens output
- Images : Coût supplémentaire selon la résolution
- Fichiers : Coût selon la taille du texte extrait

---

### 3. Sécurité et Authentification

**Authentification** :
- Firebase Auth obligatoire
- Vérification du token JWT côté serveur
- Vérification du rôle pour les fonctionnalités admin

**Sécurité des fichiers** :
- Validation du type MIME réel (pas seulement l'extension)
- Vérification des signatures de fichier (magic bytes)
- Quarantaine des fichiers suspects
- Limitation de la taille (20 MB max)
- Types de fichiers autorisés strictement limités

**Clé API OpenAI** :
- Stockée uniquement côté serveur (variable d'environnement)
- Jamais exposée au client
- Vérification de présence avant chaque requête

**Audit** :
- Logs de toutes les actions dans Firestore (`assistant_audit_logs`)
- Informations : userId, timestamp, action, métadonnées
- Pas de stockage de contenu sensible

---

### 4. Gestion des erreurs

**Types d'erreurs gérées** :

1. **Erreurs d'authentification** (401)
   - Token invalide ou expiré
   - Message : "Erreur d'authentification"

2. **Erreurs de rate limiting** (429)
   - Limite de requêtes atteinte
   - Message avec nombre restant et date de réinitialisation

3. **Erreurs de budget** (429)
   - Budget mensuel dépassé
   - Message : "Budget mensuel dépassé"

4. **Erreurs OpenAI API** (429, 401, 400)
   - Rate limit OpenAI
   - Clé API invalide
   - Contexte trop long (limite de tokens)

5. **Erreurs de timeout** (408)
   - Requête trop longue (> 60 secondes)
   - Message : "La requête a pris trop de temps"

6. **Erreurs de traitement de fichiers**
   - Fichier invalide ou non supporté
   - Erreur d'extraction de texte
   - Message d'erreur spécifique affiché

**Retry automatique** :
- 3 tentatives avec backoff exponentiel
- Délai initial : 1 seconde
- Délai maximum : 8 secondes

**Messages utilisateur** :
- Messages clairs et actionnables
- Pas de détails techniques exposés
- Suggestions de solutions

---

## Limitations connues

### 1. Formats de fichiers non supportés

**Formats non supportés** :
- Word (.docx) - Extraction de texte à venir
- Excel (.xlsx) - Extraction de texte à venir
- Anciens formats (.doc, .xls) - Non supportés

**Solution** : Convertir en PDF ou TXT en attendant

---

### 3. Taille des conversations

**Limitation** :
- Historique de conversation limité par les tokens
- Si conversation trop longue, erreur "Contexte trop long"

**Solution** :
- Créer une nouvelle conversation
- Sauvegarder et reprendre plus tard
- Troncature automatique à venir

---

### 4. Latence

**Facteurs** :
- Requêtes avec images : plus lentes (OCR)
- Requêtes avec fichiers : plus lentes (extraction)
- Mode RAG : plus lent (recherche vectorielle + génération)

**Temps moyens** :
- Chat texte : 2-5 secondes
- Chat avec images : 5-10 secondes
- Chat avec fichiers : 10-20 secondes
- Mode RAG : 5-15 secondes

---

## Vision et fonctionnalités potentielles

Cette section présente une cartographie complète des fonctionnalités potentielles pour transformer le bot IA en **collaborateur numérique transversal** pour l'agence Allianz, au-delà d'un simple chat.

### 1. Bot = Assistant métier assurance (cœur de valeur)

#### 1.1. Aide à la découverte client (particulier / pro / entreprise)

**Fonctionnalités envisagées** :
- Questionnement structuré type **trame d'entretien**
- Détection automatique des **manques de couverture**
- Priorisation des besoins (essentiels / opportunités)
- Reformulation client-friendly des risques

**Cas d'usage concrets** :
- « Analyse ce client particulier » → checklist GAV / PJ / Prévoyance / Épargne
- « Découverte pro » → RC, IRD, PJ, Santé, Prévoyance dirigeant

**Connexions nécessaires** :
- Base de connaissances Allianz (PDF, offres, conditions)
- OCR de fiche Lagon ou documents clients

#### 1.2. Génération de synthèses commerciales

**Fonctionnalités envisagées** :
- Synthèse après rendez-vous
- Compte rendu prêt à envoyer par mail
- Tableau "Ce que vous avez / Ce qu'il manque / Nos recommandations"

**Cas d'usage concrets** :
- Sortie copiable dans un mail
- Export PDF client
- Version interne (CDC) vs version client

**Connexions nécessaires** :
- Google Docs / Drive
- Génération PDF
- Gmail (brouillon automatique)

#### 1.3. Aide à la vente et à l'argumentation

**Fonctionnalités envisagées** :
- Arguments par contrat (auto, MRH, santé, prévoyance, PER)
- Gestion des objections ("c'est trop cher", "j'ai déjà")
- Comparaisons simples (sans dénigrement)

**Cas d'usage concrets** :
- Le CDC tape : « objection prix santé senior »
- Le bot répond avec 3 angles possibles

---

### 2. Bot = Copilote des process internes

#### 2.1. Pilotage M+3 / Prétermes

**Fonctionnalités envisagées** :
- Check-list dynamique M+3
- Rappels automatiques
- Analyse qualitative du portefeuille
- Validation rouge/vert

**Cas d'usage concrets** :
- Upload capture Lagon → OCR → analyse
- Le bot dit : "M+3 incomplet, PJ manquante"

**Connexions nécessaires** :
- OCR (PDF / image)
- localStorage / DB
- Slack (alertes)

#### 2.2. Gestion des leads (Allianz + agence)

**Fonctionnalités envisagées** :
- Qualification automatique du lead
- Proposition de script d'appel
- Priorisation (chaud / tiède / froid)
- Suivi conversion

**Cas d'usage concrets** :
- Lead reçu → bot propose script + next action
- Après appel → bot rédige le compte rendu

**Connexions nécessaires** :
- Lagon (via export / OCR)
- Google Sheets / DB
- Slack / notifications

#### 2.3. Suivi qualité & performance

**Fonctionnalités envisagées** :
- Analyse des volumes (leads, AN, process)
- Lien quantité ↔ qualité
- Alertes sur dérives (trop d'AN sans M+3)

**Cas d'usage concrets** :
- "Tu as fait 12 AN mais seulement 5 process ce mois-ci"

**Connexions nécessaires** :
- Tableurs
- DB interne
- Slack (report hebdo)

---

### 3. Bot = Hub documentaire intelligent

#### 3.1. Recherche intelligente dans vos documents

**Fonctionnalités envisagées** :
- Recherche sémantique dans PDF Allianz
- Questions/réponses sur conditions générales
- Résumés ciblés

**Cas d'usage concrets** :
- "Que dit le contrat X sur l'ITT ?"
- "Résumé du PER pour un client TNS"

**Connexions nécessaires** :
- Vector DB (Qdrant / Supabase / Weaviate) - ✅ Déjà implémenté avec Firestore
- Upload PDF - ✅ Déjà implémenté
- OCR - ✅ Déjà implémenté

#### 3.2. Génération de documents

**Fonctionnalités envisagées** :
- DER (Déclaration d'Événement Responsable)
- Courriers clients
- Notes internes
- Argumentaires

**Cas d'usage concrets** :
- "Génère un DER particulier à partir de cette fiche"

**Connexions nécessaires** :
- Yousign
- Google Docs / PDF
- Email

---

### 4. Bot = Orchestrateur d'outils (connecteurs & MCP)

#### 4.1. Slack (incontournable)

**Fonctionnalités envisagées** :
- Alertes automatiques
- Résumés quotidiens
- Questions au bot directement dans Slack

**Exemples** :
- Nouveau lead → message Slack
- Process en retard → ping

#### 4.2. Google Workspace

**Fonctionnalités envisagées** :
- Création de brouillons Gmail
- Docs partagés
- Tableaux de suivi

#### 4.3. Trello / Notion / Kanban

**Fonctionnalités envisagées** :
- Création de cartes automatiques
- Mise à jour d'états
- Liens client ↔ tâches

#### 4.4. Services externes data & conformité

**Fonctionnalités envisagées** :
- Bénéficiaires effectifs (Pappers) - ✅ Déjà implémenté
- Vérification entreprise - ✅ Déjà implémenté
- Pré-remplissage BE

**Connexions nécessaires** :
- API Pappers - ✅ Déjà implémenté
- INSEE / Sirene
- OCR documents légaux

---

### 5. Bot = Coach de l'équipe

#### 5.1. Formation continue

**Fonctionnalités envisagées** :
- Quiz internes
- Cas clients simulés
- Mise à jour réglementaire expliquée

**Cas d'usage concrets** :
- "Explique la prévoyance TNS à un débutant"
- "Quiz santé collective"

#### 5.2. Support CDC en temps réel

**Fonctionnalités envisagées** :
- "Que dois-je proposer dans ce cas ?"
- Aide pendant l'appel
- Résumé post-appel

---

### 6. Bot = Cerveau stratégique de l'agence

#### 6.1. Analyse portefeuille

**Fonctionnalités envisagées** :
- Détection du potentiel dormant
- Multi-équipement manquant
- Score client

#### 6.2. Aide à la décision

**Fonctionnalités envisagées** :
- ROI leads
- Scénarios commerciaux
- Simulations (comme l'outil leads existant)

---

### 7. Architecture type (simple et réaliste)

**Stack technique envisagée** :
- Front : Next.js (chat + modules) - ✅ Déjà en place
- IA : OpenAI / Mistral - ✅ OpenAI déjà implémenté
- RAG : Qdrant / Supabase - ✅ Firestore déjà implémenté
- OCR : pdf.js / Tesseract / API externe - ✅ pdf-parse déjà implémenté
- Automations : MCP / Webhooks
- Intégrations : Slack, Google, Yousign, Pappers - ✅ Pappers déjà implémenté

---

### 8. Vision finale

Le bot peut devenir :

- 🧠 **Le cerveau métier de l'agence**
- 🤝 **Le support quotidien des CDC**
- 🛠 **Le chef d'orchestre des outils**
- 📊 **Le gardien de la qualité et de la conformité**

---

### Prochaine étape logique

**Audit du quotidien** :
1. Ce que vous faites tous les jours
2. Ce qui fait perdre du temps
3. Ce qui crée de la valeur
4. Ce qui peut être automatisé par le bot

**Transformation en roadmap fonctionnelle priorisée** :
- Identifier les fonctionnalités à fort impact
- Prioriser selon la valeur métier
- Planifier l'implémentation par phases

---

## Conclusion

Le Bot IA offre une expérience complète et professionnelle pour tous les utilisateurs, avec des fonctionnalités avancées pour les administrateurs. Les fonctionnalités sont en constante évolution et des améliorations sont régulièrement apportées.

La vision présentée ci-dessus montre le potentiel de transformation du bot en **collaborateur numérique transversal** pour l'agence, au-delà d'un simple outil de chat.

Pour toute question ou problème, contactez l'équipe de développement.

---

*Document généré automatiquement - Dernière mise à jour : 2025*

