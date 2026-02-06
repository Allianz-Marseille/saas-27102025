/**
 * Chiffres réglementaires (PASS, PMSS, Madelin, régime général) pour Bob — source unique, chargés dynamiquement.
 * Bob doit utiliser EXCLUSIVEMENT les constantes de ce fichier pour les calculs de tranches de cotisations,
 * plafonds d'indemnités journalières (IJ) et formules Madelin. Mise à jour annuelle : PASS_ANNUEL, PASS_YEAR, SMIC, capital décès.
 * Référence : docs/knowledge/bob/00-SOURCE-DE-VERITE.md (chiffres réglementaires)
 */

/** PASS (Plafond Annuel de la Sécurité Sociale) — valeur annuelle en euros */
export const PASS_ANNUEL = 48_060;

/** PMSS (Plafond Mensuel de la Sécurité Sociale) — PASS / 12, pour calculs mensuels */
export const PMSS = Math.round(PASS_ANNUEL / 12);

/** Année du PASS (revalorisation chaque 1er janvier) */
export const PASS_YEAR = 2026;

/** 8 PASS (plafond Madelin prévoyance : max 3 % de 8 PASS) */
export const HUIT_PASS = PASS_ANNUEL * 8;

/** Formule Madelin prévoyance : 3,75 % du revenu + 7 % du PASS, plafonnée à 3 % de 8 PASS */
export const MADELIN_PREVOYANCE_POURCENT_REVENU = 3.75;
export const MADELIN_PREVOYANCE_POURCENT_PASS = 7;
export const MADELIN_PREVOYANCE_MAX_POURCENT_HUIT_PASS = 3;

/** SMIC mensuel brut (métropole, temps plein) — revalorisation chaque 1er janvier */
export const SMIC_MENSUEL_BRUT = 1_823.03;

/** Coefficient plafond assiette IJSS maladie (depuis 01/04/2025) : assiette plafonnée à ce coefficient × SMIC par mois */
export const IJSS_PLAFOND_COEFF_SMIC = 1.4;

/** Plafond mensuel de l'assiette pour le calcul des IJSS maladie (1,4 × SMIC) */
export const IJSS_PLAFOND_MENSUEL_ASSIETTE = Math.round(IJSS_PLAFOND_COEFF_SMIC * SMIC_MENSUEL_BRUT * 100) / 100;

/** Nombre de jours de référence annuel pour le calcul du salaire journalier de base (IJSS) */
export const IJSS_JOURS_REF_ANNUELS = 91.25;

/** IJSS maladie maximale (€/jour) = 50 % du SJB plafonné ; SJB max = (3 × plafond mensuel) / 91,25 */
export const IJSS_MALADIE_MAX_JOUR = Math.round((50 / 100) * (3 * IJSS_PLAFOND_MENSUEL_ASSIETTE) / IJSS_JOURS_REF_ANNUELS * 100) / 100;

/** Capital décès CPAM (salarié secteur privé) — forfait revalorisé par décret (souvent au 1er avril) */
export const CAPITAL_DECES_CPAM_SALARIE = 3_977;

/** Sources officielles — à vérifier chaque année */
export const REGULATORY_SOURCES = {
  urssafPlafonds:
    "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/plafonds-securite-sociale.html",
  servicePublic:
    "https://www.service-public.fr/particuliers/actualites/A15386",
  smic: "https://travail-emploi.gouv.fr/revalorisation-annuelle-du-smic-au-1er-janvier-2026",
  capitalDeces:
    "https://www.service-public.fr/particuliers/vosdroits/F3005",
} as const;

/**
 * Retourne un bloc de texte formaté pour injection dans la base de connaissances Bob.
 * Utilisé par loadBobKnowledge ou par la route chat pour que Bob cite les chiffres à jour.
 */
export function getRegulatoryFiguresBlock(): string {
  const maxMadelin = (HUIT_PASS * MADELIN_PREVOYANCE_MAX_POURCENT_HUIT_PASS) / 100;
  return `
## Chiffres réglementaires (${PASS_YEAR}) — chargés dynamiquement

| Indicateur | Valeur | Source |
|:---|:---|:---|
| **PASS ${PASS_YEAR}** (Plafond Annuel de la Sécurité Sociale) | ${PASS_ANNUEL.toLocaleString("fr-FR")} € (annuel) | URSSAF / Service-public |
| **PMSS** (Plafond Mensuel = PASS/12) | ${PMSS.toLocaleString("fr-FR")} € | Dérivé du PASS |
| **8 PASS** (pour plafond Madelin) | ${HUIT_PASS.toLocaleString("fr-FR")} € | Dérivé du PASS |

### Plafond Madelin Prévoyance (TNS)
- **Formule :** ${MADELIN_PREVOYANCE_POURCENT_REVENU} % du revenu imposable + ${MADELIN_PREVOYANCE_POURCENT_PASS} % du PASS.
- **Plafond maximum :** ${MADELIN_PREVOYANCE_MAX_POURCENT_HUIT_PASS} % de 8 PASS = **${Math.round(maxMadelin).toLocaleString("fr-FR")} €** (${PASS_YEAR}).

### Régime général (salariés)
| Indicateur | Valeur | Source |
|:---|:---|:---|
| **SMIC mensuel brut** | ${SMIC_MENSUEL_BRUT.toLocaleString("fr-FR")} € | Revalorisation 1er janvier |
| **Plafond assiette IJSS maladie** (${IJSS_PLAFOND_COEFF_SMIC} × SMIC/mois) | ${IJSS_PLAFOND_MENSUEL_ASSIETTE.toLocaleString("fr-FR")} € | Par mois (3 derniers mois plafonnés) |
| **IJSS maladie max (€/jour)** | ${IJSS_MALADIE_MAX_JOUR.toLocaleString("fr-FR")} € | 50 % du SJB plafonné (SJB = 3 mois plafonnés / 91,25) |
| **Capital décès CPAM (salarié)** | ${CAPITAL_DECES_CPAM_SALARIE.toLocaleString("fr-FR")} € | Forfait revalorisé par décret |

### Sources officielles (à citer)
- **URSSAF — Plafonds :** ${REGULATORY_SOURCES.urssafPlafonds}
- **Service-public — PASS ${PASS_YEAR} :** ${REGULATORY_SOURCES.servicePublic}
- **SMIC :** ${REGULATORY_SOURCES.smic}
- **Capital décès :** ${REGULATORY_SOURCES.capitalDeces}

*Mise à jour : modifier \`lib/assistant/regulatory-figures.ts\` (PASS_ANNUEL, PASS_YEAR, SMIC_MENSUEL_BRUT, CAPITAL_DECES_CPAM_SALARIE) une fois par an.*
`.trim();
}
