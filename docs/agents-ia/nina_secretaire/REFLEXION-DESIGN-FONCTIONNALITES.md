# Nina — Bot Secrétaire : réflexion design, UI & fonctionnalités

> Document de réflexion pour le développement du bot Nina.  
> Lieu : `docs/agents-ia/nina_secretaire/`  
> Visuels Nina : `public/agents-ia/bot-secretaire/avatar.jpg` (page), `avatar-tete.jpg` (icône chat).

---

## Icône du chat Nina

**Dans le chat (bulles Nina, en-tête, indicateur “Nina écrit…”)**, utiliser l’icône **`/agents-ia/bot-secretaire/avatar-tete.jpg`** (fichier : `public/agents-ia/bot-secretaire/avatar-tete.jpg`).

| Contexte | URL dans l'app |
|----------|----------------|----------------|
| Icône du chat Nina | `/agents-ia/bot-secretaire/avatar-tete.jpg` |

À utiliser pour : avatar à côté des messages de Nina, écran d'accueil du chat, typing indicator, etc.

---

## 1. Cahier des charges (rappels)

| Exigence | Détail |
|----------|--------|
| **Page pleine** | Le bot occupe toute la page, pas limité à un container ou un drawer. |
| **Bouton retour** | Retour clair vers la liste des agents IA (ou la page précédente). |
| **Lancement par "Bonjour"** | Un bouton "Bonjour" cliquable lance le bot : Nina salue en retour et demande ce qu’on veut faire. |
| **Chat auto-focus** | La zone de saisie est sélectionnée par défaut pour une conversation fluide, sans clic préalable. |
| **Documents & visuels** | Téléverser des documents + coller une capture d’écran (Ctrl+V / Cmd+V). |
| **Copier une réponse** | Pouvoir copier le contenu d’une réponse du bot pour la coller ailleurs. |
| **Exporter en PDF** | Générer un fichier PDF à partir d’une réponse ou d’un fil de conversation. |
| **Ergonomie globale** | Convivial, facile, tout ce qui fait d’un bot un outil agréable au quotidien. |

---

## 2. Architecture de la page (fullscreen)

### 2.1 Structure proposée

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Retour]    Nina — Bot Secrétaire                    [···]    │  ← Barre fixe, toujours visible
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    Zone conversation                      │   │
│   │  (messages, bulles, marque de temps, pièces jointes)      │   │
│   │                                                           │   │
│   │  — Soit écran d’accueil : avatar + "Bonjour"              │   │
│   │  — Soit fil de messages (scroll)                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  [📎 Doc] [🖼 Image]  │  Zone de saisie (auto-focus)     │   │
│   │                       │  Placeholder: "Message…"          │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

- **Layout** : `min-h-screen`, flex colonne, barre supérieure en `shrink-0`, zone conversation en `flex-1 overflow-auto`, zone de saisie en `shrink-0`.
- **Pas de sidebar** ni de panneau latéral : toute la largeur dédiée au duo “conversation + saisie”.
- **Responsive** : sur mobile, même structure en pile ; barre courte (retour + titre) pour garder un maximum d’espace au chat.

### 2.2 Bouton retour

- Position : **en tête**, à gauche du titre.
- Action : `Link` ou `router.back()` vers `/commun/agents-ia` (ou referrer).
- Accessibilité : `aria-label="Retour aux agents IA"`.
- Touche **Escape** : peut fermer des modales (ex. menu “···”) ou, selon choix produit, ramener à la liste des agents.

---

## 3. Écran d’accueil et bouton "Bonjour"

### 3.1 État initial (aucun message)

- **Visuel** : icône Nina = `/agents-ia/bot-secretaire/avatar-tete.jpg`. Avatar centré ou légèrement décalé, dans une zone aérée.
- **Texte court** : du type “Je suis Nina, votre assistante secrétaire.”
- **CTA principal** : un seul bouton bien visible, **“Bonjour”** (ou “Dire bonjour”), cliquable.
- Pas de zone de saisie obligatoire pour “démarrer” : un clic sur “Bonjour” suffit.

### 3.2 Comportement au clic sur "Bonjour"

1. Le bouton peut afficher un léger état de chargement (spinner ou désactivation courte).
2. **Message utilisateur** (optionnel) : soit rien, soit une bulle “Bonjour” côté user.
3. **Réponse Nina** (système) :  
   - Salutation en retour.  
   - Question ouverte du type : “Que souhaitez-vous faire ?” ou “Comment puis-je vous aider aujourd’hui ?”.
4. Dès cette première réponse :
   - La zone de saisie apparaît (si pas déjà visible).
   - **Focus automatique** dans le champ de saisie pour enchaîner tout de suite au clavier.

### 3.3 Suite de la conversation

- Dès qu’il y a au moins un échange, l’écran d’accueil (avatar + “Bonjour”) peut être remplacé par le fil de messages, ou l’avatar peut rester en en-tête réduit pour garder l’identité de Nina.

---

## 4. Chat : focus et fluidité

### 4.1 Auto-focus sur la zone de saisie

- **À l’ouverture de la page** : si conversation vide, pas de focus (éviter le flash clavier sur mobile).  
  Dès qu’il y a **au moins une réponse** (ex. après “Bonjour”), focus automatique dans le textarea.
- **Après envoi d’un message** : après chaque envoi, le focus reste (ou revient) sur la zone de saisie.
- **Après fermeture d’une modale** (ex. aperçu PDF, paramètres) : retour du focus dans la zone de saisie quand c’est pertinent.

Implémentation possible : `textareaRef.current?.focus()` dans des `useEffect` ciblés (montage, fin de réponse, fermeture modale), en évitant le focus sur mobile au tout premier rendu si on veut limiter l’ouverture du clavier.

### 4.2 Raccourcis clavier

- **Entrée** : envoyer le message (sans shift).
- **Shift + Entrée** : saut de ligne dans le textarea.
- **Ctrl+V / Cmd+V** : collage d’image (capture d’écran ou fichier image) → traité comme pièce jointe, comme dans l’assistant existant.
- **Escape** : selon le contexte — fermer menu/overlay, ou “annuler” une sélection de fichiers en cours.

Cohérence avec `AssistantCore` actuel à conserver pour les habitudes utilisateur.

---

## 5. Documents et captures d’écran

### 5.1 Téléversement de documents

- **Bouton dédié** (icône type trombone / fichier) à côté de la zone de saisie.
- **Drag & drop** sur la zone de saisie ou sur une bande dédiée “Glissez vos fichiers ici”.
- **Formats** : PDF, Word, images (PNG, JPEG, WebP), Excel/CSV si pertinent pour le rôle “secrétaire”.
- **Limites** : taille max par fichier et par message (ex. 4–5 fichiers, 10 Mo chacun), avec message clair en cas de dépassement.
- **Aperçu** : petites vignettes sous la zone de saisie avec nom, taille, bouton “supprimer”, comme dans l’assistant actuel.

### 5.2 Coller une capture d’écran

- **Ctrl+V / Cmd+V** dans le textarea : si le presse-papier contient une image, l’ajouter comme pièce jointe (sans quitter le focus).
- **Indication** dans le placeholder : “Tapez ou collez une image (Ctrl+V / Cmd+V)” pour rendre la fonction visible.
- Même pipeline que les images uploadées (redimensionnement, base64 ou upload selon l’archi backend).

---

## 6. Copier une réponse

### 6.1 Par message

- Chaque bulle “Nina” comporte un **bouton “Copier”** (icône copie) discret au survol ou toujours visible.
- Clic → copie du **texte brut** de la réponse dans le presse-papier.
- Feedback : toast “Copié” ou icône temporaire “check”, comme dans l’assistant existant (`copiedMessageId`).

### 6.2 Périmètre “copier”

- **Option 1** : uniquement le texte de la bulle (sans les boutons d’action, sans le markdown brut).
- **Option 2** : proposer “Copier le texte” et “Copier en Markdown” selon les usages (emails, docs internes).
- Pour la v1 : “Copier le texte” (version rendue, sans balises) suffit pour un usage secrétariat courant.

### 6.3 Accessibilité

- `aria-label="Copier la réponse"`.
- Possibilité de déclencher la copie au clavier (focus sur la bulle puis raccourci ou action clavier dédiée), si on va vers une navigation clavier complète plus tard.

---

## 7. Générer un fichier PDF

### 7.1 Portée

- **Par réponse** : “Télécharger en PDF” pour une bulle donnée.
- **Conversation** : “Exporter la conversation en PDF” (toutes les bulles, ou fenêtre de sélection).

Les deux sont utiles pour un bot secrétaire (note de synthèse vs. compte rendu d’échange).

### 7.2 Comportement proposé

- **Bouton** par message : icône “PDF” ou “Télécharger” à côté de “Copier”.
- **Menu ou barre** : option “Exporter la conversation en PDF” dans le “···” ou en bas de la zone de messages.
- Au clic :
  - Si besoin, petit loader “Génération du PDF…”.
  - Téléchargement automatique d’un fichier `nina-reponse-YYYY-MM-DD-HHmm.pdf` ou `nina-conversation-YYYY-MM-DD-HHmm.pdf`.

### 7.3 Contenu du PDF

- **Une réponse** : titre court (“Réponse Nina — [date]”), contenu texte (et éventuellement structure des listes / titres), logo ou nom d’agence en en-tête/bas de page si souhaité.
- **Conversation** : alternance user / Nina, avec horodatage ou date, lisible et sobre (police, marges, pas trop dense).

Techno côté client : lib du type `jspdf` + `html2canvas` ou génération côté serveur (route API dédiée qui reçoit le texte ou l’HTML et renvoie un PDF). À trancher selon perf et complexité de mise en page.

---

## 8. Ergonomie et “tout ce qui fait d’un bot un outil agréable”

### 8.1 Déjà couverts par le cahier des charges

- Page pleine, retour, “Bonjour”, focus, documents, copier, PDF → voir sections ci‑dessus.

### 8.2 Compléments proposés

| Sujet | Proposition |
|-------|------------|
| **Feedback “Nina écrit…”** | Indicateur de chargement (typing) pendant la génération de la réponse. |
| **Gestion des erreurs** | Message clair en cas d’échec (réseau, quota, fichier trop lourd) + bouton “Réessayer”. |
| **Réponses longues** | Scroll dans la bulle si besoin, ou “Voir plus” pour déplier. Numérotation des paragraphes optionnelle pour “aller à la section X”. |
| **Historique / reprise** | Si on stocke les conversations : reprise au prochain passage sur la page (même session ou persistance), avec possibilité “Nouvelle conversation”. |
| **Indicateur de statut** | Petit indicateur “En ligne” / “Prête” à côté du nom pour rassurer. |
| **Ton et personnalité** | Nina “professionnelle et bienveillante” : phrases courtes, formules de politesse adaptées, pas de jargon inutile. À figer dans les prompts (référence `specification-comportement-ia.md` / `main-button-prompts.ts`). |
| **Actions rapides** | En fin de réponse, boutons du type “Rédiger un mail”, “Résumer”, “Corriger ce texte” si ça correspond aux cas d’usage secrétariat. |
| **Réglages discrets** | Dans le “···” : préférences (ex. longueur des réponses, ton), lien aide, rappel du rôle de Nina. |
| **Mobile** | Zone de saisie toujours visible ou sticky en bas ; éviter que le clavier pousse le bouton “Bonjour” hors écran au premier affichage. |

### 8.3 Cohérence avec l’existant

- Réutiliser autant que possible :
  - `AssistantCore` (ou une variante “fullscreen”) pour messages, saisie, pièces jointes, copie.
  - Composants UI (Button, Textarea, toasts sonner).
  - Logique de paste d’images, `file-processing`, `image-utils`.
- Adapter le layout (pas de drawer, page pleine) et ajouter la couche “écran d’accueil + Bonjour” et “export PDF” spécifiques à Nina.

---

## 9. Récap des livrables par phase

### Phase 1 — Page et lancement

- [ ] Page Nina en fullscreen (`/commun/agents-ia/bot-secretaire` ou équivalent).
- [ ] Barre avec bouton retour + titre “Nina — Bot Secrétaire”.
- [ ] Écran d’accueil : avatar + bouton “Bonjour”.
- [ ] Comportement “Bonjour” : salutation + “Que voulez-vous faire ?” + apparition du chat et focus sur la zone de saisie.

### Phase 2 — Conversation fluide

- [ ] Zone de saisie avec auto-focus après première réponse et après envoi.
- [ ] Raccourcis Entrée / Shift+Entrée / Ctrl+V.
- [ ] Téléversement de documents (bouton + drag & drop).
- [ ] Coller une capture d’écran (Ctrl+V).
- [ ] Bouton “Copier” par réponse + feedback “Copié”.

### Phase 3 — Export et confort

- [ ] “Télécharger en PDF” par réponse.
- [ ] “Exporter la conversation en PDF”.
- [ ] Indicateur “Nina écrit…”.
- [ ] Gestion d’erreurs et “Réessayer”.
- [ ] Option “Nouvelle conversation” si persistance des échanges.

### Phase 4 — Finesse

- [ ] Menu “···” (paramètres, aide, export global).
- [ ] Petits boutons d’action rapide en fin de réponse si définis.
- [ ] Ajustements mobile et accessibilité (aria, focus, Escape).

---

## 10. Points à trancher en équipe

1. **Route exacte** : garder `/commun/agents-ia/bot-secretaire` ou une URL dédiée type `/nina` ?
2. **Stockage** : conversation en mémoire navigateur uniquement, ou persistance (Firestore, compte utilisateur) ?
3. **PDF** : génération côté client (jspdf, etc.) ou API dédiée ?
4. **Rôle métier** : quels prompts et scénarios “secrétaire” en priorité (mails, comptes rendus, rappels, prise de notes) pour la première version ?
5. **Avatar** : l’icône du chat (bulles, accueil, typing) est `/agents-ia/bot-secretaire/avatar-tete.jpg`. À trancher : forme d’affichage (carré, rond, fond) pour rester aligné avec la charte agents-ia.

---

*Document vivant : à mettre à jour au fil des décisions et des sprints.*
