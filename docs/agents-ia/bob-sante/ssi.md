# SSI — Sécurité sociale des indépendants (expertise Bob)

**Public concerné :** Artisans, Commerçants, Industriels (ACI). Gérants majoritaires SARL, auto-entrepreneurs ACI. Recouvrement : URSSAF. Site : [secu-independants.fr](https://www.secu-independants.fr/).

**Objectif :** Donner une **vision complète des prestations, garanties et conditions** SSI pour **calculer les droits d’un indépendant** et déterminer ce qu’il perçoit au titre de la SSI (IJ, invalidité, décès, maternité/paternité). La SSI est une **organisation spécifique au sein du régime général** pour les TNS. Les **cotisations** sont calculées sur le revenu net professionnel ; les **droits aux prestations** en dépendent directement — vérifier que les cotisations sont à jour.

Contenu détaillé + exemples chiffrés injectés dans Bob : `docs/knowledge/bob/ro/ssi.md`.

---

## 1. Indemnités journalières (arrêt maladie / accident hors AT)

### 1.1 Conditions d’ouverture des droits

| Condition | Règle |
|-----------|--------|
| **Affiliation** | Au moins **12 mois** à la SSI à la date de l’arrêt. |
| **Revenu minimum** | **RAAM ≥ 10 % du PASS** (ex. 4 806 € pour PASS 2026 = 48 060 €). En dessous, **aucune IJ**. |
| **Arrêt** | Prescrit par un médecin ; **cessation totale** de l’activité professionnelle. |
| **Hors AT/MP** | Accident du travail et maladie professionnelle relèvent de la **CPAM (régime AT/MP)** — règles et montants différents. |

### 1.2 Assiette : Revenu d’activité annuel moyen (RAAM)

| Élément | Règle |
|--------|--------|
| **Définition** | Moyenne des **revenus nets sociaux** (bénéfices ou rémunérations déclarés) sur les **3 dernières années civiles** — **pas** le chiffre d’affaires brut. |
| **Auto-entrepreneurs** | RAAM basé sur le CA après **abattement forfaitaire** : **71 %** (vente), **50 %** (BIC prestations de services), **34 %** (BNC). |
| **Création récente** | Si moins de 3 ans d’activité, la caisse utilise les années disponibles ; règles spécifiques à confirmer auprès de la SSI/URSSAF. |

### 1.3 Formule de calcul des IJ

| Élément | Formule / Montant |
|--------|--------------------|
| **IJ journalière brute** | **min( RAAM / 730 ; PASS / 730 )**. Ex. PASS 2026 : 48 060 / 730 ≈ **65,84 €/jour** max. |
| **Jours indemnisés** | **max(0 ; jours d’arrêt − carence)**. Carence : **3 jours** (ou **7 jours** si maladie **sans** hospitalisation). |
| **Durée maximale** | **360 jours** sur une période glissante de **3 ans**. |
| **Montant total sur une période** | *(Jours indemnisés)* × *(IJ journalière)*, dans la limite des 360 j / 3 ans. |

### 1.4 Récapitulatif IJ

| Élément | Règle |
|--------|--------|
| **IJ max (PASS 2026)** | 48 060 / 730 ≈ **65,84 €/jour**. |
| **Carence** | **3 jours** ; **7 jours** si maladie sans hospitalisation. |
| **Durée** | **360 jours** sur **3 ans**. |
| **Seuil minimal RAAM** | 10 % du PASS (≈ 4 806 € en 2026) ; en dessous, IJ = 0 €. |

**Limites pour l’audit :** Le RO ne paie jamais les **charges fixes** (loyer, cotisations, leasing). → Argument pour une complémentaire Madelin et option **Frais Fixes**.

---

## 2. Invalidité (partielle ou totale)

### 2.1 Conditions

| Condition | Règle |
|-----------|--------|
| **Affiliation** | Au moins **12 mois** à la SSI. |
| **Événement** | Maladie ou accident **non professionnel** (sinon → régime AT/MP). |
| **Reconnaissance** | **Taux d’incapacité** reconnu par la caisse (médecin-conseil). |

### 2.2 Catégories et montants

| Catégorie | Définition | Pension (ordre de grandeur) |
|-----------|------------|-----------------------------|
| **Catégorie 1 (partielle)** | L’assuré peut exercer une **activité réduite** (réduction de capacité ≥ 2/3). | Environ **30 %** du revenu annuel moyen, **plafonné**. |
| **Catégorie 2 (totale)** | L’assuré est **inapte à toute activité** professionnelle (gestes de la vie quotidienne possibles). | Environ **50 %** du revenu annuel moyen, **plafonné**. |

Les plafonds sont fixés par la réglementation (liés au PASS). Les montants sont souvent **insuffisants** par rapport au revenu réel → prévoyance complémentaire (rente invalidité) recommandée.

---

## 3. Décès

| Prestation | Montant (ordre de grandeur, PASS 2026 = 48 060 €) | Conditions / Remarques |
|------------|---------------------------------------------------|-------------------------|
| **Capital décès (cotisant)** | **~20 % du PASS** ≈ **9 612 €**. | Versé aux ayants droit. |
| **Capital décès (retraité)** | **~8 % du PASS** ≈ **3 845 €**. | |
| **Bonus enfant à charge** | Montant complémentaire par enfant. | Enfants < 16 ans ou en études (jusqu’à 20 ans). **Demande dans le mois** suivant le décès. |
| **Pension de réversion (conjoint)** | **54 %** de la pension de retraite **de base** du défunt. | Conditions d’âge (ex. 55 ans) et de durée de mariage — voir barème en vigueur. |
| **Rente éducation** | **Non versée par la SSI.** | À prévoir en **complémentaire** (Loi Madelin). |

---

## 4. Maternité et paternité

| Élément | Règle |
|--------|--------|
| **Conditions** | Au moins **10 mois d’affiliation** SSI à la date prévue d’accouchement ; revenus ≥ seuil minimal (ordre de grandeur 10 % PASS). |
| **Maternité** | **Cessation totale d’activité** au moins **8 semaines** (dont 6 après la naissance) pour percevoir les IJ. **IJ** : même formule que maladie (1/730e du RAAM, plafond PASS/730) — ex. ~**65 €/jour**. **Allocation forfaitaire de repos maternel** : ordre de grandeur **~3 864 €** (versée en deux fois, sous conditions de revenus). Durée du congé : 16 semaines (1er enfant), 26 sem. (2 enfants ou plus), 34/46 sem. (gémellaire / multiple). |
| **Paternité** | **25 jours** calendaires (32 si naissances multiples) dans les 6 mois suivant la naissance. **IJ** si **suspension totale** d’activité, même montant que maternité. Toute activité non déclarée pendant le congé peut entraîner remboursement des indemnités. |

---

## 5. Ce qui ne relève pas de la SSI (précision)

| Risque | Organisme / Règle |
|--------|-------------------|
| **Accident du travail / Maladie professionnelle** | **CPAM** (régime AT/MP) — indemnisation et barème spécifiques. |
| **Rente éducation** | Non prévue par la SSI → complémentaire Madelin. |
| **Retraite** | Retraite **de base** des indépendants gérée dans le cadre SSI (CNAV) ; retraite **complémentaire** (ex. RSI puis CNAVPL selon profession). Calcul des pensions = sujet distinct (durée, points, etc.). |

---

## 6. Calcul des droits : checklist pour un indépendant

Pour **déterminer les droits au titre de la SSI** d’un indépendant donné :

1. **Vérifier l’affiliation** : 12 mois pour IJ et invalidité ; 10 mois pour maternité.
2. **Calculer le RAAM** : moyenne des revenus nets sociaux des 3 dernières années (abattement si auto-entrepreneur). Vérifier RAAM ≥ 10 % PASS pour les IJ.
3. **IJ (maladie)** : IJ/j = min(RAAM/730 ; PASS/730). Jours payés = jours d’arrêt − carence (3 ou 7 j), plafond 360 j / 3 ans.
4. **Invalidité** : vérifier catégorie (1 ou 2) et appliquer ~30 % ou ~50 % du revenu moyen (plafonné).
5. **Décès** : capital 20 % ou 8 % PASS selon statut ; bonus enfant (demande sous 1 mois) ; réversion conjoint 54 % retraite base (conditions d’âge).
6. **Maternité / paternité** : si éligible, IJ sur même base + allocation forfaitaire maternité le cas échéant.

**Chiffres à jour (PASS, seuils)** : `lib/assistant/regulatory-figures.ts` ; site [secu-independants.fr](https://www.secu-independants.fr/).

---

## 7. Synthèse pour l’argumentaire

- **Carence IJ** : 3 à 7 jours sans indemnisation.
- **Plafond IJ** : ~66 €/jour max → insuffisant pour les revenus élevés et pour les charges fixes.
- **Invalidité** : 30 % / 50 % du revenu, plafonnés → gap important.
- **Capital décès** : forfait faible ; **pas de rente éducation** → à dimensionner en complémentaire.

Retour au [sommaire](bob-expert.md).
