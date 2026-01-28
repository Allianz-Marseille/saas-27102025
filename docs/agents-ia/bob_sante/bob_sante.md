# Bob — Bot Santé & Prévoyance

> Document de référence unique pour Bob : prompt système, design, UI, fonctionnalités et suivi.  
> Lieu : `docs/agents-ia/bob_sante/`  
> Visuels : `public/agents-ia/bob-sante/avatar.jpg` (page), `avatar-tete.jpg` (icône chat).  
> Code : `lib/assistant/bob-system-prompt.ts` → `getBobSystemPrompt()` (à créer).

---

## Sommaire

0. [Texte de présentation (modale)](#texte-de-présentation-modale) — contenu pour la modale d'introduction
1. [Description de Bob](#description-de-bob) — stack, fonctionnalités, UI, design
2. [Cibles et cas d'usage](#cibles-et-cas-dusage) — TNS, salariés, entreprises, seniors
3. [Thèmes à couvrir](#thèmes-à-couvrir) — régimes sociaux, santé, prévoyance
4. [Todo — Suivi global](#todo--suivi-global)
5. [Prompt système (ébauche)](#prompt-système-ébauche)
6. [Design, UI & fonctionnalités](#design-ui--fonctionnalités) (spécifications détaillées)
7. [Points à trancher](#points-à-trancher-en-équipe)
8. [Plan d'action et check-list de tests](#plan-daction-et-check-list-de-tests)

---

## Texte de présentation (modale)

Contenu prêt à intégrer dans une modale de présentation de Bob (titre, accroche, fonctionnalités, CTA).

### Titre

**Bob — Expert santé & prévoyance**

### Accroche (1–2 phrases)

Bob est votre assistant expert en régimes sociaux, santé et prévoyance. Il vous aide à comprendre vos cotisations, votre mutuelle, vos garanties prévoyance — que vous soyez TNS, salarié, entreprise ou senior — avec un ton pédagogique et une réponse immédiate.

### Ce qu'il fait pour vous

- **Régimes sociaux** : explication des cotisations (URSSAF, ex-RSI), bases, différences TNS vs salarié.
- **Santé** : lecture de bulletins de salaire, attestations mutuelle, tiers payant, remboursements.
- **Prévoyance** : garanties incapacité, invalidité, décès ; comparaison contrats collectifs et individuels.
- **Publics** : accompagnement adapté aux TNS, salariés, entreprises (contrats collectifs) et seniors (retraite, prévoyance, reste à charge).

### Fonctionnalités de l'interface

- **Chat en direct** : réponses en temps réel (streaming), avec indicateur « Bob écrit… ».
- **Pièces jointes** : envoi d'images (coller avec Ctrl+V ou Cmd+V), de PDF, Word, Excel, TXT, CSV — bulletins de salaire, attestations, contrats — jusqu'à 10 fichiers par message.
- **Copier / exporter** : copie d'une réponse en un clic ; export d'une réponse ou de toute la conversation en PDF.
- **Brouillon** : panneau dédié pour déposer une synthèse, l'éditer, la copier ou l'exporter en PDF.
- **Actions rapides** : « Mettre dans le brouillon », « Résumer en 3 points », « Transformer en synthèse pour mon expert » sur chaque réponse longue.
- **Sécurité** : option pour masquer les données sensibles (IBAN, email, téléphone, numéros de sécurité sociale) avant copie ou export.

### CTA suggéré pour la modale

*« Démarrer avec Bob »* ou *« Ouvrir Bob »* — fermeture de la modale + navigation vers `/commun/agents-ia/bob-sante` (ou ouverture du chat selon le design).

### Version courte (pour tooltip ou bandeau)

**Bob** — Expert santé & prévoyance : régimes sociaux, mutuelle, prévoyance pour TNS, salariés, entreprises et seniors. Chat streamé, pièces jointes, export PDF et brouillon intégré.

---

## Description de Bob

Vue d'ensemble technique et produit du bot santé & prévoyance : stack, fonctionnalités, interface et design. Réutilisation de la stack et du layout de Nina ; adaptations métier et visuelles.

### Stack technique

| Couche | Technologies |
|--------|--------------|
| **Framework** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, composants UI (Radix / shadcn) |
| **Auth** | Firebase Auth (Bearer token sur `/api/assistant/chat`) |
| **LLM & Vision** | OpenAI API — `gpt-4o` (texte + images), streaming SSE |
| **Extraction documents** | `lib/assistant/file-extraction` (OpenAI Vision, etc.), `pdf-parse`, `mammoth` (Word) — bulletins, attestations, contrats |
| **Traitement fichiers** | `lib/assistant/file-processing`, `lib/assistant/image-utils` |
| **PDF** | `jspdf` + `html2canvas` (génération côté client : réponses, conversation, brouillon) |
| **Markdown** | `react-markdown`, `remark-gfm`, `rehype-raw` — `MarkdownRenderer` |
| **UX** | Sonner (toasts), `next-themes` (dark mode) |
| **Config** | `lib/assistant/config` : timeout, `SUMMARY_WINDOW`, `MAX_HISTORY_MESSAGES`, `PDF_EXPORT_MAX_CHARS`, `ENABLE_BOB_BOT` (à définir) |
| **Sécurité / masquage** | `lib/assistant/mask-sensitive` : masquage IBAN, email, téléphone, numéros sensibles avant copie/export si option activée |

**Routes et modules clés (à créer) :**

- Page : `app/commun/agents-ia/bob-sante/page.tsx` — route `/commun/agents-ia/bob-sante`
- API : `app/api/assistant/chat/route.ts` — `context.agent === "bob"` ⇒ prompt Bob
- Prompt : `lib/assistant/bob-system-prompt.ts` → `getBobSystemPrompt()`

---

### Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| **Lancement "Bonjour"** | Clic sur "Bonjour" → salutation Bob + "Que souhaitez-vous savoir ?" + apparition du chat, focus dans la zone de saisie |
| **Chat streamé** | Réponses en streaming SSE ; indicateur "Bob écrit…" pendant la génération |
| **Upload images** | Bouton image + paste Ctrl+V / Cmd+V ; drag & drop — bulletins, attestations, contrats |
| **Upload documents** | PDF, Word, Excel, TXT, CSV — max 10 fichiers / message, 20 Mo / fichier ; extraction côté API |
| **Copier une réponse** | Bouton "Copier" par bulle Bob ; feedback "Copié" + toast |
| **PDF par message** | "Télécharger en PDF" sur chaque réponse longue ; génération via `html2canvas` + `jspdf` |
| **Export conversation** | "Exporter en PDF" dans la barre → fichier `bob-conversation-YYYY-MM-DD.pdf` |
| **Brouillon (split screen)** | Panneau à droite (lg+) : dépôt du contenu Bob ("Mettre dans le brouillon"), édition, copie, export PDF du brouillon |
| **Suggestions de démarrage** | "Comprendre ma fiche de paie", "Comparer des contrats prévoyance", "Régime TNS vs salarié", "Aide retraite / seniors", "Expliquer une attestation mutuelle" |
| **Actions rapides** | Par réponse longue : "Mettre dans le brouillon", "Résumer en 3 points", "Transformer en synthèse pour mon expert" |
| **Gestion d'erreurs** | Affichage erreur + bouton "Réessayer" |
| **Raccourci global** | `Alt + B` (Windows/Linux) ou `Cmd + Shift + B` (Mac) → navigation vers Bob ; désactivé si focus input/textarea/contenteditable |
| **Mobile PDF** | Sur Mobile : ouverture du PDF dans un nouvel onglet (compatibilité iOS) |
| **Sources** | En bas des réponses quand des fichiers/images ont été envoyés : noms des fichiers |
| **Sécurité / sensibles** | Alerte UI « Évitez de coller données sensibles » ; checkbox « Masquer données sensibles avant copie » (IBAN, n° sécu, etc.) |

---

### UI

- **Layout** : Page fullscreen (`min-h-screen`), pas de sidebar. Structure : barre fixe → zone conversation → zone de saisie ; à droite (lg+), panneau "Brouillon".
- **Barre** : Bouton retour (lien vers `/commun/agents-ia`), titre "Bob — Bot Santé & Prévoyance", bouton "Exporter en PDF" (affiché une fois la conversation engagée).
- **Écran d'accueil** : Avatar (`avatar-tete.jpg`) en cercle, texte "Je suis Bob, votre expert santé et prévoyance.", CTA "Bonjour".
- **Chat** : Bulles user (droite, couleur primaire Bob) / assistant (gauche, fond slate) ; avatar Bob à gauche des réponses ; zone de saisie avec raccourcis affichés (Entrée, Shift+Entrée, Ctrl+V).
- **Saisie** : `Textarea` auto-focus après "Bonjour" et après envoi ; boutons image, fichier, envoi ; aperçus des pièces jointes avec retrait possible ; alerte sensibles + checkbox masquage.
- **Responsive** : Brouillon masqué en dessous de `lg` ; structure verticale préservée sur mobile.

---

### Design

| Élément | Choix |
|--------|--------|
| **Couleur primaire** | À définir : bleu santé / teal (ex. `teal-600` / `teal-700`) pour CTA, bouton "Bonjour", bulles user, accents — à trancher en équipe |
| **Neutres** | Slate pour fonds, bordures, texte secondaire |
| **Avatar** | Cercle, bordure discrète ; `avatar-tete.jpg` dans le chat et l'écran d'accueil — `public/agents-ia/bob-sante/avatar-tete.jpg` |
| **Typographie** | Titre `text-xl font-semibold` ; messages `text-sm` ; prose via `MarkdownRenderer` |
| **Dark mode** | Support via `dark:` et `next-themes` |
| **Micro-interactions** | "Bob écrit…" avec loader animé ; feedback copie (icône Check) ; toasts Sonner |
| **Accessibilité** | `aria-label` sur les boutons ; tooltips sur les actions |

---

## Cibles et cas d'usage

| Profil | Exemples de questions ou tâches |
|--------|---------------------------------|
| **TNS** | Comparer régime social (ex-RSI / URSSAF), cotisations, prévoyance obligatoire TNS, choix mutuelle TNS, bases et assiettes. |
| **Salarié** | Comprendre sa fiche de paie (cotisations santé, prévoyance), mutuelle d'entreprise, prévoyance collective, attestation de droits, reste à charge. |
| **Entreprise** | Comparer contrats collectifs (prévoyance, mutuelle), obligations légales, garanties minimales, mise en place ou évolution d'un régime. |
| **Senior** | Retraite et prévoyance, maintien des garanties, complémentaire santé retraite, reste à charge, points de vigilance. |

---

## Thèmes à couvrir

- **Régimes sociaux** : URSSAF, ex-RSI, cotisations maladie / vieillesse / famille, bases de calcul, différences TNS vs salarié.
- **Santé** : mutuelle (individuelle / collective), tiers payant, remboursements, niveaux de garantie, attestation de droits, bulletin de salaire (lignes santé).
- **Prévoyance** : incapacité, invalidité, décès, contrats collectifs vs individuels, garanties minimales (Loi Madelin pour TNS, convention collective pour salariés), comparaison de garanties.

---

## Todo — Suivi global

### Prompt & config

- [ ] Créer `lib/assistant/bob-system-prompt.ts` et aligner avec l'ébauche ci-dessous.
- [ ] Tester réponse au "Bonjour" et focus santé / prévoyance (hors-sujet).

### Phase 1 — Page et lancement

- [ ] Page Bob en fullscreen (`/commun/agents-ia/bob-sante`).
- [ ] Barre avec bouton retour + titre "Bob — Bot Santé & Prévoyance".
- [ ] Écran d'accueil : avatar + bouton "Bonjour".
- [ ] Comportement "Bonjour" : salutation + "Que souhaitez-vous savoir ?" + apparition du chat et focus sur la zone de saisie.

### Phase 2 — Conversation fluide

- [ ] Zone de saisie avec auto-focus après première réponse et après envoi.
- [ ] Raccourcis Entrée / Shift+Entrée / Ctrl+V.
- [ ] Téléversement de documents (bouton + drag & drop) — bulletins, attestations, contrats.
- [ ] Coller une capture d'écran (Ctrl+V).
- [ ] Bouton "Copier" par réponse + feedback "Copié".

### Phase 3 — Export et confort

- [ ] "Télécharger en PDF" par réponse.
- [ ] "Exporter la conversation en PDF".
- [ ] Indicateur "Bob écrit…".
- [ ] Gestion d'erreurs et "Réessayer".
- [ ] Option "Nouvelle conversation" si persistance des échanges.

### Phase 4 — Finesse

- [ ] Menu "···" (paramètres, aide, export global).
- [ ] Actions rapides en fin de réponse ("Mettre dans le brouillon", "Résumer en 3 points", "Transformer en synthèse pour mon expert").
- [ ] Ajustements mobile et accessibilité (aria, focus, tooltips).
- [ ] PDF Mobile : ouverture en nouvel onglet sur Mobile.
- [ ] Gestion du contexte : fenêtre glissante (ex. 12 messages) + note de troncation.
- [ ] Raccourci global : `Alt + B` / `Cmd + Shift + B` pour ouvrir Bob.
- [ ] Split screen (zone de brouillon) : conversation à gauche, brouillon à droite (lg+), copier + PDF brouillon.

---

## Prompt système (ébauche)

Le **prompt système** sera défini dans `lib/assistant/bob-system-prompt.ts` → `getBobSystemPrompt()`. Injecté dans l'API, il n'est pas affiché à l'utilisateur.

### Identité

Tu es **Bob**, l'assistant expert en régimes sociaux, santé et prévoyance intégré au SaaS. Tu es l'allié de l'utilisateur pour comprendre ses cotisations, sa mutuelle, ses garanties prévoyance — que ce soit en tant que TNS, salarié, entreprise ou senior.

### Personnalité

- **Professionnel et pédagogique** : polie (vouvoiement par défaut), claire et rassurante.
- **Précis** : tu t'appuies sur les documents fournis et les notions juridiques en vigueur sans inventer.
- **Bienveillant** : tu renvoies vers un professionnel (avocat, expert-comptable, assureur, médecin) lorsque la question dépasse une aide à la compréhension ou une comparaison générale.

### Compétences et missions

1. **Régimes sociaux** : explication des cotisations (URSSAF, ex-RSI), bases, différences TNS vs salarié.
2. **Santé** : lecture de bulletins de salaire, attestations mutuelle, niveaux de garantie, tiers payant, remboursements.
3. **Prévoyance** : garanties incapacité, invalidité, décès ; comparaison contrats collectifs et individuels ; obligations selon le statut (TNS, salarié, entreprise).
4. **Synthèse** : extraction d'informations à partir de documents (bulletins, contrats, attestations) et présentation claire (listes, tableaux).

### Règles d'or (comportement)

- **Signature** : Ne signe pas chaque message. En fin de synthèse, tu peux rappeler que ce n'est pas un conseil personnalisé.
- **Périmètre** : Tu ne substitues pas un conseil juridique, médical ou assurantiel personnalisé. Si la question relève d'une décision engageante (choix de contrat, litige, situation médicale), tu invites à consulter un professionnel.
- **Documents illisibles** : Si un document est illisible, demander poliment une nouvelle capture ou un fichier lisible.
- **Réponse au "Bonjour"** : Quand l'utilisateur clique sur « Bonjour », répondre par une phrase d'accueil chaleureuse, par exemple : *« Bonjour ! Je suis Bob, votre expert santé et prévoyance. Que souhaitez-vous savoir aujourd'hui ? »*
- **Hors-sujet** : Si la question est hors sujet (ex. recette, code informatique), répondre : *« Je me concentre sur les régimes sociaux, la santé et la prévoyance. Avez-vous une question sur vos cotisations, votre mutuelle ou vos garanties ? »*

### Utilisation technique (à venir)

```javascript
const { getBobSystemPrompt } = await import("@/lib/assistant/bob-system-prompt");

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: getBobSystemPrompt() },
    { role: "user", content: "Bonjour" }
  ],
});
```

---

## Design, UI & fonctionnalités

Spécifications détaillées (cahier des charges, architecture, PDF). Même structure que Nina ; adaptations libellés et suggestions.

### Icône du chat Bob

**Dans le chat (bulles Bob, en-tête, indicateur "Bob écrit…")**, utiliser l'icône **`/agents-ia/bob-sante/avatar-tete.jpg`**.

| Contexte            | URL dans l'app                    |
|---------------------|------------------------------------|
| Icône du chat Bob   | `/agents-ia/bob-sante/avatar-tete.jpg` |

---

### 1. Cahier des charges (rappels)

| Exigence           | Détail |
|--------------------|--------|
| **Page pleine**    | Le bot occupe toute la page, pas limité à un container ou un drawer. |
| **Bouton retour**  | Retour clair vers la liste des agents IA. |
| **Lancement par "Bonjour"** | Un bouton "Bonjour" cliquable lance le bot : Bob salue et demande ce qu'on veut savoir. |
| **Chat auto-focus** | La zone de saisie est sélectionnée par défaut après le premier échange. |
| **Documents & visuels** | Téléverser des documents (bulletins, attestations, contrats) + coller une capture (Ctrl+V / Cmd+V). |
| **Copier une réponse** | Pouvoir copier le contenu d'une réponse du bot. |
| **Exporter en PDF** | Générer un fichier PDF à partir d'une réponse ou du fil de conversation. |
| **Ergonomie globale** | Convivial, facile, cohérent avec Nina. |

---

### 2. Architecture de la page (fullscreen)

Même structure que Nina :

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Retour]    Bob — Bot Santé & Prévoyance             [···]     │  ← Barre fixe
├─────────────────────────────────────────────────────────────────┤
│   Zone conversation (messages, bulles, pièces jointes)          │
│   — Écran d'accueil : avatar + "Bonjour"                         │
│   — Ou fil de messages (scroll)                                  │
├─────────────────────────────────────────────────────────────────┤
│  [📎 Doc] [🖼 Image]  │  Zone de saisie (auto-focus)             │
└─────────────────────────────────────────────────────────────────┘
```

- **Layout** : `min-h-screen`, flex colonne, barre en `shrink-0`, conversation en `flex-1 overflow-auto`, saisie en `shrink-0`. À droite (lg+), panneau Brouillon.
- **Bouton retour** : vers `/commun/agents-ia`, `aria-label="Retour aux agents IA"`.

---

### 3. Écran d'accueil et bouton "Bonjour"

- **État initial** : avatar `avatar-tete.jpg`, texte "Je suis Bob, votre expert santé et prévoyance.", CTA **"Bonjour"**.
- **Au clic** : message user optionnel "Bonjour", réponse Bob (salutation + "Que souhaitez-vous savoir ?"), zone de saisie visible, **focus automatique** dans le champ.
- **Suite** : dès un échange, écran d'accueil remplacé par le fil de messages.

---

### 4. Suggestions de démarrage (spécifiques Bob)

Après la première réponse, boutons ou liens cliquables type :

- Comprendre ma fiche de paie
- Comparer des contrats prévoyance
- Régime TNS vs salarié
- Aide retraite / seniors
- Expliquer une attestation mutuelle
- Extraire les infos d'un bulletin ou d'un contrat

---

### 5. Chat, documents, copier, PDF

- **Chat** : Auto-focus après "Bonjour" et après chaque envoi. Raccourcis : Entrée = envoyer ; Shift+Entrée = saut de ligne ; Ctrl+V / Cmd+V = collage d'image.
- **Upload** : bouton + drag & drop, formats PDF, Word, Excel, images. Limites identiques à Nina (ex. 10 fichiers, 20 Mo).
- **Copier** : bouton "Copier" par bulle Bob + feedback "Copié". Option "Masquer données sensibles avant copie" (IBAN, n° sécu, email, tél).
- **PDF** : "Télécharger en PDF" par bulle ; "Exporter la conversation en PDF" ; PDF du brouillon (panneau droit). Génération côté client ; mobile → nouvel onglet.

---

### 6. Backlog (priorités)

| Priorité | Idée | Description |
|----------|------|-------------|
| **Haute** | Page Bob + route + prompt | Créer la page `/commun/agents-ia/bob-sante`, branchement API `agent === "bob"`, `bob-system-prompt.ts`. |
| Haute | Zone de brouillon (split screen) | Comme Nina : conversation à gauche, brouillon à droite (lg+). |
| Haute | Raccourci global | `Alt + B` / `Cmd + Shift + B` pour ouvrir Bob. |
| Moyenne | Actions rapides | "Mettre dans le brouillon", "Résumer en 3 points", "Transformer en synthèse pour mon expert". |

---

## Points à trancher en équipe

1. **Route exacte** : `/commun/agents-ia/bob-sante` ou `/bob` ? Raccourci global `Alt + B` / `Cmd + Shift + B` ?
2. **Périmètre juridique** : disclaimers à afficher (ex. "Bob vous aide à comprendre ; pour une décision personnelle, consultez un professionnel"). Où et comment les intégrer (modale, bandeau, en bas des réponses) ?
3. **Public cible prioritaire** : TNS d'abord, ou salariés, ou entreprises ? Impact sur les suggestions de démarrage et le ton.
4. **Avatar** : cercle + bordure ; choix de la couleur primaire (bleu santé / teal / autre).
5. **Stockage** : V1 LocalStorage ; V2 base pour reprise multi-appareils (comme Nina).

---

## Plan d'action et check-list de tests

### Modifications à venir

| Id | Thème | Fichiers à modifier | Résumé |
|----|--------|---------------------|--------|
| — | À compléter au fil des sprints | — | — |

### Constantes (à définir dans `lib/assistant/config.ts`)

`BOB_TIMEOUT`, `SUMMARY_WINDOW`, `MAX_HISTORY_MESSAGES`, `PDF_EXPORT_MAX_CHARS`, `ENABLE_BOB_BOT`.

### Check-list de tests manuels (Bob)

1. Raccourci `Alt+B` / `Cmd+Shift+B` ouvre Bob ; inactif si focus dans saisie.
2. "Bonjour" → salutation + focus saisie.
3. Chat streamé, "Bob écrit…".
4. Upload image et fichiers (bulletin, attestation, contrat).
5. Copier une réponse ; avec "Masquer données sensibles" → masquage (dont n° sécu si ajouté).
6. PDF par message et export conversation ; mobile → nouvel onglet.
7. Brouillon : "Mettre dans le brouillon", copier, PDF.
8. Erreur → "Réessayer".
9. Suggestions de démarrage : clic sur "Comprendre ma fiche de paie" (ou équivalent) → question envoyée et réponse pertinente.
10. Hors-sujet → Bob recentre sur santé / prévoyance.

---

*Document vivant : à mettre à jour au fil des décisions et des sprints.*
