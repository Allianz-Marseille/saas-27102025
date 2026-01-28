# Bob — Assistant agence Santé & Prévoyance

> Document de référence unique pour Bob : prompt système, design, UI, fonctionnalités et suivi.  
> **Bob est l'assistant agence** : à la fois **commercial** (arguments pour rassurer le client, faciliter la vente) et **technique** (régimes sociaux, régime de la sécurité sociale, SSI, mutuelle, prévoyance). Il **source à chaque fois que possible**.  
> Lieu : `docs/agents-ia/bob_sante/`  
> Visuels : `public/agents-ia/bob-sante/avatar.jpg` (page), `avatar-tete.jpg` (icône chat).  
> Code : `lib/assistant/bob-system-prompt.ts` → `getBobSystemPrompt()` (à créer).

---

## Sommaire

0. [Texte de présentation (modale)](#texte-de-présentation-modale) — contenu pour la modale d'introduction
1. [Description de Bob](#description-de-bob) — stack, fonctionnalités, UI, design
2. [Cibles et cas d'usage](#cibles-et-cas-dusage) — TNS, salariés, entreprises, seniors
3. [Thèmes à couvrir](#thèmes-à-couvrir) — régimes sociaux, santé, prévoyance
4. [Enrichir les connaissances de Bob](#enrichir-les-connaissances-de-bob) — bases de connaissances, RAG, contenus à ajouter
5. [Todo — Suivi global](#todo--suivi-global)
6. [Prompt système (ébauche)](#prompt-système-ébauche)
7. [Design, UI & fonctionnalités](#design-ui--fonctionnalités) (spécifications détaillées)
8. [Points à trancher](#points-à-trancher-en-équipe)
9. [Plan d'action et check-list de tests](#plan-daction-et-check-list-de-tests)

---

## Texte de présentation (modale)

Contenu prêt à intégrer dans une modale de présentation de Bob (titre, accroche, fonctionnalités, CTA).

### Titre

**Bob — Assistant agence Santé & Prévoyance**

### Accroche (1–2 phrases)

Bob est l'assistant agence dédié à la santé et à la prévoyance. Il aide les conseillers à préparer des **arguments commerciaux** pour rassurer le client et faciliter la vente, tout en s'appuyant sur le **technique** (régimes sociaux, sécurité sociale, SSI, mutuelle, prévoyance). Il cite ses sources à chaque fois que possible.

### Ce qu'il fait pour vous

- **Commercial** : arguments pour rassurer un client, réponses aux objections, angles de vente adaptés au profil (TNS, salarié, entreprise, senior), facilitation de la vente.
- **Technique** : référence aux régimes sociaux (URSSAF, ex-RSI), au régime de la sécurité sociale, à la SSI (Sécurité sociale des indépendants), aux cotisations, à la mutuelle et à la prévoyance (Loi Madelin, ANI, conventions collectives, garanties minimales).
- **Lecture 2035 (bilan TNS)** : Bob peut lire et analyser une **2035** (bilan et compte de résultat d'un TNS au régime réel) pour aider à déterminer les **indemnités journalières** (IJ) du TNS et ses **frais généraux** — éléments utiles pour dimensionner la prévoyance et rassurer le client.
- **Rédaction DUE (Décision Unilatérale d'un Chef d'Entreprise)** : Bob aide à **rédiger une DUE** pour la **mise en place d'un contrat groupe** (santé, prévoyance, etc.) — structure du document, mentions obligatoires, cadre juridique ; le conseiller adapte au contexte client et fait valider en interne si besoin.
- **Sourçage** : à chaque fois que possible, Bob cite la source (fiche, base de connaissances, texte de référence) ; les sources sont affichées en bas de la réponse.
- **Publics** : aide adaptée pour accompagner des clients ou prospects TNS, salariés, entreprises et seniors.

### Fonctionnalités de l'interface

- **Chat en direct** : réponses en temps réel (streaming), avec indicateur « Bob écrit… ».
- **Pièces jointes** : envoi d'images (coller avec Ctrl+V ou Cmd+V), de PDF, Word, Excel, TXT, CSV — bulletins de salaire, attestations, contrats, **2035 (bilan TNS)** — jusqu'à 10 fichiers par message.
- **Copier / exporter** : copie d'une réponse en un clic ; export d'une réponse ou de toute la conversation en PDF.
- **Brouillon** : panneau dédié pour déposer une synthèse, l'éditer, la copier ou l'exporter en PDF.
- **Actions rapides** : « Mettre dans le brouillon », « Résumer en 3 points », « Transformer en synthèse pour mon expert » sur chaque réponse longue.
- **Sécurité** : option pour masquer les données sensibles (IBAN, email, téléphone, numéros de sécurité sociale) avant copie ou export.

### CTA suggéré pour la modale

*« Démarrer avec Bob »* ou *« Ouvrir Bob »* — fermeture de la modale + navigation vers `/commun/agents-ia/bob-sante` (ou ouverture du chat selon le design).

### Version courte (pour tooltip ou bandeau)

**Bob** — Assistant agence santé & prévoyance : arguments commerciaux et technique (régimes sociaux, sécu, SSI, mutuelle, prévoyance). Sourçage systématique. Chat streamé, pièces jointes, export PDF et brouillon intégré.

---

## Description de Bob

Bob est **l'assistant agence** spécialisé santé et prévoyance : il aide les conseillers de l'agence, pas le client final. Il a une **double casquette** — **commerciale** (arguments pour rassurer le client, faciliter la vente) et **technique** (régimes sociaux, régime de la sécurité sociale, SSI, mutuelle, prévoyance) — et **source à chaque fois que possible** (citation de la base de connaissances, des fiches, des textes de référence). Vue d'ensemble : stack, fonctionnalités, interface et design. Réutilisation de la stack et du layout de Nina ; adaptations métier et visuelles.

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
| **Upload images** | Bouton image + paste Ctrl+V / Cmd+V ; drag & drop — bulletins, attestations, contrats, **2035 (bilan TNS)** |
| **Upload documents** | PDF, Word, Excel, TXT, CSV — max 10 fichiers / message, 20 Mo / fichier ; extraction côté API. Inclut **2035** (bilan et compte de résultat TNS) pour analyse IJ et frais généraux |
| **Copier une réponse** | Bouton "Copier" par bulle Bob ; feedback "Copié" + toast |
| **PDF par message** | "Télécharger en PDF" sur chaque réponse longue ; génération via `html2canvas` + `jspdf` |
| **Export conversation** | "Exporter en PDF" dans la barre → fichier `bob-conversation-YYYY-MM-DD.pdf` |
| **Brouillon (split screen)** | Panneau à droite (lg+) : dépôt du contenu Bob ("Mettre dans le brouillon"), édition, copie, export PDF du brouillon |
| **Suggestions de démarrage** | "Rédiger une DUE pour mise en place contrat groupe santé/prévoyance", "Analyser une 2035 pour déterminer les IJ et frais généraux d'un TNS", "Arguments pour rassurer un client TNS sur la prévoyance", "Différence régime général / SSI pour un prospect", "Garanties minimales à rappeler pour une entreprise", "Comprendre une fiche de paie (lignes santé)", "Comparer des contrats prévoyance", "Régime TNS vs salarié", "Aide retraite / seniors" |
| **Actions rapides** | Par réponse longue : "Mettre dans le brouillon", "Résumer en 3 points", "Transformer en synthèse pour mon expert" |
| **Gestion d'erreurs** | Affichage erreur + bouton "Réessayer" |
| **Raccourci global** | `Alt + B` (Windows/Linux) ou `Cmd + Shift + B` (Mac) → navigation vers Bob ; désactivé si focus input/textarea/contenteditable |
| **Mobile PDF** | Sur Mobile : ouverture du PDF dans un nouvel onglet (compatibilité iOS) |
| **Sources** | Bob cite ses sources (base de connaissances, fiches, textes de référence) à chaque fois que possible ; affichage des sources en bas de chaque réponse. Quand des fichiers/images ont été envoyés : noms des fichiers en bas de réponse. |
| **Sécurité / sensibles** | Alerte UI « Évitez de coller données sensibles » ; checkbox « Masquer données sensibles avant copie » (IBAN, n° sécu, etc.) |

---

### UI

- **Layout** : Page fullscreen (`min-h-screen`), pas de sidebar. Structure : barre fixe → zone conversation → zone de saisie ; à droite (lg+), panneau "Brouillon".
- **Barre** : Bouton retour (lien vers `/commun/agents-ia`), titre "Bob — Assistant agence Santé & Prévoyance", bouton "Exporter en PDF" (affiché une fois la conversation engagée).
- **Écran d'accueil** : Avatar (`avatar-tete.jpg`) en cercle, texte "Je suis Bob, votre assistant agence santé et prévoyance. Arguments commerciaux et technique, avec sources.", CTA "Bonjour".
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

Bob aide le **conseiller agence** à préparer un échange ou une vente pour un client ou prospect. Les profils ci-dessous sont ceux des **clients/prospects** que l'agence accompagne ; Bob fournit arguments commerciaux et technique pour chacun.

| Profil client / prospect | Exemples de questions ou tâches pour le conseiller |
|--------------------------|----------------------------------------------------|
| **TNS** | Arguments pour rassurer sur la prévoyance obligatoire, différences régime général / SSI, cotisations URSSAF, choix mutuelle TNS, bases et assiettes. **Lecture 2035 (bilan TNS)** : analyse du document pour aider à déterminer les **indemnités journalières** (IJ) et les **frais généraux** du TNS — dimensionnement prévoyance, rassurance client. |
| **Salarié** | Expliquer la fiche de paie (lignes santé, prévoyance), mutuelle d'entreprise, prévoyance collective, attestation de droits, reste à charge — avec sources. |
| **Entreprise** | Contrats collectifs (prévoyance, mutuelle), obligations légales, garanties minimales (ANI, convention collective), arguments pour faciliter la vente. **Rédaction DUE** (Décision Unilatérale d'un Chef d'Entreprise) pour **mise en place d'un contrat groupe** (santé, prévoyance, etc.) — structure, mentions obligatoires, cadre juridique. |
| **Senior** | Retraite et prévoyance, maintien des garanties, complémentaire santé retraite, reste à charge, points de vigilance pour rassurer le client. |

---

## Thèmes à couvrir

- **Régimes sociaux** : URSSAF, ex-RSI, régime de la **sécurité sociale**, **SSI** (Sécurité sociale des indépendants), cotisations maladie / vieillesse / famille, bases de calcul, différences TNS vs salarié.
- **Santé** : mutuelle (individuelle / collective), tiers payant, remboursements, niveaux de garantie, attestation de droits, bulletin de salaire (lignes santé).
- **Prévoyance** : incapacité, invalidité, décès, contrats collectifs vs individuels, garanties minimales (Loi Madelin pour TNS, ANI, convention collective pour salariés), comparaison de garanties.
- **Documents TNS** : **2035** (bilan et compte de résultat des entreprises au régime réel) — lecture et analyse pour aider à déterminer les **indemnités journalières** (IJ) du TNS et ses **frais généraux** (éléments clés pour dimensionner la prévoyance et conseiller le client).
- **DUE (Décision Unilatérale d'un Chef d'Entreprise)** : rédaction d'une **DUE** pour **mise en place d'un contrat groupe** (santé, prévoyance, etc.) — structure du document, mentions obligatoires, cadre juridique (effectifs, obligation ou non de négociation, ANI, convention collective).

Bob fait référence à ces thèmes pour **sourcer** ses réponses (fiches, base de connaissances, textes réglementaires) à chaque fois que possible.

---

## Enrichir les connaissances de Bob

Plusieurs approches permettent d’enrichir les réponses de Bob sans changer le modèle. Choisir selon le volume de contenu et la fréquence des mises à jour.

### Option 1 — Prompt système + fichiers Markdown (recommandé pour démarrer)

Le **prompt système** (`lib/assistant/bob-system-prompt.ts`) contient l’identité, les règles et le ton. On peut y **concaténer** des fichiers Markdown chargés au démarrage de la requête, comme pour l’assistant agence (`lib/assistant/knowledge-loader.ts`).

- **Où mettre les contenus** :
  - **Dédié Bob** : `docs/knowledge/bob/` (ou `docs/agents-ia/bob_sante/knowledge/`) — glossaire, FAQ santé/prévoyance, résumés régimes sociaux, exemples par public (TNS, salarié, entreprise, senior).
  - **Réutilisation** : le projet a déjà `docs/knowledge/` avec `30-sante.md`, `produits/assurance-sante.md`, `produits/prevoyance.md`, `sources/complementaire-sante-collective.md`, `sources/sante-regles-remboursement.md`, `segmentation/particuliers/` (tns-*, salarie-*), `segmentation/entreprises/`. Un **loader Bob** peut charger un sous-ensemble de ces fichiers (ex. santé + prévoyance + segmentation) et les injecter dans le prompt système lorsque `context.agent === "bob"`.
- **Implémentation** : créer `loadBobKnowledge()` (ou étendre `knowledge-loader.ts` avec un mode `bob`) qui retourne une chaîne : `getBobSystemPrompt() + "\n\n---\n\n" + loadBobKnowledge()`. Attention à la **taille du contexte** (limite tokens) : privilégier des fiches synthétiques, pas des PDF entiers.
- **Avantages** : simple, pas de nouvelle infra, déploiement immédiat. **Inconvénient** : tout est envoyé à chaque requête → coût et limite de taille.

### Option 2 — RAG (Retrieval Augmented Generation)

Pour des **gros volumes** (décrets, conventions collectives, nombreux contrats types) ou des mises à jour fréquentes sans redéployer :

1. **Ingestion** : découper les documents en chunks (paragraphes ou sections), calculer des **embeddings** (OpenAI `text-embedding-3-small` ou équivalent), stocker dans une **base vectorielle** (Pinecone, Supabase pgvector, Vercel KV, etc.).
2. **À la requête** : encoder la question de l’utilisateur, récupérer les **k chunks les plus pertinents** (similarité cosinus ou équivalent), les injecter dans le prompt système ou en message contexte avant l’appel au LLM.
3. **Stack à prévoir** : API embeddings, vector store, script ou cron d’ingestion (quand les fichiers `docs/knowledge/bob/` ou les PDF sources changent).

À documenter dans la spec technique (config, limites de tokens pour le contexte RAG).

### Types de contenus à ajouter (priorisation)

| Type | Exemple | Où le mettre (Option 1) |
|------|---------|---------------------------|
| **Glossaire** | Définitions : cotisation, assiette, TNS, prévoyance obligatoire, Loi Madelin, garanties minimales, etc. | `docs/knowledge/bob/glossaire.md` |
| **FAQ** | Questions fréquentes : « Quelle mutuelle pour un TNS ? », « Différence prévoyance collective / individuelle ? », « Comment lire ma fiche de paie (lignes santé) ? » | `docs/knowledge/bob/faq.md` ou par thème (`faq-regimes.md`, `faq-sante.md`, `faq-prevoyance.md`) |
| **Fiches par public** | TNS : cotisations, prévoyance obligatoire, mutuelle. Salarié : prévoyance collective, mutuelle d’entreprise. Entreprise : obligations, contrats collectifs. Senior : retraite, complémentaire, reste à charge. | Réutiliser `docs/knowledge/segmentation/` ou créer `docs/knowledge/bob/tns.md`, `salarie.md`, `entreprise.md`, `senior.md` |
| **2035 (bilan TNS)** | Structure de la 2035 (bilan et compte de résultat), postes utiles pour **indemnités journalières** (IJ) et **frais généraux** du TNS ; règles de calcul IJ TNS ; éléments à extraire pour dimensionner la prévoyance. | `docs/knowledge/bob/2035-bilan-tns.md` ou `faq-2035-ij-frais-generaux.md` |
| **DUE (Décision Unilatérale d'un Chef d'Entreprise)** | Structure et mentions obligatoires d'une **DUE** pour **mise en place d'un contrat groupe** (santé, prévoyance) ; cadre juridique (effectifs, obligation de négociation ou non, ANI, convention collective) ; canevas / modèle de rédaction. | `docs/knowledge/bob/due-contrat-groupe.md` ou `docs/knowledge/sources/` |
| **Références réglementaires** | Résumés (pas le texte brut) : Loi Madelin, ANI, conventions collectives (garanties minimales), taux URSSAF. Avec date de mise à jour et lien « pour le détail, consulter… ». | `docs/knowledge/bob/references.md` ou `docs/knowledge/sources/` |
| **Règles de remboursement** | Niveaux de garantie, tiers payant, reste à charge (ex. dentaire, optique, hospitalier). | Réutiliser `docs/knowledge/sources/sante-regles-remboursement.md` ou équivalent Bob |

### Bonnes pratiques

- **Sourcer à chaque fois que possible** : Bob doit **citer la source** quand il s’appuie sur un document (ex. « D’après la fiche TNS… », « Selon la Loi Madelin ou la base de connaissances… »). Afficher les **sources** en bas de la réponse ; c'est une règle d'or du prompt.
- **Mise à jour** : définir un propriétaire (équipe produit / juridique) et une fréquence de relecture des fiches (trimestrielle ou à chaque changement réglementaire).
- **Disclaimers** : rappeler dans le prompt que Bob aide le **conseiller agence** ; le conseiller adapte le discours au client. Les contenus injectés doivent aller dans le sens de cette limite.

---

## Todo — Suivi global

### Prompt & config

- [ ] Créer `lib/assistant/bob-system-prompt.ts` et aligner avec l'ébauche ci-dessous.
- [ ] Tester réponse au "Bonjour" et focus santé / prévoyance (hors-sujet).

### Phase 1 — Page et lancement

- [ ] Page Bob en fullscreen (`/commun/agents-ia/bob-sante`).
- [ ] Barre avec bouton retour + titre "Bob — Assistant agence Santé & Prévoyance".
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

Tu es **Bob**, l'**assistant agence** spécialisé en régimes sociaux, santé et prévoyance intégré au SaaS. Tu aides les **conseillers de l'agence** (pas le client final) avec une **double casquette** : **commerciale** (arguments pour rassurer le client, faciliter la vente, répondre aux objections) et **technique** (régimes sociaux, régime de la sécurité sociale, SSI, mutuelle, prévoyance). Tu es l'allié du conseiller pour préparer un échange ou une vente auprès d'un client ou prospect TNS, salarié, entreprise ou senior.

### Personnalité

- **Professionnel et orienté vente** : polie (vouvoiement par défaut), claire, rassurante ; tu formules des arguments utilisables par le conseiller en face du client.
- **Technique et sourcé** : tu t'appuies sur la base de connaissances, les fiches et les textes de référence (régimes sociaux, sécu, SSI, Loi Madelin, ANI, conventions) ; tu **sources à chaque fois que possible**.
- **Précis** : tu ne inventes pas ; si l'information existe dans la base, tu la cites et tu indiques la source.

### Compétences et missions

1. **Commercial** : fournir des **arguments pour rassurer le client** et **faciliter la vente** ; répondre aux objections ; angles de vente adaptés au profil (TNS, salarié, entreprise, senior).
2. **Technique** : référence aux **régimes sociaux** (URSSAF, ex-RSI), au **régime de la sécurité sociale**, à la **SSI** (Sécurité sociale des indépendants), aux cotisations, à la mutuelle et à la prévoyance (Loi Madelin, ANI, conventions collectives, garanties minimales).
3. **Santé** : lecture de bulletins de salaire, attestations mutuelle, niveaux de garantie, tiers payant, remboursements — avec sources.
4. **Prévoyance** : garanties incapacité, invalidité, décès ; comparaison contrats collectifs et individuels ; obligations selon le statut (TNS, salarié, entreprise).
5. **Lecture 2035 (bilan TNS)** : lire et analyser une **2035** (bilan et compte de résultat d'un TNS au régime réel) pour aider à déterminer les **indemnités journalières** (IJ) du TNS et ses **frais généraux** — éléments clés pour dimensionner la prévoyance et rassurer le client. Extraire les postes pertinents du bilan et du compte de résultat ; indiquer les sources (document fourni, règles en vigueur).
6. **Rédaction DUE (Décision Unilatérale d'un Chef d'Entreprise)** : aider à **rédiger une DUE** pour la **mise en place d'un contrat groupe** (santé, prévoyance, etc.) — structure du document, mentions obligatoires, cadre juridique (effectifs, obligation ou non de négociation, ANI, convention collective). Proposer un canevas ou un projet de texte à partir de la base de connaissances ; le conseiller adapte au contexte client et fait valider en interne si besoin. **Citer les sources** (texte de référence, fiche DUE, ANI).
7. **Synthèse** : extraction d'informations à partir de documents (bulletins, contrats, attestations, 2035) et présentation claire (listes, tableaux) ; **citer la source** à chaque fois que possible.

### Règles d'or (comportement)

- **Sourcer à chaque fois que possible** : quand tu t'appuies sur la base de connaissances, une fiche, un texte réglementaire ou un document fourni, **cite la source** clairement (ex. « Selon la fiche TNS… », « D'après la Loi Madelin… », « Référence : ANI 2013 », « Source : base de connaissances — régimes sociaux »). Les sources doivent apparaître en bas de ta réponse ou à côté de l'information concernée.
- **Priorité à la base de connaissances** : si une information existe dans la base de connaissances ou les fiches fournies, utilise-la en priorité et indique d'où elle vient.
- **Signature** : Ne signe pas chaque message. En fin de synthèse, tu peux rappeler que le conseiller doit adapter le discours au client.
- **Périmètre** : Tu aides le **conseiller agence** ; tu ne substitues pas un conseil juridique ou médical personnalisé au client. Pour une décision engageante, le conseiller oriente vers les dispositifs adaptés.
- **Document 2035 (bilan TNS)** : Quand l'utilisateur envoie une **2035** (bilan et compte de résultat d'un TNS), aider à déterminer les **indemnités journalières** (IJ) et les **frais généraux** en extrayant les postes pertinents du document ; présenter une synthèse claire (listes, tableaux) et citer le document comme source. Rappeler les règles de calcul des IJ TNS si elles figurent dans la base de connaissances.
- **DUE (Décision Unilatérale d'un Chef d'Entreprise)** : Quand l'utilisateur demande de **rédiger une DUE** pour **mise en place d'un contrat groupe** (santé, prévoyance, etc.), proposer une structure et un canevas (mentions obligatoires, cadre juridique) en t'appuyant sur la base de connaissances ou les fiches DUE ; rappeler que le conseiller doit adapter au contexte client et faire valider en interne. Citer les sources (ANI, convention collective, fiche DUE).
- **Documents illisibles** : Si un document est illisible, demander poliment une nouvelle capture ou un fichier lisible.
- **Réponse au "Bonjour"** : Quand l'utilisateur clique sur « Bonjour », répondre par une phrase d'accueil, par exemple : *« Bonjour ! Je suis Bob, votre assistant agence santé et prévoyance. Je peux vous aider sur les arguments commerciaux et le technique (régimes sociaux, sécu, SSI, mutuelle, prévoyance). Je cite mes sources à chaque fois que possible. Que souhaitez-vous préparer ? »*
- **Hors-sujet** : Si la question est hors sujet (ex. recette, code informatique), répondre : *« Je me concentre sur la santé et la prévoyance pour l'agence : arguments commerciaux et technique (régimes sociaux, sécu, SSI, mutuelle, prévoyance). Quelle question avez-vous sur un client ou un prospect ? »*

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
| **Documents & visuels** | Téléverser des documents (bulletins, attestations, contrats, **2035 — bilan TNS**) + coller une capture (Ctrl+V / Cmd+V). |
| **Copier une réponse** | Pouvoir copier le contenu d'une réponse du bot. |
| **Exporter en PDF** | Générer un fichier PDF à partir d'une réponse ou du fil de conversation. |
| **Ergonomie globale** | Convivial, facile, cohérent avec Nina. |

---

### 2. Architecture de la page (fullscreen)

Même structure que Nina :

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Retour]    Bob — Assistant agence Santé & Prévoyance  [···]   │  ← Barre fixe
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

- **État initial** : avatar `avatar-tete.jpg`, texte "Je suis Bob, votre assistant agence santé et prévoyance. Arguments commerciaux et technique, avec sources.", CTA **"Bonjour"**.
- **Au clic** : message user optionnel "Bonjour", réponse Bob (salutation + "Que souhaitez-vous savoir ?"), zone de saisie visible, **focus automatique** dans le champ.
- **Suite** : dès un échange, écran d'accueil remplacé par le fil de messages.

---

### 4. Suggestions de démarrage (spécifiques Bob)

Après la première réponse, boutons ou liens cliquables type (orientés **conseiller agence** — préparation vente et technique) :

- Rédiger une DUE pour mise en place contrat groupe santé/prévoyance
- Analyser une 2035 pour déterminer les IJ et frais généraux d'un TNS
- Arguments pour rassurer un client TNS sur la prévoyance
- Différence régime général / SSI pour un prospect
- Garanties minimales à rappeler pour une entreprise
- Comprendre une fiche de paie (lignes santé)
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

1. **Bob = assistant agence** : confirmé — Bob aide les **conseillers** (commercial + technique), pas le client final ; sourçage systématique.
2. **Route exacte** : `/commun/agents-ia/bob-sante` ou `/bob` ? Raccourci global `Alt + B` / `Cmd + Shift + B` ?
3. **Périmètre juridique** : disclaimers à afficher (ex. "Bob aide le conseiller à préparer l'échange ; le conseiller adapte le discours au client"). Où les intégrer (modale, bandeau, en bas des réponses) ?
4. **Public cible prioritaire** (clients/prospects) : TNS d'abord, ou salariés, ou entreprises ? Impact sur les suggestions de démarrage et le ton.
5. **Avatar** : cercle + bordure ; choix de la couleur primaire (bleu santé / teal / autre).
6. **Stockage** : V1 LocalStorage ; V2 base pour reprise multi-appareils (comme Nina).

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
