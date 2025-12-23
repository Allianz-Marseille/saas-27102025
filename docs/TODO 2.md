# TODO : Fonctionnalités Assistant IA

Document de référence : [FONCTIONNALITES_BOT_CHAT_AGREABLE.md](./FONCTIONNALITES_BOT_CHAT_AGREABLE.md)

---

## 📋 Légende

### Priorités
- 🔴 **Priorité 1** : Fonctionnalités essentielles (À implémenter rapidement)
- 🟡 **Priorité 2** : Améliorations importantes (À planifier)
- 🟢 **Priorité 3** : Nice to have (Améliorations futures)

### Statuts
- ⏳ **À faire** : Pas encore commencé
- 🚧 **En cours** : En développement
- ✅ **Terminé** : Implémenté et testé

### Effort
- 🔹 **Faible** : < 2h
- 🔸 **Moyen** : 2-4h
- 🔶 **Élevé** : > 4h

---

## 🔴 PRIORITÉ 1 : Fonctionnalités essentielles

Ces fonctionnalités améliorent significativement l'expérience utilisateur et sont fréquemment demandées.

### 1.1. Copier tout le chat

**Statut** : ✅ Terminé  
**Effort** : 🔹 Faible (2-3h)  
**Impact** : Très élevé  
**Complexité** : Faible

**Description** : Permettre de copier l'intégralité de la conversation en un clic avec formatage cohérent.

**Fichiers concernés** :
- `app/commun/outils/assistant-ia/page.tsx` : Ajouter fonction `handleCopyAllMessages()`
- `lib/assistant/export.ts` : Réutiliser logique formatage si existe

**Dépendances** : Aucune

**Détails d'implémentation** :
- Créer fonction qui formate tous les messages : `[Utilisateur/Assistant] - timestamp\ncontenu\n`
- Ajouter bouton "Copier tout" dans la barre d'outils (à côté de "Sauvegarder")
- Utiliser `navigator.clipboard.writeText()`
- Toast de confirmation après copie
- Formatage optionnel avec/sans timestamps (menu déroulant ou option)

**Checklist** :
- [x] Fonction `handleCopyAllMessages()` implémentée
- [x] Bouton "Copier tout" ajouté dans CardHeader
- [x] Formatage cohérent des messages (rôle + timestamp + contenu)
- [x] Gestion format texte avec emojis et séparateurs
- [x] Toast de confirmation après copie
- [x] Test : copie complète d'une conversation
- [x] Test : messages avec images (affichage `[X images]` ou similaire)
- [x] Test : conversations longues

---

### 1.2. Nouveau chat amélioré

**Statut** : ✅ Terminé  
**Effort** : 🔹 Faible (1-2h)  
**Impact** : Élevé  
**Complexité** : Faible

**Description** : Renommer "Réinitialiser" en "Nouveau chat" et ajouter confirmation si conversation non sauvegardée.

**Fichiers concernés** :
- `app/commun/outils/assistant-ia/page.tsx` : Modifier fonction `handleResetConversation()` et UI

**Dépendances** : Aucune

**Détails d'implémentation** :
- Renommer bouton "Réinitialiser" → "Nouveau chat"
- Ajouter état pour tracker si conversation modifiée depuis dernière sauvegarde
- Si messages non sauvegardés : Dialog de confirmation avec options :
  - Sauvegarder avant de continuer
  - Abandonner les modifications
  - Annuler
- Si sauvegardée ou vide : Pas de confirmation, reset direct
- Utiliser `AlertDialog` de shadcn/ui pour confirmation
- Raccourci clavier (Ctrl+N / Cmd+N)
- Animation de transition

**Checklist** :
- [x] Bouton renommé "Nouveau chat"
- [x] Détection des changements non sauvegardés
- [x] Dialog de confirmation implémenté (AlertDialog shadcn/ui)
- [x] Options : Sauvegarder et continuer / Abandonner / Annuler
- [x] Raccourci Ctrl+N / Cmd+N implémenté
- [x] Indicateur visuel sur bouton Sauvegarder (bordure orange)
- [x] Test : Reset avec conversation vide → pas de confirmation
- [x] Test : Reset avec conversation sauvegardée → pas de confirmation
- [x] Test : Reset avec modifications non sauvegardées → confirmation affichée
- [x] Test : Différents scénarios (avec/sans messages)

---

### 1.3. Recherche dans conversation active (Ctrl+F)

**Statut** : ✅ Terminé  
**Effort** : 🔶 Élevé (4-6h)  
**Impact** : Élevé  
**Complexité** : Moyenne

**Description** : Implémenter recherche native dans la conversation avec surlignage des occurrences et navigation.

**Fichiers concernés** :
- `app/commun/outils/assistant-ia/page.tsx` : Ajouter composant de recherche
- `components/assistant/SearchBar.tsx` : Nouveau composant dédié (à créer)

**Dépendances** : Aucune

**Détails d'implémentation** :
- Raccourci clavier `Cmd/Ctrl + F` pour ouvrir recherche
- Input de recherche visible (barre en haut de la zone de messages)
- Recherche en temps réel (debounce 300ms)
- Surlignage des occurrences dans les messages
- Navigation : Boutons "Précédent" / "Suivant"
- Compteur : "X sur Y résultats"
- Fermeture avec `Esc` ou bouton fermer
- Recherche insensible à la casse (optionnel : toggle case-sensitive)
- Scroll automatique vers le résultat

**Checklist** :
- [x] Créer composant SearchBar
- [x] Créer composant HighlightedText pour surlignage
- [x] Raccourci `Cmd/Ctrl + F` fonctionnel
- [x] Barre de recherche affichée/masquée avec animation
- [x] Recherche en temps réel avec debounce (300ms)
- [x] Surlignage des occurrences (jaune) et résultat actif (orange)
- [x] Navigation précédent/suivant avec boutons
- [x] Compteur de résultats (X/Y)
- [x] Scroll automatique vers résultat actif
- [x] Fermeture avec `Esc` et bouton X
- [x] Test : Recherche dans conversation longue (>50 messages)
- [x] Test : Recherche avec caractères spéciaux (échappement regex)
- [x] Test : Pas de résultat → message "Aucun résultat"

---

## 🟡 PRIORITÉ 2 : Améliorations importantes

Ces fonctionnalités apportent une vraie valeur ajoutée mais ne sont pas critiques.

### 2.1. Raccourcis clavier complets

**Statut** : ⏳ À faire  
**Effort** : 🔸 Moyen (3-4h)  
**Impact** : Moyen-Élevé  
**Complexité** : Faible-Moyenne

**Description** : Implémenter tous les raccourcis clavier recommandés pour améliorer la productivité.

**Fichiers concernés** :
- `app/commun/outils/assistant-ia/page.tsx` : Ajouter gestion raccourcis
- `components/assistant/KeyboardShortcuts.tsx` : Composant aide raccourcis (à créer)
- `lib/assistant/keyboard-shortcuts.ts` : Utilitaires raccourcis (optionnel)

**Dépendances** : 
- Bibliothèque : `react-hotkeys-hook` ou `use-hotkeys` (à installer)

**Raccourcis à implémenter** :
- `Cmd/Ctrl + N` : Nouveau chat
- `Cmd/Ctrl + S` : Sauvegarder conversation (prévenir save page)
- `Cmd/Ctrl + F` : Rechercher (déjà dans 1.3)
- `Cmd/Ctrl + E` : Exporter conversation
- `Cmd/Ctrl + K` : Ouvrir templates
- `Cmd/Ctrl + /` : Afficher aide raccourcis (Dialog avec liste)
- `Esc` : Fermer modals/dialogs (déjà partiellement implémenté)
- `Enter` : Envoyer message
- `Shift+Enter` : Nouvelle ligne

**Détails d'implémentation** :
- Installer `react-hotkeys-hook` : `npm install react-hotkeys-hook`
- Créer hook custom `useKeyboardShortcuts()`
- Gérer conflits navigateur (preventDefault si nécessaire)
- Dialog d'aide avec liste complète des raccourcis
- Indicateur visuel lors de l'utilisation d'un raccourci (optionnel)

**Checklist** :
- [ ] Bibliothèque installée (`react-hotkeys-hook`)
- [ ] Hook `useKeyboardShortcuts()` créé
- [ ] `Cmd/Ctrl + N` : Nouveau chat
- [ ] `Cmd/Ctrl + S` : Sauvegarder (prévenir save page)
- [ ] `Cmd/Ctrl + E` : Exporter
- [ ] `Cmd/Ctrl + K` : Ouvrir templates
- [ ] `Cmd/Ctrl + /` : Aide raccourcis
- [ ] `Esc` : Fermer modals
- [ ] Dialog d'aide avec liste complète
- [ ] Affichage tooltips avec raccourcis
- [ ] Compatibilité Mac (Cmd) et Windows (Ctrl)
- [ ] Désactiver raccourcis dans inputs
- [ ] Tests : Tous les raccourcis fonctionnent
- [ ] Tests : Conflits navigateur gérés correctement

---

### 2.2. Avatars pour les messages

**Statut** : ⏳ À faire  
**Effort** : 🔹 Faible (2-3h)  
**Impact** : Moyen  
**Complexité** : Faible

**Description** : Ajouter avatars pour personnaliser et distinguer visuellement utilisateur vs assistant.

**Fichiers concernés** :
- `app/commun/outils/assistant-ia/page.tsx` : Modifier affichage messages
- `components/assistant/MessageAvatar.tsx` : Nouveau composant (à créer)
- Composant : `@/components/ui/avatar` (déjà disponible)

**Dépendances** : Aucune (composant Avatar déjà disponible), Données utilisateur (userData)

**Détails d'implémentation** :
- Avatar utilisateur : Initiales ou icône personnalisée (depuis `userData`)
- Avatar assistant : Icône Bot (déjà utilisée)
- Taille : `size-8` (32px) ou `size-10` (40px)
- Position : À gauche du message (utilisateur à droite, assistant à gauche)
- Fallback : Initiales si pas de photo
- Performance : Lazy loading si beaucoup d'avatars
- Design moderne et cohérent

**Checklist** :
- [ ] Créer composant MessageAvatar
- [ ] Avatar utilisateur affiché (initiales ou photo si disponible)
- [ ] Avatar assistant affiché (icône Bot)
- [ ] Position correcte (user right, assistant left)
- [ ] Fallback initiales fonctionnel
- [ ] Ajuster le layout des messages
- [ ] Taille appropriée et responsive
- [ ] Test : Utilisateur sans photo → initiales affichées
- [ ] Test : Différents utilisateurs

---

### 2.3. Auto-resize textarea

**Statut** : ⏳ À faire  
**Effort** : 🔹 Faible (1-2h)  
**Impact** : Moyen  
**Complexité** : Faible

**Description** : Textarea qui s'agrandit automatiquement selon le contenu, jusqu'à une limite max.

**Fichiers concernés** :
- `app/commun/outils/assistant-ia/page.tsx` : Modifier Textarea
- `components/ui/textarea.tsx` : Ou créer AutoResizeTextarea

**Dépendances** : Optionnel : `react-textarea-autosize` (sinon implémentation CSS/JS)

**Détails d'implémentation** :
- Méthode 1 : Utiliser `react-textarea-autosize` (recommandé, simple)
- Méthode 2 : CSS/JS custom avec `scrollHeight`
- Limite max : 10-15 lignes avant activation du scroll
- Transition smooth pour l'agrandissement
- Réinitialisation après envoi
- Hauteur min/max définie
- Expansion automatique pendant la saisie
- Scroll interne si max atteinte

**Checklist** :
- [ ] Implémenter logique auto-resize
- [ ] Textarea s'agrandit avec le contenu
- [ ] Définir hauteur min (60px) et max (200px)
- [ ] Limite max respectée (scroll activé après X lignes)
- [ ] Transition smooth
- [ ] Gérer scroll interne
- [ ] Réinitialisation après envoi
- [ ] Test : Texte long → scroll activé correctement
- [ ] Test : Performance (pas de lag lors de la saisie)
- [ ] Test : Sur mobile

---

### 2.4. Bouton "Aller en bas"

**Statut** : ⏳ À faire  
**Effort** : 🔹 Faible (1-2h)  
**Impact** : Faible-Moyen  
**Complexité** : Faible

**Description** : Bouton flottant pour retourner en bas de la conversation si l'utilisateur a remonté.

**Fichiers concernés** :
- `app/commun/outils/assistant-ia/page.tsx` : Ajouter bouton et logique scroll
- `components/assistant/ScrollToBottom.tsx` : Nouveau composant (à créer)

**Dépendances** : Aucune

**Détails d'implémentation** :
- Détecter position scroll (via `scrollTop` et `scrollHeight`)
- Afficher bouton seulement si utilisateur n'est pas en bas
- Bouton flottant en bas à droite de la zone de messages
- Animation d'apparition/disparition (fade)
- Clic : Scroll smooth vers le bas
- Icône : Flèche vers le bas (`ChevronDown` de Lucide)
- Badge avec nombre de nouveaux messages (optionnel)

**Checklist** :
- [ ] Créer composant ScrollToBottom
- [ ] Détection position scroll implémentée
- [ ] Bouton affiché uniquement si pas en bas
- [ ] Bouton flottant positionné correctement
- [ ] Animation apparition/disparition
- [ ] Smooth scroll vers le bas au clic
- [ ] Position fixe en bas à droite
- [ ] Badge nouveaux messages (optionnel)
- [ ] Test : Remonter → bouton apparaît
- [ ] Test : Descendre en bas → bouton disparaît

---

### 2.5. Export Markdown

**Statut** : ⏳ À faire  
**Effort** : 🔹 Faible (2-3h)  
**Impact** : Faible-Moyen  
**Complexité** : Faible

**Description** : Ajouter format Markdown à l'export de conversations.

**Fichiers concernés** :
- `lib/assistant/export.ts` : Ajouter fonction `exportToMarkdown()`
- `app/api/assistant/export/route.ts` : Ajouter case `markdown`
- `app/commun/outils/assistant-ia/page.tsx` : Ajouter option export Markdown

**Dépendances** : Aucune (formatage manuel), Fonction export existante

**Détails d'implémentation** :
- Fonction `exportToMarkdown(conversation: Conversation): string`
- Formatage :
  - Titre : `# Conversation: {title}`
  - Métadonnées : Date, nombre de messages
  - Messages : `## [Utilisateur/Assistant] - {timestamp}` + contenu
  - Préserver markdown existant dans les messages
- API route : Ajouter case `markdown` dans le switch
- UI : Ajouter option dans menu export (si menu existe) ou bouton séparé
- Téléchargement fichier .md
- Préservation du formatage
- Inclusion métadonnées (date, participants)
- Gérer images (liens ou base64)

**Checklist** :
- [ ] Fonction `exportToMarkdown()` implémentée
- [ ] Formatage Markdown correct
- [ ] API route supporte format `markdown`
- [ ] Préserver formatage Markdown
- [ ] Ajouter métadonnées en en-tête
- [ ] Gérer images (liens ou base64)
- [ ] UI : Option export Markdown ajoutée
- [ ] Bouton export dans menu
- [ ] Téléchargement fichier `.md` fonctionnel
- [ ] Test : Export conversation avec markdown → préservé
- [ ] Test : Export conversation longue → format correct

---

### 2.6. Télécharger conversation en image

**Statut** : ⏳ À faire  
**Effort** : 🔶 Élevé (6-8h)  
**Impact** : Moyen  
**Complexité** : Moyenne

**Description** : Générer une image (PNG/JPG) formatée de la conversation pour partage.

**Fichiers concernés** :
- `lib/assistant/export-image.ts` : Nouveau fichier pour logique export image (à créer)
- `lib/assistant/export.ts` : Ajouter fonction `exportToImage()`
- `app/commun/outils/assistant-ia/page.tsx` : Ajouter fonction export image

**Dépendances** : 
- `html2canvas` : ✅ Déjà installé
- Gestion de la taille (conversations longues → pagination ou chunking)

**Détails d'implémentation** :
- Utiliser `html2canvas` pour capturer la zone de messages
- Formatage : Styles pour rendre l'image professionnelle
  - Fond blanc
  - Messages bien espacés
  - Avatars si disponibles
  - Timestamps formatés
- Gestion conversations longues :
  - Option 1 : Capture complète (risque OOM si très longue)
  - Option 2 : Pagination (plusieurs images)
- Résolution : Haute résolution pour partage (2x ou 3x)
- Format : PNG (meilleure qualité) ou JPG (taille réduite)
- Téléchargement : Trigger download automatique
- Option : sélectionner partie de conversation

**Checklist** :
- [ ] Installer html2canvas
- [ ] Créer fonction `exportToImage()`
- [ ] Fonction `exportConversationToImage()` implémentée
- [ ] Utilisation `html2canvas` pour capture
- [ ] Formatage professionnel de l'image
- [ ] Gérer format PNG/JPG
- [ ] Option résolution
- [ ] Gestion conversations longues (pagination/découpage si nécessaire)
- [ ] Haute résolution pour partage
- [ ] Bouton export image
- [ ] Loading state pendant génération
- [ ] Téléchargement fonctionnel
- [ ] Test : Export conversation courte → image correcte
- [ ] Test : Export conversation longue → pas d'OOM
- [ ] Test : Performance acceptable
- [ ] Test : Différentes tailles

---

### 2.7. Amélioration de l'accessibilité (a11y)

**Statut** : ⏳ À faire  
**Effort** : 🔸 Moyen (4-6h)  
**Impact** : Moyen (important pour certains utilisateurs)  
**Complexité** : Moyenne

**Description** : Améliorer l'accessibilité pour conformité WCAG 2.1 AA minimum.

**Fichiers concernés** :
- `app/commun/outils/assistant-ia/page.tsx` : Ajouter attributs ARIA
- Tous les composants UI utilisés
- Tous les composants assistant

**Dépendances** : Aucune (attributs ARIA natifs)

**Détails d'implémentation** :
- **Attributs ARIA** :
  - Boutons sans texte visible : `aria-label`
  - Modals : `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
  - Zones live : `aria-live="polite"` pour nouveaux messages
  - Formulaires : `aria-required`, `aria-invalid`
- **Navigation clavier** :
  - Focus visible : Ring Tailwind `focus-visible:ring-2` (déjà partiellement présent)
  - Ordre logique : Tab order cohérent
  - Escape : Fermer modals (déjà partiellement implémenté)
- **Contraste** :
  - Vérifier tous les textes (ratio 4.5:1 minimum)
  - Texte large : 3:1 minimum
  - Utiliser outil de vérification de contraste
- **Lecteurs d'écran** :
  - Tester avec NVDA/JAWS/VoiceOver
  - Landmarks : `role="main"`, `role="navigation"`
  - Labels : Tous les inputs doivent avoir des `<Label>`
- **Réduction de mouvement** :
  - Respecter `prefers-reduced-motion`
  - CSS : `@media (prefers-reduced-motion: reduce)`

**Checklist** :
- [ ] Audit accessibilité avec Lighthouse
- [ ] Tous les boutons ont `aria-label` si nécessaire
- [ ] Modals ont attributs ARIA corrects
- [ ] Zone de messages : `aria-live="polite"`
- [ ] Focus visible sur tous les éléments interactifs
- [ ] Tab order logique et cohérent
- [ ] Contraste vérifié (ratio 4.5:1 minimum)
- [ ] Tester navigation clavier
- [ ] Vérifier contraste couleurs
- [ ] Tests avec lecteur d'écran (NVDA/VoiceOver)
- [ ] Tester avec lecteur d'écran
- [ ] Ajouter skip links
- [ ] `prefers-reduced-motion` respecté
- [ ] Labels sur tous les inputs

---

### 2.8. Sidebar responsive avec historique

**Statut** : ⏳ À faire  
**Effort** : 🔶 Élevé (4-6h)  
**Impact** : Moyen  
**Complexité** : Moyenne

**Description** : Améliorer la sidebar d'historique avec layout responsive (drawer sur mobile).

**Fichiers concernés** :
- `app/commun/outils/assistant-ia/page.tsx` : Modifier layout
- `components/assistant/ConversationSidebar.tsx` : Nouveau composant (à créer)
- Potentiellement : Nouveau composant `Sidebar.tsx`

**Dépendances** : 
- Composant : `Sheet` de shadcn/ui (à installer : `npx shadcn@latest add sheet`)
- API conversations

**Détails d'implémentation** :
- **Desktop (> 1024px)** : Sidebar fixe (300-400px) à gauche, chat principal flex-1
- **Mobile/Tablet (< 1024px)** : Drawer/Sheet qui s'ouvre depuis bouton
- Composant `Sheet` de shadcn/ui pour drawer mobile
- Bouton toggle sidebar (hamburger menu) visible sur mobile
- Transition smooth ouverture/fermeture
- Overlay sur mobile (fond sombre)
- Sidebar rétractable (desktop)
- Drawer mobile
- Liste des conversations récentes
- Recherche dans l'historique
- Affichage complet de l'historique (déplacer depuis onglet)

**Checklist** :
- [ ] Composant `Sheet` installé
- [ ] Créer composant ConversationSidebar
- [ ] Layout avec sidebar rétractable
- [ ] Sidebar fixe sur desktop (> 1024px)
- [ ] Drawer/Sheet sur mobile (< 1024px)
- [ ] Drawer pour mobile
- [ ] Intégrer liste conversations
- [ ] Recherche et filtres
- [ ] Supprimer onglet "Historique"
- [ ] Persistance état sidebar (localStorage)
- [ ] Bouton toggle visible sur mobile
- [ ] Transition smooth
- [ ] Animations d'ouverture/fermeture
- [ ] Overlay sur mobile
- [ ] Test : Desktop → sidebar fixe fonctionnelle
- [ ] Test : Mobile → drawer s'ouvre/ferme correctement
- [ ] Test : Responsive breakpoints respectés
- [ ] Tests responsive

---

### 2.9. Réponses rapides / Suggestions

**Statut** : ⏳ À faire  
**Effort** : 🔶 Élevé (8-12h)  
**Impact** : Moyen  
**Complexité** : Moyenne

**Description** : Proposer des réponses rapides ou suggestions de questions pour améliorer l'efficacité.

**Fichiers concernés** :
- `components/assistant/QuickReplies.tsx` : Nouveau composant (à créer)
- `app/commun/outils/assistant-ia/page.tsx` : Intégrer composant
- `lib/assistant/suggestions.ts` : Logique suggestions (à créer)

**Dépendances** : Aucune, Templates, historique utilisateur

**Détails d'implémentation** :
- **Suggestions de questions au démarrage** :
  - Afficher 3-5 suggestions quand conversation vide
  - Clic sur suggestion → remplir textarea et focus
- **Réponses rapides sous messages assistant** :
  - Afficher 2-3 boutons de réponses rapides
  - Logique : Basée sur contexte du message ou suggestions génériques
  - Clic → remplir textarea avec réponse
- Design : Boutons avec style discret (outline ou ghost)
- Position : En dessous du message assistant
- Questions suggérées au démarrage
- Réponses rapides contextuelles
- Personnalisation selon historique utilisateur
- Templates rapides

**Checklist** :
- [ ] Composant `QuickReplies` créé
- [ ] Définir questions fréquentes
- [ ] Logique suggestions contextuelles
- [ ] Intégration avec templates
- [ ] Personnalisation selon historique
- [ ] Suggestions au démarrage affichées
- [ ] Clic suggestion → remplit textarea
- [ ] Réponses rapides sous messages assistant
- [ ] UI avec chips/boutons
- [ ] Design cohérent avec UI existante
- [ ] Test : Suggestions pertinentes
- [ ] Test : Clic fonctionne correctement
- [ ] Tests suggestions pertinentes

---

### 2.10. Amélioration export PDF

**Statut** : ⏳ À faire  
**Effort** : 🔸 Moyen (2-3h)  
**Impact** : Moyen  
**Complexité** : Faible-Moyenne

**Description** : Améliorer l'export PDF existant avec mise en page professionnelle.

**Fichiers concernés** :
- `app/api/assistant/export/route.ts` : Améliorer la route existante
- `lib/assistant/export.ts` : Améliorer les fonctions

**Dépendances** : API export existante

**Détails d'implémentation** :
- En-tête avec logo Allianz
- Mise en page structurée
- Préservation du formatage
- Table des matières (si long)
- Numérotation des pages

**Checklist** :
- [ ] Améliorer template PDF
- [ ] Ajouter en-tête/pied de page
- [ ] Intégrer logo Allianz
- [ ] Préserver formatage Markdown
- [ ] Table des matières pour conversations longues
- [ ] Numérotation pages
- [ ] Tester avec conversations variées

---

## 🟢 PRIORITÉ 3 : Fonctionnalités avancées

Ces fonctionnalités sont agréables à avoir mais non essentielles.

### 3.1. Mode sombre

**Statut** : ⏳ À faire  
**Effort** : 🔸 Moyen (4-6h sans tous composants / 12-16h tous composants)  
**Impact** : Faible (cosmétique)  
**Complexité** : Moyenne (si tous composants) / Élevée (tous composants)

**Description** : Toggle de thème sombre/clair avec préférence sauvegardée.

**Fichiers concernés** :
- Tous les composants UI (ajout classes `dark:`)
- Tous les composants assistant
- `app/layout.tsx` : Ajouter `ThemeProvider` de `next-themes`
- Configuration : `tailwind.config.ts` : `darkMode: 'class'`
- Configuration Tailwind déjà en place

**Dépendances** : 
- `next-themes` : ✅ Déjà installé

**Détails d'implémentation** :
- Configuration Tailwind : `darkMode: 'class'`
- Provider `ThemeProvider` au root de l'app
- Toggle dans header ou paramètres
- Ajouter classes `dark:` pour tous les styles
- Stockage préférence : `localStorage` (géré par next-themes)
- Option : Détection préférence système
- Toggle light/dark/auto
- Persistance préférence
- Respect préférence système
- Transition fluide

**Checklist** :
- [ ] Tailwind configuré pour dark mode (`darkMode: 'class'`)
- [ ] `ThemeProvider` ajouté au layout
- [ ] Toggle UI implémenté
- [ ] Toggle dans UI
- [ ] Tous les composants supportent dark mode
- [ ] Vérifier classes dark: dans tous composants
- [ ] Tester contraste en mode sombre
- [ ] Ajuster couleurs si nécessaire
- [ ] Contraste vérifié en dark mode (WCAG AA)
- [ ] Préférence sauvegardée
- [ ] Test : Basculement thème fonctionne
- [ ] Tester transition
- [ ] Test : Préférence persiste après refresh
- [ ] Vérifier images/icônes

---

### 3.2. Partage de conversation

**Statut** : ⏳ À faire  
**Effort** : 🔶 Élevé (12-16h)  
**Impact** : Faible (cas d'usage limité)  
**Complexité** : Élevée

**Description** : Système de liens partageables pour conversations (avec permissions).

**Fichiers concernés** :
- `app/api/assistant/share/route.ts` : Nouvelle route API (à créer)
- `app/shared/[shareId]/page.tsx` : Page publique (à créer)
- `lib/assistant/sharing.ts` : Logique partage (à créer)
- `app/commun/outils/assistant-ia/page.tsx` : UI partage
- Firestore : Collection `shared_conversations`

**Dépendances** : Aucune, Base de données pour stocker liens

**Détails d'implémentation** :
- Génération UUID pour chaque conversation partagée
- Collection Firestore `shared_conversations` :
  - `shareId`, `conversationId`, `userId`, `createdAt`, `expiresAt` (TTL optionnel)
- Permissions : Lecture seule pour liens partagés
- UI : Bouton "Partager" → génère lien → copie dans presse-papiers
- Page publique : Route `/share/[shareId]` pour visualiser conversation partagée
- Expiration : Option TTL (ex: 7 jours, 30 jours, jamais)
- Génération lien de partage unique
- Page publique consultation seule
- Option expiration lien
- Protection par mot de passe (optionnel)

**Checklist** :
- [ ] Créer table shares dans Firestore
- [ ] Route API `/api/assistant/share` créée
- [ ] Collection Firestore `shared_conversations` créée
- [ ] Génération UUID fonctionnelle
- [ ] API génération lien partage
- [ ] UI : Bouton "Partager" avec génération lien
- [ ] Copie lien dans presse-papiers
- [ ] Page publique `/share/[shareId]` créée
- [ ] Page publique de consultation
- [ ] Permissions : Lecture seule fonctionnelle
- [ ] Gestion expiration
- [ ] TTL optionnel (expiration)
- [ ] Option mot de passe
- [ ] Bouton partage dans UI
- [ ] Statistiques de consultation (optionnel)
- [ ] Test : Partage → lien fonctionne
- [ ] Test : Lien expiré → message approprié
- [ ] Tests sécurité : Accès non autorisé bloqué

---

### 3.3. Messages épinglés

**Statut** : ⏳ À faire  
**Effort** : 🔸 Moyen (6-8h)  
**Impact** : Faible  
**Complexité** : Moyenne

**Description** : Permettre d'épingler des messages importants dans une conversation.

**Fichiers concernés** :
- `app/commun/outils/assistant-ia/page.tsx` : Logique épinglage
- `components/assistant/PinnedMessages.tsx` : Nouveau composant (à créer)
- Interface `Message` : Ajouter champ `pinned?: boolean`
- Firestore : Ajouter champ `pinned` aux messages
- Interface Message étendue

**Dépendances** : Aucune

**Détails d'implémentation** :
- Ajouter champ `pinned: boolean` à l'interface `Message`
- Bouton épingler/désépingler sur chaque message (hover)
- Affichage messages épinglés en haut de la conversation (section dédiée)
- Sauvegarde état épinglé dans Firestore
- Indicateur visuel : Badge ou icône épinglé
- Limite : Maximum X messages épinglés par conversation (optionnel)
- Épingler/désépingler message
- Section messages épinglés en haut
- Accès rapide aux messages épinglés
- Badge visuel

**Checklist** :
- [ ] Interface `Message` mise à jour (`pinned?: boolean`)
- [ ] Étendre interface Message avec isPinned
- [ ] Bouton épingler/désépingler ajouté
- [ ] Bouton épingler sur chaque message
- [ ] Composant PinnedMessages
- [ ] Section messages épinglés en haut
- [ ] Section collapsible en haut
- [ ] Sauvegarde dans Firestore
- [ ] Sauvegarde dans conversation
- [ ] Indicateur visuel (badge/icône)
- [ ] Limite nombre messages épinglés
- [ ] Animations
- [ ] Test : Épingler → message apparaît en haut
- [ ] Test : Désépingler → message retourne position originale
- [ ] Test : Persistance après refresh

---

### 3.4. Personnalisation UI

**Statut** : ⏳ À faire  
**Effort** : 🔶 Élevé (12-16h base / 20-30h complet)  
**Impact** : Faible  
**Complexité** : Élevée

**Description** : Paramètres de personnalisation (taille police, densité, couleur accent).

**Fichiers concernés** :
- `app/commun/outils/assistant-ia/page.tsx` : Appliquer préférences
- `app/commun/outils/assistant-ia/settings/page.tsx` : Nouvelle page paramètres (à créer)
- `components/assistant/SettingsPanel.tsx` : Panneau paramètres (à créer)
- `lib/assistant/preferences.ts` : Gestion préférences (à créer)
- `lib/assistant/settings.ts` : Utilitaires (à créer)
- Firestore : Collection `user_preferences`
- Tous les composants UI (application des préférences)

**Dépendances** : Aucune, localStorage pour persistance

**Détails d'implémentation** :
- **Page paramètres** :
  - Taille police : Small, Normal, Large (via CSS variables)
  - Densité : Compact, Normal, Comfortable (espacement)
  - Couleur accent : Palette prédéfinie (sécurité design)
- **Stockage** : Firestore collection `user_preferences`
- **Application** : Provider React pour préférences
- **CSS Variables** : Utilisation pour taille police et espacement
- **Couleur accent** : CSS variables HSL dynamiques
- Taille police
- Espacement messages
- Couleurs personnalisées
- Disposition (compact/confortable)
- Affichage timestamps

**Checklist** :
- [ ] Créer interface UserSettings
- [ ] Composant SettingsPanel
- [ ] Page paramètres créée
- [ ] Options taille police
- [ ] Options espacement
- [ ] Thème couleurs
- [ ] Mode compact/confortable
- [ ] Options personnalisation : Taille police, densité, couleur
- [ ] Stockage Firestore fonctionnel
- [ ] Persistance localStorage
- [ ] Provider React pour préférences
- [ ] Application des préférences dans tous les composants
- [ ] CSS Variables utilisées
- [ ] Synchronisation avec compte (optionnel)
- [ ] Test : Changement taille police → appliqué
- [ ] Test : Changement densité → appliqué
- [ ] Test : Préférences synchronisées entre devices

---

### 3.5. Statistiques d'utilisation

**Statut** : ⏳ À faire  
**Effort** : 🔶 Élevé (8-10h)  
**Impact** : Faible (utile pour admins)  
**Complexité** : Moyenne

**Description** : Tableau de bord avec métriques d'utilisation pour les administrateurs.

**Fichiers concernés** :
- `app/commun/outils/assistant-ia/stats/page.tsx` : Page statistiques (à créer)
- `app/admin/assistant-analytics/page.tsx` : Nouvelle page (ou extension existante)
- `components/assistant/StatsCharts.tsx` : Graphiques (à créer)
- `lib/assistant/analytics.ts` : Calculs statistiques (à créer)
- Firestore : Collection `assistant_analytics` (agrégation)

**Dépendances** : Aucune, Données monitoring existantes, librairie charts (recharts)

**Détails d'implémentation** :
- **Métriques** :
  - Nombre total de conversations
  - Nombre total de messages
  - Coûts par utilisateur
  - Temps de réponse moyen
  - Formats de fichiers les plus utilisés
  - Conversations les plus actives
- **Agrégation** : Calcul côté serveur ou client
- **Visualisation** : Graphiques (Recharts déjà installé)
- **Périodes** : Aujourd'hui, cette semaine, ce mois, tout le temps
- **Permissions** : Admin uniquement
- Nombre de conversations
- Messages envoyés/reçus
- Tokens utilisés
- Graphiques temporels
- Sujets fréquents

**Checklist** :
- [ ] Installer recharts
- [ ] API récupération statistiques
- [ ] Page statistiques
- [ ] Page analytics créée (admin uniquement)
- [ ] Calculs statistiques implémentés
- [ ] Graphiques visualisation (Recharts)
- [ ] Graphiques conversations/temps
- [ ] Graphiques tokens utilisés
- [ ] Top sujets/templates
- [ ] Métriques : Conversations, messages, coûts, temps réponse
- [ ] Filtres par période
- [ ] Export statistiques
- [ ] Période sélectionnable
- [ ] Permissions admin vérifiées
- [ ] Test : Données correctes affichées
- [ ] Test : Performance acceptable (pas de lag)

---

## 📋 Checklist générale d'implémentation

Pour chaque fonctionnalité, suivre ces étapes :

### Avant développement
- [ ] Lire la documentation de référence dans `FONCTIONNALITES_BOT_CHAT_AGREABLE.md`
- [ ] Comprendre les contraintes techniques spécifiques
- [ ] Vérifier les dépendances nécessaires
- [ ] Identifier les fichiers concernés

### Pendant le développement
- [ ] Suivre les bonnes pratiques React/Next.js
- [ ] Utiliser TypeScript avec typage strict
- [ ] Respecter le système de design (Tailwind, shadcn/ui)
- [ ] Gérer les erreurs proprement
- [ ] Ajouter des commentaires si nécessaire

### Tests
- [ ] Test manuel de la fonctionnalité
- [ ] Test des cas limites
- [ ] Test responsive (mobile/tablet/desktop)
- [ ] Test accessibilité (navigation clavier, lecteur d'écran)
- [ ] Test performance (pas de lag)

### Après développement
- [ ] Code review (si applicable)
- [ ] Documentation mise à jour si nécessaire
- [ ] Tests en staging avant production
- [ ] Déploiement progressif si possible

---

## 📝 Notes d'implémentation

### Bonnes pratiques

1. **Ordre d'implémentation** : Commencer par les fonctionnalités indépendantes
2. **Tests** : Tester chaque fonctionnalité avant de passer à la suivante
3. **Documentation** : Documenter les nouvelles fonctions/composants
4. **Code Review** : Faire relire le code avant merge
5. **Déploiement** : Tester en staging avant production

### Fichiers principaux

- `app/commun/outils/assistant-ia/page.tsx` : Composant principal du chat
- `lib/assistant/export.ts` : Fonctions d'export
- `components/assistant/` : Nouveaux composants UI
- `lib/assistant/` : Utilitaires et helpers
- `app/api/assistant/` : Routes API

### Dépendances potentielles à installer

```bash
# Pour export image
npm install html2canvas

# Pour statistiques
npm install recharts

# Pour raccourcis clavier
npm install react-hotkeys-hook

# Pour auto-resize textarea (optionnel)
npm install react-textarea-autosize

# Déjà installés
- react-markdown
- remark-gfm
- react-syntax-highlighter
- next-themes
```

---

## 📊 Progression globale

### Par priorité
- **🔴 Priorité 1** : 3/3 fonctionnalités (100%) ✅
- **🟡 Priorité 2** : 0/10 fonctionnalités (0%)
- **🟢 Priorité 3** : 0/5 fonctionnalités (0%)

### Total général
**3/18 fonctionnalités terminées (16.7%)**

### Répartition des efforts
- 🔹 **Faible** : 6 fonctionnalités (33%)
- 🔸 **Moyen** : 5 fonctionnalités (28%)
- 🔶 **Élevé** : 7 fonctionnalités (39%)

---

## 📊 Résumé des estimations

### Priorité 1 (Essentiel)
- **Total** : 7-11h
- **Fonctionnalités** : 3

### Priorité 2 (Important)
- **Total** : 31-48h
- **Fonctionnalités** : 10

### Priorité 3 (Nice to have)
- **Total** : 42-76h
- **Fonctionnalités** : 5

### **Total global** : 80-135h

---

## 🎯 Ordre recommandé d'implémentation

Pour un développement cohérent et efficace :

1. **Phase 1 - Fondations** (Priorité 1)
   - 1.2. Nouveau chat amélioré (plus simple)
   - 1.1. Copier tout le chat (indépendant)
   - 1.3. Recherche conversation (plus complexe)

2. **Phase 2 - UI de base** (Priorité 2)
   - 2.3. Auto-resize textarea (simple, amélioration immédiate)
   - 2.4. Bouton "Aller en bas" (simple)
   - 2.2. Avatars messages (visuel, impact UX)
   - 2.8. Sidebar responsive (layout)

3. **Phase 3 - Productivité** (Priorité 2)
   - 2.1. Raccourcis clavier (productivité)
   - 2.9. Réponses rapides (efficacité)

4. **Phase 4 - Export et partage** (Priorité 2)
   - 2.5. Export Markdown (simple)
   - 2.6. Export image (plus complexe)
   - 2.10. Amélioration export PDF

5. **Phase 5 - Accessibilité** (Priorité 2)
   - 2.7. Amélioration accessibilité (important pour inclusivité)

6. **Phase 6 - Améliorations avancées** (Priorité 3)
   - À planifier selon besoins et retours utilisateurs

---

*Document créé le : 2025-01-27*  
*Dernière mise à jour : 21 décembre 2024 - 18h30*  
*Basé sur : [FONCTIONNALITES_BOT_CHAT_AGREABLE.md](./FONCTIONNALITES_BOT_CHAT_AGREABLE.md)*

---

## 📝 Changelog

### 21 décembre 2024 - 18h30
**🔴 PRIORITÉ 1 - TERMINÉE (3/3) ✅**

- ✅ **1.1. Copier tout le chat** : Implémenté avec formatage professionnel, emojis, et gestion des images
- ✅ **1.2. Nouveau chat amélioré** : Renommé, détection des changements non sauvegardés, dialog de confirmation, raccourci Ctrl+N
- ✅ **1.3. Recherche dans conversation active (Ctrl+F)** : SearchBar avec surlignage, navigation, compteur, scroll automatique

**Fichiers modifiés :**
- `app/commun/outils/assistant-ia/page.tsx` : Intégration de toutes les fonctionnalités
- `components/assistant/SearchBar.tsx` : Nouveau composant (créé)
- `components/assistant/HighlightedText.tsx` : Nouveau composant (créé)
