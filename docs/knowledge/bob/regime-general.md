# Régime général — CPAM / CNAM (expertise Bob)

**Public concerné :** Salariés du secteur privé, régimes alignés. Gestion : **CPAM** (CNAM), recouvrement URSSAF. *Fonctionnaires : règles spécifiques (non détaillées ici).*

**Objectif :** Donner une **vision complète des prestations, garanties et conditions** du régime général pour **calculer les droits d'un salarié** et déterminer ce qu'il perçoit au titre de la Sécurité sociale (maladie, IJ, invalidité, décès, maternité/paternité, AT/MP). Le régime général est le « premier étage » de la protection ; il reste **structurellement incomplet** — d'où l'audit (bulletin de paie, mutuelle, prévoyance collective) et le calcul du gap.

**Chiffres à jour (SMIC, plafond IJSS, capital décès) :** `lib/assistant/regulatory-figures.ts` — Bob reçoit le bloc « Régime général (salariés) » à chaque requête.

---

## Concepts clés (santé)

| Concept | Définition |
|--------|------------|
| **BRSS** (Base de Remboursement SS) | Tarif de référence sur lequel la Sécu applique son pourcentage de remboursement. |
| **Ticket modérateur** | Part non remboursée par la Sécu (reste à la charge de l'assuré ou de sa mutuelle). |
| **PASS** | Plafond Annuel de la Sécurité Sociale — unité pour cotisations et plafonds. Source : `regulatory-figures.ts`. |
| **SJB** (Salaire journalier de base) | Référence pour le calcul des IJ : assiette / 91,25 (nombre de jours de référence annuel). |

---

## 1. Maladie — Soins et indemnités journalières (IJ)

### 1.1 Soins (maladie)

| Élément | Règle |
|--------|--------|
| **Remboursement** | Taux selon acte (ex. 70 % généraliste, 80 % spécialiste) sur la BRSS ; ticket modérateur à la charge de l'assuré ou de la mutuelle. |
| **Franchise et forfait** | Forfait 1 €, franchises médicamenteuses. |
| **ALD** | Affection longue durée : exonération du ticket modérateur pour les soins en rapport avec l'ALD. |
| **Cure thermale** | Prise en charge sous conditions. |

### 1.2 Indemnités journalières (arrêt maladie — accident/maladie hors AT/MP)

#### Conditions d'ouverture des droits

| Condition | Règle |
|-----------|--------|
| **Affiliation / cotisation** | Conditions d'affiliation et de cotisation au régime général (durée selon barème CPAM). |
| **Arrêt** | Prescrit par un médecin ; transmis à la CPAM dans les délais. |
| **Hors AT/MP** | Accident du travail et maladie professionnelle → régime **AT/MP** (voir § 6). |

#### Assiette : salaire journalier de base (SJB)

| Élément | Règle |
|--------|--------|
| **Définition** | Moyenne des **salaires bruts des 3 mois civils précédant** l'arrêt de travail. |
| **Salaire journalier de base** | **Total des 3 mois (plafonnés) / 91,25**. Valeur 91,25 : `regulatory-figures.ts` (IJSS_JOURS_REF_ANNUELS). |
| **Plafond mensuel** | Chaque mois est **plafonné à 1,4 × SMIC mensuel**. Montant : voir bloc « Régime général (salariés) » (IJSS_PLAFOND_MENSUEL_ASSIETTE). Depuis le 1er avril 2025 : plafond à 1,4 SMIC (au lieu de 1,8 SMIC). |

#### Formule de calcul des IJ maladie

| Élément | Formule / Montant |
|--------|--------------------|
| **IJ journalière brute** | **50 % du SJB** = 50 % × (somme des 3 derniers mois plafonnés / 91,25). |
| **Plafond IJ** | Voir bloc « Régime général (salariés) » : **IJSS_MALADIE_MAX_JOUR** (€/jour). |
| **Carence** | **3 jours** : les IJ sont versées à partir du **4e jour** d'arrêt. Souvent compensée par **maintien de salaire** par l'employeur ou par convention collective. |
| **Durée maximale** | **360 jours** sur **3 ans** (période de 3 ans consécutifs). |

#### Récapitulatif IJ maladie

| Élément | Règle |
|--------|--------|
| **IJ max** | Voir `regulatory-figures.ts` (IJSS_MALADIE_MAX_JOUR). |
| **Carence** | **3 jours** (versement à partir du 4e jour). |
| **Durée** | **360 jours** sur **3 ans**. |

---

## 2. Invalidité (maladie ou accident non professionnel)

### 2.1 Conditions

| Condition | Règle |
|-----------|--------|
| **Critère** | Capacité de travail ou de gain **réduite d'au moins 2/3** (maladie ou accident **non professionnel** — sinon → AT/MP). |
| **Assiette** | **Salaire brut annuel moyen des 10 meilleures années** (dans la limite du PASS). |

### 2.2 Catégories et montants (ordre de grandeur)

| Catégorie | Définition | Pension (calcul) | Fourchette mensuelle (ordre de grandeur) |
|-----------|------------|------------------|----------------------------------------|
| **1ère catégorie** | La personne peut encore exercer une **activité professionnelle** (réduction de capacité ≥ 2/3). | **30 %** du salaire annuel moyen (plafonné). | Min. ~338 € ; max. **~1 201 €/mois**. |
| **2ème catégorie** | La personne **ne peut plus exercer** aucune activité professionnelle. | **50 %** du salaire annuel moyen (plafonné). | Min. ~338 € ; max. **~2 002 €/mois**. |
| **3ème catégorie** | Incapacité à toute activité **+ besoin d'assistance** (tierce personne). | **50 %** + **majoration pour tierce personne**. | — |

Cumul avec une activité possible sous conditions (plafond de ressources). Les plafonds sont revalorisés chaque année.

---

## 3. Décès

### 3.1 Capital décès

| Élément | Règle |
|--------|--------|
| **Montant** | Forfait revalorisé par décret. Voir `regulatory-figures.ts` : **CAPITAL_DECES_CPAM_SALARIE**. |
| **Condition du défunt** | Moins de 3 mois avant le décès : salarié, chômeur indemnisé, ou bénéficiaire d'une rente AT ou d'une pension d'invalidité. |
| **Demande** | À formuler **rapidement** (délais CPAM) ; certains ayants droit doivent justifier de **ressources inférieures à un plafond** (ex. ~6 614 €/an selon années). |

### 3.2 Ayants droit (ordre de priorité)

1. **Conjoint** (ou partenaire Pacs non dissous) non séparé.  
2. **Enfants** du défunt < 21 ans (ou infirmes, non imposables).  
3. **Enfants recueillis** au foyer, mêmes conditions.  
4. **Ascendants** (parents, grands-parents).

### 3.3 Pension de réversion (conjoint survivant)

| Élément | Règle |
|--------|--------|
| **Taux** | **54 %** de la pension de retraite **de base** que percevait (ou aurait dû percevoir) le défunt. |
| **Condition d'âge** | Conjoint âgé d'**au moins 55 ans** au moment de la demande. |
| **Statut** | Réservé au **conjoint marié** (Pacs et concubinage ne donnent pas droit à la réversion). Ex-conjoints divorcés peuvent y prétendre ; en cas de mariages multiples, partage au prorata des durées. |
| **Plafond de ressources** | Au-delà d'un certain plafond de ressources annuelles (ex. ~24 232 € personne seule, ~38 771 € couple), la pension peut être réduite ou supprimée. |

### 3.4 Rente d'orphelin

Prestation versée sous conditions (âge, ressources) — barème CNAV / Assurance retraite.

---

## 4. Maternité et paternité

### 4.1 Conditions d'ouverture des droits (IJ maternité/paternité)

| Condition | Règle |
|-----------|--------|
| **Cotisation** | Avoir cotisé sur au moins **1 015 × SMIC horaire** sur les **6 mois précédant** le congé, **ou** **150 h** sur les **3 mois précédents**, **ou** **600 h** sur les **12 mois précédents** (salariés discontinus/saisonniers). |
| **Affiliation** | Au moins **6 mois** à la Sécurité sociale à la date présumée de l'accouchement. |

### 4.2 Indemnités journalières maternité / paternité

| Élément | Règle |
|--------|--------|
| **Assiette** | **1/91,25** des **3 derniers salaires bruts**, plafonnés au **plafond mensuel** de la Sécurité sociale (PASS/12). |
| **Montant** | Min. ~11 €/j ; max. ~**102 €/j** (ordre de grandeur) — **sans délai de carence** (versement dès le 1er jour du congé prénatal). |
| **Déduction** | **21 %** (CSG + CRDS) en déduction forfaitaire avant versement. |
| **Versement** | Par la CPAM, **tous les 14 jours**. |

### 4.3 Durées des congés

| Situation | Avant naissance | Après naissance | Total |
|------------|-----------------|-----------------|--------|
| **1er ou 2e enfant** | 6 sem. | 10 sem. | **16 sem.** |
| **3e enfant** | 8 sem. | 18 sem. | **26 sem.** |
| **Jumeaux** | 12 sem. | 22 sem. | **34 sem.** |
| **Triplés ou plus** | — | — | **46 sem.** |

**Paternité / accueil** : durée selon barème en vigueur (ex. 25 jours calendaires, 32 si naissances multiples) ; mêmes principes d'IJ si conditions remplies.

---

## 5. Accidents du travail / Maladies professionnelles (AT/MP)

| Élément | Règle |
|--------|--------|
| **Soins** | Prise en charge **intégrale** (sans ticket modérateur). |
| **IJ** | Règles et montants **spécifiques** ; **pas de délai de carence** dans certains cas. |
| **Incapacité permanente (IPP)** | Rente ou capital selon taux d'IPP. |
| **Faute inexcusable** de l'employeur : majorations possibles. |

*Détail : CPAM, service AT/MP.*

---

## 6. Retraite (rappel pour l'audit)

Âge légal, âge du taux plein, décote/surcote, calcul de la pension (répartition), liquidation. **Impact sur la prévoyance** : les garanties IJ et invalidité du régime général (et souvent du contrat collectif) **cessent à la liquidation retraite** — à prendre en compte pour les seniors (capital décès, maintien garanties santé).

---

## 7. Famille

Allocations familiales, PAJE et autres prestations selon situation (revenus, nombre d'enfants). *Détail : CAF, barèmes en vigueur.*

---

## 8. Calcul des droits : checklist pour un salarié

Pour **déterminer les droits au titre du régime général** d'un salarié donné :

1. **IJ maladie** : Vérifier affiliation/cotisation. **SJB** = (3 derniers mois bruts plafonnés à 1,4 SMIC) / 91,25. **IJ/j** = 50 % du SJB (plafond = IJSS_MALADIE_MAX_JOUR dans regulatory-figures). Jours payés = jours d'arrêt − 3 (carence), max 360 j / 3 ans.
2. **Invalidité** : Catégorie 1 (30 %) ou 2 (50 %) ou 3 (50 % + tierce personne) ; assiette = 10 meilleures années (plafond PASS) ; fourchettes min/max à jour.
3. **Décès** : Capital décès forfait = CAPITAL_DECES_CPAM_SALARIE (regulatory-figures) ; réversion conjoint 54 % (≥ 55 ans, marié, plafond de ressources) ; rente orphelin selon barème.
4. **Maternité / paternité** : Vérifier 6 mois d'affiliation et conditions de cotisation (1 015 × SMIC ou 150 h / 600 h). IJ sans carence, assiette 3 derniers salaires (plafond mensuel SS), versement tous les 14 jours.
5. **AT/MP** : Si accident ou maladie professionnelle, appliquer les règles AT/MP (soins 100 %, IJ sans carence, IPP).

**Chiffres à jour** : `lib/assistant/regulatory-figures.ts` (SMIC, plafond IJSS, IJ max, capital décès) ; service-public.fr, legisocial.fr, CPAM.

---

## Synthèse pour l'audit salarié

- **IJ maladie** : Carence 3 jours (souvent couverte par maintien de salaire ou convention) ; plafond = IJSS_MALADIE_MAX_JOUR (assiette plafonnée 1,4 SMIC).
- **Invalidité** : 3 catégories ; pensions plafonnées (max ~1 201 € / ~2 002 €/mois) → prévoyance collective ou individuelle pour compléter.
- **Décès** : Capital décès = CAPITAL_DECES_CPAM_SALARIE ; réversion 54 % (conditions d'âge et de ressources) → prévoyance collective (1,50 % TA cadres, capital décès, rente conjoint) pour renforcer.

**Source :** regime-general.md ; chiffres réglementaires : `lib/assistant/regulatory-figures.ts`.
