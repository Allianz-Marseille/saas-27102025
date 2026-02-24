# 03 – IRSI : Dégâts des eaux et Incendie (Logique Habitation)

La convention **IRSI** (Indemnisation et Recours des Sinistres Immeuble) régit les sinistres dont les dommages matériels sont **inférieurs ou égaux à 5 000 € HT par local sinistré**. Elle simplifie la gestion en désignant un **interlocuteur unique** pour la victime.

**Sommaire**
- 1. Champ d’application et seuils
- 2. Tranche 1 : Dommages &lt; 1 600 € HT
- 3. Tranche 2 : Dommages entre 1 600 € et 5 000 € HT
- 4. Désignation de l’assureur gestionnaire
- 5. Instructions pour Sinistro (IA)
- Renvoi CIDE-COP (&gt; 5 000 € HT)

---

## 1. Champ d’application et seuils

- **Nature des risques :** Dégâts des eaux et Incendie.
- **Seuil de sortie :** Si le montant des dommages **dépasse 5 000 € HT** dans un local, la convention **CIDE-COP** prend le relais (voir fiche 04 – [`04-cide-cop-copropriete.md`](04-cide-cop-copropriete.md)).
- **Localisation :** Immeubles en copropriété, mono-propriété, locatif ou pleine propriété. L’origine du sinistre doit se situer dans l’immeuble ou dans un immeuble mitoyen voisin.
- **Historique :** En vigueur depuis le **1er juin 2018** en remplacement de la convention **CIDRE**.

**Mots-clés pour extraction :** IRSI, 5 000 € HT, dégâts des eaux, incendie, CIDRE, 01/06/2018.

---

## 2. Tranche 1 : Dommages &lt; 1 600 € HT

C’est la tranche de la **simplification maximale**.

- **Assureur gestionnaire :** Il s’agit de l’assureur du **local sinistré** (souvent l’assureur de l’**occupant**, qu’il soit locataire ou propriétaire).
- **Indemnisation :** L’assureur gestionnaire prend en charge les dommages **sans recherche de responsabilité**.
- **Recours :** **Aucun recours** n’est possible entre assureurs signataires pour cette tranche. Le dossier est clôturé sans recours interne entre compagnies.

**Mots-clés pour extraction :** Tranche 1, 1 600 € HT, aucun recours, assureur du local sinistré.

---

## 3. Tranche 2 : Dommages entre 1 600 € et 5 000 € HT

Ici, la logique de recours réapparaît mais l’expertise reste simplifiée.

- **Assureur gestionnaire :** Désigné selon les **mêmes règles** qu’en Tranche 1 (voir section 4).
- **Expertise :** Mise en place d’une **expertise unique** pour le **compte commun** de tous les assureurs concernés.
- **Recours :** L’assureur gestionnaire indemnise la victime puis **exerce un recours** contre l’assureur du responsable selon le **barème conventionnel** IRSI (détails dans les documents officiels – `../pdf-sinistro/`).

**Mots-clés pour extraction :** Tranche 2, 1 600 € – 5 000 € HT, expertise unique, compte commun, recours selon barème.

---

## 4. Désignation de l’assureur gestionnaire

Pour Sinistro, la règle de désignation suit cet **ordre de priorité** (pour le local sinistré) :

| Priorité | Règle | Cas d’usage |
|----------|--------|-------------|
| **1** | L’assureur de l’**occupant** (locataire ou copropriétaire occupant) | Local occupé ; l’occupant a un contrat MRH. |
| **2** | L’assureur du **Propriétaire Non Occupant (PNO)** | Local **vacant** ou occupant non assuré. |
| **3** | L’assureur de l’**immeuble / copropriété** (contrat syndic) | En dernier recours. |

Sinistro doit **identifier l’occupant** (locataire ou propriétaire occupant) pour proposer le bon gestionnaire ; en cas de local vacant, orienter vers l’assureur PNO.

---

## 5. Instructions pour Sinistro (IA)

Lorsqu’un collaborateur saisit un sinistre **habitation** (dégâts des eaux ou incendie) :

1. **Vérifier le montant :** Demander systématiquement si l’estimation est **&lt; 1 600 €**, **entre 1 600 € et 5 000 €**, ou **&gt; 5 000 €** (HT). En fonction de la réponse, aiguiller vers Tranche 1, Tranche 2 ou CIDE-COP (fiche 04).
   - Si le collaborateur ne précise pas explicitement **HT**, Sinistro doit demander confirmation avant de conclure.
2. **Identifier l’occupant :** Déterminer si le local est occupé par un locataire ou un propriétaire pour désigner l’assureur gestionnaire selon l’ordre de priorité (section 4). En cas de local vacant, évoquer l’assureur PNO.
3. **Préciser le recours :** Rappeler qu’en **Tranche 1**, le dossier est clôturé **sans recours** entre compagnies ; en **Tranche 2**, préciser que le recours s’exerce selon le barème conventionnel.
4. **Structurer la réponse :** Utiliser le format 5 blocs (Qualification, Cadre conventionnel, Justification, Direction de gestion, État du recours) avant toute recommandation.

---

## Renvoi CIDE-COP (&gt; 5 000 € HT)

Pour les sinistres dont le montant **dépasse 5 000 € HT** (par local ou au global), on sort du cadre IRSI et on applique la convention **CIDE-COP**. Voir la fiche dédiée : [`04-cide-cop-copropriete.md`](04-cide-cop-copropriete.md).
