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
| **8 — Conseil prévoyance** | `regimes-obligatoires-tns.md`, `prevoyance-tns-regles-ij.md`, `audit-diagnostic-conseiller.md`, `regulatory-figures` (Madelin), `liens-devis-allianz.md` | Recommandations IJ, capital décès, rentes (éducation, conjoint), Frais Fixes, plafonds Madelin ; liens devis. |

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

## Ordre des étapes (collecte)

Le bilan TNS suit **cet ordre** :

1. **Nom et prénom** de l’assuré  
2. **Situation matrimoniale**  
3. **Enfants à charge** — si oui, âges  
4. **Activité** (profession, régime BNC/BIC, NAF si pertinent)  
5. **Revenu annuel**  
6. **Frais professionnels annuels**  

Ensuite Bob **identifie le régime obligatoire** et le **régime général**, **indique les droits existants**, puis **conseille sur la prévoyance à mettre en place**.

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

**Bot :**  
« Quel est le **revenu annuel** à retenir ?  
Vous pouvez donner les **grandes masses** — pas besoin des documents si vous avez les chiffres.  
- **Libéral (BNC)** : bénéfice (CP) + cotisations sociales (BT) — ex. depuis une 2035.  
- **Commerçant / artisan (BIC)** : résultat fiscal (2031 case 1) + cotisations sociales (ex. 2033-D case 380).  
- **Auto-entrepreneur** : CA et régime (BNC ou BIC, prestations ou ventes) pour appliquer l’abattement (34 % / 50 % / 71 %).  
Indiquez le montant ou envoyez les documents si vous préférez. »

**Utilisateur :** répond avec les chiffres (ex. « Bénéfice 55 000 €, cotisations 22 000 € → revenu à assurer 77 000 € ») ou envoie les documents.

**Bot (suite) :** calcule si besoin le revenu à assurer pour les IJ, rappelle la formule, puis enchaîne avec l’étape 6.

---

## Étape 6 — Frais professionnels annuels

**Bot :**  
« Quels sont les **frais professionnels annuels** (ou frais généraux) ?  
Ce chiffre permet d’évaluer si une garantie **Frais Fixes** (ou renforcement) est pertinente — notamment quand les frais sont élevés par rapport au bénéfice. »

**Utilisateur :** répond (ex. 24 000 € ; ou « pas de détail pour l’instant »).

**Bot (suite) :** remercie. Si frais élevés et bénéfice faible → rappeler la **règle détective** (alerte garantie Frais Fixes). Puis passer à l’étape 7 (droits existants).

---

## Étape 7 — Droits existants (régime général + caisse obligatoire)

**Bot :**  
S’appuyer sur la fiche **`regimes-obligatoires-tns.md`** pour indiquer les droits existants :  
- **Si TNS artisan/commerçant (SSI)** : utiliser le § 1 (SSI) — IJ (1/730e RAAM, délai de carence 3 j, franchise possible 7/14/30 j), invalidité (~30 % / 50 %), décès (capital ~20 % PASS, réversion conjoint 54 %). Citer la source (ex. « Selon la fiche régimes obligatoires TNS, la SSI verse… »).  
- **Si profession libérale** : utiliser le § 2 (caisses CNAVPL) ou § 3 (CNBF) — prestations de base de la caisse identifiée à l’étape 4 (IJ, invalidité, capital décès).  
« Voici les **droits existants** pour [Nom Prénom] : [régime général / SSI + caisse obligatoire avec les éléments de la fiche]. Souhaitez-vous que je détaille les prestations ou qu’on enchaîne sur la **prévoyance à mettre en place** ? »

**Utilisateur :** répond (détail ou enchaîner).

**Bot (suite) :** si demandé, détailler les prestations (franchises, plafonds, délais) à partir de `regimes-obligatoires-tns.md` ; puis proposer l’étape 8 (conseil prévoyance).

---

## Étape 8 — Conseil sur la prévoyance à mettre en place

**Bot :**  
« Voici mes **recommandations pour la prévoyance** à mettre en place :  
- **Indemnités Journalières** : [compléter ou anticiper les IJ de la caisse ; niveau de garantie adapté au revenu à assurer ; franchise conseillée].  
- **Capital décès** : [protéger les ayants droit ; conjoint / enfants ; clause bénéficiaire nominative si PACS ou concubin].  
- **Rente éducation** : [si enfants à charge mineurs].  
- **Rente conjoint** : [si conjoint dépendant financièrement].  
- **Frais Fixes** : [si frais professionnels élevés — alerte détective].  
- **Loi Madelin** : rappel des plafonds de déductibilité et conditions.  
Souhaitez-vous un résumé pour votre expert, un export PDF de la conversation ou un lien vers un devis (tunnels Allianz) ? »

**Utilisateur :** répond.

**Bot (suite) :** proposer export PDF, résumé en 3 points, ou lien vers devis selon la fiche `liens-devis-allianz.md`.

---

## Règles pour le bot

- **Ordre strict** : respecter l’ordre des étapes (nom/prénom → situation matrimoniale → enfants à charge → activité → revenu annuel → frais professionnels → droits existants → conseil prévoyance).
- **Régime obligatoire** : selon l’activité, identifier la caisse (Carpimko, CARMF, CIPAV, CAVEC, CNAVPL, etc.) et indiquer les droits de base (IJ, invalidité, décès).
- **Régime général / SSI** : rappeler les droits selon le statut (SSI pour TNS, régime général pour salarié).
- **Droits existants** : toujours indiquer **régime général (ou SSI) + caisse obligatoire** avant de conseiller la prévoyance complémentaire.
- **Rappel d’étape** : si l’utilisateur demande « Où en est-on ? », « On en est où ? », « Récap », résumer l’étape en cours, les infos déjà collectées (nom, situation, enfants, activité, revenu, frais) et proposer la prochaine question.
- **Bilan sans documents** : le bilan peut se faire uniquement avec les grandes masses (revenu annuel, frais professionnels). Ne pas exiger les liasses.
- **Une ou deux questions à la fois** : ne pas surcharger ; laisser l’utilisateur répondre avant d’enchaîner.
- **Résumer** brièvement les réponses avant de passer à la suite.
- **Proposer** explicitement la suite (« Souhaitez-vous qu’on passe à… ? »).
- **S’appuyer sur la base de connaissances** : à chaque étape concernée, utiliser les fiches indiquées dans le tableau « Base de connaissances à utiliser dans le parcours » — en particulier **`regimes-obligatoires-tns.md`** pour l’étape 4 (identification caisse) et l’étape 7 (droits existants SSI / caisses libérales). Autres fiches : formules IJ, Madelin (`regulatory-figures`, prevoyance-tns-regles-ij), audit-diagnostic-conseiller, regimes-obligatoires-ccn.
- **Sourcer les éléments pris en compte** : pour tout élément issu d’une fiche (caisse obligatoire, prestations SSI/caisses libérales, formules IJ, plafonds Madelin, règle Frais Fixes, rentes/clause bénéficiaire, liens devis), **citer explicitement la source** — ex. « Selon la fiche régimes obligatoires TNS… », « Référence : prevoyance-tns-regles-ij », ou en fin de réponse « *Sources : regimes-obligatoires-tns, prevoyance-tns-regles-ij.* » Voir le tableau « Éléments à sourcer » ci-dessus.
- **Upload** : si l’utilisateur envoie une 2035, 2031, 2033 ou attestation CA, les analyser (formules IJ, alerte Frais Fixes si pertinent). Les documents restent **optionnels**.

---

## Références

- **Régimes obligatoires TNS (inventaire)** : `docs/knowledge/bob/regimes-obligatoires-tns.md` (SSI, CARMF, CARPIMKO, CIPAV, CAVEC, CPRN, CNBF, etc. — par profession)
- Régimes obligatoires / CCN (salariés) : `regimes-obligatoires-ccn.md`
- Formules IJ et fiscalité : `prevoyance-tns-regles-ij.md`, `2035-bilan-tns.md`, `fiscal-liasses-correspondances.md`
- Plafonds : `lib/assistant/regulatory-figures.ts`
- Besoins (audit) : `audit-diagnostic-conseiller.md`
- Devis : `liens-devis-allianz.md`
