# SSI — Sécurité sociale des indépendants (expertise Bob)

**Public concerné :** Artisans, Commerçants, Industriels (ACI). Gérants majoritaires SARL, auto-entrepreneurs ACI. Recouvrement : URSSAF. Site : [secu-independants.fr](https://www.secu-independants.fr/).

La **SSI n’est plus un organisme séparé** mais une **organisation spécifique au sein du régime général** pour les TNS. **Cotisations** : calculées sur le revenu net professionnel (bénéfice ou rémunération de gérance). **Vigilance** : toujours vérifier si les **cotisations sont à jour**, car les droits aux prestations en dépendent directement.

Bob doit maîtriser les garanties SSI pour l’étape « Droits existants » du bilan TNS et le calcul du gap. Contenu détaillé injecté dans Bob : `docs/knowledge/bob/ro/ssi.md`.

---

## 1. Indemnités journalières (arrêt maladie / accident hors AT)

| Élément | Règle |
|--------|--------|
| **Conditions** | Affiliation SSI depuis au moins **1 an** ; revenu d’activité minimum. |
| **Formule** | **1/730e** du revenu annuel moyen (3 dernières années), plafonné au PASS. |
| **IJ max (PASS/730)** | 48 060 / 730 ≈ **65,84 €/jour** (PASS 2026). |
| **Carence** | **3 jours** ; **7 jours** si maladie sans hospitalisation. |
| **Durée** | **360 jours** sur **3 ans**. |
| **Seuil minimal** | En dessous d’un RAAM ~4 500 €, IJ peuvent être nulles. |

**À retenir pour l’audit :** Le RO ne verse rien les 3 (ou 7) premiers jours ; l’IJ est plafonnée ; les **charges fixes** (loyer, cotisations, leasing) ne sont jamais prises en charge → argument pour une complémentaire (Madelin) et option **Frais Fixes**.

---

## 2. Invalidité

| Élément | Règle |
|--------|--------|
| **Conditions** | Affiliation depuis au moins **12 mois** ; taux d’incapacité reconnu (maladie ou accident non professionnel). |
| **Catégorie 1 (partielle)** | ~**30 %** du revenu annuel moyen, plafonné. |
| **Catégorie 2 (totale)** | ~**50 %** du revenu annuel moyen, plafonné. |

Prévoyance complémentaire (rente invalidité) indispensable pour maintenir le niveau de vie.

---

## 3. Décès

| Prestation | Ordre de grandeur (PASS 2026 = 48 060 €) |
|------------|------------------------------------------|
| **Capital décès (cotisant)** | ~**20 % du PASS** ≈ 9 612 €. |
| **Capital décès (retraité)** | ~**8 % du PASS** ≈ 3 845 €. |
| **Bonus enfant à charge** | Complément par enfant (< 16 ans ou études). |
| **Pension de réversion (conjoint)** | **54 %** de la pension de retraite de base du défunt (conditions d’âge, ex. 55 ans). |
| **Rente éducation** | **Non versée par la SSI** → à prévoir en complémentaire (Madelin). |

---

## 4. Synthèse pour l’argumentaire

- **Carence IJ** : 3 à 7 jours sans indemnisation.
- **Plafond IJ** : ~66 €/jour max → insuffisant pour les revenus élevés et pour les charges fixes.
- **Invalidité** : 30 % / 50 % du revenu, plafonnés → gap important.
- **Capital décès** : forfait faible ; pas de rente éducation → capital décès et rente éducation à dimensionner en complémentaire.

Retour au [sommaire](bob-expert.md).
