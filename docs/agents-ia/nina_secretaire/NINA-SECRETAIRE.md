# Nina — Bot Secrétaire

> Document de référence unique pour Nina : prompt système, design, UI, fonctionnalités et suivi.  
> Lieu : `docs/agents-ia/nina_secretaire/`  
> Visuels : `public/agents-ia/bot-secretaire/avatar.jpg` (page), `avatar-tete.jpg` (icône chat).  
> Code : `lib/assistant/nina-system-prompt.ts` → `getNinaSystemPrompt()`.

---

## Sommaire

1. [Description de Nina](#description-de-nina) — stack, fonctionnalités, UI, design
2. [Todo — Suivi global](#todo--suivi-global)
3. [Prompt système](#prompt-système)
4. [Design, UI & fonctionnalités](#design-ui--fonctionnalités) (spécifications détaillées)
5. [Points à trancher](#points-à-trancher-en-équipe)

---

## Description de Nina

Vue d’ensemble technique et produit de l’assistante secrétaire : stack, fonctionnalités, interface et design.

### Stack technique

| Couche | Technologies |
|--------|--------------|
| **Framework** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, composants UI (Radix / shadcn) |
| **Auth** | Firebase Auth (Bearer token sur `/api/assistant/chat`) |
| **LLM & Vision** | OpenAI API — `gpt-4o` (texte + images), streaming SSE |
| **Extraction documents** | `lib/assistant/file-extraction` (OpenAI Vision, Google Cloud Vision), `pdf-parse`, `mammoth` (Word) |
| **Traitement fichiers** | `lib/assistant/file-processing` (validation, base64), `lib/assistant/image-utils` (optimisation, redimensionnement max 2048×2048, WebP/JPEG) |
| **PDF** | `jspdf` + `html2canvas` (génération côté client : réponses, conversation, brouillon) |
| **Markdown** | `react-markdown`, `remark-gfm`, `rehype-raw` — `MarkdownRenderer` avec code highlight (Prism) |
| **UX** | Sonner (toasts), `next-themes` (dark mode) |
| **Config** | `lib/assistant/config` : `NINA_TIMEOUT` (45 s), `ENABLE_NINA_BOT` |

**Routes et modules clés :**

- Page : `app/commun/agents-ia/bot-secretaire/page.tsx` — route `/commun/agents-ia/bot-secretaire`
- API : `app/api/assistant/chat/route.ts` — `context.agent === "nina"` ⇒ prompt Nina, pas base agence
- Prompt : `lib/assistant/nina-system-prompt.ts` → `getNinaSystemPrompt()`

---

### Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| **Lancement "Bonjour"** | Clic sur "Bonjour" → salutation Nina + "Que souhaitez-vous faire ?" + apparition du chat, focus dans la zone de saisie |
| **Chat streamé** | Réponses en streaming SSE ; indicateur "Nina écrit…" pendant la génération |
| **Upload images** | Bouton image + `accept="image/*"` ; paste Ctrl+V / Cmd+V ; drag & drop sur la zone de saisie |
| **Upload documents** | PDF, Word, Excel, TXT, CSV — max 10 fichiers / message, 20 Mo / fichier ; envoyés en base64, extraction côté API |
| **Copier une réponse** | Bouton "Copier" par bulle Nina ; feedback "Copié" + toast |
| **PDF par message** | "Télécharger en PDF" sur chaque réponse longue ; génération via `html2canvas` + `jspdf` |
| **Export conversation** | "Exporter en PDF" dans la barre → fichier `nina-conversation-YYYY-MM-DD.pdf` |
| **Brouillon (split screen)** | Panneau à droite (lg+) : dépôt du contenu Nina ("Mettre dans le brouillon"), édition, copie, export PDF du brouillon |
| **Suggestions de démarrage** | Boutons type "Rédiger un mail professionnel", "Résumer un document", "Corriger l'orthographe", "Extraire les infos d'un PDF", "Comparer des devis" après la première réponse |
| **Actions rapides** | Par réponse longue : "Mettre dans le brouillon", "Transformer en mail", "Résumer en 3 points" |
| **Gestion d’erreurs** | Affichage erreur + bouton "Réessayer" (renvoi du dernier message user) |
| **Raccourci global** | `Alt + N` (Windows/Linux) ou `Cmd + Shift + N` (Mac) → navigation vers Nina ; désactivé si focus input/textarea/contenteditable |
| **Mobile PDF** | Sur Mobile (détection user-agent) : ouverture du PDF dans un nouvel onglet au lieu du téléchargement direct (compatibilité iOS) |

Limites côté API : rate limiting par type de requête, budget mensuel, timeout 45 s pour Nina.

---

### UI

- **Layout** : Page fullscreen (`min-h-screen`), pas de sidebar. Structure : barre fixe → zone conversation → zone de saisie ; à droite (lg+), panneau "Brouillon".
- **Barre** : Bouton retour (lien vers `/commun/agents-ia`), titre "Nina — Bot Secrétaire", bouton "Exporter en PDF" (affiché une fois la conversation engagée).
- **Écran d’accueil** : Avatar (`avatar-tete.jpg`) en cercle, texte "Je suis Nina, votre assistante secrétaire.", CTA "Bonjour".
- **Chat** : Bulles user (droite, fond emerald) / assistant (gauche, fond slate) ; avatar Nina à gauche des réponses ; zone de saisie avec raccourcis affichés (Entrée, Shift+Entrée, Ctrl+V).
- **Saisie** : `Textarea` auto-focus après "Bonjour" et après envoi ; boutons image, fichier, envoi ; aperçus des pièces jointes avec retrait possible.
- **Responsive** : Brouillon masqué en dessous de `lg` ; structure verticale préservée sur mobile.

---

### Design

| Élément | Choix |
|--------|--------|
| **Couleur primaire** | Emerald (`emerald-600` / `emerald-700` pour CTA, bouton "Bonjour", bulles user, accents) |
| **Neutres** | Slate pour fonds, bordures, texte secondaire |
| **Avatar** | Cercle, bordure `border-emerald-500/30` ; `avatar-tete.jpg` dans le chat et l’écran d’accueil |
| **Typographie** | Titre `text-xl font-semibold` ; messages `text-sm` ; prose via `MarkdownRenderer` (titres, listes, code) |
| **Dark mode** | Support via `dark:` (slate-950, slate-800, etc.) et `next-themes` |
| **Micro-interactions** | "Nina écrit…" avec `Loader2` animé ; feedback copie (icône Check) ; toasts Sonner pour succès / erreur |
| **Accessibilité** | `aria-label` sur les boutons (Retour, Copier, PDF, Envoyer, etc.) ; tooltips sur les actions |

Les spécifications détaillées (cahier des charges, architecture de la page, PDF, gestion du contexte, backlog) sont dans [Design, UI & fonctionnalités](#design-ui--fonctionnalités).

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
- [ ] **PDF Mobile** : ouverture du PDF en nouvel onglet sur Mobile (compatibilité iOS).
- [ ] **Gestion du contexte** : summarization automatique au-delà de 20 messages pour préserver performances et mémoire.
- [ ] **Raccourci global** : `Alt + N` (Windows/Linux) ou `Cmd + Shift + N` (Mac) pour ouvrir Nina depuis tout le SaaS.
- [ ] **Split screen (zone de brouillon)** : priorité haute backlog — conversation à gauche, éditeur des rédactions à droite.

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

Spécifications détaillées (cahier des charges, architecture, PDF, contexte). Vue d’ensemble : [Description de Nina](#description-de-nina).

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
- **UX Mobile** : sur Mobile, la génération du PDF doit forcer l’ouverture dans un **nouvel onglet** (ou nouvel écran) pour garantir la compatibilité, notamment sous iOS (éviter les blocages de téléchargement direct).

---

### 8. Ergonomie et cohérence

- Réutiliser `AssistantCore` (ou variante fullscreen), composants UI, logique paste/images, `file-processing`, `image-utils`.
- Gestion des erreurs (réseau, quota, fichier trop lourd) + "Réessayer".
- Historique / "Nouvelle conversation" si persistance.
- Ton et personnalité : alignés avec le [Prompt système](#prompt-système) et `nina-system-prompt.ts`.

#### Gestion du contexte

- Si la conversation dépasse **20 messages**, prévoir un **résumé automatique du contexte** (summarization) injecté dans le fil avant les messages récents, pour préserver les performances et la mémoire de Nina (limite de tokens, cohérence des réponses).
- Seuils et comportement (fenêtre glissante, résumé tous les N messages, etc.) à préciser selon le provider et le coût.

#### Backlog (priorités)

| Priorité | Idée | Description |
|----------|------|-------------|
| **Haute** | **Zone de brouillon (split screen)** | À gauche la conversation, à droite un éditeur où Nina dépose les rédactions finales → exporter en PDF après édition. **Priorité haute** du backlog pour transformer le chat en outil d’édition à part entière. |
| Haute | **Raccourci global** | `Alt + N` (Windows/Linux) ou `Cmd + Shift + N` (macOS) pour ouvrir Nina. Désactivé si focus dans input/textarea/contenteditable. |
| Moyenne | Actions rapides | En fin de réponse : "Transformer en mail", "Faire un tableau récap", "Extraire les dates/RDV", "Résumer", "Corriger ce texte". |

---

## Points à trancher en équipe

1. **Route exacte** : `/commun/agents-ia/bot-secretaire` ou `/nina` ? Raccourci global (ex. `Alt + N`) pour ouvrir Nina ?
2. **Stockage** : **V1** LocalStorage ; **V2** base pour reprise multi‑appareils.
3. **PDF** : confirmer génération côté client (jspdf + html2canvas).
4. **Rôle métier** : quels scénarios secrétaire en priorité (mails, comptes rendus, rappels, prise de notes) pour la v1 ?
5. **Avatar** : cercle + bordure "statut en ligne" ; icône : `/agents-ia/bot-secretaire/avatar-tete.jpg`.

---

## Plan d'action appliqué (A→G) et check-list de tests

### Modifications appliquées

| Id | Thème | Fichiers modifiés | Résumé |
|----|--------|-------------------|--------|
| **A** | Raccourci clavier | `layout.tsx`, sidebars, `NINA-SECRETAIRE.md` | `Alt+N` / `Cmd+Shift+N` ; désactivé si focus input/textarea/contenteditable |
| **B** | Prompt Nina | `nina-system-prompt.ts` | Déjà aligné ; pas de Cmd+N |
| **C** | PDF | `bot-secretaire/page.tsx`, `config.ts` | JPEG 0.85, `PDF_EXPORT_MAX_CHARS`, alerte longue réponse, mobile nouvel onglet |
| **D** | Contexte >20 | `config.ts`, `chat/route.ts` | `SUMMARY_WINDOW` = 12 ; fenêtre glissante ; note de troncation |
| **E** | Sécurité | `chat/route.ts`, page Nina, `mask-sensitive.ts` | Pas de log PII ; alerte sensibles ; "Masquer données sensibles" avant copie |
| **F** | Timeout | `chat/route.ts` | Stream 45s, AbortController, fallback "[Résultat partiel — …]" |
| **G** | Sources | `bot-secretaire/page.tsx` | Section "Sources" (fichiers, pages non détectées) en bas de réponse |

### Constantes (`lib/assistant/config.ts`)

`NINA_TIMEOUT` = 45 000 · `SUMMARY_WINDOW` = 12 · `MAX_HISTORY_MESSAGES` = 20 · `PDF_EXPORT_MAX_CHARS` = 50 000

### Check-list de tests manuels (Nina)

1. Raccourci `Alt+N` / `Cmd+Shift+N` ouvre Nina ; inactif si focus dans saisie.
2. "Bonjour" → salutation + focus saisie.
3. Chat streamé, "Nina écrit…".
4. Upload image (bouton / Ctrl+V / drag) et fichiers.
5. Copier une réponse ; avec "Masquer données sensibles" → masquage.
6. PDF par message et export conversation ; mobile → nouvel onglet.
7. Brouillon : "Mettre dans le brouillon", copier, PDF.
8. Erreur → "Réessayer".
9. >12 messages → fenêtre glissante.
10. Timeout (si testable) → fallback partiel.
11. Envoi avec fichier(s) → "Sources" en bas de réponse.

---

*Document vivant : à mettre à jour au fil des décisions et des sprints.*
