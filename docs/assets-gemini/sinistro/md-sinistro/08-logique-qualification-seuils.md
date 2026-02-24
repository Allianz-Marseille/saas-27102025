# 08 – Logique de Qualification et Seuils (Moteur de décision)

Ce document définit l’**arbre de décision** que **Sinistro** doit parcourir pour chaque demande. Il assure la transition entre la saisie brute du collaborateur et l’application des fiches techniques (02 à 06). C’est le **moteur d’aiguillage** du SaaS.

**Sommaire**
- 1. Arbre de décision global
- 2. Logique spécifique : Habitation (seuils HT)
- 3. Logique spécifique : Automobile (responsabilité)
- 4. Contraintes de sortie (format de réponse IA)
- 5. Exceptions et sorties de conventions
- Référence croisée vers les fiches

---

## 1. Arbre de décision global

Pour chaque sinistre, Sinistro suit cet enchaînement strict.

### Étape 1 : Qualification de la nature

| Nature du sinistre | Aiguillage | Fiche à consulter |
|--------------------|------------|-------------------|
| **Auto matériel** (véhicules entre eux) | Convention **IRSA/IDA** | [`02-cas-irsa-constat-amiable.md`](02-cas-irsa-constat-amiable.md) |
| **Auto corporel** | Vérifier gravité (AIPP) → **IRCA** ou **PAOS** | [`05-auto-corporel-irca-paos.md`](05-auto-corporel-irca-paos.md) |
| **Habitation** (dégâts des eaux / incendie) | **IRSI** ou **CIDE-COP** selon montant HT | [`03-irsi-degats-eaux-immeuble.md`](03-irsi-degats-eaux-immeuble.md), [`04-cide-cop-copropriete.md`](04-cide-cop-copropriete.md) |
| **Professionnel / Construction** | **CID-PIV** ou **CRAC** | [`06-pro-rc-cid-piv-crac.md`](06-pro-rc-cid-piv-crac.md) |

---

## 2. Logique spécifique : Habitation (seuils HT)

Le **montant des dommages** est le critère d’aiguillage principal. Le calcul doit toujours se faire en **Hors Taxes (HT)**.

Si le montant est fourni sans mention explicite HT, Sinistro doit demander confirmation avant de choisir IRSI Tranche 1, IRSI Tranche 2 ou CIDE-COP.

| Montant des dommages (HT) | Convention applicable | Action Sinistro |
|---------------------------|------------------------|-----------------|
| **&lt; 1 600 €** | **IRSI – Tranche 1** | Désigner l’assureur gestionnaire (souvent l’occupant). **Aucun recours**. |
| **1 600 € à 5 000 €** | **IRSI – Tranche 2** | Désigner le gestionnaire. Préciser : **Recours selon barème**. |
| **&gt; 5 000 €** | **CIDE-COP** | Sortie de l’IRSI. Gérer selon règles copropriété (fiche 04). |

*Localisation :* En **copropriété**, CIDE-COP s’applique aux sinistres lourds ; en **maison individuelle** ou **locatif**, IRSI (tranches 1 et 2) selon montant. Fiche 03 pour le détail.

---

## 3. Logique spécifique : Automobile (responsabilité)

L’analyse repose sur la combinaison des **croix du constat** et du **barème IRSA** (fiche 02).

1. **Saisie des croix** : Demander les **cases cochées pour A et B** (1 à 17).
   - En cas de constat image : lister les cases détectées puis demander confirmation avant de conclure.
2. **Rappel IDA** : Rappeler que **chaque assureur gère son client** (Indemnisation Directe de l’Assuré).
3. **Détermination du cas** : Faire correspondre les croix au cas du barème (ex. Case 10 côté B + Case 1 côté B = Cas 10, 100 % A / 0 % B).
4. **Recours** : Définir si le recours est **total (100 %)**, **partiel (50 %)** ou **nul**.

Voir la fiche [`02-cas-irsa-constat-amiable.md`](02-cas-irsa-constat-amiable.md) pour les identifiants de règle (`IRSA_10`, `IRSA_13`, etc.), les croix bloquantes et la gestion des désaccords.

---

## 4. Contraintes de sortie (format de réponse IA)

Pour garantir la fiabilité du SaaS, l’IA doit respecter **ce format de réponse** pour chaque sinistre qualifié :

1. **Qualification :** [Nature du sinistre — ex. Auto matériel, Habitation dégâts des eaux]
2. **Cadre conventionnel :** [Convention citée — ex. IRSA/IDA, IRSI Tranche 1, CIDE-COP]
3. **Justification :** [Seuil atteint (montant HT) ou croix identifiées (Croix A : … ; Croix B : …) + ID règle si auto]
4. **Direction de gestion :** [Qui indemnise / qui est l’assureur gestionnaire]
5. **État du recours :** [Possibilité et quantum du recours — aucun, selon barème, total, partiel]

*Exemple (auto) :* « 1. Qualification : Auto matériel. 2. Cadre : IRSA/IDA. 3. Justification : Croix A : 9, 11 ; Croix B : 1, 10 → règle `IRSA_10`. 4. Gestion : Chaque assureur indemnise son assuré (IDA). 5. Recours : Total — assureur de B exerce un recours contre assureur de A (100 % A). »

---

## 5. Exceptions et sorties de conventions

Sinistro doit **alerter le collaborateur** si le cas sort du cadre conventionnel (**droit commun** applicable) :

- **Sinistre à l’étranger** ou **véhicule étranger** (selon accords bilatéraux ou absence de convention).
- **Contestation de signature** ou **constat non signé** par l’une des parties.
- **Dommages dépassant les plafonds** spécifiques des recours conventionnels (ex. seuils particuliers par convention).
- **Litige majeur** (observations contradictoires, schéma incohérent) : orienter vers 50/50 par défaut et rappeler la possibilité de recours en droit commun (expertise, témoins).

Dans ces situations, indiquer clairement que la **convention ne s’applique pas** ou s’applique sous réserve, et que l’indemnisation et les recours relèvent du **droit commun** (contrat, expertise, tribunal).

---

## Référence croisée vers les fiches

| Besoin | Fiche |
|--------|--------|
| Cas IRSA, constat amiable, désaccords | [`02-cas-irsa-constat-amiable.md`](02-cas-irsa-constat-amiable.md) |
| IRSI, tranches 1 et 2, barème | [`03-irsi-degats-eaux-immeuble.md`](03-irsi-degats-eaux-immeuble.md) |
| CIDE-COP, copropriété | [`04-cide-cop-copropriete.md`](04-cide-cop-copropriete.md) |
| IRCA, PAOS, corporel | [`05-auto-corporel-irca-paos.md`](05-auto-corporel-irca-paos.md) |
| CID-PIV, CRAC | [`06-pro-rc-cid-piv-crac.md`](06-pro-rc-cid-piv-crac.md) |
| Définitions, acronymes | [`07-glossaire-acronymes-sinistro.md`](07-glossaire-acronymes-sinistro.md) |
