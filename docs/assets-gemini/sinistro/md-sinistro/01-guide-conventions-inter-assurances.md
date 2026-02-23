# Guide des Conventions Inter-Assurances pour Sinistro

Ce document est la **base de connaissance** des accords passés entre compagnies (sous l'égide de **France Assureurs**, ex-FSA) pour accélérer l'indemnisation des victimes et simplifier les recours. Sinistro doit s'y référer pour qualifier les sinistres et indiquer les règles applicables.

> **Important :** Ces conventions ne sont **pas opposables aux tiers** (clients, victimes). Elles servent uniquement à régler les comptes **entre** assureurs. Sinistro doit toujours distinguer : **droit commun** (ce qu'on doit au client) vs **convention** (ce que l'assureur récupère en recours).

**Sommaire**
- Liens utiles (sites officiels et référence)
- 1. Sinistres Automobiles (matériels et corporels)
- 2. Sinistres Habitation (dégâts des eaux et incendie)
- 3. Risques professionnels et responsabilité civile
- 4. Comment Sinistro doit utiliser ces infos
- 5. Rappel juridique

---

## Liens utiles (sites officiels et référence)

| Ressource | URL |
|-----------|-----|
| **France Assureurs** – fédération professionnelle (ex-FFSA/GEMA) | [www.franceassureurs.fr](https://www.franceassureurs.fr) |
| **e-constat auto** – application officielle constat amiable (DARVA, même valeur que le papier) | [www.e-constat-auto.fr](https://www.e-constat-auto.fr) |
| **France Assureurs – Démarches en cas de sinistre** (tempête, inondation, etc.) | [Demarches sinistre](https://www.franceassureurs.fr/lassurance-protege-finance-et-emploie/lassurance-protege/les-demarches-en-cas-de-sinistre/tempete-questions-reponses-sur-votre-assurance/) |
| **INC – Les conventions de règlement des sinistres entre assureurs** (grand public) | [inc-conso.fr](https://www.inc-conso.fr/content/les-conventions-de-reglement-des-sinistres-entre-assureurs) |

---

## 1. Sinistres Automobiles (matériels et corporels)

Cœur d'activité pour un agent général ou un courtier.

| Convention | Nom complet | Champ d'application |
|------------|-------------|---------------------|
| **IRSA** | Indemnisation Directe et de Recours entre Sociétés d'Assurance | **La plus courante.** Gère les accidents **matériels** entre deux véhicules (ou plus). Définit les fameux **« Cas »** (Cas 10, 13, 21…) pour déterminer les responsabilités. |
| **IDA** | Indemnisation Directe de l'Assuré | Volet de l'IRSA : l'assureur **direct** indemnise son propre client sans attendre le recours. |
| **IRCA** | Indemnisation et Recours Corporels Automobiles | Gère les **dommages corporels légers** (AIPP < 5 % en général) suite à un accident de la route. |
| **PAOS** | Protocole d'Accord d'Offre de Services | Accidents corporels **plus graves** : les assureurs collaborent pour verser des **provisions** à la victime. |

---

## 2. Sinistres Habitation (dégâts des eaux et incendie)

Depuis 2018 (réforme majeure), référence pour le gestionnaire MRH.

### IRSI – Indemnisation et Recours des Sinistres Immeuble

Remplace l'ancienne **CIDRE**. Cruciale pour Sinistro :

- **Tranche 1 (sinistre < 1 600 € HT)**  
  L'assureur gestionnaire (souvent celui de l'occupant) paie tout **sans recours**. Pas de recherche de responsabilité.

- **Tranche 2 (entre 1 600 € et 5 000 € HT)**  
  L'assureur gestionnaire indemnise, mais peut exercer un **recours** contre le responsable selon un barème précis.

- **Au-delà de 5 000 €**  
  On sort de l'IRSI pour entrer dans la convention **CIDE-COP**.

### CIDE-COP

- **Usage :** Gros dégâts des eaux ou incendies en **copropriété** (montants élevés).
- **Principe :** Mise en cause des responsabilités plus fine, recours entre assureurs plus complexes.

---

## 3. Risques professionnels et responsabilité civile

| Convention | Usage |
|------------|--------|
| **CID-PIV** | Convention d'Indemnisation Directe – Pertes Indirectes et Vol. |
| **CRAC** | Convention de Règlement de l'Assurance Construction. |

---

## 4. Comment Sinistro doit utiliser ces infos

Logique à suivre dans le SaaS :

1. **Qualification**  
   « Est-ce un dégât des eaux ou un accident auto ? » → choix de la convention (IRSA/IRCA/PAOS vs IRSI/CIDE-COP).

2. **Seuil**  
   « Le montant estimé est-il de 1 200 € ou 8 000 € ? »  
   Indispensable pour choisir **IRSI Tranche 1**, **IRSI Tranche 2** ou **CIDE-COP**.

3. **Localisation**  
   Copropriété, maison individuelle ou locatif → impact sur assureur gestionnaire et recours.

4. **Action**  
   Sinistro indique :
   - qui est l’**Assureur Gestionnaire** ;
   - s’il y a un **Recours** possible et dans quel cadre (convention + barème si applicable).

---

## 5. Rappel juridique

- **Droit commun** : ce que l'assuré ou la victime peut exiger de son assureur (contrat, loi).
- **Convention** : règles entre assureurs pour répartir les coûts (recours, gestionnaire).  
Sinistro ne doit jamais présenter la convention comme un droit opposable au client ; il l’utilise pour expliquer **qui paie, qui recourt**, et **selon quels seuils**.

---

*Document à compléter : **Cas IRSA** (détail des responsabilités par cas pour l’analyse de constat amiable).*
