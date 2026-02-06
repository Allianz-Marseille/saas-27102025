# FAQ Bob — Assistant agence Santé & Prévoyance

Questions fréquentes sur le fonctionnement de Bob, ses prompts, sa base de connaissances et où trouver chaque élément.

---

## 1. Qui est Bob ?

**Bob** est l’**assistant agence** dédié à la santé et à la prévoyance. Il aide les **conseillers de l’agence** (pas le client final) avec une double casquette :

- **Commerciale** : arguments pour rassurer le client, répondre aux objections, faciliter la vente.
- **Technique** : régimes sociaux (URSSAF, ex-RSI), régime de la sécurité sociale, SSI, mutuelle, prévoyance (Loi Madelin, ANI, conventions collectives, garanties minimales).

**Public cible (clients/prospects accompagnés par l’agence)** : TNS, salariés, entreprises, seniors.

**Principe** : Bob **sources à chaque fois que possible** — il cite la base de connaissances, les fiches et les textes de référence. Les sources sont affichées en bas des réponses.

---

## 2. Comment Bob fonctionne (côté technique)

### Route et page

- **URL** : `/commun/agents-ia/bob-sante`
- **Page** : `app/commun/agents-ia/bob-sante/page.tsx`

### API chat

- **Endpoint** : `POST /api/assistant/chat`
- **Contexte** : le front envoie `context: { agent: "bob" }`.

Quand `context.agent === "bob"`, l’API :

1. Charge le prompt système via `getBobSystemPrompt()` (`lib/assistant/bob-system-prompt.ts`).
2. Charge la base de connaissances via `loadBobKnowledge()` (`lib/assistant/knowledge-loader.ts`).
3. Ajoute le bloc de chiffres réglementaires via `getRegulatoryFiguresBlock()` (`lib/assistant/regulatory-figures.ts`).

**Formule du prompt système effectif :**

```
getBobSystemPrompt() + "\n\n---\n\n" + loadBobKnowledge() + "\n\n---\n\n" + getRegulatoryFiguresBlock()
```

Référence : `app/api/assistant/chat/route.ts` (lignes 196–204).

### Stack

- Next.js, React, TypeScript, Tailwind CSS
- Firebase Auth (Bearer token sur l’API chat)
- OpenAI (gpt-4o, streaming SSE)
- Extraction de documents : PDF, Word, Excel, TXT, CSV (bulletins, attestations, contrats, liasses 2035)
- Export PDF (réponse, conversation, brouillon) côté client (jspdf, html2canvas)

---

## 3. Quels sont ses prompts ?

### Fichier unique

Tout le prompt système Bob est dans **`lib/assistant/bob-system-prompt.ts`**, fonction **`getBobSystemPrompt()`**.

### Contenu du prompt (résumé)

| Bloc | Contenu |
|------|--------|
| **Identité** | Bob, assistant agence santé & prévoyance ; aide les conseillers pour préparer un échange ou une vente (TNS, salarié, entreprise, senior). |
| **Personnalité** | Professionnel, orienté vente ; technique et sourcé ; précis (ne pas inventer). |
| **10 compétences** | (1) Commercial, (2) Technique (régimes, sécu, SSI, mutuelle, prévoyance), (3) Santé (bulletins, attestations, garanties), (4) Prévoyance (incapacité, invalidité, décès), (5) Lecture documents TNS par « costume juridique » (Auto-entrepreneur, EI BNC/BIC, Société IS), (6) Rédaction DUE, (7) Synthèse, (8) Audit & Diagnostic, (9) Expertise Fiscale 360°, (10) Régimes obligatoires & CCN. |
| **Modules hors bilan TNS** | Conformité & DUE, analyse documents (2035, fiche de paie, attestations), aide à la vente & comparaison, actions systématiques (demander infos manquantes, « Action Suivante », tableaux Markdown), templates de réponse, proactivité senior (≥ 62 ans). |
| **Règles d’or** | Sourçage ; fiscalité des IJ (imposable ou non selon déduction) ; priorité base de connaissances ; périmètre (conseiller, pas conseil juridique personnalisé) ; analyse TNS par costume juridique ; DUE (demander collège / répartition / dispenses, preuve remise individuelle) ; cadres 1,50 % TA ; vigilance bénéfice / frais généraux ; TNS et situation familiale ; documents illisibles ; réponse au « Bonjour » ; **message d’amorce bilan TNS** ; **parcours guidé bilan TNS** (8 étapes) ; hors-sujet. |

**Référence détaillée** : la spec complète (dont l’ébauche du prompt et le « Cœur de Bob ») est dans **`docs/agents-ia/bob_sante/bob_sante.md`** (sections « Prompt système (ébauche) » et « Le Cœur de Bob »).

---

## 4. Base de connaissances

### Chargeur

- **Fonction** : `loadBobKnowledge()` dans **`lib/assistant/knowledge-loader.ts`**.
- **Dossiers lus** : `docs/knowledge/bob/` puis `docs/knowledge/bob/ro/` (ordre défini par le loader).
- **Limite** : 28 000 caractères au total (`BOB_KNOWLEDGE_MAX_CHARS`) ; les derniers fichiers peuvent être tronqués.

### Inventaire des fiches

Références : **`docs/knowledge/bob/00-SOURCE-DE-VERITE.md`** et **`docs/knowledge/bob/README.md`**.

**Fiches dans `docs/knowledge/bob/`** (exemples) : `00-SOURCE-DE-VERITE.md`, `2035-bilan-tns.md`, `audit-diagnostic-conseiller.md`, `ccn-top10-obligations.md`, `commercial-objections-reponses.md`, `due-contrat-groupe.md`, `faq.md`, `fiscal-liasses-correspondances.md`, `fiscalite-entree-sortie-prevoyance.md`, `glossaire.md`, `liens-devis-allianz.md`, `logique-parcours-bilan-tns.md`, `methodologie-conseil-prevoyance-tns.md`, `parcours-bilan-tns.md`, `prevoyance-tns-regles-ij.md`, `references.md`, `regimes-obligatoires-ccn.md`, `regimes-obligatoires-tns.md`, `reglementaire-due-standard.md`, `retraite-collective-pero.md`, `sante-panier-soins-minimal.md`, `synthese-comparative-ro-tns.md`, `templates-reponse-modules-bob.md`.

**Fiches dans `docs/knowledge/bob/ro/`** (par caisse) : `ssi.md`, `carmf.md`, `carpimko.md`, `cipav.md`, `cavec.md`, `cnbf.md`, `carcdsf.md`, `cavp.md`, `carpv.md`.

---

## 5. Parcours Bilan prévoyance TNS

### Déclencheur

- L’utilisateur demande un bilan prévoyance TNS « étape par étape » ou « me guider », ou clique sur la suggestion **« Bilan prévoyance TNS »** dans l’interface.

### Amorce

Bob répond d’abord par le **message d’amorce** (nom et prénom du client), puis enchaîne les étapes dans l’ordre.

### Les 8 étapes

| Étape | Contenu |
|-------|--------|
| 1 | Nom et prénom de l’assuré |
| 2 | Situation matrimoniale |
| 3 | Enfants à charge (si oui, âges) |
| 4 | Activité (profession, BNC/BIC) → identification de la **caisse obligatoire** et utilisation de la fiche `ro/[caisse].md` |
| 5 | Revenu annuel (bénéfice + cotisations pour assiette IJ) |
| 6 | Frais professionnels annuels |
| 7 | **Droits existants** : tableau (Garantie \| SSI \| RO \| Reste à assurer), calcul du gap, citation *« Sources : ro/[caisse].md »* |
| 8 | **Préconisation chiffrée** : IJ, capital décès, rentes, option Frais Fixes, Madelin, liens devis, mentions légales |

### Fiches clés du parcours

- `parcours-bilan-tns.md`, `logique-parcours-bilan-tns.md`
- `ro/[caisse].md` selon le métier (ex. `ro/ssi.md`, `ro/carmf.md`)
- `prevoyance-tns-regles-ij.md`, `2035-bilan-tns.md`, `audit-diagnostic-conseiller.md`, `liens-devis-allianz.md`

**Spec détaillée du parcours** : **`docs/agents-ia/bob_sante/parcours_bilan_tns.md`**. La fiche **chargée** par Bob est `docs/knowledge/bob/parcours-bilan-tns.md`.

---

## 6. Interface et fonctionnalités (rappel)

- **Accueil** : bouton « Bonjour » → salutation + apparition du chat, focus zone de saisie.
- **Chat** : réponses en streaming (« Bob écrit… »), bulles user / assistant.
- **Pièces jointes** : images (coller Ctrl+V / Cmd+V, bouton, drag & drop), documents (PDF, Word, Excel, TXT, CSV — ex. 2035), jusqu’à 10 fichiers par message.
- **Copier** : par réponse ; option « Masquer données sensibles avant copie ».
- **Export PDF** : par réponse, conversation entière, brouillon.
- **Brouillon** : panneau à droite (lg+), dépôt depuis une réponse, édition, copie, PDF.
- **Actions rapides** (réponses longues) : Mettre dans le brouillon, Résumer en 3 points, Transformer en synthèse pour mon expert.
- **Raccourci global** : **Alt+B** (Windows/Linux) ou **Cmd+Shift+B** (Mac) pour ouvrir Bob.

### Amorces de questions / sujets / thèmes

Une fois la conversation engagée, Bob affiche la phrase **« Que souhaitez-vous faire ? »** et une série de **boutons d’amorces** (suggestions de démarrage). Un clic envoie la question associée et lance la réponse adaptée. Les amorces proposées sont :

| Amorce | Thème |
|--------|--------|
| Bilan prévoyance TNS | Parcours guidé en 8 étapes (voir § 5). |
| Rédiger une DUE (contrat groupe) | Rédaction DUE santé/prévoyance/retraite. |
| Analyser une 2035 (IJ et frais généraux) | Lecture liasse BNC, extraction IJ et frais généraux. |
| Arguments pour rassurer un client TNS | Angles commerciaux prévoyance TNS. |
| Différence régime général / SSI | Pédagogie pour un prospect. |
| Garanties minimales entreprise | ANI, CCN, panier minimal. |
| Comprendre une fiche de paie (santé) | Lignes santé, part employeur. |
| Comparer des contrats prévoyance | Comparatif garanties. |
| Régime TNS vs salarié | Différences régimes. |
| Aide retraite / seniors | Retraite, maintien garanties, reste à charge. |
| Expliquer une attestation mutuelle | Pédagogie pour le client. |
| Extraire infos bulletin ou contrat | Synthèse à partir d’un document. |

La liste est définie dans la page Bob : `app/commun/agents-ia/bob-sante/page.tsx` (constante `SUGGESTIONS_DEMARRAGE`).

---

## 7. Où trouver quoi ?

| Besoin | Fichier ou dossier |
|--------|--------------------|
| **Doc de référence globale** | `docs/agents-ia/bob_sante/bob_sante.md` |
| **Prompt système** | `lib/assistant/bob-system-prompt.ts` |
| **Base de connaissances** | `docs/knowledge/bob/` + `docs/knowledge/bob/ro/` |
| **Inventaire et maintenance des fiches** | `docs/knowledge/bob/00-SOURCE-DE-VERITE.md`, `docs/knowledge/bob/README.md` |
| **Parcours bilan TNS (spec)** | `docs/agents-ia/bob_sante/parcours_bilan_tns.md` |
| **Parcours bilan TNS (fiche chargée)** | `docs/knowledge/bob/parcours-bilan-tns.md` |
| **API chat (branchement Bob)** | `app/api/assistant/chat/route.ts` |
| **Page Bob** | `app/commun/agents-ia/bob-sante/page.tsx` |
| **Chargeur de connaissances** | `lib/assistant/knowledge-loader.ts` (`loadBobKnowledge`) |
| **Chiffres réglementaires (PASS, Madelin)** | `lib/assistant/regulatory-figures.ts` |

---

*Document généré à partir du plan FAQ Bob. Pour le détail des règles métier, du design et des todos, voir `bob_sante.md`.*
