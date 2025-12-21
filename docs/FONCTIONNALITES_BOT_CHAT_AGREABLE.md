# Analyse des fonctionnalités pour un bot de chat agréable et efficace

## Table des matières

1. [Introduction](#introduction)
2. [Fonctionnalités de base (essentielles)](#fonctionnalités-de-base-essentielles)
3. [Gestion des conversations](#gestion-des-conversations)
4. [Interactions avec le contenu](#interactions-avec-le-contenu)
5. [Gestion des fichiers et médias](#gestion-des-fichiers-et-médias)
6. [Amélioration de l'UX](#amélioration-de-lux)
7. [Fonctionnalités avancées](#fonctionnalités-avancées)
8. [Accessibilité et ergonomie](#accessibilité-et-ergonomie)
9. [Fonctionnalités existantes dans notre bot](#fonctionnalités-existantes-dans-notre-bot)
10. [Recommandations par priorité](#recommandations-par-priorité)
11. [Notes de mise en œuvre](#notes-de-mise-en-œuvre)
12. [Contraintes techniques détaillées](#contraintes-techniques-détaillées)
13. [Contraintes techniques pour l'amélioration de l'UI](#contraintes-techniques-pour-lamélioration-de-lui)

---

## Introduction

### Contexte
Ce document analyse toutes les fonctionnalités qui rendent un bot de chat agréable, efficace et professionnel. L'objectif est d'améliorer l'expérience utilisateur de l'assistant IA pour l'agence Allianz en identifiant les fonctionnalités essentielles, importantes et "nice-to-have".

### Objectif
Créer une référence complète pour guider le développement et l'amélioration continue de l'interface de chat, en se basant sur les meilleures pratiques UX et les besoins réels des utilisateurs.

---

## Fonctionnalités de base (essentielles)

### 1. Chat sélectionné automatiquement au chargement
**Description** : Lors de l'ouverture de l'interface, le chat doit être automatiquement sélectionné/focus pour permettre une saisie immédiate.

**Avantages** :
- Gain de temps pour l'utilisateur
- Interaction fluide sans clics supplémentaires
- Meilleure expérience utilisateur

**Implémentation** : Focus automatique sur le Textarea au chargement du composant.

**Status** : ✅ Implémenté (textarea focus au chargement)

---

### 2. Historique des conversations
**Description** : Système permettant de sauvegarder, charger et gérer plusieurs conversations.

**Fonctionnalités attendues** :
- Liste des conversations sauvegardées
- Titre automatique ou personnalisé pour chaque conversation
- Date de dernière modification
- Nombre de messages par conversation
- Prévisualisation rapide

**Status** : ✅ Implémenté (historique complet avec sauvegarde/chargement)

---

### 3. Interface claire et intuitive
**Description** : Interface utilisateur épurée, moderne et facile à comprendre.

**Caractéristiques** :
- Design cohérent et professionnel
- Hiérarchie visuelle claire
- Feedback visuel immédiat
- Messages bien différenciés (utilisateur vs assistant)

**Status** : ✅ Implémenté (interface moderne avec Tailwind CSS)

---

## Gestion des conversations

### 1. Nouveau chat (bouton/commande)
**Description** : Permettre de démarrer une nouvelle conversation facilement.

**Fonctionnalités attendues** :
- Bouton "Nouveau chat" visible et accessible
- Confirmation si conversation non sauvegardée
- Option de sauvegarder avant de créer un nouveau chat
- Raccourci clavier (ex: Cmd/Ctrl + N)

**Status** : ⚠️ Partiellement implémenté (bouton "Réinitialiser" existe, mais pas de "Nouveau chat" dédié)

**Amélioration suggérée** :
- Renommer "Réinitialiser" en "Nouveau chat"
- Ajouter une confirmation avant de perdre les messages non sauvegardés
- Ajouter un raccourci clavier

---

### 2. Supprimer une conversation
**Description** : Permettre de supprimer une conversation de l'historique.

**Fonctionnalités attendues** :
- Bouton de suppression visible
- Confirmation avant suppression
- Feedback visuel après suppression
- Possibilité de restaurer (optionnel, corbeille)

**Status** : ✅ Implémenté (suppression avec confirmation)

---

### 3. Charger une conversation existante
**Description** : Permettre de charger une conversation sauvegardée.

**Fonctionnalités attendues** :
- Liste des conversations disponibles
- Prévisualisation (titre, date, nombre de messages)
- Chargement rapide en un clic
- Feedback visuel pendant le chargement

**Status** : ✅ Implémenté (chargement complet avec prévisualisation)

---

### 4. Exporter les conversations
**Description** : Permettre d'exporter une conversation dans différents formats.

**Formats supportés** :
- **TXT** : Format texte simple
- **PDF** : Format professionnel avec mise en forme
- **Word (DOCX)** : Format éditable
- **Markdown** : Format pour documentation
- **Image (PNG/JPG)** : Capture d'écran formatée (à implémenter)

**Fonctionnalités attendues** :
- Menu contextuel pour choisir le format
- Téléchargement automatique
- Formatage professionnel pour PDF
- Préservation des images dans l'export (optionnel)

**Status** : ✅ Partiellement implémenté (TXT, PDF, Word disponibles via API)

**Amélioration suggérée** :
- Ajouter l'export en Markdown 
- Ajouter l'export en image (screenshot formaté) 
- Améliorer le formatage PDF avec en-têtes et styles

---

## Interactions avec le contenu

### 1. Copier le texte d'un message
**Description** : Permettre de copier le contenu d'un message individuel.

**Fonctionnalités attendues** :
- Bouton de copie visible au survol (hover)
- Feedback visuel après copie (checkmark, toast)
- Copie du texte formaté ou brut selon le contexte
- Raccourci clavier optionnel

**Status** : ✅ Implémenté (bouton copie avec feedback visuel)

---

### 2. Copier tout le chat
**Description** : Permettre de copier l'intégralité de la conversation en un clic.

**Fonctionnalités attendues** :
- Bouton "Copier tout" dans la barre d'outils
- Formatage cohérent lors de la copie
- Indication claire des messages (Utilisateur / Assistant)
- Option de format (avec/sans timestamps)

**Status** : ❌ Non implémenté

**Priorité** : 🔴 Haute (fonctionnalité très demandée)

---

### 3. Télécharger le chat en PDF
**Description** : Générer et télécharger un PDF de la conversation.

**Caractéristiques attendues** :
- Formatage professionnel avec en-têtes
- Préservation de la mise en forme (markdown)
- Images incluses si présentes
- Nom de fichier automatique (date + titre)

**Status** : ✅ Implémenté (API disponible, peut être amélioré côté formatage)

---

### 4. Télécharger le chat en image
**Description** : Générer une image (PNG/JPG) de la conversation.

**Caractéristiques attendues** :
- Capture formatée de la conversation
- Fond personnalisable
- Résolution élevée
- Partage facile sur réseaux sociaux (optionnel)

**Status** : ❌ Non implémenté

**Priorité** : 🟡 Moyenne (utile pour partage visuel)

---

### 5. Partager une conversation
**Description** : Permettre de partager une conversation via différents canaux.

**Options de partage** :
- Lien de partage (si conversations publiques)
- Export par email
- Partage sur réseaux sociaux (image formatée)
- Copie de lien dans le presse-papiers

**Status** : ❌ Non implémenté

**Priorité** : 🟢 Basse (peut être utile pour collaboration)

---

## Gestion des fichiers et médias

### 1. Upload de PDF pour analyse
**Description** : Permettre d'uploader des fichiers PDF pour analyse par l'IA.

**Fonctionnalités attendues** :
- Drag & drop de fichiers
- Sélection de fichiers via bouton
- Prévisualisation des fichiers uploadés
- Affichage du nom et de la taille
- Extraction automatique du texte (OCR si nécessaire)
- Suppression avant envoi

**Status** : ✅ Implémenté (upload PDF complet avec OCR et prévisualisation)

---

### 2. Upload d'images
**Description** : Permettre d'uploader des images pour analyse.

**Fonctionnalités attendues** :
- Drag & drop d'images
- Copier-coller d'images (Ctrl+V / Cmd+V)
- Sélection multiple
- Prévisualisation avec miniatures
- Compression automatique si nécessaire
- Formats supportés : JPG, PNG, WebP, GIF
- Suppression avant envoi

**Status** : ✅ Implémenté (toutes les méthodes d'upload disponibles)

---

### 3. Drag & drop de fichiers
**Description** : Interface permettant de glisser-déposer des fichiers directement dans le chat.

**Fonctionnalités attendues** :
- Zone de drop visible
- Feedback visuel pendant le survol
- Support de multiples fichiers
- Validation des types de fichiers
- Feedback d'erreur pour fichiers invalides

**Status** : ✅ Implémenté (drag & drop complet avec feedback visuel)

---

### 4. Prévisualisation des fichiers uploadés
**Description** : Afficher un aperçu des fichiers avant l'envoi.

**Caractéristiques attendues** :
- Miniature pour les images
- Nom et taille pour les fichiers
- Indicateur de statut (chargé, en cours, erreur)
- Bouton de suppression individuel

**Status** : ✅ Implémenté (prévisualisation complète avec suppression)

---

### 5. Suppression de fichiers avant envoi
**Description** : Permettre de retirer des fichiers de la liste avant l'envoi du message.

**Fonctionnalités attendues** :
- Bouton de suppression visible sur chaque fichier
- Confirmation optionnelle pour fichiers volumineux
- Feedback visuel immédiat

**Status** : ✅ Implémenté (suppression simple et efficace)

---

## Amélioration de l'UX

### 1. Messages en streaming (typing effect)
**Description** : Affichage progressif de la réponse de l'IA au fur et à mesure de sa génération.

**Avantages** :
- Perception de vitesse améliorée
- Expérience plus naturelle
- Possibilité d'interrompre si nécessaire

**Status** : ✅ Implémenté (streaming SSE complet)

---

### 2. Indicateurs de chargement
**Description** : Afficher clairement quand l'IA traite une requête.

**Types d'indicateurs** :
- Spinner pendant le traitement
- Message "L'IA réfléchit..." ou équivalent
- Barre de progression (optionnel pour fichiers volumineux)

**Status** : ✅ Implémenté (spinner et indicateurs visuels)

---

### 3. Gestion des erreurs avec messages clairs
**Description** : Messages d'erreur explicites et actionnables.

**Caractéristiques attendues** :
- Messages d'erreur en français
- Explication de la cause
- Suggestion de solution
- Codes d'erreur pour support technique
- Toasts/snackbars pour feedback immédiat

**Status** : ✅ Implémenté (toasts avec messages clairs)

---

### 4. Support du markdown dans les réponses
**Description** : Rendre le markdown dans les réponses de l'IA.

**Éléments supportés** :
- Titres (H1-H6)
- Listes (ordonnées et non ordonnées)
- Code inline et blocs de code
- Liens
- Tableaux
- Citations
- Gras, italique

**Status** : ✅ Implémenté (MarkdownRenderer avec support complet)

---

### 5. Syntax highlighting pour le code
**Description** : Mise en évidence syntaxique pour les blocs de code.

**Caractéristiques attendues** :
- Détection automatique du langage
- Coloration syntaxique
- Numérotation des lignes (optionnel)
- Bouton de copie pour chaque bloc de code

**Status** : ✅ Implémenté (syntax highlighting via react-markdown)

---

### 6. Scroll automatique vers le bas
**Description** : Défilement automatique vers le dernier message.

**Comportement attendu** :
- Scroll smooth lors de nouveaux messages
- Ne pas forcer le scroll si l'utilisateur remonte
- Bouton "Aller en bas" si l'utilisateur est en haut

**Status** : ✅ Implémenté (scroll automatique smooth)

**Amélioration suggérée** :
- Ajouter un bouton "Aller en bas" visible quand l'utilisateur remonte

---

### 7. Messages épinglés/favoris
**Description** : Permettre d'épingler des messages importants.

**Fonctionnalités attendues** :
- Bouton pour épingler un message
- Affichage des messages épinglés en haut
- Export incluant les messages épinglés

**Status** : ❌ Non implémenté

**Priorité** : 🟢 Basse (fonctionnalité avancée)

---

## Fonctionnalités avancées

### 1. Recherche dans l'historique
**Description** : Permettre de rechercher dans toutes les conversations sauvegardées.

**Fonctionnalités attendues** :
- Barre de recherche dans l'onglet historique
- Recherche par titre, contenu, date
- Surlignage des résultats
- Navigation entre résultats

**Status** : ✅ Implémenté (recherche par titre et contenu)

---

### 2. Recherche dans une conversation
**Description** : Permettre de rechercher dans la conversation active.

**Fonctionnalités attendues** :
- Raccourci clavier (Ctrl/Cmd + F)
- Surlignage des occurrences
- Navigation précédent/suivant
- Compteur de résultats

**Status** : ❌ Non implémenté

**Priorité** : 🟡 Moyenne (très utile pour conversations longues)

---

### 3. Filtres par date
**Description** : Filtrer les conversations par période.

**Filtres attendus** :
- Aujourd'hui
- Cette semaine
- Ce mois
- Personnalisé (date début/fin)

**Status** : ✅ Implémenté (filtres : all, today, week, month)

---

### 4. Templates de messages
**Description** : Pré-définir des prompts réutilisables.

**Fonctionnalités attendues** :
- Bibliothèque de templates
- Variables personnalisables dans les templates
- Templates système et utilisateur
- Catégorisation (email, analyse, devis, etc.)
- Création/édition de templates

**Status** : ✅ Implémenté (système de templates complet avec variables)

---

### 5. Réponses rapides / Suggestions
**Description** : Proposer des réponses rapides ou des suggestions de questions.

**Fonctionnalités attendues** :
- Boutons de réponses rapides sous les messages
- Suggestions de questions au démarrage
- Historique des questions fréquentes

**Status** : ❌ Non implémenté

**Priorité** : 🟡 Moyenne (améliore l'efficacité)

---

### 6. Mode sombre / clair
**Description** : Permettre de basculer entre thème clair et sombre.

**Fonctionnalités attendues** :
- Toggle dans les paramètres
- Préférence sauvegardée
- Transition smooth

**Status** : ❌ Non implémenté (mais Tailwind supporte dark mode)

**Priorité** : 🟢 Basse (amélioration cosmétique)

---

### 7. Personnalisation de l'interface
**Description** : Permettre à l'utilisateur de personnaliser certains aspects.

**Options possibles** :
- Taille de police
- Densité d'affichage (compact/normal/comfortable)
- Position du chat (gauche/droite/centré)
- Couleur d'accent

**Status** : ❌ Non implémenté

**Priorité** : 🟢 Basse (nice-to-have)

---

### 8. Statistiques et analytics
**Description** : Afficher des statistiques sur l'utilisation.

**Métriques possibles** :
- Nombre de conversations
- Nombre total de messages
- Temps moyen de réponse
- Sujets les plus discutés

**Status** : ❌ Non implémenté

**Priorité** : 🟢 Basse (utile pour admins)

---

## Accessibilité et ergonomie

### 1. Raccourcis clavier
**Description** : Raccourcis pour les actions courantes.

**Raccourcis recommandés** :
- `Enter` : Envoyer le message
- `Shift + Enter` : Nouvelle ligne
- `Ctrl/Cmd + K` : Nouveau chat
- `Ctrl/Cmd + S` : Sauvegarder la conversation
- `Ctrl/Cmd + E` : Exporter
- `Ctrl/Cmd + /` : Afficher l'aide des raccourcis
- `Esc` : Fermer les modals/dialogs

**Status** : ⚠️ Partiellement implémenté (Enter pour envoyer, Shift+Enter pour nouvelle ligne)

**Priorité** : 🟡 Moyenne (améliore la productivité)

---

### 2. Support clavier complet
**Description** : Navigation complète au clavier.

**Fonctionnalités attendues** :
- Navigation dans les conversations au clavier
- Tab pour naviguer entre les éléments
- Flèches pour naviguer dans l'historique

**Status** : ⚠️ Partiel (navigation basique)

---

### 3. Responsive design
**Description** : Interface adaptée aux différentes tailles d'écran.

**Breakpoints à considérer** :
- Mobile (< 640px)
- Tablette (640px - 1024px)
- Desktop (> 1024px)

**Fonctionnalités mobiles** :
- Chat en plein écran
- Historique en drawer/sidebar
- Boutons tactiles optimisés

**Status** : ✅ Implémenté (responsive avec Tailwind)

**Amélioration suggérée** :
- Tester et optimiser pour mobile spécifiquement

---

### 4. Accessibilité (a11y)
**Description** : Conformité aux standards d'accessibilité web.

**Points à vérifier** :
- Attributs ARIA appropriés
- Contraste de couleurs suffisant
- Navigation au clavier
- Lecteurs d'écran (screen readers)
- Focus visible

**Status** : ⚠️ Partiel (quelques attributs ARIA présents)

**Priorité** : 🟡 Moyenne (important pour accessibilité)

---

### 5. Internationalisation (i18n)
**Description** : Support de plusieurs langues.

**Fonctionnalités attendues** :
- Sélection de langue
- Traduction de l'interface
- Format de dates/heures localisé

**Status** : ❌ Non implémenté (interface en français uniquement)

**Priorité** : 🟢 Basse (si pas besoin multilingue)

---

## Fonctionnalités existantes dans notre bot

### ✅ Fonctionnalités complètement implémentées

1. **Chat avec streaming** : Réponses en temps réel via SSE
2. **Upload d'images** : Drag & drop, copier-coller, bouton (formats multiples)
3. **Upload de fichiers PDF** : Avec extraction de texte et OCR
4. **Prévisualisation** : Images et fichiers avant envoi
5. **Suppression** : Retirer fichiers/images avant envoi
6. **Copie de message** : Bouton hover avec feedback
7. **Sauvegarde** : Conversations sauvegardées dans Firestore
8. **Chargement** : Charger une conversation sauvegardée
9. **Suppression de conversation** : Avec confirmation
10. **Export** : TXT, PDF, Word (via API)
11. **Historique** : Liste complète avec recherche
12. **Filtres par date** : Today, week, month, all
13. **Templates** : Système complet avec variables
14. **Markdown** : Rendu complet dans les réponses
15. **Syntax highlighting** : Pour blocs de code
16. **Scroll automatique** : Vers nouveaux messages
17. **Gestion d'erreurs** : Toasts avec messages clairs
18. **Indicateurs de chargement** : Spinners et feedback visuel
19. **Interface responsive** : Adaptation mobile/tablette/desktop

### ⚠️ Fonctionnalités partiellement implémentées

1. **Nouveau chat** : Bouton "Réinitialiser" existe, mais pas dédié
2. **Raccourcis clavier** : Enter/Shift+Enter seulement
3. **Accessibilité** : Quelques attributs ARIA, mais peut être amélioré

### ❌ Fonctionnalités non implémentées

1. **Copier tout le chat** : Fonctionnalité manquante
2. **Télécharger en image** : Non disponible
3. **Recherche dans conversation active** : Ctrl+F non implémenté
4. **Réponses rapides** : Suggestions non disponibles
5. **Mode sombre** : Non implémenté
6. **Partage de conversation** : Non disponible
7. **Messages épinglés** : Non implémenté
8. **Personnalisation** : Non disponible
9. **Statistiques** : Non implémenté
10. **Export Markdown** : Non disponible
11. **Bouton "Aller en bas"** : Non implémenté

---

## Recommandations par priorité

### 🔴 Priorité 1 : Essentiel (à implémenter rapidement)

Ces fonctionnalités améliorent significativement l'expérience utilisateur et sont fréquemment demandées :

1. **Copier tout le chat**
   - Impact : Très élevé
   - Complexité : Faible
   - Effort estimé : 2-3h
   - Description : Bouton pour copier l'intégralité de la conversation avec formatage

2. **Nouveau chat amélioré**
   - Impact : Élevé
   - Complexité : Faible
   - Effort estimé : 1-2h
   - Description : Renommer "Réinitialiser" en "Nouveau chat" + confirmation si non sauvegardé

3. **Recherche dans conversation active (Ctrl+F)**
   - Impact : Élevé
   - Complexité : Moyenne
   - Effort estimé : 4-6h
   - Description : Recherche native dans la conversation avec surlignage

---

### 🟡 Priorité 2 : Important (à prévoir)

Ces fonctionnalités apportent une vraie valeur ajoutée mais ne sont pas critiques :

1. **Raccourcis clavier complets**
   - Impact : Moyen-Élevé
   - Complexité : Faible-Moyenne
   - Effort estimé : 3-4h
   - Description : Implémenter les raccourcis recommandés (Cmd+K, Cmd+S, etc.)

2. **Télécharger le chat en image**
   - Impact : Moyen
   - Complexité : Moyenne
   - Effort estimé : 6-8h
   - Description : Générer une image formatée de la conversation (html2canvas ou similaire)

3. **Réponses rapides / Suggestions**
   - Impact : Moyen
   - Complexité : Moyenne
   - Effort estimé : 8-12h
   - Description : Proposer des réponses ou questions suggérées

4. **Amélioration accessibilité (a11y)**
   - Impact : Moyen (important pour certains utilisateurs)
   - Complexité : Moyenne
   - Effort estimé : 4-6h
   - Description : Ajouter attributs ARIA, améliorer navigation clavier, contrastes

5. **Bouton "Aller en bas"**
   - Impact : Faible-Moyen
   - Complexité : Faible
   - Effort estimé : 1-2h
   - Description : Bouton flottant pour retourner en bas si l'utilisateur remonte

6. **Export Markdown**
   - Impact : Faible-Moyen
   - Complexité : Faible
   - Effort estimé : 2-3h
   - Description : Ajouter format Markdown à l'export

---

### 🟢 Priorité 3 : Nice to have (améliorations futures)

Ces fonctionnalités sont agréables à avoir mais non essentielles :

1. **Mode sombre / clair**
   - Impact : Faible (cosmétique)
   - Complexité : Moyenne
   - Effort estimé : 4-6h
   - Description : Toggle de thème avec préférence sauvegardée

2. **Partage de conversation**
   - Impact : Faible (cas d'usage limité)
   - Complexité : Élevée
   - Effort estimé : 12-16h
   - Description : Système de liens partageables (nécessite architecture)

3. **Messages épinglés / favoris**
   - Impact : Faible
   - Complexité : Moyenne
   - Effort estimé : 6-8h
   - Description : Permettre d'épingler des messages importants

4. **Personnalisation de l'interface**
   - Impact : Faible
   - Complexité : Élevée
   - Effort estimé : 12-16h
   - Description : Paramètres de personnalisation (taille police, densité, etc.)

5. **Statistiques et analytics**
   - Impact : Faible (utile pour admins)
   - Complexité : Moyenne
   - Effort estimé : 8-10h
   - Description : Tableau de bord avec métriques d'utilisation

6. **Internationalisation (i18n)**
   - Impact : Faible (si pas besoin multilingue)
   - Complexité : Élevée
   - Effort estimé : 16-24h
   - Description : Support de multiples langues

---

## Résumé des priorités

### À faire rapidement (Priorité 1)
- ✅ Copier tout le chat
- ✅ Nouveau chat amélioré
- ✅ Recherche dans conversation (Ctrl+F)

### À planifier (Priorité 2)
- ⏳ Raccourcis clavier complets
- ⏳ Télécharger en image
- ⏳ Réponses rapides
- ⏳ Amélioration accessibilité
- ⏳ Bouton "Aller en bas"
- ⏳ Export Markdown

### Pour plus tard (Priorité 3)
- 📋 Mode sombre
- 📋 Partage de conversation
- 📋 Messages épinglés
- 📋 Personnalisation
- 📋 Statistiques
- 📋 Internationalisation

---

## Notes de mise en œuvre

### Technologies recommandées

- **Recherche** : Utiliser `useMemo` + `filter` pour recherche client-side
- **Capture d'image** : `html2canvas` ou `dom-to-image` pour conversion HTML → Image
- **Raccourcis clavier** : `react-hotkeys-hook` ou `use-hotkeys`
- **Export Markdown** : Formater les messages en Markdown simple

### Considérations techniques

- **Performance** : Indexer les conversations pour recherche rapide
- **Stockage** : Considérer la taille des exports (PDF/image)
- **UX** : Toujours proposer un feedback visuel immédiat
- **Accessibilité** : Tester avec lecteurs d'écran

---

## Contraintes techniques détaillées

Cette section détaille toutes les contraintes techniques, limitations et prérequis pour chaque fonctionnalité.

### 1. Upload et traitement de fichiers

#### Contraintes de taille

- **Taille maximale par fichier** : 20 MB
  - Constante : `MAX_FILE_SIZE = 20 * 1024 * 1024` (dans `lib/assistant/file-processing.ts`)
  - Validation côté client et serveur
  - Impact : Fichiers volumineux rejetés avec message d'erreur clair

- **Nombre maximum de fichiers par message** : 10 fichiers
  - Constante : `MAX_FILES_PER_MESSAGE = 10`
  - Validation avant traitement
  - Impact : Si plus de 10 fichiers sélectionnés, seuls les 10 premiers sont traités

#### Types de fichiers supportés

| Format | Extension | MIME Type | Traitement |
|--------|-----------|-----------|------------|
| PDF | `.pdf` | `application/pdf` | Extraction texte via `pdf-parse`, OCR via Google Vision si nécessaire |
| Word | `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Extraction via `mammoth` |
| Word (ancien) | `.doc` | `application/msword` | ❌ Non supporté (demander conversion en .docx) |
| Excel | `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | Extraction via `exceljs` |
| Excel (ancien) | `.xls` | `application/vnd.ms-excel` | ❌ Non supporté (demander conversion en .xlsx) |
| Texte | `.txt` | `text/plain` | Lecture directe |
| CSV | `.csv` | `text/csv` | Lecture directe |

**Dépendances npm requises** :
- `pdf-parse` : Extraction texte PDF
- `mammoth` : Extraction texte DOCX
- `exceljs` : Extraction données Excel
- `@google-cloud/vision` : OCR pour PDF scannés

#### Validation des fichiers

- **Vérification du type MIME réel** : Signature de fichier (magic bytes)
  - PDF : `%PDF` (0x25 0x50 0x44 0x46)
  - ZIP-based (DOCX/XLSX) : `PK` (0x50 0x4B)
  - Fichiers avec extension valide mais type MIME incorrect → Quarantaine

- **Contraintes de sécurité** :
  - Validation stricte type MIME vs extension
  - Fichiers suspects mis en quarantaine
  - Pas d'exécution de code

#### Performance et timeouts

- **Timeout API OCR PDF** : 300 secondes (5 minutes)
  - Configuration : `export const maxDuration = 300` (dans `app/api/ocr/pdf/route.ts`)
  - Impact : PDFs très volumineux peuvent dépasser le timeout
  - Solution : Optimiser le traitement ou réduire la taille des fichiers

- **Traitement asynchrone** : Extraction de texte côté serveur uniquement
  - Les PDFs ne peuvent pas être traités côté client (limitation de `pdf-parse`)
  - Requête API dédiée : `/api/assistant/files/extract`

#### Limitations connues

1. **Fichiers .doc et .xls (anciens formats)** : Non supportés
   - Solution : Conversion en .docx/.xlsx par l'utilisateur

2. **PDFs scannés sans OCR** : Extraction limitée
   - Solution : Utilisation de Google Vision API pour OCR
   - Coût : Utilisation de quotas Google Cloud

3. **Images dans les PDFs** : Non extraites
   - Seul le texte est extrait
   - Les images PDF ne sont pas analysées par l'IA

---

### 2. Upload et traitement d'images

#### Formats supportés

- **Formats acceptés** : JPG, PNG, WebP, GIF
- **Détection** : `file.type.startsWith("image/")`

#### Contraintes

- **Pas de limite de taille explicite** (contrôlée par le navigateur)
  - Recommandation : Limiter à 10 MB pour éviter les problèmes de mémoire
  - Compression automatique recommandée pour grandes images

- **Copier-coller d'images** : Supporté via `onPaste` event
  - Récupération via `clipboardData.items`
  - Format : `image/*`

#### Prévisualisation

- **Conversion en Base64** : Stockage temporaire avant envoi
  - Utilisation : `convertImagesToBase64()` (dans `lib/assistant/image-utils.ts`)
  - Impact mémoire : Grandes images peuvent consommer beaucoup de RAM
  - Nettoyage : Suppression après envoi du message

---

### 3. Rate Limiting (Limitation de requêtes)

#### Limites par défaut

| Type de requête | Limite par jour | Justification |
|----------------|-----------------|---------------|
| Texte uniquement | 100 requêtes | Coût modéré |
| Avec images | 50 requêtes | Coût plus élevé (tokens vision) |
| Avec fichiers | 20 requêtes | Coût très élevé (tokens contexte) |

**Configuration** : `DEFAULT_RATE_LIMITS` dans `lib/assistant/rate-limiting.ts`

#### Fonctionnement

- **Stockage** : Firestore collection `assistant_rate_limits`
- **Clé de document** : `${userId}_${type}_${date}`
- **Réinitialisation** : Quotidienne à minuit UTC
- **Vérification** : Avant chaque requête à l'API OpenAI

#### Contraintes techniques

- **Atomicité** : Vérification + incrément en une seule opération
- **Persistance** : Firestore pour partage entre instances (si plusieurs serveurs)
- **Performance** : Requête Firestore par vérification (acceptable car avant requête OpenAI)

---

### 4. Budget et coûts

#### Configuration

- **Budget mensuel par défaut** : $100 USD
- **Seuils d'alerte** :
  - Warning : 80% du budget
  - Critical : 95% du budget
  - Block : 100% (si `blockAtLimit = true`)

**Configuration** : `DEFAULT_BUDGET_CONFIG` dans `lib/assistant/budget-alerts.ts`

#### Stockage

- Collection Firestore : `assistant_config` → document `budget`
- Collection Firestore : `assistant_usage` → tracking des coûts

#### Calcul des coûts

- **Méthode** : Basée sur les tokens utilisés (input + output)
- **Prix** : Dépend du modèle OpenAI utilisé (`gpt-4o` par défaut)
- **Tracking** : Après chaque requête via `logUsage()`

#### Limitations

- **Précision** : Coûts estimés (peuvent varier légèrement)
- **Mise à jour** : Après chaque requête (pas en temps réel)
- **Réinitialisation** : Mensuelle (1er du mois)

---

### 5. Streaming des réponses (SSE)

#### Implémentation

- **Protocole** : Server-Sent Events (SSE)
- **Format** : `data: {JSON}\n\n`
- **Types de messages** :
  - `content` : Chunk de texte de la réponse
  - `metadata` : Métadonnées (non utilisé actuellement)

#### Contraintes

- **Timeout** : Défini par Vercel/Next.js (généralement 60s)
  - Problème : Réponses longues peuvent timeout
  - Solution : Chunking plus agressif ou augmentation timeout

- **Connexion** : Une seule connexion SSE par requête
  - Pas de multiplexing
  - Nouvelle connexion pour chaque message

#### Performance

- **Buffer côté client** : Accumulation progressive du texte
- **Rendu** : Mise à jour React à chaque chunk
- **Optimisation** : `useState` pour mise à jour incrémentale

---

### 6. Export de conversations

#### Formats actuellement implémentés

**TXT** :
- ✅ Implémenté : `exportToText()` dans `lib/assistant/export.ts`
- Complexité : Faible
- Aucune dépendance externe
- Limitation : Pas de formatage avancé

**PDF** :
- ⚠️ Partiellement implémenté : Fonction stub présente mais non fonctionnelle
- Dépendances requises :
  - Option 1 : `pdfkit` (légère, génération manuelle)
  - Option 2 : `puppeteer` (lourd, mais meilleur rendu HTML)
  - Option 3 : `jspdf` + `html2canvas` (côté client, déjà installé)
- Contraintes :
  - Génération serveur : Nécessite Node.js avec Canvas support
  - Génération client : Limité par la taille du navigateur
- Recommandation : Utiliser `jspdf` côté client (déjà présent dans package.json)

**Word (DOCX)** :
- ⚠️ Partiellement implémenté : Fonction stub présente mais non fonctionnelle
- Dépendance requise : `docx` (npm package)
- Contraintes :
  - Génération serveur uniquement
  - Format complexe (structure XML compressée)
- Effort : Moyen-élevé

#### Contraintes d'export PDF/Image

**Export en image (PNG/JPG)** :
- Dépendances disponibles : `html2canvas` (déjà installé)
- Limitation taille :
  - Canvas HTML5 : Limite de taille variable selon navigateur
  - Images très longues : Problèmes de mémoire
- Performance :
  - Rendering peut être lent pour conversations longues
  - Recommandation : Chunking ou pagination

**Export Markdown** :
- ✅ Facile à implémenter (pas de dépendance externe)
- Formatage : Conversion des messages en Markdown simple
- Limitation : Pas de support des images dans le Markdown export

---

### 7. Sauvegarde et chargement de conversations

#### Stockage

- **Base de données** : Firestore
- **Collection** : `assistant_conversations`
- **Structure** :
  ```typescript
  {
    id: string;
    userId: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
  }
  ```

#### Limitations de taille

- **Firestore document max** : 1 MB par document
- **Impact** : Conversations très longues peuvent dépasser la limite
- **Solution** : Pagination ou stockage des messages dans sous-collection

#### Performance

- **Chargement** : Requête Firestore par conversation
- **Index recommandé** : `userId` + `updatedAt` (desc)
- **Pagination** : Recommandée si beaucoup de conversations (>100)

---

### 8. Templates de prompts

#### Stockage

- **Templates système** : Hardcodés dans `lib/assistant/templates.ts`
- **Templates utilisateur** : Firestore collection `assistant_templates`
- **Structure** :
  ```typescript
  {
    id: string;
    name: string;
    description: string;
    prompt: string;
    variables?: string[];
    category?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }
  ```

#### Limitations

- **Variables** : Extraction simple via regex `{{variableName}}`
- **Validation** : Pas de validation des types de variables
- **Sécurité** : Pas de sanitization du prompt (à faire si templates utilisateur)

---

### 9. Recherche et filtres

#### Recherche dans l'historique

- **Implémentation actuelle** : Client-side avec `filter()` + `includes()`
- **Performance** : Acceptable jusqu'à ~1000 conversations
- **Limitations** :
  - Recherche textuelle simple (pas de fuzzy search)
  - Sensible à la casse
  - Pas de recherche full-text (titre seulement)

#### Filtres par date

- **Implémentation** : Client-side avec comparaison de dates
- **Performance** : O(n) où n = nombre de conversations
- **Optimisation possible** : Index Firestore avec query

---

### 10. Raccourcis clavier

#### Implémentation recommandée

**Bibliothèques possibles** :
- `react-hotkeys-hook` : Simple, léger
- `use-hotkeys` : Alternative populaire
- `react-hotkeys` : Plus ancien mais stable

**Contraintes** :
- Gestion des conflits avec autres raccourcis navigateur
- Support multi-plateforme (Mac vs Windows)
- Prévenir le comportement par défaut du navigateur

#### Raccourcis recommandés

| Raccourci | Action | Conflit potentiel |
|-----------|--------|-------------------|
| `Enter` | Envoyer | ✅ Déjà implémenté |
| `Shift + Enter` | Nouvelle ligne | ✅ Déjà implémenté |
| `Cmd/Ctrl + K` | Nouveau chat | ⚠️ Conflit avec barre de recherche navigateur |
| `Cmd/Ctrl + S` | Sauvegarder | ⚠️ Sauvegarde page (prévenir) |
| `Cmd/Ctrl + E` | Exporter | ✅ Pas de conflit |
| `Cmd/Ctrl + /` | Aide | ✅ Pas de conflit |
| `Esc` | Fermer modals | ✅ Déjà partiellement implémenté |

---

### 11. Accessibilité (a11y)

#### Prérequis techniques

- **Attributs ARIA** : À ajouter manuellement
- **Navigation clavier** : Gestion du focus
- **Contraste** : Vérifier avec outils (WCAG 2.1 AA minimum)
- **Lecteurs d'écran** : Test avec NVDA/JAWS/VoiceOver

#### Contraintes

- **Composants Radix UI** : Déjà accessibles (bon point de départ)
- **Focus management** : Nécessite logique custom
- **Labels** : Tous les inputs doivent avoir des labels
- **Rôles ARIA** : À définir pour zones personnalisées

---

### 12. Mode sombre

#### Implémentation technique

**Bibliothèque** : `next-themes` (déjà installé)

**Contraintes** :
- **Tailwind CSS** : Support dark mode via `dark:` prefix
- **Configuration** : `tailwind.config.js` → `darkMode: 'class'`
- **Persistance** : LocalStorage ou cookie
- **Performance** : Pas d'impact significatif

**Limitation** : Nécessite refactor de tous les composants pour ajouter classes dark

---

### 13. Responsive design

#### Breakpoints Tailwind

- **Mobile** : `< 640px` (sm)
- **Tablet** : `640px - 1024px` (md, lg)
- **Desktop** : `> 1024px` (xl, 2xl)

#### Contraintes

- **Chat en mobile** : Nécessite optimisation spécifique
- **Historique** : Drawer/sidebar sur mobile
- **Boutons** : Taille minimale 44x44px (tactile)

---

### 14. Partage de conversations

#### Options techniques

**Lien partageable** :
- Génération UUID pour chaque conversation
- Collection Firestore : `shared_conversations`
- Contraintes :
  - Sécurité : Accès public vs privé
  - Expiration : TTL sur les liens
  - Permissions : Lecture seule

**Export par email** :
- Service email requis (SendGrid, Resend, etc.)
- Contraintes :
  - Taille limite des pièces jointes (25 MB généralement)
  - Rate limiting du service email

**Image partageable** :
- Génération côté client avec `html2canvas`
- Upload vers Cloud Storage (Firebase Storage)
- Génération URL publique
- Limitation : Coûts de stockage

---

### 15. Statistiques et analytics

#### Données à tracker

- Nombre de conversations
- Nombre de messages
- Coûts par utilisateur
- Temps de réponse moyen
- Formats de fichiers les plus utilisés

#### Stockage

- **Collection Firestore** : `assistant_analytics`
- **Agrégation** : Possible avec Cloud Functions ou client-side
- **Performance** : Indexer sur `userId` + `date`

#### Limitations

- **Données personnelles** : Conformité RGPD
- **Stockage** : Coûts Firestore
- **Calculs** : Peuvent être coûteux si beaucoup de données

---

## Résumé des contraintes critiques

### Limites absolues

1. **Taille fichier** : 20 MB max par fichier
2. **Nombre fichiers** : 10 fichiers max par message
3. **Firestore document** : 1 MB max (risque pour conversations très longues)
4. **Rate limiting** : 100/50/20 requêtes par jour selon type
5. **Budget mensuel** : Configurable (défaut $100)

### Dépendances critiques

1. **PDF parsing** : `pdf-parse` (nécessite Node.js, pas de client-side)
2. **OCR** : Google Cloud Vision API (quota et coûts)
3. **Export PDF** : `jspdf` + `html2canvas` (déjà installé)
4. **Export Word** : `docx` (non installé)

### Points d'attention performance

1. **Base64 images** : Consommation mémoire
2. **SSE streaming** : Timeout sur réponses longues
3. **Recherche client-side** : Performance dégradée >1000 conversations
4. **Export image** : Risque OOM sur conversations très longues

---

## Contraintes techniques pour l'amélioration de l'UI

Cette section détaille toutes les contraintes techniques, limitations et prérequis pour améliorer l'interface utilisateur du bot de chat.

### 1. Stack technique UI actuelle

#### Framework et bibliothèques

- **Next.js 16** : Framework React avec SSR/SSG
- **React 19** : Bibliothèque UI
- **TypeScript** : Typage statique
- **Tailwind CSS 4** : Framework CSS utility-first
- **Radix UI** : Composants accessibles headless
- **shadcn/ui** : Composants basés sur Radix UI
- **Lucide React** : Icônes
- **Framer Motion** : Animations (déjà installé mais non utilisé actuellement)
- **Sonner** : Toast notifications

#### Architecture des composants

**Structure actuelle** :
```
components/
  ├── ui/              # Composants shadcn/ui de base
  │   ├── button.tsx
  │   ├── card.tsx
  │   ├── input.tsx
  │   ├── textarea.tsx
  │   ├── tabs.tsx
  │   └── ...
  └── assistant/       # Composants spécifiques assistant
      └── MarkdownRenderer.tsx
```

**Pattern utilisé** : Composition de composants Radix UI avec styles Tailwind

---

### 2. Système de design

#### Tokens de design

**Couleurs** : Système de couleurs via CSS variables (design system)
- `primary` : Couleur principale
- `secondary` : Couleur secondaire
- `accent` : Couleur d'accentuation
- `muted` : Couleur pour éléments en arrière-plan
- `destructive` : Couleur pour actions destructives
- `foreground` / `background` : Couleurs de texte et fond

**Typographie** :
- Taille de base : `text-sm` (14px)
- Échelle : `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl`, `4xl`
- Font : Système par défaut (sans-serif)

**Espacement** :
- Scale Tailwind : `0.5`, `1`, `1.5`, `2`, `2.5`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`, `20`, `24`, `32`

**Border radius** :
- Default : `rounded-md` (6px)
- Variations : `sm`, `md`, `lg`, `xl`, `2xl`, `full`

#### Contraintes de cohérence

- **Variants de composants** : Utiliser `class-variance-authority` (CVA) pour variants cohérents
- **Composition** : Utiliser `cn()` utility pour merger les classes Tailwind
- **Dark mode** : Préfixe `dark:` pour styles dark (non activé actuellement)

---

### 3. Composants UI disponibles

#### Composants shadcn/ui installés

| Composant | Usage actuel | Documentation |
|-----------|--------------|---------------|
| Button | ✅ Utilisé | Variants: default, destructive, outline, secondary, ghost, link |
| Card | ✅ Utilisé | CardHeader, CardContent, CardTitle |
| Input | ✅ Utilisé | Input text standard |
| Textarea | ✅ Utilisé | Zone de saisie multi-lignes |
| Tabs | ✅ Utilisé | Navigation par onglets |
| Label | ✅ Utilisé | Labels pour formulaires |
| Dialog | ❌ Disponible | Modals/dialogs |
| Alert | ❌ Disponible | Alertes contextuelles |
| Alert Dialog | ❌ Disponible | Confirmations |
| Popover | ❌ Disponible | Popups contextuels |
| Tooltip | ❌ Disponible | Info-bulles |
| Select | ❌ Disponible | Dropdowns |
| Checkbox | ❌ Disponible | Cases à cocher |
| Switch | ❌ Disponible | Toggles |
| Avatar | ❌ Disponible | Avatars utilisateurs |
| Badge | ❌ Disponible | Badges/labels |
| Scroll Area | ❌ Disponible | Zones scrollables custom |
| Progress | ❌ Disponible | Barres de progression |

**Contrainte** : Utiliser les composants existants pour maintenir la cohérence

---

### 4. Améliorations UI recommandées et leurs contraintes

#### 4.1. Amélioration de l'affichage des messages

**Objectifs** :
- Meilleure distinction visuelle utilisateur vs assistant
- Avatars pour personnalisation
- Indicateurs de statut (envoyé, en cours, erreur)
- Amélioration de la lisibilité

**Contraintes techniques** :

1. **Avatars** :
   - Composant disponible : `@/components/ui/avatar`
   - Taille recommandée : `size-8` (32px) ou `size-10` (40px)
   - Fallback : Initiales ou icône générique
   - Stockage : Firebase Storage ou URL externe
   - Performance : Lazy loading recommandé si beaucoup d'avatars

2. **Bulle de message améliorée** :
   - Design actuel : `bg-primary` (user) vs `bg-muted` (assistant)
   - Amélioration possible : Ombres, bordures, coins arrondis différents
   - Contrainte : Maintenir le contraste pour accessibilité
   - Responsive : `max-w-[80%]` actuel, ajuster selon breakpoint

3. **Indicateurs de statut** :
   - Icônes : `Loader2` (spin), `Check`, `AlertCircle`
   - Position : En bas à droite du message
   - Animation : `animate-spin` pour loading
   - Timing : Feedback immédiat

4. **Lisibilité** :
   - Line height : `leading-relaxed` ou `leading-loose` pour messages longs
   - Espacement : `space-y-4` actuel (peut être ajusté)
   - Largeur max : `max-w-[80%]` sur desktop, `max-w-[90%]` sur mobile

---

#### 4.2. Zone de saisie améliorée

**Objectifs** :
- Meilleur feedback visuel
- Indicateur de caractères restants (optionnel)
- Auto-resize du textarea
- Suggestions/autocomplete

**Contraintes techniques** :

1. **Auto-resize du Textarea** :
   - Méthode 1 : CSS `rows` dynamique avec `scrollHeight`
   - Méthode 2 : Bibliothèque `react-textarea-autosize`
   - Limite max : 10-15 lignes avant scroll
   - Performance : Re-render à chaque changement (acceptable)

2. **Compteur de caractères** :
   - Position : En bas à droite du textarea
   - Style : `text-xs text-muted-foreground`
   - Limite : Afficher seulement si proche limite (optionnel)
   - Limite recommandée : 4000 caractères (limite OpenAI)

3. **Placeholder amélioré** :
   - Actuel : "Tapez votre message... (Vous pouvez coller des images avec Ctrl+V / Cmd+V)"
   - Amélioration : Placeholder animé ou multi-lignes
   - Contrainte : Reste lisible et informatif

4. **Boutons d'action** :
   - Taille : `size="icon"` ou `size="sm"`
   - Position : En bas à droite de la zone de saisie
   - États : disabled pendant `isLoading`
   - Accessibilité : Labels ARIA obligatoires

---

#### 4.3. Sidebar/Historique amélioré

**Objectifs** :
- Meilleure navigation dans l'historique
- Recherche améliorée
- Prévisualisation des conversations
- Actions rapides (supprimer, renommer, etc.)

**Contraintes techniques** :

1. **Layout responsive** :
   - Desktop : Sidebar fixe (300-400px) + chat principal
   - Mobile : Drawer/sheet qui s'ouvre par le bouton
   - Composant : `Sheet` de shadcn/ui (à installer) ou custom drawer
   - Breakpoint : `< lg` (1024px) pour drawer

2. **Liste virtuelle** :
   - Problème : Performance avec >100 conversations
   - Solution : `react-window` ou `@tanstack/react-virtual`
   - Estimation : Nécessaire à partir de ~200 conversations
   - Contrainte : Taille bundle (+15-20 KB)

3. **Recherche améliorée** :
   - Input avec icône de recherche
   - Debounce : 300ms recommandé
   - Highlight : Surligner les résultats
   - Performance : Indexation côté client ou serveur

4. **Actions contextuelles** :
   - Menu dropdown par conversation
   - Composant : `Popover` ou `DropdownMenu` de Radix
   - Actions : Charger, Renommer, Supprimer, Exporter
   - Confirmation : `AlertDialog` pour suppression

---

#### 4.4. Animations et transitions

**Objectifs** :
- Transitions fluides
- Feedback visuel immédiat
- Animations subtiles pour améliorer l'UX

**Contraintes techniques** :

1. **Framer Motion (déjà installé)** :
   - Bundle size : ~50 KB gzipped
   - Usage recommandé : Animations complexes
   - Alternatives légères : CSS transitions (préféré pour simples)

2. **Animations recommandées** :

   **Messages** :
   - Entrée : `fadeIn` + `slideUp` (300ms)
   - Bibliothèque : CSS `@keyframes` ou Framer Motion `motion.div`
   - Performance : Utiliser `transform` et `opacity` (GPU-accelerated)

   **Boutons** :
   - Hover : Transition Tailwind `transition-colors` (150ms)
   - Active : Scale légère `scale-95`
   - Déjà implémenté via `buttonVariants`

   **Modals/Dialogs** :
   - Entrée : Fade + scale (200ms)
   - Composant Radix : Animations incluses
   - Customisation : Via CSS ou Framer Motion

   **Loading states** :
   - Spinner : `animate-spin` Tailwind (déjà utilisé)
   - Skeleton : Composants skeleton pour contenu en chargement
   - Pulse : `animate-pulse` pour placeholders

3. **Performance** :
   - Limiter animations : Maximum 2-3 animations simultanées
   - `will-change` : À utiliser avec parcimonie
   - `prefers-reduced-motion` : Respecter pour accessibilité

---

#### 4.5. Mode sombre

**Objectifs** :
- Thème sombre pour confort visuel
- Toggle rapide
- Préférence sauvegardée

**Contraintes techniques** :

1. **next-themes (déjà installé)** :
   - Configuration : Provider au root de l'app
   - Storage : `localStorage` ou cookie
   - System preference : Détection automatique possible

2. **Styles Tailwind** :
   - Configuration : `darkMode: 'class'` dans `tailwind.config`
   - Usage : Préfixe `dark:` pour chaque style
   - Exemple : `bg-white dark:bg-gray-900`

3. **Composants** :
   - Tous les composants doivent supporter dark mode
   - Couleurs : Utiliser les tokens du design system
   - Images : Inverser si nécessaire (filtres CSS)

4. **Contraintes** :
   - Effort : Refactor de tous les composants (taille importante)
   - Test : Vérifier contraste (WCAG AA minimum)
   - Icons : S'assurer visibilité en dark mode

5. **Toggle UI** :
   - Position : Header ou paramètres
   - Composant : `Switch` avec icônes soleil/lune
   - Feedback : Toast ou animation

---

#### 4.6. Indicateurs visuels améliorés

**Objectifs** :
- Feedback immédiat pour toutes les actions
- États de chargement clairs
- Messages d'erreur visuels

**Contraintes techniques** :

1. **Toasts (Sonner)** :
   - Déjà implémenté : `toast.success()`, `toast.error()`, etc.
   - Position : En bas à droite (configurable)
   - Durée : 4s par défaut (configurable)
   - Limite : Maximum 3-4 toasts simultanés

2. **Progress indicators** :
   - Composant : `Progress` de shadcn/ui (disponible)
   - Usage : Upload de fichiers, export, etc.
   - Style : Barre linéaire ou circulaire
   - Animation : Smooth transition

3. **Skeleton loaders** :
   - Composant : À créer (pas dans shadcn/ui)
   - Usage : Chargement conversations, messages
   - Style : `animate-pulse` Tailwind
   - Contrainte : Maintenir structure similaire au contenu réel

4. **Badges/Status indicators** :
   - Composant : `Badge` de shadcn/ui (disponible)
   - Usage : Statut conversation, nombre de messages, etc.
   - Variants : default, secondary, destructive, outline

---

#### 4.7. Responsive design amélioré

**Objectifs** :
- Expérience optimale sur tous les écrans
- Navigation adaptative
- Interactions tactiles optimisées

**Contraintes techniques** :

1. **Breakpoints Tailwind** :
   ```
   sm: 640px   (mobile large)
   md: 768px   (tablet)
   lg: 1024px  (desktop)
   xl: 1280px  (desktop large)
   2xl: 1536px (desktop très large)
   ```

2. **Layout adaptatif** :

   **Mobile (< 640px)** :
   - Chat en plein écran
   - Historique : Drawer/Sheet depuis bouton
   - Messages : `max-w-[90%]`
   - Boutons : Taille minimale 44x44px (tactile)
   - Input : Pleine largeur, padding augmenté

   **Tablet (640px - 1024px)** :
   - Layout 2 colonnes si espace disponible
   - Sidebar réduite (250px)
   - Messages : `max-w-[75%]`

   **Desktop (> 1024px)** :
   - Sidebar fixe (300-400px)
   - Chat principal : Flex-1
   - Messages : `max-w-[80%]`

3. **Touch interactions** :
   - Zone tactile minimale : 44x44px (Apple HIG)
   - Espacement : Minimum 8px entre éléments tactiles
   - Swipe : Actions swipe pour supprimer (optionnel, complexe)

4. **Performance mobile** :
   - Lazy loading : Images et composants lourds
   - Debounce : Inputs et recherches
   - Virtual scrolling : Listes longues

---

#### 4.8. Accessibilité UI (a11y)

**Objectifs** :
- Conforme WCAG 2.1 AA
- Navigation clavier complète
- Support lecteurs d'écran

**Contraintes techniques** :

1. **Attributs ARIA** :
   - Tous les boutons : `aria-label` si pas de texte visible
   - Modals : `role="dialog"`, `aria-modal="true"`
   - Zones live : `aria-live="polite"` pour messages
   - Formulaires : `aria-required`, `aria-invalid`

2. **Navigation clavier** :
   - Focus visible : Ring Tailwind `focus-visible:ring-2`
   - Ordre logique : Tab order cohérent
   - Raccourcis : Documentés et non-conflictuels
   - Escape : Fermer modals/dialogs

3. **Contraste** :
   - Texte normal : Ratio 4.5:1 minimum
   - Texte large : Ratio 3:1 minimum
   - Outil : Utiliser contraste checker
   - Dark mode : Vérifier contraste aussi

4. **Lecteurs d'écran** :
   - Test : NVDA (Windows), JAWS, VoiceOver (Mac)
   - Landmarks : `role="main"`, `role="navigation"`
   - Labels : Tous les inputs doivent avoir des labels
   - Descriptions : `aria-describedby` si nécessaire

5. **Réduction de mouvement** :
   - Respecter `prefers-reduced-motion`
   - CSS : `@media (prefers-reduced-motion: reduce) { animation: none; }`
   - JavaScript : `window.matchMedia('(prefers-reduced-motion: reduce)')`

---

#### 4.9. Performance UI

**Objectifs** :
- Temps de chargement rapide
- Interactions fluides (60 FPS)
- Bundle size optimisé

**Contraintes techniques** :

1. **Code splitting** :
   - Next.js : Automatic code splitting par route
   - Lazy loading : `React.lazy()` pour composants lourds
   - Dynamic imports : `next/dynamic` avec `ssr: false` si nécessaire

2. **Optimisation React** :
   - `useMemo` : Pour calculs coûteux (recherche, filtres)
   - `useCallback` : Pour callbacks passés aux enfants
   - `React.memo` : Pour composants qui re-render souvent
   - Éviter : Re-renders inutiles (profiler React DevTools)

3. **Images** :
   - Next.js Image : Optimisation automatique
   - Lazy loading : `loading="lazy"` natif
   - Formats : WebP/AVIF si supporté
   - Base64 : Limiter taille (comme actuellement)

4. **CSS** :
   - Tailwind : Purge automatique (production)
   - Critical CSS : Inline pour above-the-fold
   - Fonts : `font-display: swap` pour performance

5. **Bundle size** :
   - Analyser : `@next/bundle-analyzer`
   - Limites recommandées :
     - Page initiale : < 200 KB gzipped
     - Composants : < 50 KB par composant lourd
   - Tree shaking : Vérifier imports (éviter `import *`)

---

#### 4.10. Personnalisation UI

**Objectifs** :
- Permettre à l'utilisateur de personnaliser certains aspects
- Préférences sauvegardées

**Contraintes techniques** :

1. **Options de personnalisation** :

   **Taille de police** :
   - Options : Small, Normal, Large
   - Implémentation : CSS variable `--font-size-base`
   - Stockage : `localStorage` ou Firestore (préférence utilisateur)
   - Application : `text-sm`, `text-base`, `text-lg` selon choix

   **Densité d'affichage** :
   - Options : Compact, Normal, Comfortable
   - Espacement : Ajuster `space-y-*` et padding
   - Stockage : Préférence utilisateur

   **Couleur d'accent** :
   - Complexité : Élevée (nécessite thème dynamique)
   - Solution : CSS variables avec HSL
   - Limite : Palette prédéfinie (sécurité design)
   - Stockage : Firestore user preferences

2. **Stockage des préférences** :
   - Firestore : Collection `user_preferences`
   - Structure : `{ userId, ui: { fontSize, density, accentColor } }`
   - Sync : Temps réel si plusieurs devices

3. **Application des préférences** :
   - Provider React : `PreferencesProvider`
   - CSS Variables : Mise à jour dynamique
   - Performance : Re-render minimal (Context optimisé)

---

### 5. Bibliothèques UI recommandées (non installées)

#### Pour animations avancées

- **Framer Motion** : ✅ Déjà installé (50 KB)
  - Usage : Animations complexes, gestes
  - Alternative légère : CSS transitions si animations simples

- **React Spring** : Alternative à Framer Motion (plus léger)
  - Taille : ~30 KB
  - Usage : Animations physiques réalistes

#### Pour composants manquants

- **Sheet/Drawer** : À ajouter à shadcn/ui
  - Command : `npx shadcn@latest add sheet`
  - Usage : Sidebar mobile, historique

- **Dropdown Menu** : À ajouter à shadcn/ui
  - Command : `npx shadcn@latest add dropdown-menu`
  - Usage : Actions contextuelles

- **Command Palette** : À ajouter à shadcn/ui
  - Command : `npx shadcn@latest add command`
  - Usage : Recherche globale, raccourcis

#### Pour performances

- **@tanstack/react-virtual** : Virtualisation de listes
  - Taille : ~15 KB
  - Usage : Historique avec beaucoup de conversations
  - Alternative : `react-window` (plus léger mais moins de features)

- **react-intersection-observer** : Lazy loading d'éléments
  - Taille : ~3 KB
  - Usage : Chargement progressif des messages

---

### 6. Contraintes de compatibilité navigateurs

#### Support cible

- **Chrome/Edge** : Dernières 2 versions
- **Firefox** : Dernières 2 versions
- **Safari** : Dernières 2 versions
- **Mobile Safari** : iOS 14+
- **Chrome Mobile** : Android 8+

#### Limitations connues

1. **CSS Grid/Flexbox** : Support universel ✅
2. **CSS Variables** : Support universel ✅
3. **Intersection Observer** : Support universel ✅
4. **Clipboard API** : Support universel ✅
5. **ResizeObserver** : Support universel ✅

#### Polyfills nécessaires

- Aucun polyfill requis pour les fonctionnalités utilisées
- Next.js gère automatiquement les polyfills nécessaires

---

### 7. Résumé des contraintes UI critiques

#### Limitations absolues

1. **Bundle size** : Maintenir < 200 KB initial
2. **Performance** : 60 FPS pour interactions
3. **Accessibilité** : WCAG 2.1 AA minimum
4. **Compatibilité** : Support navigateurs cibles
5. **Responsive** : Fonctionnel sur mobile/tablet/desktop

#### Dépendances critiques

1. **Tailwind CSS** : Framework CSS (core)
2. **Radix UI** : Composants accessibles (core)
3. **next-themes** : Mode sombre (déjà installé)
4. **Sonner** : Toasts (déjà installé)
5. **Framer Motion** : Animations (déjà installé, optionnel)

#### Points d'attention performance

1. **Re-renders React** : Optimiser avec memo/useMemo/useCallback
2. **Images Base64** : Limiter taille et nombre
3. **Listes longues** : Virtualisation si >100 éléments
4. **Animations** : Limiter nombre simultanées
5. **Dark mode** : Vérifier contraste et performance

#### Effort d'implémentation estimé

| Amélioration | Complexité | Effort estimé |
|--------------|------------|---------------|
| Avatars messages | Faible | 2-3h |
| Auto-resize textarea | Faible | 1-2h |
| Sidebar responsive | Moyenne | 4-6h |
| Mode sombre | Élevée | 12-16h (tous composants) |
| Animations fluides | Moyenne | 6-8h |
| Accessibilité complète | Élevée | 16-24h |
| Personnalisation UI | Élevée | 20-30h |
| Virtualisation listes | Moyenne | 8-12h |

---

## Conclusion

Notre bot dispose déjà de nombreuses fonctionnalités essentielles et avancées. Les principales améliorations à apporter concernent :

1. **La productivité** : Raccourcis clavier, copie complète, recherche
2. **L'export** : Formats additionnels (Markdown, Image)
3. **L'accessibilité** : Conformité a11y pour tous les utilisateurs

Les fonctionnalités "nice-to-have" peuvent être ajoutées progressivement selon les retours utilisateurs et les besoins métier.

---

*Document créé le : 2025-01-27*  
*Dernière mise à jour : 2025-01-27 (ajout des contraintes techniques détaillées et améliorations UI)*

