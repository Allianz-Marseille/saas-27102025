# Parcours type — Bilan prévoyance TNS

Le bilan TNS se fait **par étape**, dans cet ordre. Quand l'utilisateur envoie « Je souhaite faire un bilan prévoyance pour un TNS. Peux-tu me guider étape par étape ? », répondre par une brève intro puis **poser immédiatement la première question** (étape 1 — nom et prénom).

**Ordre des étapes :** 1) Nom et prénom de l'assuré — 2) Situation matrimoniale — 3) Enfants à charge (si oui, âges) — 4) Activité — 5) Revenu annuel — 6) Frais professionnels annuels — 7) Droits existants (régime général + caisse obligatoire) — 8) Conseil prévoyance à mettre en place.

**Nota :** Bilan faisable sans documents ; grandes masses (revenu annuel, frais pro) suffisent.

## Base de connaissances à utiliser (obligatoire)

À chaque étape, s'appuyer sur les fiches suivantes (chargées avec ce parcours dans la base Bob) :

- **Étape 4 (Activité)** : **regimes-obligatoires-tns** — § 4 Synthèse par profession et § 2 (caisses CNAVPL) ou § 1 (SSI) pour identifier la caisse obligatoire (Carpimko, CARMF, CIPAV, SSI, etc.).
- **Étape 5 (Revenu)** : prevoyance-tns-regles-ij, 2035-bilan-tns, fiscal-liasses-correspondances — formules IJ (CP+BT, 2031+380, abattement auto-entrepreneur).
- **Étape 6 (Frais pro)** : prevoyance-tns-regles-ij § 4, 2035-bilan-tns — règle détective (Frais Fixes si bénéfice faible + frais élevés).
- **Étape 7 (Droits existants)** : **regimes-obligatoires-tns** — § 1 SSI (IJ 1/730e RAAM, délai carence 3 j, invalidité ~30 %/50 %, décès ~20 % PASS, réversion 54 %) si artisan/commerçant ; § 2 ou § 3 (caisses libérales) si profession libérale. Citer la source (« Selon la fiche régimes obligatoires TNS… »).
- **Étape 8 (Conseil)** : regimes-obligatoires-tns, prevoyance-tns-regles-ij, audit-diagnostic-conseiller, regulatory-figures (Madelin), liens-devis-allianz.

## Éléments à sourcer (obligatoire)

Bob **cite explicitement la source** pour tout élément pris en compte issu de la base de connaissances. Formulation : « Selon la fiche [nom]… », « Référence : [fiche] », ou en fin de bloc : « *Source : regimes-obligatoires-tns.* »

| Élément | Fiche à citer | Étape |
|---------|---------------|-------|
| Caisse obligatoire (CARPIMKO, CARMF, CIPAV, SSI…) | regimes-obligatoires-tns | 4, 7 |
| Prestations SSI (IJ 1/730e RAAM, délai carence 3 j, invalidité ~30 %/50 %, décès ~20 % PASS, réversion 54 %) | regimes-obligatoires-tns § 1 | 7 |
| Prestations caisses libérales | regimes-obligatoires-tns § 2 ou § 3 | 7 |
| Formule IJ BNC (CP+BT), BIC (2031+380), abattement auto-entrepreneur | prevoyance-tns-regles-ij, 2035-bilan-tns, fiscal-liasses-correspondances | 5 |
| Règle détective / Frais Fixes | prevoyance-tns-regles-ij § 4, 2035-bilan-tns | 6 |
| Plafonds Madelin | regulatory-figures, prevoyance-tns-regles-ij § 3 | 8 |
| Rente éducation, rente conjoint, clause bénéficiaire (PACS/concubin) | audit-diagnostic-conseiller | 2, 8 |
| Liens devis Allianz | liens-devis-allianz | 8 |

À la fin des réponses utilisant chiffres, formules ou prestations réglementaires : indiquer au moins une source (ex. « *Sources : regimes-obligatoires-tns, prevoyance-tns-regles-ij.* »).

## Régimes connus par Bob

- **Régime obligatoire (caisse de la profession)** : Carpimko (infirmiers libéraux, kinés, etc.), CARMF (médecins), CIPAV (architectes, experts-comptables, etc.), CAVEC, CNAVPL… Indiquer les prestations de base (IJ, invalidité, décès) de la caisse selon l'activité.
- **Régime général / SSI** : Bob connaît le régime général (salariés, CPAM) et la SSI (TNS artisans/commerçants). Toujours indiquer les **droits existants** (régime général ou SSI + caisse obligatoire) avant de conseiller la prévoyance complémentaire.

---

## Étape 1 — Nom et prénom

**Bot :** « Pour commencer, quel est le nom et le prénom de l'assuré ? »

**Suite :** remercier, enchaîner étape 2.

## Étape 2 — Situation matrimoniale

**Bot :** « Quelle est la situation matrimoniale ? Marié(e), pacsé(e), concubin(e), célibataire, divorcé(e), veuf(ve) ? »

**Suite :** remercier ; si PACS/concubin, rappeler clause bénéficiaire nominative. Enchaîner étape 3.

## Étape 3 — Enfants à charge

**Bot :** « Y a-t-il des enfants à charge ? Si oui, combien et quels âges ? »

**Suite :** remercier, noter les âges (rente éducation si mineurs). Enchaîner étape 4.

## Étape 4 — Activité

**Bot :** « Quelle est l'activité du TNS ? Profession (ex. médecin, infirmier libéral, artisan, commerçant). Régime fiscal si connu : BNC, BIC, micro. NAF ou intitulé si pertinent. »

**Suite :** remercier, préciser régime (BNC/BIC/micro) et **identifier la caisse obligatoire** en s'appuyant sur **regimes-obligatoires-tns** (§ 4 Synthèse par profession, § 2 caisses CNAVPL ou § 1 SSI) — ex. Carpimko infirmier, CARMF médecin, CIPAV architecte, SSI artisan. Enchaîner étape 5.

## Étape 5 — Revenu annuel

**Logique BNC/BIC :** Le BNC et le résultat BIC sont **déjà nets des charges** (CA − charges = bénéfice). Si l'assuré dit « 80 000 € de BNC », ces 80 000 € sont déjà le bénéfice — **ne jamais** soustraire les frais de l'étape 6 pour « recalculer » un bénéfice net. Revenu à assurer IJ = bénéfice (CP) + cotisations (BT) en BNC ; résultat 2031 + cotisations 2033-D case 380 en BIC.

**Bot :** « Quel est le revenu annuel à retenir pour les IJ ? BNC : bénéfice (CP) — déjà net des charges — + cotisations (BT). BIC : résultat fiscal (2031 case 1) — déjà net des charges — + cotisations (2033-D case 380). Auto-entrepreneur : CA et régime pour abattement (34 % / 50 % / 71 %). Indiquez le montant ou envoyez les documents. »

**Suite :** calculer si besoin le revenu à assurer (CP+BT ou 2031+380). **Ne jamais** soustraire les frais de l'étape 6 du revenu. Enchaîner étape 6.

## Étape 6 — Frais professionnels annuels

**Logique :** Les frais professionnels = charges qui **continuent en cas d'arrêt** (loyer, assurances, etc.). Ils **ne sont pas soustraits du revenu** : le BNC/BIC est déjà le bénéfice net. L'étape 6 sert **uniquement** à évaluer la garantie Frais Fixes (si frais élevés par rapport au bénéfice).

**Bot :** « Quels sont les frais professionnels annuels (charges qui continuent en cas d'arrêt) ? Utile pour évaluer la garantie Frais Fixes — pas pour recalculer le bénéfice (BNC/BIC déjà net des charges). »

**Suite :** remercier ; si frais élevés par rapport au bénéfice (étape 5) → alerte règle détective (Frais Fixes). **Ne jamais** écrire « revenu − frais = bénéfice net ». Enchaîner étape 7.

## Étape 7 — Droits existants (régime général + caisse obligatoire)

**Bot :** S'appuyer sur **regimes-obligatoires-tns** : si artisan/commerçant → § 1 SSI (IJ 1/730e RAAM, délai carence 3 j, franchise 7/14/30 j, invalidité ~30 %/50 %, décès ~20 % PASS, réversion 54 %) ; si libéral → § 2 ou § 3 (prestations caisse identifiée). Citer la source. « Voici les droits existants pour [Nom] : [SSI ou régime général + caisse obligatoire]. Souhaitez-vous le détail ou qu'on enchaîne sur la prévoyance ? »

**Suite :** si demandé, détailler à partir de regimes-obligatoires-tns ; puis proposer étape 8.

## Étape 8 — Conseil prévoyance à mettre en place

**Bot :** « Recommandations prévoyance : IJ (compléter/anticiper la caisse ; niveau adapté au revenu ; franchise), Capital décès (ayants droit ; clause bénéficiaire si PACS/concubin), Rente éducation (si enfants mineurs), Rente conjoint (si conjoint dépendant), Frais Fixes (si frais pro élevés), Loi Madelin (plafonds). Souhaitez-vous un résumé, un export PDF ou un lien devis ? »

**Suite :** proposer export PDF, résumé, lien devis (fiche liens-devis-allianz).

---

## Règles pour le bot (parcours bilan TNS)

- **Ordre strict** : 1 Nom/prénom → 2 Situation matrimoniale → 3 Enfants à charge → 4 Activité → 5 Revenu annuel → 6 Frais pro → 7 Droits existants (régime général + caisse obligatoire) → 8 Conseil prévoyance.
- **Régime obligatoire** : identifier la caisse (Carpimko, CARMF, CIPAV…) selon l'activité ; indiquer les droits de base.
- **Droits existants** : toujours indiquer régime général (ou SSI) + caisse obligatoire avant de conseiller la prévoyance.
- **Rappel d'étape** : « Où en est-on ? » → résumer l'étape en cours, les infos collectées (nom, situation, enfants, activité, revenu, frais), proposer la prochaine question.
- **Base de connaissances** : à chaque étape, utiliser les fiches du tableau « Base de connaissances à utiliser » — **regimes-obligatoires-tns** obligatoire pour étapes 4 et 7. Autres fiches : prevoyance-tns-regles-ij, 2035-bilan-tns, audit-diagnostic-conseiller, regulatory-figures, liens-devis-allianz.
- **Sourcer les éléments pris en compte** : pour tout élément issu d'une fiche (caisse obligatoire, prestations SSI/caisses, formules IJ, Madelin, Frais Fixes, rentes/clause bénéficiaire, liens devis), **citer explicitement la source** — ex. « Selon la fiche régimes obligatoires TNS… », « Référence : prevoyance-tns-regles-ij », ou en fin de réponse « *Sources : regimes-obligatoires-tns, prevoyance-tns-regles-ij.* » Voir le tableau « Éléments à sourcer ».
- **Logique BNC/BIC** : le bénéfice (BNC) ou résultat fiscal (BIC) est **déjà net des charges**. Ne **jamais** soustraire les frais de l'étape 6 du revenu pour obtenir un « bénéfice net » (ex. si 80 000 € de BNC, c'est déjà le bénéfice). Les frais de l'étape 6 servent uniquement à évaluer la garantie Frais Fixes.
- **Bilan sans documents** : grandes masses suffisent. Une ou deux questions à la fois. Résumer, proposer la suite. Upload optionnel.

Références : **regimes-obligatoires-tns** (inventaire TNS par profession), regimes-obligatoires-ccn, prevoyance-tns-regles-ij, 2035-bilan-tns, audit-diagnostic-conseiller, liens-devis-allianz.
