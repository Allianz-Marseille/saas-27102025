# Nina — Bot Secrétaire

> Document de référence unique pour Nina : prompt système, design, UI, fonctionnalités et suivi.  
> Lieu : `docs/agents-ia/nina_secretaire/`  
> Visuels : `public/agents-ia/bot-secretaire/avatar.jpg` (page), `avatar-tete.jpg` (icône chat).  
> Code : `lib/assistant/nina-system-prompt.ts` → `getNinaSystemPrompt()`.

---

## Sommaire

1. [Todo — Suivi global](#todo--suivi-global)
2. [Prompt système](#prompt-système)
3. [Design, UI & fonctionnalités](#design-ui--fonctionnalités)
4. [Points à trancher](#points-à-trancher-en-équipe)

---

## Todo — Suivi global

### Prompt & config

- [ ] Aligner le prompt dans `lib/assistant/nina-system-prompt.ts` avec la spec ci‑dessous.
- [ ] Tester réponse au "Bonjour" et focus secrétariat (hors-sujet).

### Phase 1 — Page et lancement

- [ ] Page Nina en fullscreen (`/commun/agents-ia/bot-secretaire` ou équivalent).
- [ ] Barre avec bouton retour + titre "Nina — Bot Secrétaire".
- [ ] Écran d'accueil : avatar + bouton "Bonjour".
- [ ] Comportement "Bonjour" : salutation + "Que voulez-vous faire ?" + apparition du chat et focus sur la zone de saisie.

### Phase 2 — Conversation fluide

- [ ] Zone de saisie avec auto-focus après première réponse et après envoi.
- [ ] Raccourcis Entrée / Shift+Entrée / Ctrl+V.
- [ ] Téléversement de documents (bouton + drag & drop).
- [ ] Coller une capture d'écran (Ctrl+V).
- [ ] Bouton "Copier" par réponse + feedback "Copié".

### Phase 3 — Export et confort

- [ ] "Télécharger en PDF" par réponse.
- [ ] "Exporter la conversation en PDF".
- [ ] Indicateur "Nina écrit…".
- [ ] Gestion d'erreurs et "Réessayer".
- [ ] Option "Nouvelle conversation" si persistance des échanges.

### Phase 4 — Finesse

- [ ] Menu "···" (paramètres, aide, export global).
- [ ] Petits boutons d'action rapide en fin de réponse si définis.
- [ ] Ajustements mobile et accessibilité (aria, focus, Escape).

---

## Prompt système

Ce bloc décrit le **prompt système** injecté dans l’API (OpenAI, Anthropic, Google, etc.) pour définir le comportement de Nina. Ce texte n’est pas affiché à l’utilisateur ; il fixe l’identité, le ton et les règles de l’assistante.

### Identité

Tu es **Nina**, l’assistante secrétaire intelligente intégrée au SaaS. Tu es l’alliée indispensable de l’utilisateur pour sa gestion administrative, sa rédaction et son organisation.

### Personnalité

- **Professionnelle et bienveillante** : polie (vouvoiement par défaut), calme et efficace.
- **Concise** : pas de longs discours inutiles, tu vas droit au but.
- **Réactive** : toujours prête à aider, tu encourages l’utilisateur à te confier ses tâches rébarbatives.

### Compétences et missions

1. **Rédaction** : emails, courriers officiels, comptes rendus, notes de synthèse à partir de notes brouillonnes.
2. **Correction** : orthographe et amélioration du style des textes fournis.
3. **Analyse de documents** : résumer des PDF, extraire des informations clés de captures d’écran.
4. **Formatage** : présentations propres (listes à puces, titres clairs).

### Règles d’or (comportement)

- **Signature** : Ne signe pas chaque message. Si tu rédiges un modèle de mail, termine par une balise type `[Votre Nom/Signature]`.
- **Focus secrétariat** : Si la question est hors sujet (ex. « Comment coder en Python ? », « Recette des lasagnes ? »), répondre : *« En tant que secrétaire, je me concentre sur vos tâches administratives et rédactionnelles. Souhaitez-vous que je vous aide plutôt sur un document ou un mail ? »*
- **Documents illisibles** : Si un document est illisible, demander poliment une nouvelle capture d’écran.
- **Réponse au "Bonjour"** : Quand l’utilisateur clique sur « Bonjour », répondre toujours par une phrase d’accueil chaleureuse, par exemple : *« Bonjour ! Je suis Nina, votre assistante. Que puis-je faire pour vous aujourd’hui ? »*

### Utilisation technique

Dans l’appel API, ce contenu est passé dans le champ `system` :

```javascript
const { getNinaSystemPrompt } = await import("@/lib/assistant/nina-system-prompt");

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: getNinaSystemPrompt() },
    { role: "user", content: "Bonjour" }
  ],
});
```

### Intérêts pour le projet

1. **Coût** : demander d’être concise dans le prompt limite le volume de tokens générés.
2. **Expérience** : Nina se présente comme « Je suis Nina », jamais comme « Je suis une IA créée par… ».
3. **Sécurité** : elle reste dans son rôle de secrétaire et refuse les usages hors sujet.

---

## Design, UI & fonctionnalités

### Icône du chat Nina

**Dans le chat (bulles Nina, en-tête, indicateur “Nina écrit…”)**, utiliser l’icône **`/agents-ia/bot-secretaire/avatar-tete.jpg`**.

| Contexte            | URL dans l'app                          |
|---------------------|------------------------------------------|
| Icône du chat Nina  | `/agents-ia/bot-secretaire/avatar-tete.jpg` |

À utiliser pour : avatar à côté des messages de Nina, écran d'accueil du chat, typing indicator, etc.

#### Identité visuelle et micro-interactions

- **Forme de l'avatar** : **cercle avec bordure fine** (type "statut en ligne" vert discret).
- **Indicateur "Nina écrit…"** : **animation** (trois points qui défilent ou légère pulsation autour de l’avatar).

---

### 1. Cahier des charges (rappels)

| Exigence           | Détail |
|--------------------|--------|
| **Page pleine**    | Le bot occupe toute la page, pas limité à un container ou un drawer. |
| **Bouton retour**  | Retour clair vers la liste des agents IA (ou la page précédente). |
| **Lancement par "Bonjour"** | Un bouton "Bonjour" cliquable lance le bot : Nina salue en retour et demande ce qu’on veut faire. |
| **Chat auto-focus** | La zone de saisie est sélectionnée par défaut après le premier échange. |
| **Documents & visuels** | Téléverser des documents + coller une capture d’écran (Ctrl+V / Cmd+V). |
| **Copier une réponse** | Pouvoir copier le contenu d’une réponse du bot. |
| **Exporter en PDF** | Générer un fichier PDF à partir d’une réponse ou d’un fil de conversation. |
| **Ergonomie globale** | Convivial, facile, tout ce qui fait d’un bot un outil agréable au quotidien. |

---

### 2. Architecture de la page (fullscreen)

#### 2.1 Structure proposée

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Retour]    Nina — Bot Secrétaire                    [···]    │  ← Barre fixe
├─────────────────────────────────────────────────────────────────┤
│   Zone conversation (messages, bulles, pièces jointes)          │
│   — Écran d’accueil : avatar + "Bonjour"                         │
│   — Ou fil de messages (scroll)                                  │
├─────────────────────────────────────────────────────────────────┤
│  [📎 Doc] [🖼 Image]  │  Zone de saisie (auto-focus)             │
└─────────────────────────────────────────────────────────────────┘
```

- **Layout** : `min-h-screen`, flex colonne, barre en `shrink-0`, conversation en `flex-1 overflow-auto`, saisie en `shrink-0`.
- **Pas de sidebar** : toute la largeur pour conversation + saisie.
- **Responsive** : même structure en pile sur mobile.

#### 2.2 Bouton retour

- Position : à gauche du titre. Action : vers `/commun/agents-ia` (ou referrer).
- `aria-label="Retour aux agents IA"`.
- Touche **Escape** : fermer modales ou retour liste agents selon choix produit.

---

### 3. Écran d’accueil et bouton "Bonjour"

- **État initial** : avatar `avatar-tete.jpg`, texte court "Je suis Nina, votre assistante secrétaire.", CTA **"Bonjour"**.
- **Au clic** : message user optionnel "Bonjour", réponse Nina (salutation + "Que souhaitez-vous faire ?"), zone de saisie visible, **focus automatique** dans le champ.
- **Suite** : dès un échange, écran d’accueil remplacé par le fil de messages (ou avatar en tête réduit).

---

### 4. Chat : focus et fluidité

- **Auto-focus** : à l’ouverture sans message, pas de focus (éviter clavier mobile). Après première réponse et après chaque envoi, focus dans le textarea.
- **Raccourcis** : Entrée = envoyer ; Shift+Entrée = saut de ligne ; Ctrl+V / Cmd+V = collage d’image ; Escape = fermer overlay / annuler sélection.

---

### 5. Documents et captures d’écran

- **Upload** : bouton + drag & drop, formats PDF, Word, images, Excel/CSV si pertinent. Limites (ex. 4–5 fichiers, 10 Mo), aperçu avec vignettes et supprimer.
- **Coller une capture** : Ctrl+V dans le textarea → image en pièce jointe. Placeholder : "Tapez ou collez une image (Ctrl+V / Cmd+V)".
- **Drag & drop sur une bulle Nina** (backlog) : "Peux-tu analyser ce document ?" sans repasser par la saisie.

---

### 6. Copier et presse-papier

- **Par message** : bouton "Copier" (texte brut) et **"Nettoyer le texte"** (sans Markdown, pour email) + feedback "Copié".
- **Accessibilité** : `aria-label="Copier la réponse"`.

---

### 7. Générer un fichier PDF

- **Portée** : "Télécharger en PDF" par bulle ; "Exporter la conversation en PDF".
- **Comportement** : loader "Génération du PDF…", téléchargement `nina-reponse-YYYY-MM-DD-HHmm.pdf` ou `nina-conversation-…`.
- **Recommandation** : génération **côté client** (`jspdf` + `html2canvas`). Templates : "Brut" et "Officiel" (en-tête, date, "Généré par l'assistante Nina").

---

### 8. Ergonomie et cohérence

- Réutiliser `AssistantCore` (ou variante fullscreen), composants UI, logique paste/images, `file-processing`, `image-utils`.
- Gestion des erreurs (réseau, quota, fichier trop lourd) + "Réessayer".
- Historique / "Nouvelle conversation" si persistance.
- Ton et personnalité : alignés avec le [Prompt système](#prompt-système) et `nina-system-prompt.ts`.

#### Backlog

- **Zone de brouillon (split screen)** : à gauche la conversation, à droite un éditeur où Nina dépose les rédactions finales → exporter en PDF après édition.
- **Actions rapides** en fin de réponse : "Transformer en mail", "Faire un tableau récap", "Extraire les dates/RDV", "Résumer", "Corriger ce texte".

---

## Points à trancher en équipe

1. **Route exacte** : `/commun/agents-ia/bot-secretaire` ou `/nina` ? Raccourci global (ex. `Alt + N`) pour ouvrir Nina ?
2. **Stockage** : **V1** LocalStorage ; **V2** base pour reprise multi‑appareils.
3. **PDF** : confirmer génération côté client (jspdf + html2canvas).
4. **Rôle métier** : quels scénarios secrétaire en priorité (mails, comptes rendus, rappels, prise de notes) pour la v1 ?
5. **Avatar** : cercle + bordure “statut en ligne” ; icône : `/agents-ia/bot-secretaire/avatar-tete.jpg`.

---

*Document vivant : à mettre à jour au fil des décisions et des sprints.*
