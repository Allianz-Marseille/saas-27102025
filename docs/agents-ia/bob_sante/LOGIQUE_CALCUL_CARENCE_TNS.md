# Logique de calcul « Carence » — Bilan de Protection Sociale TNS

Spec pour implémenter le **moteur de calcul du reste à charge** (gap) et la **chronologie des indemnités** par segment de temps. Le bot ne doit pas seulement « coder un formulaire », il doit **modéliser la carence**.

**Référence :** parcours bilan TNS (étape 7 Droits existants, étape 8 Proposition chiffrée). Chiffres réglementaires : `lib/assistant/regulatory-figures.ts`.

---

## 1. Rôle

Tu es un actuaire expert en protection sociale française. L’objectif est d’implémenter l’algorithme de calcul du **Reste à Charge** pour un Travailleur Non Salarié (TNS), en suivant une **chronologie stricte** (segments 1, 2, 3).

---

## 2. Entrées utilisateur

- **Revenu Annuel Moyen (RAM)** des 3 dernières années (ou déclaré).
- **Charges fixes professionnelles mensuelles** (loyer pro, leasing, URSSAF, assurances, etc.).
- **Caisse (RO)** : code ou sélection (SSI, CARMF, CARPIMKO, CARCDSF, CAVP, CARPV, CAVEC, CIPAV, CNBF).

---

## 3. Chronologie stricte (segments)

L’algorithme doit suivre cette chronologie :

| Segment | Période | Règle | Remarque |
|--------|---------|--------|----------|
| **Segment 1** | Jours 1 à 3 | **Carence totale** | SSI & Libéraux : 0 €. Perte = Revenu journalier + Charges fixes journalières. |
| **Segment 2** | Jours 4 à 90 | **Part CPAM / SSI** | IJ = (RAM / 730), plafonné selon caisse (voir tableau). Pour les libéraux, la CPAM ne couvre **jamais** les charges pro. |
| **Segment 3** | Jours 91 à 1095 (3 ans) | **Part Caisse (RO)** | IJ caisse selon tableau (forfait, classe, ou 0 € « trou noir »). |

---

## 4. Table de référence des Régimes Obligatoires (RO) 2026

| Caisse (RO) | Population | IJ CPAM (J4 à J90) | IJ Caisse (J91 à J1095) | Invalidité Totale (Rente/An) |
|-------------|------------|---------------------|--------------------------|-----------------------------|
| **SSI** | Artisans / Commerçants | 1/730e RAM (Max 65 €) | Maintien IJ CPAM | 50 % du RAM (plafonné) |
| **CARMF** | Médecins | 1/730e RAM (Max 197 €) | Classe A: 72 € / B: 111 € / C: 150 € | A: 16 k€ / B: 27 k€ / C: 33 k€ |
| **CARPIMKO** | Paramédicaux | 1/730e RAM (Max 197 €) | **Forfait : 55,44 €** | ~ 20 160 € |
| **CARCDSF** | Dentistes / Sages-F. | 1/730e RAM (Max 197 €) | **Forfait : 108,18 €** | ~ 27 236 € |
| **CAVP** | Pharmaciens | 1/730e RAM (Max 197 €) | **0 € (Trou noir)** | ~ 16 872 € |
| **CARPV** | Vétérinaires | 1/730e RAM (Max 197 €) | **0 € (Trou noir)** | Selon classe (12 k€ à 38 k€) |
| **CAVEC** | Experts-Comptables | 1/730e RAM (Max 197 €) | **Forfait : 130,00 €** | Selon classe (12 k€ à 49 k€) |
| **CIPAV** | Architectes / Conseils | 1/730e RAM (Max 197 €) | **0 € (Trou noir)** | Proportionnelle (points) |
| **CNBF** | Avocats | **0 €** (voir Barreau) | **Forfait : 90,00 €** | ~ 9 500 € (minimum) |

**Note PASS :** La table ci-dessus suppose un plafond type 2026. La source unique dans le code est `lib/assistant/regulatory-figures.ts` (PASS_ANNUEL, PASS_YEAR). Harmoniser selon la revalorisation officielle (URSSAF).

---

## 5. Data model — RegimeConstants (implémentation Cursor)

Implémenter un objet `RegimeConstants` (ou équivalent) pour l’année fiscale 2026 :

```ts
// Référence : PASS — aligner avec lib/assistant/regulatory-figures.ts
const PASS_2026 = 47_100; // ou 48_060 selon source officielle retenue

// IJ max CPAM : libéraux (1/730e plafonné à 3 PASS / 730) vs artisans (1/730e PASS)
const CPAM_MAX_IJ_LIBERAUX = (PASS_2026 * 3) / 730;   // ~193,56 €
const CPAM_MAX_IJ_SSI = PASS_2026 / 730;              // ~64,52 €

// CAISSE_DATA_MAP (exemple de structure)
const CAISSE_DATA_MAP = {
  SSI:       { waitingPeriodDays: 3, ijCaisseFromDay91: "MAINTIEN_CPAM", maxIjCpam: CPAM_MAX_IJ_SSI },
  CARPIMKO:  { waitingPeriodDays: 90, ijCaisse: 55.44, invalidityFlat: 20_160 },
  CARMF:     { waitingPeriodDays: 90, classes: { A: { max: 46_368, ij: 72.21 }, B: { max: 139_104, ij: 111.09 }, C: { max: 999_999, ij: 149.97 } } },
  CARCDSF:   { waitingPeriodDays: 90, ijCaisse: 108.18, invalidityFlat: 27_236 },
  CAVP:      { waitingPeriodDays: 90, ijCaisse: 0, gapAlert: "Trou noir total après 3 mois" },
  CARPV:     { waitingPeriodDays: 90, ijCaisse: 0, gapAlert: "Trou noir total après 3 mois" },
  CAVEC:     { waitingPeriodDays: 90, ijCaisse: 130.00, capitalDecesMax: 290_850 },
  CIPAV:     { waitingPeriodDays: 90, ijCaisse: 0, gapAlert: "Trou noir total après 3 mois" },
  CNBF:      { waitingPeriodDays: 0, ijCaisse: 90.00, note: "Carence J1-15 gérée par le Barreau, pas par la CNBF" },
};
```

---

## 6. Logique du Gap Report (sortie bot)

Pour chaque calcul, générer un **Gap Report** par segment :

- **Segment 1 (J1–J3) :**  
  `Delta_journalier = (Revenu_journalier + Charges_fixes_journalières)` (aucune IJ).

- **Segment 2 (J4–J90) :**  
  `Delta_journalier = (Revenu_journalier + Charges_fixes_journalières) - IJ_CPAM`  
  (IJ_CPAM = min(RAM/730, plafond caisse)).

- **Segment 3 (J91+) :**  
  `Delta_journalier = (Revenu_journalier + Charges_fixes_journalières) - IJ_Caisse`  
  (IJ_Caisse = forfait ou classe selon CAISSE_DATA_MAP).

**Indicateur « Survival Duration » :**  
« Sans assurance, votre épargne sera épuisée en **X jours** compte tenu de vos charges fixes. »

---

## 7. Résultat chiffré attendu (structure Diagnostic)

Le bot doit produire un objet **Diagnostic** (ou JSON) avec au minimum :

| Champ | Formule / sens |
|-------|-----------------|
| **BESOIN_MENSUEL** | (RAM / 12) + Charges_fixes_mensuelles |
| **COUVERTURE_EXISTANTE** | Somme des IJ (CPAM + caisse) sur un mois type selon segment |
| **GAP_MENSUEL** | BESOIN_MENSUEL - COUVERTURE_EXISTANTE |

Optionnel : détail par segment (GAP segment 1, 2, 3) et **Survival Duration** (jours).

---

## 8. Règle d’alerte et conseil

- Si **GAP_MENSUEL > 30 % du revenu mensuel** : afficher une alerte **« Risque de cessation de paiement immédiate »** et chiffrer l’**économie d’impôt** via la Loi Madelin (base ~30 % de la prime estimée).
- Référence Madelin : `lib/assistant/regulatory-figures.ts` (plafond 3 % de 8 PASS).

---

## 9. UI / UX attendues

- **Tableau comparatif :**
  - Colonne 1 : **« Vos Besoins de survie »** (Revenu + Charges fixes).
  - Colonne 2 : **« Ce que vous donne votre RO »**.
  - Colonne 3 : **« Le Manque à combler »** (en rouge si déficit).

- **Graphique (recommandation) :** barres empilées
  - **Barre A :** Besoins (Revenus + Charges fixes).
  - **Barre B :** Ce que donne le régime (souvent une faible part de A).
  - **Zone rouge :** Le « danger » à assurer (gap).

---

## 10. Cas de test de validation (Kiné CARPIMKO)

| Donnée | Valeur |
|--------|--------|
| Profil | Kiné (CARPIMKO) |
| Revenu | 45 000 € / an |
| Charges pro | 2 000 € / mois |

**Résultat attendu :** Le bot doit trouver un **déficit d’environ 3 900 € par mois** entre le 4ᵉ et le 90ᵉ jour (segment 2 : besoin = 3 750 + 2 000 = 5 750 €/mois ; IJ CPAM = min(45 000/730, 197) ≈ 61,64 €/j → couverture ≈ 1 849 €/mois → GAP ≈ **3 901 €/mois**). Pour viser un déficit strictement > 4 000 €/mois, prendre par ex. charges 2 200 €/mois (besoin 5 950 €, GAP ≈ 4 101 €).

---

## 11. Exemple de JSON de sortie — Expert-Comptable (CAVEC)

Profil simulé : RAM 60 000 €/an, charges fixes 2 500 €/mois, caisse CAVEC.

**Calculs de référence :**
- Revenu mensuel = 60 000 / 12 = 5 000 €. Besoin mensuel = 5 000 + 2 500 = **7 500 €**.
- IJ CPAM (J4–J90) = min(60 000 / 730, 197) ≈ **82,19 €/j**. IJ CAVEC (J91+) = **130 €/j** (forfait).
- Segment 1 : delta/j = (5 000/30 + 2 500/30) ≈ 250 €/j, 0 € de couverture.
- Segment 2 : couverture 82,19 €/j → gap/j ≈ 250 − 82,19 ≈ 167,81 €/j.
- Segment 3 : couverture 130 €/j → gap/j ≈ 250 − 130 = 120 €/j.

Exemple de structure **Diagnostic** attendue (à générer par le moteur) :

```json
{
  "profil": {
    "caisse": "CAVEC",
    "libelleCaisse": "Experts-Comptables",
    "ram": 60000,
    "chargesFixesMensuelles": 2500,
    "revenuMensuel": 5000
  },
  "besoinMensuel": 7500,
  "couvertureExistante": {
    "segment1_J1_J3": { "ijJournaliere": 0, "description": "Carence totale" },
    "segment2_J4_J90": { "ijJournaliere": 82.19, "ijMensuelleTypique": 2465.7, "source": "CPAM (1/730e RAM plafonné)" },
    "segment3_J91_plus": { "ijJournaliere": 130, "ijMensuelleTypique": 3900, "source": "CAVEC forfait" }
  },
  "gapMensuel": {
    "segment2": 5034.3,
    "segment3": 3600
  },
  "gapMensuelRepresentatif": 5034.3,
  "alerte": {
    "actif": true,
    "message": "Risque de cessation de paiement immédiate",
    "motif": "GAP_MENSUEL (5034 €) > 30 % du revenu mensuel (1500 €)"
  },
  "survivalDuration": {
    "segment2_joursAvantEpuisement": "X jours (selon épargne disponible)",
    "message": "Sans assurance, votre épargne sera épuisée en X jours compte tenu de vos charges fixes."
  },
  "conseilMadelin": "Économie d'impôt estimée (base 30 % de la prime) à rappeler pour préconisation."
}
```

**Vérification rapide :** BESOIN_MENSUEL 7 500 − COUVERTURE segment 2 (2 465,7) ≈ **5 034 €** = GAP_MENSUEL représentatif (segment 2 = période la plus critique avant J91). En segment 3, couverture 130 €/j × 30 = 3 900 €/mois → GAP 7 500 − 3 900 = **3 600 €/mois**.

---

## 12. Fichiers à aligner

- **Chiffres globaux :** `lib/assistant/regulatory-figures.ts` (PASS_ANNUEL, PASS_YEAR).
- **Fiches détaillées par caisse :** `docs/knowledge/bob/ro/*.md` (ssi, carmf, carpimko, etc.) — à garder alignées avec cette table pour les forfaits et classes.
- **Parcours :** `docs/knowledge/bob/parcours-bilan-tns.md` (étape 7 = droits existants + gap, étape 8 = préconisation chiffrée).

---

*Document créé pour Cursor : implémentation du moteur de calcul carence, intégration des données RO 2026, et exemple de sortie Diagnostic (CAVEC).*
