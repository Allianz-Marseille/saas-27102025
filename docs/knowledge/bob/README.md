# Base de connaissances Bob — Assistant agence Santé & Prévoyance

Ce dossier contient les fiches métier injectées dans le prompt Bob (prévoyance TNS, bilan, régimes obligatoires, méthodologie conseil).

**Référence :** `docs/agents-ia/bob-sante/bob-expert.md` pour le plan des thématiques expert Bob.

---

## Source de vérité et conventions

**Document central :** **`00-SOURCE-DE-VERITE.md`**

Ce document définit :

- **Où se trouve la vérité** pour chaque type d’information (chiffres réglementaires, prestations par caisse, parcours, etc.).
- **Les règles** pour garder la base cohérente : ne pas dupliquer le PASS dans les .md, une fiche = un thème, convention de citation des fiches.
- **L’inventaire** des fiches chargées (`docs/knowledge/bob/` + `docs/knowledge/bob/ro/`).
- **La maintenance** recommandée (annuelle PASS, nouveau régime, etc.).

**Chiffres réglementaires (PASS, Madelin) :** source unique = **`lib/assistant/regulatory-figures.ts`**. Mise à jour annuelle : modifier ce fichier uniquement ; ne pas recopier les valeurs dans les fiches .md.

**Fiches par caisse (RO) :** `docs/knowledge/bob/ro/[caisse].md` (ssi, carmf, carpimko, carcdsf, cavec, cipav, cnbf, cavp, carpv). Référence à citer : `ro/[caisse].md`.

---

## Chargement par Bob

- **Fonction :** `loadBobKnowledge()` dans `lib/assistant/knowledge-loader.ts`.
- **Dossiers :** `docs/knowledge/bob/` puis `docs/knowledge/bob/ro/`.
- **Limite :** 28 000 caractères au total (troncature possible sur les derniers fichiers).
- **Chiffres à jour :** le bloc `getRegulatoryFiguresBlock()` (depuis `regulatory-figures.ts`) est injecté dans le prompt à chaque requête Bob.

Pour l’inventaire détaillé des fiches et leur rôle, voir **`00-SOURCE-DE-VERITE.md`** § 3.
