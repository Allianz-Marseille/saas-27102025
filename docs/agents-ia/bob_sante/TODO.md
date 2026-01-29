# TODO — Bob Assistant agence Santé & Prévoyance

Document de référence : [bob_sante.md](./bob_sante.md)

---

## État des lieux (à mettre à jour au fil de l'avancement)

| | Statut |
|---|--------|
| **Ce qui a été fait** | Page Bob (`/commun/agents-ia/bob-sante`), prompt `bob-system-prompt.ts`, API `context.agent === "bob"`, config `BOB_TIMEOUT` / `ENABLE_BOB_BOT`, liste agents + raccourci Alt+B / Cmd+Shift+B, dossier `docs/knowledge/bob/`. |
| **Ce qui reste à faire** | Fiches base de connaissances, modale présentation, variable Vercel `NEXT_PUBLIC_ENABLE_BOB_BOT`, tests manuels, points à trancher en équipe. |

---

## 2. À FAIRE PAR VOUS (actions manuelles)

- [ ] **Variable Vercel** : Dans le projet Vercel, ajouter/compléter `ENABLE_BOB_BOT` (et éventuellement `BOB_TIMEOUT`, `OPENAI_API_KEY` si pas déjà présentes).
- [ ] **Base de connaissances** : Créer ou compléter le dossier `docs/knowledge/bob/` avec les fiches listées dans bob_sante.md § Architecture de la Base de Connaissances Bob.
- [ ] **Documents de test** : Préparer des liasses 2035 / 2033 anonymisées (ou attestations CA, bulletins) pour les tests d'upload et d'analyse Bob.
- [ ] **Enrichissement Allianz.fr** : Utiliser le prompt Cursor dédié (bob_sante.md § Enrichissement avec Allianz.fr) pour faire rechercher sur Allianz.fr et ajouter les liens utiles / devis.
- [ ] **URLs des tunnels de devis** : Vérifier ou compléter les URLs dans le projet (`constants.ts`, `lib/assistant/config`, etc.) et les indiquer à Cursor pour insertion dans les sections pertinentes.
- [ ] **Chiffres réglementaires (PASS, Madelin)** : Vérifier une fois par an (ou à chaque changement) les plafonds PASS et Madelin sur URSSAF / Allianz et mettre à jour la base de connaissances Bob.
- [ ] **Points à trancher en équipe** : Valider les points listés dans la section 15 ci-dessous.

---

## 3. Code et routes (Stack technique)

- [x] Créer `app/commun/agents-ia/bob-sante/page.tsx` (route `/commun/agents-ia/bob-sante`).
- [x] Adapter `app/api/assistant/chat/route.ts` pour `context.agent === "bob"` → prompt Bob.
- [x] Créer `lib/assistant/bob-system-prompt.ts` → `getBobSystemPrompt()`.
- [x] Définir dans `lib/assistant/config` : `BOB_TIMEOUT`, `SUMMARY_WINDOW`, `MAX_HISTORY_MESSAGES`, `PDF_EXPORT_MAX_CHARS`, `ENABLE_BOB_BOT`.
- [x] S'assurer que `lib/assistant/mask-sensitive` est utilisé (IBAN, email, téléphone, n° sécu).

---

## 4. Prompt système

- [x] Finaliser le prompt dans `bob-system-prompt.ts` avec : Identité, Personnalité, Compétences 1–10, toutes les Règles d'or (sourçage, costume juridique, DUE, vigilance détective, Bonjour, hors-sujet, documents illisibles).
- [ ] Tester réponse au « Bonjour » et recentrage hors-sujet (santé / prévoyance).

---

## 5. Texte de présentation (modale)

- [ ] Intégrer le titre « Bob — Assistant agence Santé & Prévoyance » dans la modale.
- [ ] Intégrer l'accroche (1–2 phrases).
- [ ] Intégrer « Ce qu'il fait pour vous » (Commercial, Technique, Lecture 2035, Rédaction DUE, Sourçage, Publics).
- [ ] Intégrer les fonctionnalités de l'interface (chat, PJ, copier/export, brouillon, actions rapides, sécurité).
- [ ] Intégrer le CTA (« Démarrer avec Bob » / « Ouvrir Bob ») → navigation `/commun/agents-ia/bob-sante`.
- [ ] Prévoir la version courte (tooltip / bandeau) si besoin.

---

## 6. Phase 1 — Page et lancement

- [x] Page Bob en fullscreen (`/commun/agents-ia/bob-sante`).
- [x] Barre : bouton retour (vers `/commun/agents-ia`), titre « Bob — Assistant agence Santé & Prévoyance », bouton « Exporter en PDF » (affiché une fois la conversation engagée).
- [x] Écran d'accueil : image `bob_rit.png` (cercle, bordure discrète), texte d'intro, CTA « Bonjour ».
- [x] Comportement « Bonjour » : salutation Bob + « Que souhaitez-vous savoir ? » + apparition du chat + focus zone de saisie.

---

## 7. Phase 2 — Conversation et upload

- [ ] Zone de saisie avec auto-focus après première réponse et après chaque envoi.
- [ ] Raccourcis : Entrée (envoyer), Shift+Entrée (saut de ligne), Ctrl+V / Cmd+V (coller image).
- [ ] Upload images : bouton + paste + drag & drop (bulletins, attestations, contrats, 2035).
- [ ] Upload documents : PDF, Word, Excel, TXT, CSV — max 10 fichiers / message, 20 Mo / fichier.
- [ ] Coller une capture d'écran (Ctrl+V / Cmd+V).
- [ ] Bouton « Copier » par réponse Bob + feedback « Copié » + toast.
- [ ] Alerte UI « Évitez de coller données sensibles » + checkbox « Masquer données sensibles avant copie » (IBAN, n° sécu, email, tél).
- [ ] Affichage des sources en bas de chaque réponse ; noms des fichiers envoyés en bas de réponse.

---

## 8. Phase 3 — Export et confort

- [ ] « Télécharger en PDF » par réponse longue (html2canvas + jspdf).
- [ ] « Exporter la conversation en PDF » dans la barre → `bob-conversation-YYYY-MM-DD.pdf`.
- [ ] Indicateur « Bob écrit… » pendant le streaming.
- [ ] Gestion d'erreurs : affichage erreur + bouton « Réessayer ».
- [ ] Option « Nouvelle conversation » si persistance des échanges.
- [ ] Sur mobile : ouverture du PDF dans un nouvel onglet (compatibilité iOS).

---

## 9. Phase 4 — Finesse UI et accessibilité

- [ ] Menu « ··· » (paramètres, aide, export global).
- [ ] Actions rapides par réponse longue : « Mettre dans le brouillon », « Résumer en 3 points », « Transformer en synthèse pour mon expert ».
- [ ] Split screen : conversation à gauche, panneau Brouillon à droite (lg+) ; copier + export PDF du brouillon.
- [ ] Brouillon masqué en dessous de `lg` ; structure verticale sur mobile.
- [ ] Raccourci global : `Alt + B` (Windows/Linux) / `Cmd + Shift + B` (Mac) → navigation vers Bob ; désactivé si focus input/textarea/contenteditable.
- [ ] Accessibilité : `aria-label` sur les boutons, tooltips sur les actions.
- [ ] Design : couleur primaire (bleu santé / teal — à trancher), neutres Slate, typo (`text-xl font-semibold` titre, `text-sm` messages), dark mode (`dark:` + `next-themes`), micro-interactions (loader « Bob écrit… », feedback copie, toasts Sonner).

---

## 10. Suggestions de démarrage

Toutes les suggestions doivent être présentes en boutons/liens après la première réponse :

- [ ] Rédiger une DUE pour mise en place contrat groupe santé/prévoyance.
- [ ] Analyser une 2035 pour déterminer les IJ et frais généraux d'un TNS.
- [ ] Arguments pour rassurer un client TNS sur la prévoyance.
- [ ] Différence régime général / SSI pour un prospect.
- [ ] Garanties minimales à rappeler pour une entreprise.
- [ ] Comprendre une fiche de paie (lignes santé).
- [ ] Comparer des contrats prévoyance.
- [ ] Régime TNS vs salarié.
- [ ] Aide retraite / seniors.
- [ ] Expliquer une attestation mutuelle.
- [ ] Extraire les infos d'un bulletin ou d'un contrat.

---

## 11. Base de connaissances — Fichiers à créer

- [x] Créer le dossier `docs/knowledge/bob/` s'il n'existe pas.
- [ ] `fiscal-liasses-correspondances.md` — mapping 2035, 2031, 2033, TNS vs IS.
- [ ] `retraite-collective-pero.md` — Art. 83, C1/C2/C3, fiscalité.
- [ ] `reglementaire-due-standard.md` — canevas DUE santé/prévoyance/retraite, conformité.
- [ ] `prevoyance-tns-regles-ij.md` — franchises, frais généraux, réintégrations Madelin.
- [ ] `sante-panier-soins-minimal.md` — Contrat Responsable, 100 % Santé.
- [ ] `commercial-objections-reponses.md` — argumentation, aide à la vente.
- [ ] `ccn-top10-obligations.md` — obligations conventionnelles prioritaires.
- [ ] `2035-bilan-tns.md` (ou fiche dédiée) — grille de lecture liasse, Cheat Sheet (BNC, BIC, IS, Auto-entrepreneur).
- [ ] `due-contrat-groupe.md` — structure DUE, procédure de validation (CSE, décharge, preuves URSSAF), canevas, DUE retraite/PERO.
- [ ] `audit-diagnostic-conseiller.md` — questions clés situation civile et activité → garanties (rente conjoint, rente éducation, capital décès), diagnostic matrimonial PACS.
- [ ] `fiscalite-entree-sortie-prevoyance.md` — Expertise Fiscale 360° (entrée/sortie).
- [ ] `regimes-obligatoires-ccn.md` — socles Sécu/caisses libérales, 5 points vigilance CCN.
- [ ] `glossaire.md` — définitions (cotisation, assiette, TNS, Loi Madelin, etc.).
- [ ] `faq.md` ou `faq-regimes.md`, `faq-sante.md`, `faq-prevoyance.md`.
- [ ] Fiches par public : TNS, salarié, entreprise, senior (ou réutiliser `docs/knowledge/segmentation/`).
- [ ] `references.md` — Loi Madelin, ANI, CCN, taux URSSAF (avec date de mise à jour).
- [ ] Réutiliser ou dupliquer `sante-regles-remboursement.md` pour règles de remboursement.

---

## 12. Base de connaissances — Loader et RAG

- [ ] Créer `loadBobKnowledge()` ou étendre `knowledge-loader.ts` avec un mode `bob` : `getBobSystemPrompt() + "\n\n---\n\n" + loadBobKnowledge()`.
- [ ] Charger un sous-ensemble pertinent depuis `docs/knowledge/` et `docs/knowledge/bob/` lorsque `context.agent === "bob"` (en veillant à la limite de tokens).
- [ ] (Optionnel / plus tard) RAG : ingestion (chunks, embeddings, vector store), récupération à la requête, script ou cron d'ingestion — à documenter en spec technique.

---

## 13. Cœur de Bob (règles dans le prompt)

- [ ] Injecter dans le prompt : identification du « costume juridique » (numéro formulaire 2035/2031/2033/2065, NAF, catégorie BNC/BIC/IS/Micro).
- [ ] Injecter les formules de calcul des IJ (BNC EI, BIC EI, Société IS, Micro-entreprise).
- [ ] Injecter la logique DUE (collège, 50 % employeur, dispenses d'ordre public).
- [ ] Injecter la règle « détective » : bénéfice faible + frais généraux élevés → suggérer garantie « Frais Fixes » renforcée.

---

## 14. Check-list de tests manuels

- [ ] Raccourci Alt+B / Cmd+Shift+B ouvre Bob ; inactif si focus dans saisie.
- [ ] « Bonjour » → salutation + focus saisie.
- [ ] Chat streamé, « Bob écrit… ».
- [ ] Upload image et fichiers (bulletin, attestation, contrat, 2035).
- [ ] Copier une réponse ; avec « Masquer données sensibles » → masquage effectif.
- [ ] PDF par message et export conversation ; mobile → nouvel onglet.
- [ ] Brouillon : « Mettre dans le brouillon », copier, PDF.
- [ ] Erreur → « Réessayer ».
- [ ] Suggestions de démarrage : clic → question envoyée et réponse pertinente.
- [ ] Hors-sujet → Bob recentre sur santé / prévoyance.

---

## 15. Points à trancher en équipe

- [ ] Route exacte : `/commun/agents-ia/bob-sante` ou `/bob` ? Raccourci Alt+B / Cmd+Shift+B confirmé ?
- [ ] Périmètre juridique : où afficher les disclaimers (modale, bandeau, en bas des réponses) ?
- [ ] Public cible prioritaire : TNS, salariés ou entreprises en premier ?
- [ ] Couleur primaire : bleu santé / teal / autre ?
- [ ] Stockage : V1 LocalStorage ; V2 base pour reprise multi-appareils ?

---

## 16. Améliorations futures (niveau supérieur)

- [ ] Mapping fiscal précis : dictionnaire des cases fiscales en base de connaissances.
- [ ] Connexion CCN : base simplifiée (BTP, SYNTEC, HCR) pour rappels maintien de salaire, franchise.
- [ ] Bibliothèque de clauses DUE (temps partiel, apprentis, etc.).
- [ ] Détection d'opportunités (mutuelle sans prévoyance → bandeau conseil).
- [ ] Action rapide « Bob, aide-moi à conclure » (3 arguments de clôture).
- [ ] Mode « Bilan Flash » : tableau Situation actuelle / Risques détectés / Solution préconisée.
- [ ] Calculatrice intégrée (IJ à partir des chiffres liasse).
- [ ] Vision multi-docs (bulletin + contrat mutuelle → conformité part employeur).
- [ ] Vérification de version : afficher « Calcul basé sur le PASS 20XX » en bas des calculs.
- [ ] Détection qualité d'image (photo 2035 floue → demander nouvelle capture).
- [ ] Anonymisation étendue (noms, noms d'entreprises) pour export.
- [ ] Simulateur RAC : devis dentaire/optique + grille mutuelle → reste à charge.
- [ ] Priorisation équipe : Précision technique / Aide à la vente / Automatisation.

---

## 17. Plan d'action — Modifications à venir

- [ ] Compléter le tableau « Modifications à venir » (Id, Thème, Fichiers, Résumé) au fil des sprints — voir bob_sante.md § Plan d'action et check-list de tests.
