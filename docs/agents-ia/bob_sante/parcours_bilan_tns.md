# Parcours type — Bilan prévoyance TNS

Parcours guidé pour réaliser un bilan prévoyance d’un Travailleur Non Salarié (TNS). Le bilan se fait **de la manière suivante et par étape**. Le bot pose les questions au fur et à mesure ; l’utilisateur répond ; le bot enchaîne avec la ou les questions suivantes.

**Raccourci dans l’interface Bob :** un bouton « Bilan prévoyance TNS » dans les suggestions de démarrage envoie le message d’amorce et lance ce parcours.

**Nota :** Le bilan peut être réalisé **sans fournir de documents financiers** : l’utilisateur peut indiquer uniquement les **grandes masses** (revenu annuel, frais professionnels annuels). Les liasses (2035, 2031, 2033) ou attestations sont optionnelles.

---

## Base de connaissances à utiliser dans le parcours

Bob **s’appuie obligatoirement** sur les fiches suivantes aux étapes indiquées. Ces fiches sont chargées par `loadBobKnowledge()` depuis `docs/knowledge/bob/`.

| Étape | Fiche(s) | Usage |
|-------|----------|--------|
| **4 — Activité** | `regimes-obligatoires-tns.md` | Identifier la **caisse obligatoire** : § 4 (Synthèse par profession) et § 2 (tableau des 10 caisses CNAVPL) ou § 3 (CNBF avocats). Artisan/commerçant → SSI (§ 1). |
| **5 — Revenu annuel** | `prevoyance-tns-regles-ij.md`, `2035-bilan-tns.md`, `fiscal-liasses-correspondances.md` | Formules IJ (BNC : CP+BT ; BIC : 2031 case 1 + 2033-D case 380 ; auto-entrepreneur : abattement). |
| **6 — Frais pro** | `prevoyance-tns-regles-ij.md` § 4, `2035-bilan-tns.md` | Définition frais généraux, règle détective (bénéfice faible + frais élevés → alerte Frais Fixes). |
| **7 — Droits existants** | `regimes-obligatoires-tns.md` | **SSI** (§ 1) : IJ (1/730e RAAM, délai carence 3 j, franchise 7/14/30 j), invalidité (~30 % / 50 %), décès (capital ~20 % PASS, réversion 54 %). **Caisses libérales** (§ 2) : prestations de base de la caisse identifiée (IJ, invalidité, capital décès). Citer la source (ex. « Selon la fiche régimes obligatoires TNS… »). |
| **8 — Proposition chiffrée** | `regimes-obligatoires-tns.md`, `prevoyance-tns-regles-ij.md`, `audit-diagnostic-conseiller.md`, `regulatory-figures` (Madelin), `liens-devis-allianz.md` | **Proposition chiffrée** : IJ (€/jour ou €/mois), capital décès (€), rentes (éducation, conjoint), Frais Fixes (€), Madelin ; en tenant compte des déclarations (revenu, frais, situation familiale) ; liens devis. |

---

## Éléments à sourcer (obligatoire)

Bob **cite explicitement la source** pour tout élément pris en compte issu de la base de connaissances. Formulation type : « Selon la fiche [nom de la fiche]… », « Référence : [fiche] », ou en fin de bloc : « *Source : regimes-obligatoires-tns.* »

| Élément pris en compte | Fiche à citer | Quand |
|------------------------|---------------|--------|
| **Caisse obligatoire** (CARPIMKO, CARMF, CIPAV, SSI, etc.) | `regimes-obligatoires-tns.md` | Étape 4 (identification), étape 7 (droits existants). |
| **Prestations SSI** (IJ 1/730e RAAM, délai carence 3 j, invalidité ~30 %/50 %, décès ~20 % PASS, réversion 54 %) | `regimes-obligatoires-tns.md` § 1 | Étape 7 si TNS artisan/commerçant. |
| **Prestations caisses libérales** (IJ, invalidité, capital décès) | `regimes-obligatoires-tns.md` § 2 ou § 3 | Étape 7 si profession libérale. |
| **Formule IJ BNC** (CP + BT) | `prevoyance-tns-regles-ij.md` ou `2035-bilan-tns.md` | Étape 5 (calcul revenu à assurer). |
| **Formule IJ BIC** (2031 case 1 + 2033-D case 380) | `prevoyance-tns-regles-ij.md` ou `fiscal-liasses-correspondances.md` | Étape 5. |
| **Abattement auto-entrepreneur** (34 % / 50 % / 71 %) | `prevoyance-tns-regles-ij.md`, `2035-bilan-tns.md` | Étape 5 si micro. |
| **Règle détective / Frais Fixes** (bénéfice faible + frais élevés) | `prevoyance-tns-regles-ij.md` § 4, `2035-bilan-tns.md` | Étape 6 si applicable. |
| **Plafonds Madelin** (déductibilité prévoyance) | `regulatory-figures` (PASS), `prevoyance-tns-regles-ij.md` § 3 | Étape 8. |
| **Rente éducation, rente conjoint, clause bénéficiaire** (PACS/concubin) | `audit-diagnostic-conseiller.md` | Étape 2 (PACS/concubin), étape 8. |
| **Liens devis Allianz** | `liens-devis-allianz.md` | Étape 8 (proposition devis). |

**Règle :** à la fin des réponses qui utilisent des chiffres, formules ou prestations réglementaires, indiquer au moins une source (ex. « *Sources : regimes-obligatoires-tns, prevoyance-tns-regles-ij.* »).

---

## Méthode à appliquer dans tous les cas

Cette méthode s’applique **à chaque bilan prévoyance TNS** :

1. **Déterminer ce à quoi l’assuré a droit (SSI et régime obligatoire) et le préciser**  
   Étape 7 : indiquer clairement les **droits existants** — régime général ou SSI + caisse obligatoire de la profession (CARPIMKO, CARMF, CIPAV, etc.) — avec les prestations de base (IJ, invalidité, capital décès, réversion si applicable). S’appuyer sur la fiche `regimes-obligatoires-tns.md` et citer la source.

2. **Prendre en compte les déclarations de l’assuré**  
   Utiliser toutes les informations collectées : **nom**, **situation matrimoniale**, **enfants à charge** (âges), **activité**, **revenu annuel** (bénéfice BNC ou résultat BIC + cotisations pour le revenu à assurer), **frais professionnels annuels**. Ces éléments servent à dimensionner et chiffrer la solution.

3. **Faire une proposition chiffrée de la solution à mettre en place**  
   Étape 8 : ne pas se contenter de recommandations génériques. **Proposer des ordres de grandeur ou montants concrets** à partir des données : IJ complémentaires à X €/jour (pour atteindre Y % du revenu à assurer ou combler l’écart avec la caisse), capital décès Z € (ex. X années de revenu), rente éducation si enfants mineurs (montant ou durée), rente conjoint si conjoint dépendant, garantie Frais Fixes (ex. couvrir tout ou partie des frais pro déclarés), rappel des plafonds Madelin. Puis proposer résumé, export PDF ou lien devis.

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

**Bot (suite) :** remercie, précise le régime (BNC/BIC/micro) et **identifie la caisse obligatoire** en s’appuyant sur la fiche **`regimes-obligatoires-tns.md`** (§ 4 Synthèse par profession, § 2 caisses CNAVPL ou § 1 SSI si artisan/commerçant) — ex. Carpimko pour infirmier, CARMF pour médecin, CIPAV pour architecte, SSI pour artisan. Puis enchaîne avec l’étape 5.

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
S’appuyer sur la fiche **`regimes-obligatoires-tns.md`** pour **indiquer et préciser** les droits existants :  
- **Si TNS artisan/commerçant (SSI)** : utiliser le § 1 (SSI) — IJ (1/730e RAAM, délai de carence 3 j, franchise possible 7/14/30 j), invalidité (~30 % / 50 %), décès (capital ~20 % PASS, réversion conjoint 54 %). Donner les ordres de grandeur si possible (ex. IJ max, capital décès). Citer la source.  
- **Si profession libérale** : utiliser le § 2 (caisses CNAVPL) ou § 3 (CNBF) — prestations de base de la caisse identifiée à l’étape 4 (IJ, invalidité, capital décès). Préciser ce que la caisse verse (franchises, niveaux). Citer la source.  
« Voici **ce à quoi [Nom Prénom] a droit** : [SSI ou régime général + caisse obligatoire, avec les prestations précisées]. Souhaitez-vous que je détaille les montants ou qu’on enchaîne sur la **proposition chiffrée** de prévoyance à mettre en place ? »

**Utilisateur :** répond (détail ou enchaîner).

**Bot (suite) :** si demandé, détailler les prestations (franchises, plafonds, délais) à partir de `regimes-obligatoires-tns.md` ; puis proposer l’étape 8 (proposition chiffrée).

---

## Étape 8 — Proposition chiffrée de la solution à mettre en place

**Objectif :** En prenant en compte **toutes les déclarations** (revenu à assurer, frais pro, situation matrimoniale, enfants, droits existants), **faire une proposition chiffrée** — pas seulement des recommandations génériques.

**Bot :**  
« En tenant compte de **ce à quoi [Nom] a droit** (étape 7) et de **ses déclarations** (revenu à assurer [X €], frais pro [Y €], situation [marié/pacsé/concubin], [N] enfants [âges]), voici une **proposition chiffrée** pour compléter sa prévoyance :  
- **Indemnités Journalières** : [ex. compléter les IJ de la caisse pour viser Z % du revenu à assurer ; proposer un ordre de grandeur en €/jour ou €/mois ; franchise conseillée en jours].  
- **Capital décès** : [ex. viser X années de revenu ou montant cible en € pour les ayants droit ; rappeler clause bénéficiaire nominative si PACS/concubin].  
- **Rente éducation** : [si enfants mineurs — ex. montant ou durée suggérée par enfant].  
- **Rente conjoint** : [si conjoint dépendant — ex. niveau ou % du revenu].  
- **Garantie Frais Fixes** : [si frais pro élevés — ex. couvrir tout ou partie des Y € de frais déclarés].  
- **Loi Madelin** : [rappel des plafonds de déductibilité, ex. 3 % de 8 PASS].  
*Sources : regimes-obligatoires-tns, prevoyance-tns-regles-ij.*  
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
- **S’appuyer sur la base de connaissances** : à chaque étape concernée, utiliser les fiches indiquées dans le tableau « Base de connaissances à utiliser dans le parcours » — en particulier **`regimes-obligatoires-tns.md`** pour l’étape 4 (identification caisse) et l’étape 7 (droits existants SSI / caisses libérales). Autres fiches : formules IJ, Madelin (`regulatory-figures`, prevoyance-tns-regles-ij), audit-diagnostic-conseiller, regimes-obligatoires-ccn.
- **Sourcer les éléments pris en compte** : pour tout élément issu d’une fiche (caisse obligatoire, prestations SSI/caisses libérales, formules IJ, plafonds Madelin, règle Frais Fixes, rentes/clause bénéficiaire, liens devis), **citer explicitement la source** — ex. « Selon la fiche régimes obligatoires TNS… », « Référence : prevoyance-tns-regles-ij », ou en fin de réponse « *Sources : regimes-obligatoires-tns, prevoyance-tns-regles-ij.* » Voir le tableau « Éléments à sourcer » ci-dessus.
- **Logique BNC/BIC** : le **bénéfice** (BNC) ou le **résultat fiscal** (BIC) est **déjà net des charges** (CA − charges). Ne **jamais** soustraire les frais professionnels de l’étape 6 du « revenu » pour obtenir un « bénéfice net » : si l’assuré donne 80 000 € de BNC, c’est déjà le bénéfice. Les frais de l’étape 6 servent uniquement à évaluer la garantie Frais Fixes (charges qui continuent en cas d’arrêt).
- **Upload** : si l’utilisateur envoie une 2035, 2031, 2033 ou attestation CA, les analyser (formules IJ, alerte Frais Fixes si pertinent). Les documents restent **optionnels**.

---

## Références

- **Régimes obligatoires TNS (inventaire)** : `docs/knowledge/bob/regimes-obligatoires-tns.md` (SSI, CARMF, CARPIMKO, CIPAV, CAVEC, CPRN, CNBF, etc. — par profession)
- Régimes obligatoires / CCN (salariés) : `regimes-obligatoires-ccn.md`
- Formules IJ et fiscalité : `prevoyance-tns-regles-ij.md`, `2035-bilan-tns.md`, `fiscal-liasses-correspondances.md`
- Plafonds : `lib/assistant/regulatory-figures.ts`
- Besoins (audit) : `audit-diagnostic-conseiller.md`
- Devis : `liens-devis-allianz.md`
