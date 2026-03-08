/**
 * Constantes réglementaires 2026 pour les moteurs de calcul Prévoyance.
 * Source : référentiel social 2026 (PASS, SSI, CPAM libéraux).
 *
 * À mettre à jour chaque année lors de la revalorisation du PASS.
 */

// ─── PASS 2026 ──────────────────────────────────────────────────────────────
export const PASS_2026 = 48_060;       // €/an
export const PASS_MENSUEL_2026 = 4_005; // €/mois (arrondi officiel)

// ─── RÉGIME SSI ─────────────────────────────────────────────────────────────
/** Plafond d'assiette SSI : 1 PASS */
export const SSI_RAM_PLAFOND = PASS_2026;

/** Seuil d'exclusion : si RAM < 10 % PASS → IJ = 0 */
export const SSI_RAM_SEUIL_EXCLUSION = PASS_2026 * 0.10; // 4 806 €

/** Base de calcul de l'IJ (jours / an) */
export const SSI_IJ_BASE_JOURS = 730;

/** Prélèvements CSG/CRDS sur les IJ SSI */
export const SSI_PRELEVEMENTS_CSG_CRDS = 0.067; // 6,7 %

/** IJ brute maximale (RAM = 1 PASS) */
export const SSI_IJ_MAX_BRUTE = 65.84;  // €/j

/** IJ nette maximale (après CSG/CRDS) */
export const SSI_IJ_MAX_NETTE = 61.43;  // €/j

/** Délai de carence SSI : 3 jours (versement à partir du J4) */
export const SSI_CARENCE_JOURS = 3;

/** Durée maximale de couverture IJ SSI */
export const SSI_DUREE_MAX_JOURS = 1_095; // 3 ans

// SSI — Invalidité
export const SSI_INVALIDITE_CAT1_TAUX   = 0.30; // 30 % du RAM (invalidité partielle)
export const SSI_INVALIDITE_CAT2_TAUX   = 0.50; // 50 % du RAM (invalidité totale)
export const SSI_INVALIDITE_CAT1_MAX_AN = 14_418; // € (30 % de 48 060)
export const SSI_INVALIDITE_CAT2_MAX_AN = 24_030; // € (50 % de 48 060)

// SSI — Décès
export const SSI_DECES_CAPITAL_BASE       = PASS_2026 * 0.20; // 9 612 € (20 % PASS)
export const SSI_DECES_MAJORATION_ENFANT  = PASS_2026 * 0.05; // 2 403 € / enfant (5 % PASS)

// ─── RÉGIME LIBÉRAUX (CPAM J4-J90) ─────────────────────────────────────────
/** Plafond d'assiette libéraux : 3 PASS */
export const LIBERAL_RAM_PLAFOND = PASS_2026 * 3; // 144 180 €

/** IJ CPAM maximale (RAM = 3 PASS) */
export const LIBERAL_IJ_MAX_JOUR = 197.50; // €/j

/** Délai de carence CPAM libéraux : 3 jours */
export const LIBERAL_CARENCE_JOURS = 3;

/** Début de couverture CPAM : J4 */
export const LIBERAL_CPAM_DEBUT_J = 4;

/** Fin de couverture CPAM : J90 */
export const LIBERAL_CPAM_FIN_J = 90;

/** J91 : rupture totale de la CPAM pour les libéraux */
export const LIBERAL_RUPTURE_J = 91;

// ─── CAISSES PROFESSIONNELLES — RELAIS J91+ ─────────────────────────────────

export interface CaisseProData {
  /** IJ quotidienne de base versée par la caisse (J91+), en €/j */
  ij_jour: number;
  /** Jusqu'à quel jour la caisse couvre (ex: 365 pour CARPIMKO, 90 = pas de relais) */
  duree_max_j: number;
  /** Description lisible pour injection dans le contexte IA */
  label: string;
}

export const CAISSES_PRO_DATA: Record<string, CaisseProData> = {
  CARPIMKO: {
    ij_jour: 57.10,
    duree_max_j: 365,
    label: "CARPIMKO : 57,10 €/j de J91 à J365 (+ majorations familiales possibles)",
  },
  // CARMF : 3 classes selon le revenu N-2 ; on utilise la classe correspondant au RAM
  // Classe A < 1 PASS, Classe B 1-3 PASS, Classe C > 3 PASS
  CARMF_A: {
    ij_jour: 72,
    duree_max_j: 1_095,
    label: "CARMF classe A (RAM < 48 060 €) : ~72 €/j de J91 à 36 mois",
  },
  CARMF_B: {
    ij_jour: 110,
    duree_max_j: 1_095,
    label: "CARMF classe B (RAM 48 060–144 180 €) : ~110 €/j de J91 à 36 mois",
  },
  CARMF_C: {
    ij_jour: 145,
    duree_max_j: 1_095,
    label: "CARMF classe C (RAM > 144 180 €) : ~145 €/j de J91 à 36 mois",
  },
  CIPAV: {
    ij_jour: 0,
    duree_max_j: 90,
    label: "CIPAV : AUCUNE IJ après le J90 — rupture totale de revenus",
  },
  CAVEC: {
    ij_jour: 0,
    duree_max_j: 90,
    label: "CAVEC : pas d'IJ standard après J90",
  },
  CARCDSF: {
    ij_jour: 0,
    duree_max_j: 90,
    label: "CARCDSF : couverture à vérifier selon convention individuelle",
  },
  CAVP: {
    ij_jour: 0,
    duree_max_j: 90,
    label: "CAVP : pas d'IJ standard après J90",
  },
  IRCEC: {
    ij_jour: 0,
    duree_max_j: 90,
    label: "IRCEC : pas d'IJ après J90",
  },
  AUTRE: {
    ij_jour: 0,
    duree_max_j: 90,
    label: "Caisse inconnue — vérifier les statuts de la caisse professionnelle",
  },
} as const;
