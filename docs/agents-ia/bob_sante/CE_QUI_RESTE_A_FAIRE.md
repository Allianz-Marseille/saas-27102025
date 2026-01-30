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
| 2.2 | **Variable Vercel** | `NEXT_PUBLIC_ENABLE_BOB_BOT=true` ajoutée dans le projet Vercel (saas-allianz-marseille). |
| 2.5 | **URLs tunnels de devis** | Liste complète dans `liens-devis-allianz.md` avec code agence H91358 (auto, habitation, santé, pro, etc.). |
| 2.3 | **Documents de test** | Exemples anonymisés dans `docs/agents-ia/bob_sante/documents-de-test/` (2035 BNC, 2033 BIC, 2033 IS, attestation CA auto). |
| 2.8 | **Tests manuels** | Scénario upload 2033 BIC + analyse IJ + alerte Frais Fixes validé (grille de lecture, règle détective). Reste optionnel : raccourci, Bonjour, copier, export PDF, brouillon, suggestions, recentrage. |
| 2.7 | **Points à trancher en équipe** | Décisions prises : route actuelle conservée (+ redirection `/bob` si besoin), disclaimers en bandeau haut + lien Mentions légales, public prioritaire TNS puis salariés/entreprises, couleur teal conservée, stockage V1 LocalStorage (V2 base = évolution ultérieure). Raccourci Alt+B / Cmd+Shift+B confirmé. |
| 2.6 | **Chiffres réglementaires** | Source unique dynamique : `lib/assistant/regulatory-figures.ts` (PASS, Madelin, URLs URSSAF/Service-public). Bob charge le bloc à chaque requête. Mise à jour annuelle = éditer ce fichier (PASS_ANNUEL, PASS_YEAR). |

---

### Ce qui reste à faire (bloc 2)

Aucun point bloquant. Mise à jour annuelle optionnelle : éditer `lib/assistant/regulatory-figures.ts` (PASS, année) — voir § 2.6 ci-dessous.

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

### 2.2 Variable Vercel — ✅ Fait

- Dans le projet Vercel : ajouter ou compléter **`ENABLE_BOB_BOT`** (et si besoin `BOB_TIMEOUT`, `OPENAI_API_KEY`).
- Si l’affichage de Bob dépend du front : **`NEXT_PUBLIC_ENABLE_BOB_BOT`**.

**Comment faire (Vercel) :**

1. Ouvre ton projet sur [vercel.com](https://vercel.com) → **Settings** → **Environment Variables**.
2. Ajoute une variable :
   - **Name :** `NEXT_PUBLIC_ENABLE_BOB_BOT`
   - **Value :** `true` (pour activer Bob en prod)
   - **Environments :** coche Production (et Preview / Development si tu veux Bob aussi en preview).
3. **Redéploie** le projet (Deployments → ⋮ sur le dernier déploiement → Redeploy), car les variables `NEXT_PUBLIC_*` sont injectées au build.

*`OPENAI_API_KEY` est normalement déjà présente pour l'assistant/Nina. `BOB_TIMEOUT` est fixé à 60 s dans le code ; pas besoin de variable tant que tu ne changes pas.*

---

### 2.3 Documents de test — ✅ Fait

- Des **exemples anonymisés** sont dans `docs/agents-ia/bob_sante/documents-de-test/` : 2035 BNC, 2033 BIC, 2033 IS, attestation CA auto-entrepreneur. Voir le README du dossier pour tester l'upload et l'analyse par Bob. Tu peux ajouter des liasses réelles anonymisées si besoin.

---

### 2.4 Enrichissement Allianz.fr — ✅ Fait

- Liens Allianz.fr dans `references.md`, `liens-devis-allianz.md`, renvois dans 2 fiches. (Prompt Cursor déjà utilisé.)

---

### 2.5 URLs des tunnels de devis — ✅ Fait

- Liste complète dans `docs/knowledge/bob/liens-devis-allianz.md` (code agence H91358). Bob charge cette fiche via `loadBobKnowledge()`.

---

### 2.6 Chiffres réglementaires (PASS, Madelin) — ✅ Source unique dynamique

- **Source unique :** `lib/assistant/regulatory-figures.ts` — PASS, année, formule Madelin, URLs officielles (URSSAF, Service-public). Bob charge ce bloc à chaque requête.
- **Mise à jour annuelle :** modifier dans ce fichier `PASS_ANNUEL` et `PASS_YEAR` (et les URLs dans `REGULATORY_SOURCES` si besoin). Plus besoin de toucher aux fiches markdown pour les chiffres.
- **Référence :** [URSSAF — Plafonds](https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/plafonds-securite-sociale.html), [Service-public — PASS](https://www.service-public.fr/particuliers/actualites/A15386).

---

### 2.7 Points à trancher en équipe — ✅ Fait

Décisions prises (recommandations validées) :

| Point | Décision |
|-------|----------|
| **Route** | Garder `/commun/agents-ia/bob-sante`. Ajouter une redirection `/bob` → cette page si besoin (lien court). |
| **Raccourci** | **Alt+B** / **Cmd+Shift+B** confirmé (déjà en place). |
| **Disclaimers** | Bandeau fixe en haut de la page Bob + lien vers Mentions légales. Pas de phrase en bas de chaque réponse. |
| **Public cible prioritaire** | TNS en premier (où Bob apporte le plus), puis salariés et entreprises. |
| **Couleur primaire** | Teal conservé (changer seulement si charte agence l’impose). |
| **Stockage** | V1 LocalStorage pour la partie 3. V2 (conversations en base, multi-appareils) = évolution ultérieure. |

Cursor appliquera ces décisions en partie 3 (bandeau disclaimer, redirection `/bob` si demandée, pas de changement stockage).

---

### 2.8 Tests manuels — ✅ Validé

- **Validé :** Upload document 2033 BIC (ex. `exemple-2033-bic.txt`) + question « Analyse pour les IJ et frais généraux » → Bob identifie le profil BIC, extrait assiette IJ (47 100 €), frais généraux (24 500 €), et applique la règle détective (alerte garantie Frais Fixes renforcée).
- **Optionnel :** Raccourci, « Bonjour », copier/masquage sensibles, export PDF, brouillon, suggestions, recentrage hors-sujet. Voir [TODO.md § 14](./TODO.md#14-check-list-de-tests-manuels). Remonter à Cursor tout bug ou ajustement.

---

## 3. Finalisation par Cursor — à lancer quand tu confirmes que le bloc 2 est prêt

**Déclencheur :** les décisions 2.7 sont prises → tu peux lancer la partie 3 dès maintenant en disant « On lance la partie 3 » ou « Finalise Bob avec les décisions 2.7 ». Le point 2.6 (chiffres réglementaires annuels) peut attendre.

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

---

## La suite

**Bloc 2 — Statut :** 2.7 est fait (décisions prises). Il ne reste que :

| Priorité | # | Action |
|----------|---|--------|
| 1 | **Partie 3** | **Lancer la finalisation par Cursor** : dire **« On lance la partie 3 »** ou **« Finalise Bob avec les décisions 2.7 »** → Cursor applique les décisions (bandeau disclaimer, redirection `/bob` si demandée), sans toucher au stockage ni à la couleur. |
| 2 | **2.6 (annuel)** | Mise à jour PASS/Madelin : éditer **un seul fichier** `lib/assistant/regulatory-figures.ts` (PASS_ANNUEL, PASS_YEAR). Les sources officielles (URSSAF, Service-public) y sont documentées. |
| 3 | **2.8 (optionnel)** | Compléter les tests manuels (raccourci, Bonjour, copier, export PDF, brouillon, suggestions, recentrage) et remonter tout bug à Cursor. |
