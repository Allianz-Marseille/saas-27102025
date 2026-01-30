/**
 * Chiffres réglementaires (PASS, Madelin) pour Bob — source unique, chargés dynamiquement.
 * Mise à jour annuelle : modifier PASS_ANNUEL et PASS_YEAR (et SOURCES si les URLs changent).
 * Référence : CE_QUI_RESTE_A_FAIRE.md § 2.6
 */

/** PASS (Plafond Annuel de la Sécurité Sociale) — valeur annuelle en euros */
export const PASS_ANNUEL = 48_060;

/** Année du PASS (revalorisation chaque 1er janvier) */
export const PASS_YEAR = 2026;

/** 8 PASS (plafond Madelin prévoyance : max 3 % de 8 PASS) */
export const HUIT_PASS = PASS_ANNUEL * 8;

/** Formule Madelin prévoyance : 3,75 % du revenu + 7 % du PASS, plafonnée à 3 % de 8 PASS */
export const MADELIN_PREVOYANCE_POURCENT_REVENU = 3.75;
export const MADELIN_PREVOYANCE_POURCENT_PASS = 7;
export const MADELIN_PREVOYANCE_MAX_POURCENT_HUIT_PASS = 3;

/** Sources officielles — à vérifier chaque année */
export const REGULATORY_SOURCES = {
  urssafPlafonds:
    "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/plafonds-securite-sociale.html",
  servicePublic:
    "https://www.service-public.fr/particuliers/actualites/A15386",
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
| **8 PASS** (pour plafond Madelin) | ${HUIT_PASS.toLocaleString("fr-FR")} € | Dérivé du PASS |

### Plafond Madelin Prévoyance (TNS)
- **Formule :** ${MADELIN_PREVOYANCE_POURCENT_REVENU} % du revenu imposable + ${MADELIN_PREVOYANCE_POURCENT_PASS} % du PASS.
- **Plafond maximum :** ${MADELIN_PREVOYANCE_MAX_POURCENT_HUIT_PASS} % de 8 PASS = **${Math.round(maxMadelin).toLocaleString("fr-FR")} €** (${PASS_YEAR}).

### Sources officielles (à citer)
- **URSSAF — Plafonds :** ${REGULATORY_SOURCES.urssafPlafonds}
- **Service-public — PASS ${PASS_YEAR} :** ${REGULATORY_SOURCES.servicePublic}

*Mise à jour : modifier \`lib/assistant/regulatory-figures.ts\` (PASS_ANNUEL, PASS_YEAR) une fois par an.*
`.trim();
}
