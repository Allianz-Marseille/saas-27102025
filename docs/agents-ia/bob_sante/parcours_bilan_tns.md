# Parcours type — Bilan prévoyance TNS

Parcours guidé pour réaliser un bilan prévoyance d’un Travailleur Non Salarié (TNS). Le bilan se fait **de la manière suivante et par étape**. Le bot pose les questions au fur et à mesure ; l’utilisateur répond ; le bot enchaîne avec la ou les questions suivantes.

**Raccourci dans l’interface Bob :** un bouton « Bilan prévoyance TNS » dans les suggestions de démarrage envoie le message d’amorce et lance ce parcours.

**Nota :** Le bilan peut être réalisé **sans fournir de documents financiers** : l’utilisateur peut indiquer uniquement les **grandes masses** (revenu annuel, frais professionnels annuels). Les liasses (2035, 2031, 2033) ou attestations sont optionnelles.

---

## Base de connaissances à utiliser dans le parcours

Bob **s’appuie obligatoirement** sur les fiches suivantes aux étapes indiquées. Ces fiches sont chargées par `loadBobKnowledge()` depuis `docs/knowledge/bob/` et `docs/knowledge/bob/ro/`.

| Étape | Fiche(s) | Usage |
|-------|----------|--------|
| **4 — Activité** | `regimes-obligatoires-tns.md`, **`ro/[caisse].md`** | Identifier la **caisse obligatoire** (SSI, CARMF, CARPIMKO, CIPAV, CAVEC, CNBF, CARCDSF, etc.) via la synthèse par profession ; dès que le métier est identifié, utiliser la fiche correspondante dans `ro/` (ex. `ssi.md`, `carmf.md`, `carpimko.md`). |
| **5 — Revenu annuel** | `prevoyance-tns-regles-ij.md`, `2035-bilan-tns.md`, `fiscal-liasses-correspondances.md` | Formules IJ (BNC : CP+BT ; BIC : 2031 case 1 + 2033-D case 380 ; auto-entrepreneur : abattement). |
| **6 — Frais pro** | `prevoyance-tns-regles-ij.md` § 4, `2035-bilan-tns.md` | Définition frais généraux, règle détective (bénéfice faible + frais élevés → alerte Frais Fixes). |
| **7 — Droits existants** | **`ro/[caisse].md`**, `regimes-obligatoires-tns.md` | Utiliser la fiche **`ro/[caisse].md`** de la caisse identifiée (SSI, CARMF, CARPIMKO, etc.) pour les prestations de base (IJ, invalidité, décès). Afficher un **tableau comparatif « Droits actuels » vs « Besoin réel »** (maintien du niveau de vie) et **calculer le gap** (carence journalière et annuelle). Citer la source : *« Sources : ro/[caisse].md »*. |
| **8 — Proposition chiffrée** | **`ro/[caisse].md`**, `regimes-obligatoires-tns.md`, `prevoyance-tns-regles-ij.md`, `audit-diagnostic-conseiller.md`, `regulatory-figures` (Madelin), **`liens-devis-allianz.md`** | **Préconisation chiffrée** : IJ complémentaires (€/jour ou €/mois), capital décès cible (€), rente éducation, rente conjoint ; **option Frais Fixes** si frais pro > 20 % du revenu ; **disponible fiscal Madelin 2026** (chiffres dans regulatory-figures) ; **liens de tarification** via `liens-devis-allianz.md`. Terminer par les **mentions légales** : *« Sous réserve d’acceptation médicale. Chiffres indicatifs basés sur vos déclarations. »* |

---

## Éléments à sourcer (obligatoire)

Bob **cite explicitement la source** pour tout élément pris en compte issu de la base de connaissances. Formulation type : « Selon la fiche [nom de la fiche]… », « Référence : [fiche] », ou en fin de bloc : *« Sources : ro/[caisse].md »* pour le diagnostic (étape 7).

| Élément pris en compte | Fiche à citer | Quand |
|------------------------|---------------|--------|
| **Caisse obligatoire** (CARPIMKO, CARMF, CIPAV, SSI, etc.) | `ro/[caisse].md`, `regimes-obligatoires-tns.md` | Étape 4 (identification), étape 7 (droits existants). |
| **Prestations par caisse** (IJ, invalidité, capital décès, réversion) | **`ro/[caisse].md`** (ex. `ssi.md`, `carmf.md`, `carpimko.md`) | Étape 7 — chaque diagnostic doit se terminer par *« Sources : ro/[caisse].md »*. |
| **Formule IJ BNC** (CP + BT) | `prevoyance-tns-regles-ij.md` ou `2035-bilan-tns.md` | Étape 5 (calcul revenu à assurer). |
| **Formule IJ BIC** (2031 case 1 + 2033-D case 380) | `prevoyance-tns-regles-ij.md` ou `fiscal-liasses-correspondances.md` | Étape 5. |
| **Abattement auto-entrepreneur** (34 % / 50 % / 71 %) | `prevoyance-tns-regles-ij.md`, `2035-bilan-tns.md` | Étape 5 si micro. |
| **Règle détective / Frais Fixes** (bénéfice faible + frais élevés) | `prevoyance-tns-regles-ij.md` § 4, `2035-bilan-tns.md` | Étape 6 si applicable. |
| **Plafonds Madelin / disponible fiscal 2026** | `regulatory-figures` (PASS), `prevoyance-tns-regles-ij.md` § 3 | Étape 8. |
| **Rente éducation, rente conjoint, clause bénéficiaire** (PACS/concubin) | `audit-diagnostic-conseiller.md` | Étape 2 (PACS/concubin), étape 8. |
| **Liens devis Allianz** | `liens-devis-allianz.md` | Étape 8 (proposition devis). |

**Règle :** à la fin des réponses qui utilisent des chiffres, formules ou prestations réglementaires, indiquer au moins une source. **En fin de diagnostic (étape 7)** : *« Sources : ro/[caisse].md »*. **Mentions légales** à rappeler en étape 8 : *« Sous réserve d’acceptation médicale. Chiffres indicatifs basés sur vos déclarations. »*

---

## Méthode à appliquer dans tous les cas

Cette méthode s’applique **à chaque bilan prévoyance TNS** :

1. **Déterminer ce à quoi l’assuré a droit (SSI et régime obligatoire) et le préciser**  
   Étape 7 : indiquer clairement les **droits existants** en s’appuyant sur la fiche **`ro/[caisse].md`** (ex. `ssi.md`, `carmf.md`, `carpimko.md`) correspondant à la caisse identifiée. Afficher un **tableau comparatif « Droits actuels » vs « Besoin réel »** (maintien du niveau de vie) et **chiffrer le gap** (carence journalière et annuelle). Citer la source : *« Sources : ro/[caisse].md »*.

2. **Prendre en compte les déclarations de l’assuré**  
   Utiliser toutes les informations collectées : **nom**, **situation matrimoniale**, **enfants à charge** (âges), **activité**, **revenu annuel** (bénéfice BNC ou résultat BIC + cotisations pour le revenu à assurer), **frais professionnels annuels**. Ces éléments servent à dimensionner et chiffrer la solution.

3. **Faire une préconisation chiffrée de la solution à mettre en place**  
   Étape 8 : ne pas se contenter de recommandations génériques. **Proposer des ordres de grandeur ou montants concrets** : IJ complémentaires (€/jour ou €/mois), capital décès cible (€), rente éducation si enfants mineurs, rente conjoint si conjoint dépendant. **Option Frais Fixes** : si frais pro > 20 % du revenu, recommander une couverture dédiée. **Fiscalité** : calculer le **disponible fiscal Madelin 2026** (chiffres dans regulatory-figures). **Liens de tarification** : proposer les liens devis via la fiche `liens-devis-allianz.md`. Terminer par les **mentions légales** : *« Sous réserve d’acceptation médicale. Chiffres indicatifs basés sur vos déclarations. »* Puis proposer résumé, export PDF ou lien devis.

---

## Ordre des étapes (collecte)

Le bilan TNS suit **cet ordre** :

1. **Nom et prénom** de l’assuré  
2. **Situation matrimoniale**  
3. **Enfants à charge** — si oui, âges  
4. **Activité** (profession, régime BNC/BIC, NAF si pertinent)  
5. **Revenu annuel** (bénéfice + cotisations pour revenu à assurer)  
6. **Frais professionnels annuels**  

Puis : **7. Droits existants** (déterminer et préciser ce à quoi il a droit — SSI + régime obligatoire) → **8. Proposition chiffrée** (solution à mettre en place en tenant compte des déclarations).

---

## Régimes connus par Bob

- **Régime obligatoire (caisse de la profession)** : Bob connaît les caisses obligatoires selon l’activité — ex. **Carpimko** (infirmiers libéraux, kinés, etc.), **CARMF** (médecins), **CIPAV** (architectes, experts-comptables, etc.), **CAVEC**, **CNAVPL**, etc. Il sait quelles prestations de base (IJ, invalidité, décès) sont fournies par chaque caisse.
- **Régime général / SSI** : Bob connaît le **régime général** (salariés, CPAM) et la **SSI** (Sécurité sociale des indépendants, ex-TNS artisans/commerçants). Il sait distinguer les droits selon le statut (libéral vs artisan/commerçant vs salarié).

Bob **indique les droits existants** (régime général ou SSI + caisse obligatoire de la profession) puis **conseille sur la prévoyance complémentaire** à mettre en place (IJ, capital décès, rente éducation, rente conjoint, Loi Madelin).

---

## Message d’amorce (clic sur le raccourci)

L’utilisateur clique sur **« Bilan prévoyance TNS »** → message envoyé :

> Je souhaite faire un bilan prévoyance pour un TNS. Peux-tu me guider étape par étape ?

Le bot répond par une brève intro puis **pose la première question** (étape 1 — nom et prénom).

---

## Étape 1 — Nom et prénom de l’assuré

**Bot :**  
« Pour commencer, quel est le **nom et le prénom** de l’assuré ? »

**Utilisateur :** répond (ex. Dupont, Marie).

**Bot (suite) :** remercie, puis enchaîne avec l’étape 2.

---

## Étape 2 — Situation matrimoniale

**Bot :**  
« Quelle est la **situation matrimoniale** ? Marié(e), pacsé(e), concubin(e), célibataire, divorcé(e), veuf(ve) ? »

**Utilisateur :** répond.

**Bot (suite) :** remercie, résume si besoin (ex. pour PACS/concubin, rappeler l’importance de la clause bénéficiaire nominative), puis enchaîne avec l’étape 3.

---

## Étape 3 — Enfants à charge

**Bot :**  
« Y a-t-il des **enfants à charge** ? Si oui, combien et quels âges ? »

**Utilisateur :** répond (ex. oui, 2 enfants : 8 ans et 12 ans ; ou non).

**Bot (suite) :** remercie, note les âges si pertinent (rente éducation pour mineurs), puis enchaîne avec l’étape 4.

---

## Étape 4 — Activité

**Bot :**  
« Quelle est l’**activité** du TNS ?  
- Profession (ex. médecin, infirmier libéral, artisan plombier, commerçant, expert-comptable).  
- Régime fiscal si vous le connaissez : BNC, BIC, micro / auto-entrepreneur.  
- Code NAF ou intitulé de la profession si pertinent. »

**Utilisateur :** répond (ex. infirmier libéral BNC ; médecin libéral ; artisan BIC, NAF 43.21A).

**Bot (suite) :** remercie, précise le régime (BNC/BIC/micro) et **identifie la caisse obligatoire** en s’appuyant sur la fiche **`ro/[caisse].md`** correspondante (ex. `carpimko.md` pour infirmier, `carmf.md` pour médecin, `cipav.md` pour architecte, `ssi.md` pour artisan/commerçant) ou `regimes-obligatoires-tns.md` (§ 4 Synthèse par profession). Puis enchaîne avec l’étape 5.

---

## Étape 5 — Revenu annuel

**Logique BNC/BIC :** Le **BNC** (bénéfice des professions libérales) et le **résultat BIC** sont **déjà nets des charges** (CA − charges = bénéfice). Si l’assuré déclare « 80 000 € de BNC », ces 80 000 € sont déjà le **bénéfice** — on ne soustrait pas les frais professionnels pour « recalculer » un bénéfice net. Pour les IJ : revenu à assurer = **bénéfice (CP) + cotisations (BT)** en BNC ; **résultat 2031 case 1 + cotisations 2033-D case 380** en BIC.

**Bot :**  
« Quel est le **revenu annuel** à retenir pour les IJ ?  
- **Libéral (BNC)** : le **bénéfice** (CP) — déjà net des charges — + cotisations sociales (BT), ex. depuis une 2035.  
- **Commerçant / artisan (BIC)** : le **résultat fiscal** (2031 case 1) — déjà net des charges — + cotisations (ex. 2033-D case 380).  
- **Auto-entrepreneur** : CA et régime pour appliquer l’abattement (34 % / 50 % / 71 %) ; le revenu après abattement est alors utilisé.  
Indiquez le montant (bénéfice + cotisations si vous les avez) ou envoyez les documents. »

**Utilisateur :** répond (ex. « BNC 80 000 €, cotisations 30 000 € → revenu à assurer 110 000 € » ou « Bénéfice 55 000 €, cotisations 22 000 € »).

**Bot (suite) :** calcule si besoin le revenu à assurer pour les IJ (CP+BT ou 2031+380), rappelle que le BNC/BIC est déjà net des charges. **Ne jamais** soustraire les frais professionnels de l’étape 6 du revenu de l’étape 5. Puis enchaîne avec l’étape 6.

---

## Étape 6 — Frais professionnels annuels

**Logique :** Les **frais professionnels** (frais généraux) sont les **charges qui continuent en cas d’arrêt de travail** (loyer, assurances, honoraires, charges d’équipe, etc.). Ils **ne sont pas soustraits du revenu de l’étape 5** : le BNC/BIC est déjà le bénéfice net (CA − charges). L’étape 6 sert **uniquement** à évaluer si une garantie **Frais Fixes** est pertinente — quand les frais sont élevés par rapport au bénéfice, l’activité reste fragile en cas d’arrêt.

**Bot :**  
« Quels sont les **frais professionnels annuels** (frais généraux qui continuent en cas d’arrêt : loyer, assurances, charges, etc.) ?  
Ce chiffre sert à évaluer si une garantie **Frais Fixes** est pertinente — pas à recalculer le bénéfice (le BNC/BIC est déjà net des charges). »

**Utilisateur :** répond (ex. 24 000 € ; ou « pas de détail pour l’instant »).

**Bot (suite) :** remercie. Si frais élevés par rapport au **bénéfice** (déjà connu à l’étape 5) → rappeler la **règle détective** (alerte garantie Frais Fixes). **Ne jamais** écrire « revenu − frais = bénéfice net » : le bénéfice est celui de l’étape 5. Puis passer à l’étape 7.

---

## Étape 7 — Droits existants (régime général + caisse obligatoire)

**Objectif :** **Déterminer ce à quoi l’assuré a droit** (SSI et régime obligatoire) **et le préciser** clairement.

**Bot :**  
S’appuyer sur la fiche **`ro/[caisse].md`** correspondant à la caisse identifiée à l’étape 4 (ex. `ssi.md` pour artisan/commerçant, `carmf.md` pour médecin, `carpimko.md` pour infirmier/kiné, etc.) pour **indiquer et préciser** les droits existants.  
Afficher un **tableau comparatif « Droits actuels » vs « Besoin réel »** (maintien du niveau de vie) et **calculer le gap** (carence journalière et annuelle).  
Terminer par : *« Sources : ro/[caisse].md »*.  
« Voici **ce à quoi [Nom Prénom] a droit** : [tableau Droits actuels vs Besoin réel, gap]. Souhaitez-vous que je détaille les montants ou qu’on enchaîne sur la **proposition chiffrée** de prévoyance à mettre en place ? »

**Utilisateur :** répond (détail ou enchaîner).

**Bot (suite) :** si demandé, détailler les prestations (franchises, plafonds, délais) à partir de la fiche `ro/[caisse].md` ; puis proposer l’étape 8 (proposition chiffrée).

---

## Étape 8 — Proposition chiffrée de la solution à mettre en place

**Objectif :** En prenant en compte **toutes les déclarations** (revenu à assurer, frais pro, situation matrimoniale, enfants, droits existants), **faire une proposition chiffrée** — pas seulement des recommandations génériques.

**Bot :**  
« En tenant compte de **ce à quoi [Nom] a droit** (étape 7) et de **ses déclarations** (revenu à assurer [X €], frais pro [Y €], situation [marié/pacsé/concubin], [N] enfants [âges]), voici une **préconisation chiffrée** pour compléter sa prévoyance :  
- **Indemnités Journalières** : [compléter les IJ de la caisse pour viser Z % du revenu à assurer ; ordre de grandeur en €/jour ou €/mois ; franchise conseillée en jours].  
- **Capital décès** : [montant cible en € ; rappeler clause bénéficiaire nominative si PACS/concubin].  
- **Rente éducation** : [si enfants mineurs — montant ou durée suggérée par enfant].  
- **Rente conjoint** : [si conjoint dépendant — niveau ou % du revenu].  
- **Garantie Frais Fixes** : [si frais pro > 20 % du revenu — recommander une couverture dédiée pour tout ou partie des Y € de frais déclarés].  
- **Fiscalité Madelin 2026** : [calcul du disponible fiscal ; rappel des plafonds, ex. 3 % de 8 PASS].  
- **Liens de tarification** : [proposer les liens devis selon la fiche `liens-devis-allianz.md`].  
*Sous réserve d’acceptation médicale. Chiffres indicatifs basés sur vos déclarations.*  
*Sources : ro/[caisse].md, prevoyance-tns-regles-ij.*  
Souhaitez-vous un résumé pour votre expert, un export PDF ou un lien vers un devis (tunnels Allianz) ? »

**Utilisateur :** répond.

**Bot (suite) :** proposer export PDF, résumé en 3 points, ou lien vers devis selon la fiche `liens-devis-allianz.md`.

---

## Règles pour le bot

- **Ordre strict** : respecter l’ordre des étapes (nom/prénom → situation matrimoniale → enfants à charge → activité → revenu annuel → frais professionnels → droits existants → conseil prévoyance).
- **Régime obligatoire** : selon l’activité, identifier la caisse (Carpimko, CARMF, CIPAV, CAVEC, CNAVPL, etc.) et indiquer les droits de base (IJ, invalidité, décès).
- **Régime général / SSI** : rappeler les droits selon le statut (SSI pour TNS, régime général pour salarié).
- **Méthode en 3 temps** : (1) Déterminer et préciser ce à quoi l’assuré a droit (SSI + régime obligatoire) — étape 7. (2) Prendre en compte toutes les déclarations (BNC, frais, situation matrimoniale, enfants, etc.). (3) Faire une **proposition chiffrée** à l’étape 8 (ordres de grandeur ou montants concrets : IJ en €/jour, capital décès en €, rentes, Frais Fixes, Madelin), pas seulement des recommandations génériques.
- **Droits existants (étape 7)** : déterminer et **préciser** ce à quoi il a droit (régime général ou SSI + caisse obligatoire), avec les prestations de base (IJ, invalidité, décès). Citer la source.
- **Rappel d’étape** : si l’utilisateur demande « Où en est-on ? », « On en est où ? », « Récap », résumer l’étape en cours, les infos déjà collectées (nom, situation, enfants, activité, revenu, frais) et proposer la prochaine question.
- **Bilan sans documents** : le bilan peut se faire uniquement avec les grandes masses (revenu annuel, frais professionnels). Ne pas exiger les liasses.
- **Une ou deux questions à la fois** : ne pas surcharger ; laisser l’utilisateur répondre avant d’enchaîner.
- **Résumer** brièvement les réponses avant de passer à la suite.
- **Proposer** explicitement la suite (« Souhaitez-vous qu’on passe à… ? »).
- **S’appuyer sur la base de connaissances** : à chaque étape concernée, utiliser les fiches indiquées dans le tableau « Base de connaissances à utiliser dans le parcours ». Dès que le métier est identifié (étape 4), utiliser la fiche correspondante dans **`ro/`** (ex. `ssi.md`, `carmf.md`, `carpimko.md`) pour l’étape 7 (droits existants) et l’étape 8 (préconisation). Autres fiches : formules IJ, Madelin (`regulatory-figures`, prevoyance-tns-regles-ij), audit-diagnostic-conseiller, regimes-obligatoires-ccn.
- **Sourcer les éléments pris en compte** : pour tout élément issu d’une fiche (caisse obligatoire, prestations par caisse, formules IJ, plafonds Madelin, règle Frais Fixes, rentes/clause bénéficiaire, liens devis), **citer explicitement la source**. En fin de diagnostic (étape 7) : *« Sources : ro/[caisse].md »*. En étape 8 rappeler les **mentions légales** : *« Sous réserve d’acceptation médicale. Chiffres indicatifs basés sur vos déclarations. »* Voir le tableau « Éléments à sourcer » ci-dessus.
- **Logique BNC/BIC** : le **bénéfice** (BNC) ou le **résultat fiscal** (BIC) est **déjà net des charges** (CA − charges). Ne **jamais** soustraire les frais professionnels de l’étape 6 du « revenu » pour obtenir un « bénéfice net » : si l’assuré donne 80 000 € de BNC, c’est déjà le bénéfice. Les frais de l’étape 6 servent uniquement à évaluer la garantie Frais Fixes (charges qui continuent en cas d’arrêt).
- **Upload / analyse de liasse fiscale** : si l'utilisateur dépose une liasse fiscale (2035, 2031, 2033) ou une attestation CA, Bob doit **analyser** le document pour en **extraire** : activité (et donc caisse obligatoire), revenu à assurer pour les IJ (bénéfice + cotisations selon BNC/BIC/micro). Bob **propose alors de pré-remplir les étapes 4 (activité) et 5 (revenu annuel)** avec les données extraites, **sans sauter les étapes 1 à 3** si elles n'ont pas encore été renseignées (nom, situation matrimoniale, enfants). Formules IJ et alerte Frais Fixes si pertinent. Les documents restent **optionnels**.

---

## Références

- **Fiches par caisse (bob_sante)** : `docs/agents-ia/ro/` — `ssi.md`, `carmf.md`, `carpimko.md`, `cipav.md`, `cavec.md`, `cnbf.md`, `carcdsf.md` (IJ, invalidité, décès, source).
- **Régimes obligatoires TNS (inventaire)** : `docs/knowledge/bob/regimes-obligatoires-tns.md` (synthèse par profession).
- Régimes obligatoires / CCN (salariés) : `regimes-obligatoires-ccn.md`
- Formules IJ et fiscalité : `prevoyance-tns-regles-ij.md`, `2035-bilan-tns.md`, `fiscal-liasses-correspondances.md`
- Plafonds : `lib/assistant/regulatory-figures.ts`
- Besoins (audit) : `audit-diagnostic-conseiller.md`
- Devis : `liens-devis-allianz.md` (dans `docs/knowledge/bob/`)
