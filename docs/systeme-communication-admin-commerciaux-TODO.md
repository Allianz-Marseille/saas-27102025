# TODO - Système de Communication Admin → Chargés de Clientèle

## Vue d'ensemble

Ce fichier contient toutes les tâches à réaliser pour implémenter le système de communication entre les administrateurs et les chargés de clientèle.

**5 rôles** : ADMINISTRATEUR (émetteur) + 4 rôles récepteurs (CDC_COMMERCIAL, COMMERCIAL_SANTE_INDIVIDUEL, COMMERCIAL_SANTE_COLLECTIVE, GESTIONNAIRE_SINISTRE)

---

## ⚠️ STRATÉGIE D'IMPLÉMENTATION PROGRESSIVE (IMPORTANT)

**Objectif** : Éviter les erreurs TypeScript massives en implémentant étape par étape avec validation à chaque phase.

### Principe fondamental
**UNE ÉTAPE À LA FOIS, VALIDATION TYPESCRIPT APRÈS CHAQUE ÉTAPE**

Ne jamais passer à l'étape suivante tant que la compilation TypeScript ne passe pas sans erreur.

### Processus de validation

Après chaque étape, exécuter :
```bash
npx tsc --noEmit
```

**Si des erreurs apparaissent** :
1. ❌ **ARRÊTER** l'implémentation
2. 🔍 Corriger toutes les erreurs TypeScript
3. ✅ Vérifier que `npx tsc --noEmit` passe sans erreur
4. ✅ **SEULEMENT ENSUITE** passer à l'étape suivante

### Ordre d'implémentation strict

#### Étape 1 : Types TypeScript uniquement (Phase 1.1)
- ✅ Créer `types/message.ts` avec toutes les interfaces
- ✅ Vérifier la compilation : `npx tsc --noEmit`
- ✅ **Corriger toutes les erreurs avant de continuer**
- ⏸️ **NE PAS PASSER À L'ÉTAPE 2 AVANT QUE CETTE ÉTAPE SOIT 100% VALIDÉE**

#### Étape 2 : Fonctions Firebase de base (Phase 1.2)
- ✅ Créer `lib/firebase/messages.ts` avec les fonctions CRUD
- ✅ Vérifier la compilation : `npx tsc --noEmit`
- ✅ **Corriger toutes les erreurs avant de continuer**
- ⏸️ **NE PAS PASSER À L'ÉTAPE 3 AVANT QUE CETTE ÉTAPE SOIT 100% VALIDÉE**

#### Étape 3 : Hooks (Phase 1.3)
- ✅ Créer les hooks **un par un**
- ✅ Vérifier la compilation après **chaque hook** : `npx tsc --noEmit`
- ✅ **Corriger toutes les erreurs avant de créer le hook suivant**
- ⏸️ **NE PAS PASSER À L'ÉTAPE 4 AVANT QUE TOUS LES HOOKS SOIENT VALIDÉS**

#### Étape 4 : Composants UI (Phase 1.4)
- ✅ Créer les composants **un par un**
- ✅ Vérifier la compilation après **chaque composant** : `npx tsc --noEmit`
- ✅ **Corriger toutes les erreurs avant de créer le composant suivant**
- ⏸️ **NE PAS PASSER À L'ÉTAPE 5 AVANT QUE TOUS LES COMPOSANTS SOIENT VALIDÉS**

#### Étape 5 : Pages (Phase 1.5)
- ✅ Créer les pages
- ✅ Vérifier la compilation : `npx tsc --noEmit`
- ✅ **Corriger toutes les erreurs avant de continuer**

#### Étape 6 : Firestore Rules (Phase 1.6)
- ✅ Ajouter les rules dans `firestore.rules`
- ✅ Tester avec l'émulateur Firebase

#### Étape 7 : Indexes Firestore (Phase 1.7)
- ✅ Ajouter les indexes dans `firestore.indexes.json`
- ✅ Déployer sur Firebase

### Règles d'or

1. **Jamais de "je vais corriger ça plus tard"** : Corriger immédiatement
2. **Jamais de compilation avec erreurs** : Toujours 0 erreur avant de continuer
3. **Un fichier à la fois** : Créer, compiler, valider, puis passer au suivant
4. **Tester les imports** : Vérifier que tous les imports sont corrects
5. **Vérifier les types** : S'assurer que tous les types sont bien définis et exportés

### Commandes utiles

```bash
# Vérifier la compilation TypeScript
npx tsc --noEmit

# Vérifier les erreurs ESLint
npm run lint

# Build pour vérifier les erreurs Next.js
npm run build
```

### En cas d'erreurs massives

Si vous avez déjà implémenté plusieurs étapes et que vous avez 1000 erreurs :

1. **Revenir à un commit propre** (comme vous l'avez fait)
2. **Repartir de zéro** en suivant cette stratégie
3. **Implémenter étape par étape** avec validation à chaque fois
4. **Ne jamais sauter les validations**

---

## Phase 1 : Fondations (Base fonctionnelle)

### 1.1 Types et Interfaces TypeScript
- [ ] Créer le fichier `types/message.ts`
- [ ] Définir l'interface `AdminMessage` avec tous les champs
- [ ] Définir l'interface `MessageRecipient` avec tous les champs
- [ ] Définir l'interface `MessageReply` (pour Phase 5)
- [ ] Définir l'interface `MessageTemplate` (pour Phase 3)
- [ ] Définir l'interface `MessageStatistics` (pour Phase 4)
- [ ] Définir l'interface `UserMessagePreferences` (pour Phase 5)
- [ ] Exporter tous les types
- [ ] **✅ CHECKPOINT : Exécuter `npx tsc --noEmit` - DOIT PASSER SANS ERREUR**

### 1.2 Firebase Functions - CRUD de base
- [ ] Créer le fichier `lib/firebase/messages.ts`
- [ ] Implémenter `createMessage()` : Créer un message et ses recipients (ADMIN uniquement)
- [ ] Implémenter `getMessagesByUser()` : Récupérer les messages d'un utilisateur (tous rôles sauf admin)
- [ ] Implémenter `getAllMessages()` : Récupérer tous les messages (ADMIN uniquement)
- [ ] Implémenter `markAsRead()` : Marquer un message comme lu (utilisateur récepteur uniquement)
- [ ] Implémenter `getUnreadCount()` : Compter les messages non lus (tous rôles sauf admin)
- [ ] Implémenter `getRecipientsByMessage()` : Récupérer les destinataires d'un message (ADMIN uniquement)
- [ ] Implémenter `updateMessageStats()` : Mettre à jour les statistiques (ADMIN uniquement)
- [ ] Implémenter `getUsersByRole()` : Récupérer les utilisateurs actifs d'un rôle spécifique (pour calcul des destinataires)
- [ ] Ajouter gestion des erreurs et validation
- [ ] **✅ CHECKPOINT : Exécuter `npx tsc --noEmit` - DOIT PASSER SANS ERREUR**

### 1.3 Hooks de base
- [ ] Créer le fichier `lib/hooks/use-messages.ts` : Hook pour récupérer les messages (comportement différent selon rôle)
  - [ ] **✅ CHECKPOINT : Vérifier `npx tsc --noEmit` après ce hook**
- [ ] Créer le fichier `lib/hooks/use-unread-messages.ts` : Hook pour messages non lus avec cache (tous rôles sauf admin)
  - [ ] **✅ CHECKPOINT : Vérifier `npx tsc --noEmit` après ce hook**
- [ ] Créer le fichier `lib/hooks/use-message-recipients.ts` : Hook pour les destinataires (ADMIN uniquement)
  - [ ] **✅ CHECKPOINT : Vérifier `npx tsc --noEmit` après ce hook**
- [ ] Créer le fichier `lib/hooks/use-create-message.ts` : Hook pour créer un message (ADMIN uniquement)
  - [ ] **✅ CHECKPOINT : Vérifier `npx tsc --noEmit` après ce hook**
- [ ] Implémenter la gestion du cache dans les hooks
- [ ] Implémenter la gestion des erreurs
- [ ] **✅ CHECKPOINT FINAL : Exécuter `npx tsc --noEmit` - DOIT PASSER SANS ERREUR**

### 1.4 Composants UI de base
- [ ] Créer le fichier `components/messages/message-modal.tsx` : Modale de notification (version basique)
  - [ ] **✅ CHECKPOINT : Vérifier `npx tsc --noEmit` après ce composant**
- [ ] Créer le fichier `components/messages/message-form.tsx` : Formulaire de création (version basique, ADMIN uniquement)
  - [ ] **✅ CHECKPOINT : Vérifier `npx tsc --noEmit` après ce composant**
- [ ] Créer le fichier `components/messages/message-list.tsx` : Liste des messages (version basique)
  - [ ] **✅ CHECKPOINT : Vérifier `npx tsc --noEmit` après ce composant**
- [ ] Créer le fichier `components/messages/message-card.tsx` : Carte de message
  - [ ] **✅ CHECKPOINT : Vérifier `npx tsc --noEmit` après ce composant**
- [ ] Créer le fichier `components/messages/message-badge.tsx` : Badge de notification dans sidebar
  - [ ] **✅ CHECKPOINT : Vérifier `npx tsc --noEmit` après ce composant**
- [ ] Ajouter les vérifications de rôle dans les composants
- [ ] **✅ CHECKPOINT FINAL : Exécuter `npx tsc --noEmit` - DOIT PASSER SANS ERREUR**

### 1.5 Pages de base
- [ ] Créer le fichier `app/admin/messages/page.tsx` : Journal admin (ADMIN uniquement, version basique)
  - [ ] **✅ CHECKPOINT : Vérifier `npx tsc --noEmit` après cette page**
- [ ] Créer le fichier `app/messages/page.tsx` : Journal utilisateur (tous rôles sauf admin, version basique)
  - [ ] **✅ CHECKPOINT : Vérifier `npx tsc --noEmit` après cette page**
- [ ] Ajouter les RouteGuard pour protéger les pages selon les rôles
- [ ] Implémenter le chargement des messages
- [ ] Implémenter l'affichage basique des listes
- [ ] **✅ CHECKPOINT FINAL : Exécuter `npx tsc --noEmit` - DOIT PASSER SANS ERREUR**

### 1.6 Firestore Rules
- [ ] Ajouter les rules pour `admin_messages` dans `firestore.rules`
- [ ] Ajouter les rules pour `message_recipients` dans `firestore.rules`
- [ ] Tester les rules avec l'émulateur Firebase
- [ ] Vérifier que seuls les admins peuvent créer/modifier/supprimer des messages
- [ ] Vérifier que les récepteurs peuvent uniquement lire leurs messages et marquer comme lu

### 1.7 Indexes Firestore
- [ ] Ajouter les indexes pour `admin_messages` dans `firestore.indexes.json`
- [ ] Ajouter les indexes pour `message_recipients` dans `firestore.indexes.json`
- [ ] Déployer les indexes sur Firebase

### 1.8 Tests Phase 1
- [ ] Tester la création d'un message (admin)
- [ ] Tester la réception d'un message (commercial)
- [ ] Tester le marquage comme lu
- [ ] Tester les permissions (vérifier qu'un commercial ne peut pas créer de message)
- [ ] Tester les 3 types de ciblage (global, rôle, personnel)

**Livrables Phase 1** :
- Système fonctionnel de base
- Envoi/réception de messages
- Modale de notification basique
- Listes de messages basiques

---

## Phase 2 : Améliorations UI/UX - Modale et Notifications

### 2.1 Modale de Notification Améliorée
- [x] Installer framer-motion si pas déjà fait
- [x] Ajouter animation d'entrée (slide-in + fade-in) dans `message-modal.tsx`
- [x] Implémenter effets visuels selon priorité (bordure pulsante pour urgent)
- [x] Ajouter indicateur de progression "Message 1/3" avec barre de progression
- [x] Implémenter navigation entre messages (boutons précédent/suivant)
- [x] Installer react-markdown si pas déjà fait
- [x] Implémenter support markdown basique (rendu avec react-markdown)
- [x] Implémenter détection automatique des URLs (liens cliquables)
- [x] Créer fonction de formatage de date relative ("Il y a 2 heures")
- [ ] Implémenter focus trap (impossible de sortir avec Tab)
- [ ] Ajouter ARIA labels complets
- [x] Rendre la modale responsive (plein écran sur mobile)
- [ ] Installer react-swipeable si pas déjà fait
- [ ] Implémenter swipe pour navigation sur mobile

### 2.2 Badge de Notification Amélioré
- [x] Ajouter animation pulsante si messages non lus (framer-motion) dans `message-badge.tsx`
- [x] Implémenter tooltip au survol avec nombre de messages
- [x] Implémenter couleur dynamique selon priorité (rouge/orange/bleu)
- [ ] Ajouter badge dans le menu navigation
- [x] Implémenter badge persistant jusqu'à lecture

### 2.3 Notification Toast
- [x] Créer le fichier `components/messages/message-toast.tsx`
- [x] Implémenter toast discret en bas à droite si commercial connecté
- [x] Implémenter clic sur toast pour ouvrir la modale
- [x] Implémenter auto-dismiss après 5 secondes (sauf urgent)
- [x] Ajouter animations d'entrée/sortie

**Livrables Phase 2** :
- Modale avec animations et effets visuels
- Badge animé et intelligent
- Système de toast pour notifications

---

## Phase 3 : Améliorations UI/UX - Formulaire et Éditeur

### 3.1 Formulaire de Création Amélioré
- [x] Implémenter compteur de destinataires dynamique (mise à jour temps réel) dans `message-form.tsx`
- [x] Créer dropdown expandable avec liste des destinataires (avec recherche)
- [x] Implémenter validation visuelle (badge vert si valide)
- [x] Ajouter indicateur de caractères restants pour titre (100 max)
- [x] Ajouter compteur de mots pour contenu
- [x] Créer modal de confirmation avant envoi avec récapitulatif
- [ ] Implémenter historique des brouillons (liste déroulante)

### 3.2 Éditeur de Contenu
- [x] Créer le fichier `components/messages/message-editor.tsx`
- [x] Implémenter toolbar markdown (gras, italique, listes, liens)
- [x] Implémenter onglets "Édition" / "Aperçu" avec rendu markdown
- [x] Implémenter sauvegarde automatique toutes les 30 secondes (brouillon)
- [x] Ajouter indicateur de sauvegarde ("Sauvegardé il y a X secondes")

### 3.3 Templates de Messages
- [x] Créer le fichier `lib/firebase/message-templates.ts`
- [x] Créer la collection Firestore `message_templates`
- [x] Créer le fichier `components/messages/template-selector.tsx`
- [x] Implémenter boutons rapides pour templates récurrents
- [x] Implémenter variables dynamiques ({nom_commercial}, {date}, etc.)
- [x] Implémenter CRUD templates (créer, modifier, supprimer)
- [x] Ajouter bibliothèque de templates dans l'interface admin

### 3.4 Messages Programmés
- [x] Créer le fichier `lib/firebase/scheduled-messages.ts`
- [x] Ajouter champ `scheduledAt` dans AdminMessage
- [x] Implémenter statut "scheduled" pour messages programmés
- [x] Créer interface de programmation (date/heure picker)
- [ ] Implémenter cron job ou Cloud Function pour envoi programmé
- [x] Implémenter annulation de message programmé

**Livrables Phase 3** :
- Formulaire enrichi avec éditeur markdown
- Système de templates
- Messages programmés

---

## Phase 4 : Améliorations UI/UX - Listes et Statistiques

### 4.1 Liste Admin Améliorée
- [x] Implémenter toggle vue grille/liste dans `app/admin/messages/page.tsx`
- [x] Implémenter tri avancé (taux de lecture, destinataires, date)
- [x] Implémenter filtres combinés avec badges de filtre actifs
- [x] Implémenter recherche full-text (titre + contenu)
- [x] Implémenter pagination avec lazy loading (20 par page)
- [ ] Installer xlsx et papaparse si pas déjà fait
- [ ] Implémenter export CSV/Excel des statistiques
- [ ] Créer graphiques de statistiques (recharts)
  - [ ] Graphique en barres : Taux de lecture par message
  - [ ] Graphique temporel : Messages envoyés par jour/semaine

### 4.2 Liste Commercial Améliorée
- [x] Implémenter toggle vue compacte/étendue dans `app/messages/page.tsx`
- [x] Implémenter marquage groupé ("Marquer tout comme lu")
- [x] Implémenter filtres rapides (chips : "Non lus", "Urgents", "Cette semaine")
- [x] Implémenter recherche dans messages reçus
- [x] Implémenter tri personnalisé (non lus en premier, puis priorité)
- [ ] Installer react-window si pas déjà fait
- [ ] Implémenter virtual scrolling pour listes longues

### 4.3 Cartes de Messages Améliorées
- [x] Implémenter hover effect (élévation de la carte) dans `message-card.tsx`
- [x] Ajouter barre colorée sur côté gauche (indicateur priorité)
- [x] Ajouter icônes contextuelles (épinglé, rappel, pièce jointe)
- [x] Implémenter statut de lecture visuel (bordure épaisse si non lu)
- [x] Ajouter animation au clic

### 4.4 Dashboard de Statistiques
- [x] Créer le fichier `app/admin/messages/statistics/page.tsx`
- [x] Implémenter métriques globales :
  - [x] Messages envoyés par période
  - [x] Taux de lecture moyen
  - [x] Temps moyen de lecture
  - [x] Messages les plus lus
- [x] Créer graphiques interactifs (recharts)
- [x] Implémenter filtres par période (jour, semaine, mois, année)

**Livrables Phase 4** :
- Listes améliorées avec filtres et recherche
- Dashboard de statistiques
- Graphiques interactifs

---

## Phase 5 : Fonctionnalités Avancées

### 5.1 Messages Épinglés
- [x] Ajouter champ `pinned: boolean` dans AdminMessage
- [x] Implémenter bouton "Épingler" dans interface admin
- [x] Implémenter affichage prioritaire (toujours en haut)
- [x] Ajouter badge spécial 📌 pour messages épinglés
- [x] Implémenter limite de 5 messages épinglés maximum

### 5.2 Rappels Automatiques
- [x] Créer le fichier `lib/utils/message-reminders.ts`
- [x] Implémenter vérification quotidienne des messages non lus > 24h
- [x] Implémenter rappel discret (toast ou badge)
- [x] Implémenter paramètre utilisateur pour fréquence des rappels
- [x] Implémenter notification sonore optionnelle (paramètre utilisateur)

### 5.3 Préférences Utilisateur
- [x] Créer le fichier `lib/firebase/user-preferences.ts`
- [x] Créer la collection Firestore `user_message_preferences`
- [x] Créer le fichier `app/settings/messages/page.tsx`
- [x] Implémenter paramètres :
  - [x] Activer/désactiver notifications sonores
  - [x] Fréquence des rappels
  - [x] Préférence d'affichage (liste/grille)
- [x] Ajouter lien vers page de paramètres depuis profil

### 5.4 Filtres Sauvegardés
- [ ] Créer le fichier `lib/firebase/saved-filters.ts`
- [ ] Implémenter sauvegarde de combinaisons de filtres
- [ ] Implémenter vues personnalisées avec filtres pré-configurés
- [ ] Créer interface pour créer/gérer les vues sauvegardées

### 5.5 Système de Réponses (Amélioration Validée)
- [ ] Créer le fichier `lib/firebase/message-replies.ts`
- [ ] Créer la collection Firestore `message_replies`
- [ ] Créer le fichier `components/messages/message-reply.tsx`
- [ ] Créer le fichier `components/messages/message-replies-list.tsx`
- [ ] Implémenter interface pour répondre aux messages (commerciaux)
- [ ] Implémenter thread de conversation (affichage des réponses)
- [ ] Implémenter notifications admin quand un commercial répond
- [ ] Implémenter statut "En attente de réponse" sur les messages
- [ ] Ajouter badge/indicateur visuel pour messages nécessitant une réponse
- [ ] Implémenter filtre "En attente" dans l'interface admin
- [ ] Ajouter les Firestore Rules pour `message_replies`
- [ ] Ajouter les indexes Firestore pour `message_replies`

### 5.6 Rich Media et Catégories (Améliorations Validées)
- [ ] Créer le fichier `lib/firebase/message-attachments.ts`
- [ ] Créer le fichier `components/messages/message-attachments.tsx`
- [ ] Créer le fichier `components/messages/message-category-selector.tsx`
- [ ] Implémenter support d'images intégrées (upload Firebase Storage)
- [ ] Implémenter support de vidéos (YouTube, Vimeo, ou upload)
- [ ] Implémenter support de pièces jointes (PDF, Excel, etc.)
- [ ] Implémenter galerie d'images dans les messages
- [ ] Implémenter catégories de messages (Formation, Commission, Maintenance, etc.)
- [ ] Implémenter tags multiples pour classification fine
- [ ] Implémenter filtrage par catégorie dans les listes
- [ ] Mettre à jour les schémas de données (AdminMessage avec images, videos, attachments, category, tags)
- [ ] Ajouter les indexes Firestore pour catégories

### 5.7 Automatisation (Amélioration Validée)
- [ ] Créer le fichier `lib/firebase/recurring-messages.ts`
- [ ] Créer le fichier `lib/firebase/message-triggers.ts`
- [ ] Implémenter messages récurrents (hebdomadaire, mensuel)
- [ ] Créer interface pour créer/gérer les messages récurrents
- [ ] Implémenter déclencheurs automatiques basés sur événements système
- [ ] Implémenter workflows automatisés (séquences de messages avec délais)
- [ ] Implémenter cron job ou Cloud Function pour exécution automatique

### 5.8 Analytics Avancés (Amélioration Validée)
- [ ] Créer le fichier `lib/utils/message-analytics.ts`
- [ ] Créer le fichier `components/messages/message-analytics-chart.tsx`
- [ ] Implémenter mesure du temps de lecture par message
- [ ] Implémenter taux de clic sur les liens
- [ ] Implémenter heatmap de lecture (quelles parties sont les plus lues)
- [ ] Implémenter taux de complétion (messages lus jusqu'au bout)
- [ ] Implémenter heure/jour optimal de lecture
- [ ] Implémenter temps de réaction (entre envoi et lecture)
- [ ] Implémenter patterns de lecture par rôle
- [ ] Implémenter comparaison périodique des performances
- [ ] Implémenter export PDF des statistiques
- [ ] Mettre à jour MessageRecipient avec readTime et readProgress

**Livrables Phase 5** :
- Messages épinglés
- Système de rappels
- Préférences utilisateur
- Filtres sauvegardés
- Système de réponses
- Rich media et catégories
- Automatisation
- Analytics avancés

---

## Phase 6 : Accessibilité et Performance

### 6.1 Accessibilité
- [ ] Implémenter navigation clavier complète (Tab order logique) dans tous les composants
- [ ] Implémenter raccourcis clavier :
  - [ ] `M` : Ouvrir mes messages
  - [ ] `N` : Nouveau message (admin)
  - [ ] `Esc` : Fermer (si autorisé)
- [ ] Ajouter focus visible sur tous les éléments interactifs
- [ ] Ajouter ARIA labels complets
- [ ] Implémenter annonces dynamiques pour lecteurs d'écran
- [ ] Ajouter landmarks sémantiques
- [ ] Vérifier contraste WCAG AA minimum

### 6.2 Performance
- [ ] Implémenter lazy loading des messages (20 par page)
- [ ] Implémenter virtual scrolling pour listes longues (react-window)
- [ ] Implémenter cache intelligent côté client (localStorage)
- [ ] Optimiser real-time updates avec Firestore onSnapshot
- [ ] Implémenter debounce pour recherche
- [ ] Ajouter memoization des composants lourds (React.memo, useMemo)

### 6.3 Optimisations Mobile
- [ ] Rendre modale plein écran sur mobile
- [ ] Implémenter swipe gestures pour navigation (react-swipeable)
- [ ] Implémenter actions rapides (swipe left pour marquer lu)
- [ ] Implémenter filtres en drawer latéral sur mobile
- [ ] Ajuster taille des boutons tactiles (min 44x44px)
- [ ] Optimiser cards empilées pour mobile

### 6.4 Performance et Scalabilité (Amélioration Validée)
- [ ] Configurer CDN pour médias (images/vidéos)
- [ ] Implémenter compression des messages longs
- [ ] Implémenter cache distribué pour haute disponibilité
- [ ] Implémenter monitoring des métriques de performance
- [ ] Implémenter alertes système en cas de problème
- [ ] Créer dashboard de santé système

**Livrables Phase 6** :
- Accessibilité complète
- Performance optimisée
- Expérience mobile fluide

---

## Phase 7 : Tests et Documentation

### 7.1 Tests
- [ ] Créer le dossier `__tests__/messages/`
- [ ] Créer `__tests__/messages/messages.test.ts` : Tests unitaires des fonctions Firebase
- [ ] Créer `__tests__/messages/message-modal.test.tsx` : Tests du composant modale
- [ ] Créer `__tests__/messages/message-form.test.tsx` : Tests du formulaire
- [ ] Créer `__tests__/messages/message-hooks.test.ts` : Tests des hooks
- [ ] Créer tests d'intégration des workflows complets
- [ ] Créer tests E2E des scénarios principaux
- [ ] Créer tests d'accessibilité (axe-core)

### 7.2 Documentation
- [ ] Ajouter documentation JSDoc aux composants
- [ ] Créer guide d'utilisation pour admins
- [ ] Créer guide d'utilisation pour commerciaux
- [ ] Créer documentation technique (architecture, décisions)
- [ ] Mettre à jour le README avec les nouvelles fonctionnalités

**Livrables Phase 7** :
- Suite de tests complète
- Documentation utilisateur et technique

---

## Dépendances à installer

### Packages npm nécessaires
- [ ] `react-markdown` (déjà présent dans package.json)
- [ ] `react-swipeable` : `npm install react-swipeable`
- [ ] `react-window` : `npm install react-window @types/react-window`
- [ ] `xlsx` : `npm install xlsx` (déjà présent dans package.json)
- [ ] `papaparse` : `npm install papaparse @types/papaparse`
- [ ] `jspdf` : `npm install jspdf` (déjà présent dans package.json)
- [ ] `framer-motion` (déjà présent dans package.json)
- [ ] `recharts` (déjà présent dans package.json)

---

## Notes importantes

### ⚠️ Implémentation Progressive (CRITIQUE)
- **TOUJOURS** valider TypeScript après chaque étape : `npx tsc --noEmit`
- **JAMAIS** passer à l'étape suivante si des erreurs TypeScript existent
- **JAMAIS** de "je corrigerai ça plus tard" - corriger immédiatement
- Voir la section "STRATÉGIE D'IMPLÉMENTATION PROGRESSIVE" en haut du document

### Sécurité
- Toujours vérifier le rôle utilisateur avant d'autoriser les actions
- Les admins peuvent tout faire
- Les récepteurs peuvent uniquement lire leurs messages et marquer comme lu
- Utiliser les Firestore Rules comme première ligne de défense

### Performance
- Limiter les requêtes Firestore (pagination, lazy loading)
- Mettre en cache les données fréquemment utilisées
- Optimiser les indexes Firestore

### Tests
- Tester chaque fonctionnalité avec les différents rôles
- Vérifier les permissions pour chaque action
- Tester les cas limites (messages vides, très longs, etc.)

---

## Ordre de priorité recommandé

1. **Phase 1** : Base fonctionnelle (obligatoire)
2. **Phase 2** : Modale améliorée (améliore l'expérience utilisateur)
3. **Phase 3** : Formulaire enrichi (améliore la création de messages)
4. **Phase 4** : Listes et statistiques (améliore la gestion)
5. **Phase 5** : Fonctionnalités avancées (enrichit le système)
6. **Phase 6** : Accessibilité et performance (optimisation)
7. **Phase 7** : Tests et documentation (qualité)

---

## Checklist de validation finale

Avant de considérer le système comme terminé :

- [ ] Tous les rôles peuvent accéder à leurs fonctionnalités
- [ ] Les admins peuvent créer/envoyer des messages
- [ ] Les récepteurs peuvent uniquement lire et marquer comme lu
- [ ] Les 3 types de ciblage fonctionnent (global, rôle, personnel)
- [ ] La modale s'affiche à la connexion si messages non lus
- [ ] Les données sont persistantes (pas de perte)
- [ ] Les Firestore Rules sont correctes et testées
- [ ] Les indexes Firestore sont déployés
- [ ] Les tests passent
- [ ] La documentation est à jour
