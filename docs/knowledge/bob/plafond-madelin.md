# Plafond Madelin — Calcul et déductibilité (TNS)

Fiche de connaissance pour le **calcul du plafond de déductibilité fiscale** Loi Madelin (santé et prévoyance des TNS). Les **chiffres à jour** (PASS, 8 PASS, plafond en €) sont injectés dynamiquement via `lib/assistant/regulatory-figures.ts` — Bob doit les utiliser pour tout calcul et les citer.

---

## 1. Formule du plafond Madelin (prévoyance + santé)

**Formule annuelle :**

- **Plafond de déductibilité** = minimum entre :
  - **3,75 % du revenu professionnel imposable** + **7 % du PASS** (Plafond Annuel de la Sécurité Sociale),
  - et **3 % de 8 PASS** (plafond maximum absolu).

En pratique : on calcule (3,75 % × revenu + 7 % × PASS) ; si le résultat dépasse 3 % × 8 PASS, on retient 3 % × 8 PASS.

**Variables (source unique : `regulatory-figures.ts`) :**

| Variable | Rôle |
|----------|------|
| **PASS** | Plafond Annuel de la Sécurité Sociale (revalorisation chaque 1er janvier). |
| **8 PASS** | Base du plafond maximum (3 % de 8 PASS = plafond Madelin prévoyance/santé). |
| **3,75 %** | Pourcentage appliqué au revenu professionnel. |
| **7 %** | Pourcentage appliqué au PASS (terme fixe). |
| **3 %** | Pourcentage appliqué à 8 PASS (plafond maximum). |

---

## 2. Exemple de calcul (ordre de grandeur)

*Les montants ci‑dessous sont des exemples ; les valeurs exactes doivent être lues dans le bloc réglementaire injecté (PASS de l’année en cours).*

**Données type (PASS 2026 = 48 060 €, 8 PASS = 384 480 €) :**

- Revenu professionnel imposable du TNS : **60 000 €**.

**Étape 1 — Calcul du plafond « formule » :**

- 3,75 % × 60 000 = **2 250 €**
- 7 % × 48 060 = **3 364,20 €**
- Total formule = 2 250 + 3 364,20 = **5 614,20 €**

**Étape 2 — Plafond maximum (3 % de 8 PASS) :**

- 3 % × 384 480 = **11 534,40 €**

**Étape 3 — Plafond retenu :**

- Min(5 614,20 ; 11 534,40) = **5 614,20 €** → le TNS peut déduire **jusqu’à 5 614,20 €** de cotisations santé + prévoyance (sous réserve des autres règles Madelin).

**Cas où le revenu est élevé :** pour un revenu de 200 000 €, 3,75 % × 200 000 + 7 % × PASS dépasse 3 % × 8 PASS → le plafond retenu est **3 % de 8 PASS** (ex. 11 534 € pour PASS 2026).

---

## 3. Garantie chômage (optionnelle)

La Loi Madelin prévoit aussi un plafond pour la **garantie chômage** (TNS) : ordre de grandeur 1,875 % du revenu ou 2,5 % du PASS selon le dispositif. Vérifier chaque année sur URSSAF / fiches officielles ; ne pas confondre avec le plafond santé/prévoyance ci‑dessus.

---

## 4. Points à rappeler au conseiller

- **Fiscalité à la sortie** : si les cotisations sont **déduites** (Madelin), les **prestations** (IJ, rentes) sont en principe **imposables**. Toujours le préciser au client (fiche fiscalite-entree-sortie-prevoyance).
- **Mise à jour** : le PASS est revalorisé chaque 1er janvier. Les chiffres utilisés par Bob viennent de `regulatory-figures.ts` ; en fin de réponse, citer la source (ex. « Chiffres réglementaires [année] — regulatory-figures.ts » ou « Bloc Chiffres réglementaires injecté »).

---

## 5. Source

- **Chiffres à jour** : `lib/assistant/regulatory-figures.ts` (PASS_ANNUEL, PASS_YEAR, HUIT_PASS, MADELIN_*).
- **Référence** : Loi Madelin, URSSAF — plafonds Sécurité sociale.
- **Fiche connexe** : prevoyance-tns-regles-ij.md (§ 3), fiscalite-entree-sortie-prevoyance.md.
