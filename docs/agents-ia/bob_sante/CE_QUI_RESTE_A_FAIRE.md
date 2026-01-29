# Bob Santé — Ce qui reste à faire

Répartition en **3 étapes** : Cursor tout de suite → toi → Cursor en finalisation.

Références : [bob_sante.md](./bob_sante.md), [TODO.md](./TODO.md).

---

## 1. Ce que Cursor peut faire immédiatement (sans aucune modification de ta part)

**Phase 1 — Implémentée le 29 janvier 2026.** Réalisé : zone de saisie, upload, copier/sensibles, sources, export PDF, streaming/erreurs, menu ···, brouillon, raccourci global (Alt+B / Cmd+Shift+B), suggestions de démarrage, `loadBobKnowledge()`, cœur de Bob dans le prompt, UI/accessibilité. **Modale de présentation Bob** : reportée (à faire quand Bob sera complet).

Cursor peut réaliser tout ce qui suit **sans attendre** de contenu, décision ou config de ta part. Tu n’as rien à modifier.

| # | Tâche | Détail | Statut phase 1 |
|---|--------|--------|----------------|
|---|--------|--------|
| 1 | **Modale de présentation** | Titre, accroche, « Ce qu’il fait pour vous », fonctionnalités, CTA. Contenu déjà dans `bob_sante.md` § *Texte de présentation (modale)*. | Reportée (quand Bob complet) |
| 2 | **Zone de saisie et raccourcis** | Auto-focus après première réponse et après envoi. Entrée = envoyer, Shift+Entrée = saut de ligne, Ctrl+V / Cmd+V = coller image. | Fait |
| 3 | **Upload** | Bouton + paste + drag & drop : images + PDF, Word, Excel, TXT, CSV — max 10 fichiers / message, 20 Mo / fichier. | Fait |
| 4 | **Copier + sensibles** | Bouton « Copier » par réponse, feedback « Copié » + toast. Alerte « Évitez de coller données sensibles » + checkbox « Masquer données sensibles avant copie ». | Fait |
| 5 | **Sources et fichiers** | Affichage des sources et noms des fichiers en bas de chaque réponse. | Fait |
| 6 | **Export PDF** | « Télécharger en PDF » par réponse longue (html2canvas + jspdf). « Exporter la conversation en PDF » dans la barre → `bob-conversation-YYYY-MM-DD.pdf`. Mobile : ouverture PDF dans un nouvel onglet (iOS). | Fait |
| 7 | **Streaming et erreurs** | Indicateur « Bob écrit… » pendant le streaming. Gestion d’erreurs : message + bouton « Réessayer ». Option « Nouvelle conversation » si persistance. | Fait |
| 8 | **Menu ··· et actions rapides** | Menu « ··· » (export, nouvelle conversation). Par réponse longue : « Mettre dans le brouillon », « Résumer en 3 points », « Transformer en synthèse pour mon expert ». | Fait |
| 9 | **Split screen Brouillon** | Conversation à gauche, panneau Brouillon à droite (lg+) ; copier + export PDF du brouillon. Brouillon masqué sous `lg`. | Fait |
| 10 | **Raccourci global** | Alt+B / Cmd+Shift+B → navigation vers Bob ; désactivé si focus input/textarea/contenteditable. | Fait |
| 11 | **Suggestions de démarrage** | Tous les boutons/liens après la première réponse (DUE, analyse 2035, arguments TNS, régime général/SSI, garanties minimales, fiche de paie, etc.) — libellés dans [TODO.md § 10](./TODO.md#10-suggestions-de-démarrage). | Fait |
| 12 | **Loader base de connaissances** | `loadBobKnowledge()` dans `knowledge-loader.ts` : charge `docs/knowledge/bob/` quand `context.agent === "bob"` (limite 28k caractères). Fonctionne avec le dossier vide ou partiellement rempli. | Fait |
| 13 | **Cœur de Bob dans le prompt** | Injecter dans le prompt : costume juridique (2035/2031/2033/2065, NAF, BNC/BIC/IS/Micro), formules IJ (BNC EI, BIC EI, Société IS, Micro), logique DUE (collège, 50 % employeur, dispenses), règle « détective » (bénéfice faible + frais généraux élevés → Frais Fixes). Contenu dérivé de `bob_sante.md`. | Fait |
| 14 | **UI et accessibilité** | Couleur primaire par défaut (ex. teal, à surcharger plus tard si tu en choisis une). Neutres Slate, dark mode, `aria-label`, tooltips, micro-interactions. | Fait |
| 15 | **Tests du prompt** | Vérifier réponse au « Bonjour » et recentrage hors-sujet (santé / prévoyance). | À valider manuellement |

**En résumé** : tout le code UI, upload, export, brouillon, raccourci, suggestions, loader de connaissance (sur dossiers existants), règles « cœur de Bob » et tests de prompt peuvent être faits **tout de suite** par Cursor.

---

## 2. Ce que tu dois faire à la suite

À faire **de ton côté** (ou en équipe) après ou en parallèle du bloc 1. Sans ça, la finalisation (bloc 3) ne peut pas être complète.

---

### Ce qui a été fait (bloc 2)

| # | Tâche | Commentaire |
|---|--------|-------------|
| 2.1 | **Base de connaissances** | Toutes les fiches listées ci‑dessous sont créées dans `docs/knowledge/bob/` (+ `liens-devis-allianz.md`). |
| 2.4 | **Enrichissement Allianz.fr** | Liens Allianz.fr dans `references.md`, `liens-devis-allianz.md`, renvois dans `prevoyance-tns-regles-ij.md` et `regimes-obligatoires-ccn.md`. |
| 2.5 | **URLs tunnels de devis** | Liste complète dans `liens-devis-allianz.md` avec code agence H91358 (auto, habitation, santé, pro, etc.). |

---

### Ce qui reste à faire (bloc 2) — à faire avant de lancer la partie 3

| # | Tâche | À faire |
|---|--------|--------|
| **2.2** | **Variable Vercel** | Ajouter / compléter dans le projet Vercel : `ENABLE_BOB_BOT` ou `NEXT_PUBLIC_ENABLE_BOB_BOT` (et si besoin `BOB_TIMEOUT`, `OPENAI_API_KEY`). |
| **2.3** | **Documents de test** | Préparer des liasses 2035 / 2033 anonymisées (ou attestations CA, bulletins) pour tester l’upload et l’analyse par Bob. |
| **2.6** | **Chiffres réglementaires** | Une fois par an : vérifier PASS et Madelin (URSSAF, Allianz) et mettre à jour `docs/knowledge/bob/` et `references.md`. |
| **2.7** | **Points à trancher en équipe** | Route finale, disclaimers, public cible, couleur primaire, stockage (voir détail ci‑dessous). |
| **2.8** | **Tests manuels** | Après mise en place : raccourci, Bonjour, chat, upload, copier, export PDF, brouillon, suggestions, recentrage ; remonter bugs à Cursor. |

**Quand tu confirmes que ces points sont faits (ou que tu as les infos pour 2.2, 2.7, 2.8), on lance la partie 3.**

---

### 2.1 Base de connaissances — Fiches à créer ou compléter — ✅ Fait

Dossier : **`docs/knowledge/bob/`**

Tu dois **rédiger le contenu** (ou le faire rédiger par un expert métier). Cursor peut générer des ébauches à partir de `bob_sante.md`, mais le contenu métier final reste de ton ressort.

| Fichier | Sujet |
|--------|--------|
| `fiscal-liasses-correspondances.md` | Mapping 2035, 2031, 2033, TNS vs IS |
| `retraite-collective-pero.md` | Art. 83, C1/C2/C3, fiscalité |
| `reglementaire-due-standard.md` | Canevas DUE santé/prévoyance/retraite, conformité |
| `prevoyance-tns-regles-ij.md` | Franchises, frais généraux, réintégrations Madelin |
| `sante-panier-soins-minimal.md` | Contrat Responsable, 100 % Santé |
| `commercial-objections-reponses.md` | Argumentation, aide à la vente |
| `ccn-top10-obligations.md` | Obligations conventionnelles prioritaires |
| `2035-bilan-tns.md` | Grille de lecture liasse, Cheat Sheet (BNC, BIC, IS, Auto-entrepreneur) |
| `due-contrat-groupe.md` | Structure DUE, procédure CSE, décharge, preuves URSSAF, canevas |
| `audit-diagnostic-conseiller.md` | Questions clés situation civile / activité → garanties (rente conjoint, éducation, capital décès) |
| `fiscalite-entree-sortie-prevoyance.md` | Expertise Fiscale 360° (entrée/sortie) |
| `regimes-obligatoires-ccn.md` | Socles Sécu/caisses libérales, 5 points vigilance CCN |
| `glossaire.md` | Définitions (cotisation, assiette, TNS, Loi Madelin, etc.) |
| `faq.md` ou `faq-regimes.md`, `faq-sante.md`, `faq-prevoyance.md` | FAQ par thème |
| `references.md` | Loi Madelin, ANI, CCN, taux URSSAF (avec date de mise à jour) |

Tu peux réutiliser ou dupliquer `docs/knowledge/sources/sante-regles-remboursement.md`. Fiches par public : réutiliser ou adapter `docs/knowledge/segmentation/`.

---

### 2.2 Variable Vercel — ⬜ À faire

- Dans le projet Vercel : ajouter ou compléter **`ENABLE_BOB_BOT`** (et si besoin `BOB_TIMEOUT`, `OPENAI_API_KEY`).
- Si l’affichage de Bob dépend du front : **`NEXT_PUBLIC_ENABLE_BOB_BOT`**.

---

### 2.3 Documents de test — ⬜ À faire

- Préparer des **liasses 2035 / 2033 anonymisées** (ou attestations CA, bulletins) pour tester l’upload et l’analyse par Bob.

---

### 2.4 Enrichissement Allianz.fr — ✅ Fait

- Liens Allianz.fr dans `references.md`, `liens-devis-allianz.md`, renvois dans 2 fiches. (Prompt Cursor déjà utilisé.)

---

### 2.5 URLs des tunnels de devis — ✅ Fait

- Liste complète dans `docs/knowledge/bob/liens-devis-allianz.md` (code agence H91358). Bob charge cette fiche via `loadBobKnowledge()`.

---

### 2.6 Chiffres réglementaires (PASS, Madelin) — ⬜ À faire (annuel)

- **Une fois par an** (ou à chaque changement) : vérifier les plafonds PASS et Madelin (URSSAF, Allianz) et **mettre à jour** `docs/knowledge/bob/` et `references.md`.

---

### 2.7 Points à trancher en équipe — ⬜ À faire

- Route : `/commun/agents-ia/bob-sante` ou `/bob` ? Raccourci **Alt+B** / **Cmd+Shift+B** confirmé ?
- Où afficher les **disclaimers** juridiques (modale, bandeau, en bas des réponses) ?
- **Public cible prioritaire** : TNS, salariés ou entreprises en premier ?
- **Couleur primaire** : bleu santé / teal / autre ?
- **Stockage** : V1 LocalStorage ; V2 base pour reprise multi-appareils ?

Dès que c’est décidé, tu transmets à Cursor pour la finalisation (bloc 3).

---

### 2.8 Tests manuels — ⬜ À faire (après mise en place du code)

- Vérifier : raccourci, « Bonjour », chat streamé, upload image/fichiers, copier avec masquage sensibles, export PDF, brouillon, suggestions de démarrage, recentrage hors-sujet.  
Voir [TODO.md § 14](./TODO.md#14-check-list-de-tests-manuels). Remonter à Cursor les bugs ou ajustements.

---

## 3. Finalisation par Cursor — à lancer quand tu confirmes que le bloc 2 est prêt

**Déclencheur :** tu confirmes que les points « Ce qui reste à faire » (2.2, 2.3, 2.6, 2.7, 2.8) sont faits ou que tu as les infos nécessaires → on lance la partie 3.

Une fois que c’est le cas, Cursor peut :

| # | Tâche de finalisation | Déclencheur (ce que tu as fourni) |
|---|------------------------|-----------------------------------|
| 1 | **Intégrer / adapter le loader** | Fiches créées ou ébauchées dans `docs/knowledge/bob/` → Cursor peut ajuster `loadBobKnowledge()` (ordre, priorité, limite de tokens), voire préparer une base pour un RAG ultérieur. |
| 2 | **Insérer les URLs des tunnels de devis** | Tu as communiqué les URLs vérifiées → Cursor les insère dans `constants.ts`, config, prompt, modale, fiches. |
| 3 | **Appliquer les décisions équipe** | Route finale, emplacement des disclaimers, couleur primaire, stratégie stockage → Cursor met à jour le code (routes, composants, thème, disclaimer, persistance). |
| 4 | **Enrichir le prompt avec le contenu métier** | Fiches complétées → Cursor peut affiner le prompt système ou les instructions de sourçage en fonction du contenu réel. |
| 5 | **Corrections après tes tests manuels** | Tu remontes bugs ou souhaits (UX, accessibilité, wording) → Cursor corrige et ajuste. |
| 6 | **(Optionnel) RAG** | Si tu veux passer à un RAG (embeddings, vector store) : Cursor documente ou implémente la spec technique une fois que la base de connaissances est stabilisée. |

**En résumé** : la finalisation par Cursor dépend de ce que tu auras livré (fiches, URLs, décisions, retours de tests). Dès que c’est prêt, tu confirmes et on lance la partie 3 (ex. : « C’est fait, on lance la partie 3 » ou « Finalise Bob avec [décisions / retours tests] »).

---

## Synthèse

| Étape | Qui | Quoi |
|-------|-----|------|
| **1** | **Cursor** | Tout le code immédiat : modale, saisie, upload, copier, export PDF, streaming, erreurs, brouillon, menu ···, actions rapides, suggestions, loader, cœur de Bob, UI/accessibilité, tests prompt. |
| **2** | **Toi** | Fiches base de connaissances, variable Vercel, documents de test, enrichissement Allianz, URLs devis, mise à jour PASS/Madelin, décisions équipe, tests manuels + remontée des retours. |
| **3** | **Cursor** | Finalisation : intégration des fiches/URLs/décisions, ajustements prompt, corrections après tes tests, optionnellement RAG. |
