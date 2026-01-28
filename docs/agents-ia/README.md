# Agents IA — Documentation

Ce dossier documente les agents IA de l’agence : rôles, identité visuelle, stack technique, fonctionnalités et UI.

---

## Nina — Bot Secrétaire

### Stack technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **UI** | Tailwind CSS, composants shadcn/ui (Button, Textarea, Tooltip, Card), Lucide React (icônes) |
| **Rendu des réponses** | `react-markdown`, `remark-gfm`, `rehype-raw` — composant `MarkdownRenderer` (prose, code avec Prism) |
| **Chat / API** | Route `POST /api/assistant/chat` — OpenAI (GPT-4o), streaming SSE |
| **Prompt système** | `lib/assistant/nina-system-prompt.ts` — identité, compétences, règles (devis, destinataire) |
| **Fichiers / images** | `lib/assistant/file-processing.ts` (PDF, Word, Excel, TXT, CSV), `lib/assistant/image-utils.ts` (base64), parsing côté API (`file-parsers`, `file-extraction`) |
| **Auth** | Firebase Auth — `useAuth`, `verifyAuth` sur la route chat |
| **PDF** | `jspdf` + `html2canvas` (export par réponse et brouillon) ; `jspdf` seul (export conversation et brouillon texte) |
| **État / UX** | État local React (messages, brouillon, chargement), `sonner` (toasts) |

### Fonctionnalités

- **Conversation** : envoi de texte, images (glisser-déposer, collage Ctrl+V, bouton), documents (PDF, Word, Excel, TXT, CSV) ; historique envoyé à l’API ; réponses en streaming.
- **Accueil** : écran « Bonjour » puis suggestions cliquables (Rédiger un mail, Résumer un document, Corriger un texte, Extraire infos PDF, Comparer des devis).
- **Actions rapides** (sous les réponses longues) : Mettre dans le brouillon, Transformer en mail, Résumer en 3 points ; Copier en haut de chaque bulle Nina.
- **Export PDF** : par réponse (bouton sur chaque bulle Nina, génération client avec html2canvas) ; conversation entière (bouton en-tête) ; brouillon (depuis le panneau Brouillon). Sur mobile, ouverture du PDF dans un nouvel onglet.
- **Zone brouillon** (split screen) : panneau droit sur grand écran ; dépôt du contenu d’une réponse via « Mettre dans le brouillon » ; édition, Copier, Télécharger PDF.
- **Raccourci global** : Cmd+N (Mac) / Alt+N (Windows-Linux) pour ouvrir Nina depuis n’importe quelle page (layout Commun) ; tooltip sur le lien « Agents IA » dans les sidebars.

### UI et parcours

- **Entrée** : menu Commun → « Agents IA » (sous-texte : Rédiger un mail · Résumer un document · Corriger un texte) → carte Nina → clic ouverture `/commun/agents-ia/bot-secretaire`.
- **Page Nina (plein écran)** : header avec retour, titre « Nina — Bot Secrétaire », bouton « Exporter en PDF » (conversation) si des messages existent ; pas de sidebar.
- **Avant conversation** : avatar, court texte de présentation, bouton « Bonjour ».
- **Après « Bonjour »** : zone messages (bulles user à droite / Nina à gauche avec avatar), indicateur « Nina écrit… », bandeau de suggestions au-dessus de la zone de saisie, zone de saisie (textarea, pièces jointes, boutons image/fichier/envoi), rappel Entrée / Shift+Entrée / Ctrl+V.
- **Bulle Nina** : contenu en Markdown, boutons Copier et Télécharger PDF ; si réponse longue, boutons Mettre dans le brouillon, Transformer en mail, Résumer en 3 points.
- **Brouillon** : panneau droit (caché sur mobile) avec titre « Brouillon », textarea éditable, boutons Copier et Télécharger PDF.
- **Erreur** : bandeau rouge avec message et bouton « Réessayer ».

---

## Où stocker les visages / photos des agents

- **Images (avatars, visages)** → **`public/agents-ia/`**
  - URL : `/agents-ia/<slug-agent>/avatar.png` (ou `.jpg`).
  - Sous-dossier par agent (ex. `public/agents-ia/bot-secretaire/avatar.jpg`, `avatar-tete.jpg` pour le chat).

- **Documentation** → **`docs/agents-ia/`**
  - Fichiers par agent (rôle, spec, backlog) ; pas d’images servies par l’app dans `docs/`.

## Convention de nommage

| Slug agent       | Prénom | Rôle (ex.)              | Image                                  |
|-----------------|--------|--------------------------|----------------------------------------|
| `bot-secretaire`| Nina   | Rédaction, mails, correction, analyse docs, comparaison devis | `public/agents-ia/bot-secretaire/avatar.jpg`, `avatar-tete.jpg` |
| `m-plus-3`      | —      | Expert portefeuille M+3 | `public/agents-ia/m-plus-3/avatar.png` |
| *(à compléter)* | —      | …                       | …                                      |

Pour chaque nouvel agent : créer `public/agents-ia/<slug>/`, y déposer l’avatar ; optionnel : ajouter une entrée ici ou un fichier `docs/agents-ia/<slug>.md`.

## Formats recommandés

- **Avatar / visage** : PNG ou WebP, 200×200 px minimum.
- Visages : générés (IA), photos réelles ou illustrations selon la charte.
