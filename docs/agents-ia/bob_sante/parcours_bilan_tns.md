# Parcours type — Bilan prévoyance TNS

Parcours guidé pour réaliser un bilan prévoyance d’un Travailleur Non Salarié (TNS). Le bot pose les questions au fur et à mesure ; l’utilisateur répond ; le bot enchaîne avec la ou les questions suivantes.

**Raccourci dans l’interface Bob :** un bouton « Bilan prévoyance TNS » dans les suggestions de démarrage envoie le message d’amorce et lance ce parcours.

**Nota :** Le bilan peut être réalisé **sans fournir de documents financiers** : l’utilisateur peut indiquer uniquement les **grandes masses** (revenu, bénéfice, cotisations sociales, CA, etc.). Les liasses (2035, 2031, 2033) ou attestations sont optionnelles ; le bot calcule et recommande à partir des montants communiqués.

---

## Principe

1. **Collecte d’informations** — Situation familiale, profession, revenu (documents à collecter).
2. **Analyse des documents financiers** — Calcul du revenu à assurer (BNC, BIC, auto-entrepreneur).
3. **Évaluation des besoins** — IJ, capital décès, rente éducation, rente conjoint.
4. **Vérification des obligations** — Plafonds Madelin, conventions collectives si applicable.
5. **Synthèse et recommandation** — Solutions adaptées aux besoins et au budget.

---

## Message d’amorce (clic sur le raccourci)

L’utilisateur clique sur **« Bilan prévoyance TNS »** → message envoyé :

> Je souhaite faire un bilan prévoyance pour un TNS. Peux-tu me guider étape par étape ?

Le bot répond par une brève intro puis **pose la première question** (étape 1.1).

---

## Étape 1 — Collecte d’informations

### 1.1 Situation familiale

**Bot :**  
« Pour commencer, quelle est la situation familiale du TNS ?  
- Marié, pacsé ou concubin ?  
- Nombre d’enfants (et âges si pertinent) ? »

**Utilisateur :** répond (ex. marié, 2 enfants).

**Bot (suite) :** remercie, résume si besoin, puis enchaîne avec 1.2.

---

### 1.2 Profession et activité

**Bot :**  
« Quelle est la nature de l’activité ?  
- Profession libérale (BNC), artisan ou commerçant (BIC), autre ?  
- Si vous le connaissez : code NAF ou intitulé de la profession. »

**Utilisateur :** répond (ex. médecin libéral BNC, NAF 86.21A).

**Bot (suite) :** remercie, précise le régime (BNC / BIC / micro, etc.), puis enchaîne avec 1.3.

---

### 1.3 Revenu — documents ou grandes masses

**Bot :**  
« Pour déterminer le revenu à assurer, vous pouvez soit m’envoyer les documents (liasses, attestation), soit **simplement me donner les grandes masses** — pas besoin des documents si vous avez les chiffres sous la main.  
- **Libéral (BNC)** : bénéfice (CP) et cotisations sociales (BT) — ex. depuis une 2035.  
- **Commerçant / artisan (BIC)** : résultat fiscal (2031 case 1) et cotisations sociales (ex. 2033-D case 380).  
- **Auto-entrepreneur** : chiffre d’affaires et régime (BNC ou BIC, prestations ou ventes) pour appliquer l’abattement (34 % / 50 % / 71 %).  
Indiquez les montants dont vous disposez ou envoyez les documents si vous préférez. »

**Utilisateur :** répond avec les chiffres (ex. « Bénéfice 45 000 €, cotisations 18 000 € ») ou indique qu’il enverra les documents.

**Bot (suite) :**  
- Si **grandes masses fournies** → calculer le revenu IJ, rappeler la formule, puis enchaîner vers 2.4 (synthèse revenu) ou étape 3 (besoins).  
- Si **documents annoncés ou envoyés** → proposer l’étape 2 (analyse) : upload ou dictée des montants clés.  
- Si **rien pour l’instant** → rappeler quelles grandes masses seront nécessaires et proposer de continuer dès que les chiffres sont disponibles, ou d’avancer sur les **besoins** (étape 3) avec des ordres de grandeur.

---

## Étape 2 — Revenu à assurer (documents ou grandes masses)

*(À engager dès que l’utilisateur a des **chiffres** ou des **documents**. Le bilan se fait aussi bien avec les grandes masses seules qu’avec les liasses.)*

### 2.1 Libéral (BNC)

**Bot :**  
« Pour un libéral (BNC), le revenu pour les **Indemnités Journalières (IJ)** est :  
**Revenu IJ = Bénéfice (CP) + Cotisations sociales (BT)**  
Vous pouvez me donner ces deux montants (grandes masses) ou m’envoyer la 2035 si vous l’avez. »

**Utilisateur :** donne les deux montants (ex. « Bénéfice 52 000 €, cotisations 20 000 € ») ou envoie la liasse.

**Bot (suite) :** calcule le revenu IJ, rappelle la formule, puis enchaîne vers 2.4 ou 3.

---

### 2.2 Commerçant / artisan (BIC)

**Bot :**  
« Pour un BIC :  
**Revenu IJ = Résultat fiscal (2031 case 1) + Cotisations sociales (2033-D case 380)**  
Indiquez-moi ces deux montants (grandes masses) ou envoyez les documents si vous préférez. »

**Utilisateur :** donne les chiffres ou envoie les liasses.

**Bot (suite) :** calcule si possible, rappelle la formule, puis enchaîne vers 2.4 ou 3.

---

### 2.3 Auto-entrepreneur

**Bot :**  
« Pour un auto-entrepreneur :  
**Revenu après abattement = CA − abattement forfaitaire**  
(34 % BNC, 50 % BIC prestations, 71 % BIC ventes)  
Quel est le CA déclaré et le régime (BNC ou BIC, prestations ou ventes) ? Les grandes masses suffisent. »

**Utilisateur :** répond (ex. « CA 35 000 €, BIC prestations »).

**Bot (suite) :** calcule le revenu net, rappelle la formule, puis enchaîne vers 2.4 ou 3.

---

### 2.4 Synthèse revenu à assurer

**Bot :**  
« Le revenu à assurer pour les IJ (et pour dimensionner la prévoyance) est donc de **X €** (répéter le chiffre). Souhaitez-vous qu’on passe à l’évaluation des **besoins en prévoyance** (IJ, capital décès, rentes) ? »

**Utilisateur :** oui / non ou précision.

**Bot (suite) :** si oui → étape 3.

---

## Étape 3 — Évaluation des besoins en prévoyance

### 3.1 Indemnités Journalières (IJ)

**Bot :**  
« Les **Indemnités Journalières** compensent la perte de revenu en cas d’arrêt de travail.  
On part du revenu à assurer qu’on vient d’établir.  
- Avez-vous une idée du niveau de garantie souhaité (ex. 90 % du revenu, franchise 30 jours) ?  
- Des contrats existants à prendre en compte ? »

**Utilisateur :** répond.

**Bot (suite) :** résume la cible IJ, puis enchaîne 3.2.

---

### 3.2 Capital décès

**Bot :**  
« Le **capital décès** protège les ayants droit en cas de décès.  
- Souhaitez-vous couvrir les dettes, le train de vie du foyer, un capital cible (ex. X fois le revenu) ?  
- Conjoint et/ou enfants à protéger ? »

**Utilisateur :** répond.

**Bot (suite) :** résume, puis 3.3.

---

### 3.3 Rente éducation / rente conjoint

**Bot :**  
« Pour les **enfants mineurs** : souhaitez-vous prévoir une **rente éducation** ?  
Pour le **conjoint** : dépend-il financièrement du TNS ? Si oui, souhaitez-vous une **rente conjoint** ? »

**Utilisateur :** répond.

**Bot (suite) :** résume les besoins (rente éducation, rente conjoint), puis propose l’étape 4 (obligations).

---

## Étape 4 — Vérification des obligations réglementaires

### 4.1 Plafonds Loi Madelin

**Bot :**  
« Les cotisations de prévoyance TNS peuvent être déductibles dans le cadre de la **Loi Madelin** (plafonds annuels).  
Souhaitez-vous que je vous rappelle les plafonds en vigueur et les conditions de déductibilité ? »

**Utilisateur :** oui / non.

**Bot (suite) :** si oui, donner les éléments (référence : `lib/assistant/regulatory-figures.ts` et fiches `docs/knowledge/bob/`). Puis 4.2.

---

### 4.2 Conventions collectives

**Bot :**  
« Le TNS est-il concerné par une **convention collective** (ex. activité réglementée) imposant des niveaux de prévoyance ? Si oui, laquelle ? »

**Utilisateur :** répond.

**Bot (suite) :** noter si applicable, rappeler les 5 points de vigilance CCN si pertinent (fiche `regimes-obligatoires-ccn.md`), puis proposer l’étape 5.

---

## Étape 5 — Synthèse et recommandation

**Bot :**  
« Voici une synthèse du bilan prévoyance TNS :  
- **Situation** : [famille, activité, régime].  
- **Revenu à assurer** : [X €].  
- **Besoins identifiés** : IJ, capital décès, rente éducation, rente conjoint (selon réponses).  
- **Contraintes** : Madelin, CCN si applicable.  
Je vous recommande de [propositions adaptées aux besoins et au budget]. Souhaitez-vous un résumé pour votre expert ou un devis (tunnels Allianz) ? »

**Utilisateur :** répond.

**Bot (suite) :** proposer export PDF de la conversation, résumé en 3 points, ou lien vers devis selon la fiche `liens-devis-allianz.md`.

---

## Règles pour le bot

- **Rappel d’étape** : si l’utilisateur demande « Où en est-on ? », « On en est où ? », « Récap » ou équivalent pendant le parcours, résumer **l’étape en cours**, les **infos déjà collectées** (situation familiale, profession, revenu à assurer, besoins partiels) et proposer la **prochaine question**.
- **Bilan sans documents** : le bilan peut se faire **uniquement avec les grandes masses** (revenu, bénéfice, cotisations, CA). Ne pas exiger les liasses ; proposer systématiquement l’option « donnez-moi les chiffres clés ».
- **Une ou deux questions à la fois** : ne pas surcharger ; laisser l’utilisateur répondre avant d’enchaîner.
- **Résumer** brièvement les réponses avant de passer à la suite (situation familiale, revenu calculé, besoins).
- **Proposer** explicitement la suite (« Souhaitez-vous qu’on passe à… ? ») pour garder le guidage.
- **S’appuyer** sur les fiches `docs/knowledge/bob/` (formules IJ, Madelin, CCN, audit-diagnostic-conseiller, etc.) pour les chiffres et les règles.
- **Upload** : si l’utilisateur envoie une 2035, 2031, 2033 ou attestation CA, les analyser comme dans le cœur Bob (formules IJ, alerte Frais Fixes si pertinent). Les documents restent **optionnels**.

---

## Références

- Formules IJ et fiscalité : `prevoyance-tns-regles-ij.md`, `2035-bilan-tns.md`, `fiscal-liasses-correspondances.md`
- Plafonds : `lib/assistant/regulatory-figures.ts`
- Besoins (audit) : `audit-diagnostic-conseiller.md`
- CCN : `regimes-obligatoires-ccn.md`
- Devis : `liens-devis-allianz.md`
