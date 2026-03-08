/**
 * Types pour le module de calcul déterministe Prévoyance.
 * Deux moteurs distincts : SSI (artisans/commerçants/gérants) et Libéraux (CPAM J4-J90).
 * NE PAS FUSIONNER les deux moteurs — règles, plafonds et durées diffèrent.
 */

export type RegimePrevoyance = "SSI" | "LIBERAL";

/**
 * Caisses professionnelles libérales pour le relais post-J91.
 * Chaque caisse a ses propres barèmes IJ.
 */
export type CaissePro =
  | "CARPIMKO"  // Auxiliaires médicaux (kinés, infirmiers…)
  | "CARMF"     // Médecins libéraux — 3 classes selon revenu
  | "CIPAV"     // Architectes, ingénieurs, consultants — AUCUNE IJ après J90
  | "CAVEC"     // Experts-comptables — AUCUNE IJ standard
  | "CARCDSF"   // Chirurgiens-dentistes et sages-femmes
  | "CAVP"      // Pharmaciens
  | "IRCEC"     // Artistes auteurs
  | "AUTRE";

/** Entrée pour le moteur SSI */
export interface PrevoyanceInputSSI {
  regime: "SSI";
  /** Revenu Annuel Moyen (moyenne N-1, N-2, N-3) en euros */
  ram: number;
  /** Besoin de maintien de revenu mensuel net cible */
  besoinMaintienRevenu: number;
  /** Charges fixes mensuelles de l'entreprise (frais pros) */
  besoinFraisPro?: number;
  nbEnfants?: number;
  conjointCharge?: boolean;
}

/** Entrée pour le moteur Libéraux */
export interface PrevoyanceInputLiberal {
  regime: "LIBERAL";
  /** Revenu Annuel Moyen (moyenne N-1, N-2, N-3) en euros */
  ram: number;
  /** Besoin de maintien de revenu mensuel net cible */
  besoinMaintienRevenu: number;
  /** Charges fixes mensuelles du cabinet */
  besoinFraisPro?: number;
  /** Caisse professionnelle de retraite/prévoyance (pour le relais J91+) */
  caissePro?: CaissePro;
  nbEnfants?: number;
  conjointCharge?: boolean;
}

export type PrevoyanceInput = PrevoyanceInputSSI | PrevoyanceInputLiberal;

/** Résultat du moteur SSI */
export interface ResultatSSI {
  regime: "SSI";
  pass_2026: number;
  ram: number;
  ram_plafonne: number;
  eligible: boolean;
  ij_brute_jour: number;
  ij_nette_jour: number;
  ij_nette_mois: number;
  gap_maintien_revenu_mois: number;
  gap_frais_pro_mois: number;
  rente_invalidite_cat1_an: number;  // Catégorie 1 partielle (30% RAM)
  rente_invalidite_cat2_an: number;  // Catégorie 2 totale (50% RAM)
  gap_invalidite_cat1_an: number;
  gap_invalidite_cat2_an: number;
  capital_deces: number;
  couverture_duree_max_jours: number; // 1095 (3 ans)
  alertes: string[];
}

/** Résultat du moteur Libéraux */
export interface ResultatLiberal {
  regime: "LIBERAL";
  pass_2026: number;
  ram: number;
  ram_plafonne: number;
  caisse_pro: CaissePro | "INCONNUE";
  // CPAM J4-J90
  ij_cpam_jour: number;
  ij_cpam_mois_j4_j90: number;
  gap_j4_j90_mois: number;
  // Relais J91+
  rupture_j91: true;
  caisse_ij_jour_j91: number;         // 0 si pas de relais (CIPAV, CAVEC…)
  caisse_duree_max_j: number;         // jusqu'où va le relais
  caisse_label: string;               // description lisible
  ij_totale_mois_j91: number;         // caisse seule (sans CPAM)
  gap_j91_plus_mois: number;
  alerte_rupture_j91: string;
  alertes: string[];
}

export type ResultatPrevoyance = ResultatSSI | ResultatLiberal;
