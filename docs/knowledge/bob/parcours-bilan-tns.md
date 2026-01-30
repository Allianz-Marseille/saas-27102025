# Parcours type — Bilan prévoyance TNS

Parcours guidé pour réaliser un bilan prévoyance d'un Travailleur Non Salarié (TNS). Le bot pose les questions au fur et à mesure ; l'utilisateur répond ; le bot enchaîne avec la ou les questions suivantes.

Quand l'utilisateur envoie le message d'amorce : « Je souhaite faire un bilan prévoyance pour un TNS. Peux-tu me guider étape par étape ? », répondre par une brève intro puis **poser immédiatement la première question** (étape 1.1).

**Nota :** Le bilan peut se faire **sans documents financiers** : l'utilisateur peut indiquer uniquement les **grandes masses** (revenu, bénéfice, cotisations, CA). Les liasses (2035, 2031, 2033) sont optionnelles ; calculer et recommander à partir des montants communiqués.

## Principe (5 étapes)

1. **Collecte d'informations** — Situation familiale, profession, revenu (documents à collecter).
2. **Analyse des documents financiers** — Calcul du revenu à assurer (BNC, BIC, auto-entrepreneur).
3. **Évaluation des besoins** — IJ, capital décès, rente éducation, rente conjoint.
4. **Vérification des obligations** — Plafonds Madelin, conventions collectives si applicable.
5. **Synthèse et recommandation** — Solutions adaptées aux besoins et au budget.

---

## Étape 1 — Collecte d'informations

### 1.1 Situation familiale

**Bot :** « Pour commencer, quelle est la situation familiale du TNS ? Marié, pacsé ou concubin ? Nombre d'enfants (et âges si pertinent) ? »

**Suite :** remercier, résumer si besoin, puis enchaîner avec 1.2.

### 1.2 Profession et activité

**Bot :** « Quelle est la nature de l'activité ? Profession libérale (BNC), artisan ou commerçant (BIC), autre ? Si vous le connaissez : code NAF ou intitulé de la profession. »

**Suite :** remercier, préciser le régime (BNC / BIC / micro), puis enchaîner avec 1.3.

### 1.3 Revenu — documents ou grandes masses

**Bot :** « Pour déterminer le revenu à assurer, vous pouvez soit m'envoyer les documents (liasses, attestation), soit **simplement me donner les grandes masses** — pas besoin des documents si vous avez les chiffres. Libéral (BNC) : bénéfice (CP) et cotisations (BT). BIC : résultat fiscal (2031 case 1) et cotisations (ex. 2033-D case 380). Auto-entrepreneur : CA et régime (BNC/BIC, prestations/ventes) pour l'abattement (34 % / 50 % / 71 %). Indiquez les montants ou envoyez les documents si vous préférez. »

**Suite :** Si grandes masses fournies → calculer revenu IJ, rappeler la formule, enchaîner vers 2.4 ou 3. Si documents annoncés ou envoyés → proposer étape 2 (upload ou dictée des montants). Si rien pour l'instant → rappeler quelles grandes masses sont nécessaires, proposer de continuer plus tard ou d'avancer sur les besoins (étape 3) avec ordres de grandeur.

---

## Étape 2 — Revenu à assurer (documents ou grandes masses)

(À engager dès que l'utilisateur a des **chiffres** ou des **documents**. Le bilan se fait aussi bien avec les grandes masses seules qu'avec les liasses.)

### 2.1 Libéral (BNC)

**Bot :** « Pour un libéral (BNC), revenu IJ = Bénéfice (CP) + Cotisations sociales (BT). Donnez-moi ces deux montants (grandes masses) ou envoyez la 2035 si vous l'avez. »

**Suite :** calculer le revenu IJ, rappeler la formule, enchaîner vers 2.4 ou 3.

### 2.2 Commerçant / artisan (BIC)

**Bot :** « Pour un BIC, revenu IJ = Résultat fiscal (2031 case 1) + Cotisations sociales (2033-D case 380). Indiquez ces deux montants (grandes masses) ou envoyez les documents. »

**Suite :** calculer si possible, rappeler la formule, enchaîner vers 2.4 ou 3.

### 2.3 Auto-entrepreneur

**Bot :** « Pour un auto-entrepreneur : Revenu après abattement = CA − abattement (34 % BNC, 50 % BIC prestations, 71 % BIC ventes). Quel est le CA et le régime (BNC ou BIC, prestations ou ventes) ? Les grandes masses suffisent. »

**Suite :** calculer le revenu net, rappeler la formule, enchaîner vers 2.4 ou 3.

### 2.4 Synthèse revenu à assurer

**Bot :** « Le revenu à assurer pour les IJ est donc de X €. Souhaitez-vous qu'on passe à l'évaluation des besoins en prévoyance (IJ, capital décès, rentes) ? »

**Suite :** si oui → étape 3.

---

## Étape 3 — Évaluation des besoins en prévoyance

### 3.1 Indemnités Journalières (IJ)

**Bot :** « Les IJ compensent la perte de revenu en cas d'arrêt de travail. On part du revenu à assurer établi. Avez-vous une idée du niveau de garantie souhaité (ex. 90 % du revenu, franchise 30 jours) ? Des contrats existants à prendre en compte ? »

**Suite :** résumer la cible IJ, puis enchaîner 3.2.

### 3.2 Capital décès

**Bot :** « Le capital décès protège les ayants droit en cas de décès. Souhaitez-vous couvrir les dettes, le train de vie du foyer, un capital cible ? Conjoint et/ou enfants à protéger ? »

**Suite :** résumer, puis 3.3.

### 3.3 Rente éducation / rente conjoint

**Bot :** « Pour les enfants mineurs : souhaitez-vous prévoir une rente éducation ? Pour le conjoint : dépend-il financièrement du TNS ? Si oui, souhaitez-vous une rente conjoint ? »

**Suite :** résumer les besoins, puis proposer étape 4.

---

## Étape 4 — Vérification des obligations réglementaires

### 4.1 Plafonds Loi Madelin

**Bot :** « Les cotisations prévoyance TNS peuvent être déductibles (Loi Madelin, plafonds annuels). Souhaitez-vous que je vous rappelle les plafonds en vigueur et les conditions de déductibilité ? »

**Suite :** si oui, donner les éléments (référence regulatory-figures et fiches bob). Puis 4.2.

### 4.2 Conventions collectives

**Bot :** « Le TNS est-il concerné par une convention collective imposant des niveaux de prévoyance ? Si oui, laquelle ? »

**Suite :** noter si applicable, rappeler les 5 points de vigilance CCN si pertinent (fiche regimes-obligatoires-ccn), puis proposer étape 5.

---

## Étape 5 — Synthèse et recommandation

**Bot :** « Voici une synthèse du bilan prévoyance TNS : Situation (famille, activité, régime). Revenu à assurer : X €. Besoins identifiés : IJ, capital décès, rente éducation, rente conjoint (selon réponses). Contraintes : Madelin, CCN si applicable. Je vous recommande de [propositions adaptées]. Souhaitez-vous un résumé pour votre expert ou un devis (tunnels Allianz) ? »

**Suite :** proposer export PDF, résumé en 3 points, ou lien vers devis (fiche liens-devis-allianz).

---

## Règles pour le bot (parcours bilan TNS)

- **Rappel d'étape** : si l'utilisateur demande « Où en est-on ? », « On en est où ? », « Récap » ou équivalent, résumer l'étape en cours, les infos déjà collectées (situation familiale, profession, revenu, besoins partiels) et proposer la prochaine question.
- **Bilan sans documents** : le bilan peut se faire **uniquement avec les grandes masses** (revenu, bénéfice, cotisations, CA). Ne pas exiger les liasses ; proposer systématiquement l'option « donnez-moi les chiffres clés ».
- **Une ou deux questions à la fois** : ne pas surcharger ; laisser l'utilisateur répondre avant d'enchaîner.
- **Résumer** brièvement les réponses avant de passer à la suite (situation familiale, revenu calculé, besoins).
- **Proposer** explicitement la suite (« Souhaitez-vous qu'on passe à… ? ») pour garder le guidage.
- **S'appuyer** sur les fiches bob (formules IJ, Madelin, CCN, audit-diagnostic-conseiller) pour les chiffres et les règles.
- **Upload** : si l'utilisateur envoie une 2035, 2031, 2033 ou attestation CA, les analyser comme dans le cœur Bob (formules IJ, alerte Frais Fixes si pertinent). Les documents restent **optionnels**.

Références : prevoyance-tns-regles-ij, 2035-bilan-tns, fiscal-liasses-correspondances, audit-diagnostic-conseiller, regimes-obligatoires-ccn, liens-devis-allianz.
