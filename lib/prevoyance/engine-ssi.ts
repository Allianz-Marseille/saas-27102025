/**
 * Moteur de calcul SSI — Artisans, Commerçants, Gérants Majoritaires.
 *
 * NE PAS FUSIONNER avec engine-liberaux.ts : les formules, plafonds et
 * durées de couverture sont fondamentalement différents.
 *
 * Référence : doc 02-regime-ssi-2026.md + PASS 2026 = 48 060 €
 */

import {
  PASS_2026,
  SSI_RAM_PLAFOND,
  SSI_RAM_SEUIL_EXCLUSION,
  SSI_IJ_BASE_JOURS,
  SSI_PRELEVEMENTS_CSG_CRDS,
  SSI_DUREE_MAX_JOURS,
  SSI_INVALIDITE_CAT1_TAUX,
  SSI_INVALIDITE_CAT2_TAUX,
  SSI_INVALIDITE_CAT1_MAX_AN,
  SSI_INVALIDITE_CAT2_MAX_AN,
  SSI_DECES_CAPITAL_BASE,
  SSI_DECES_MAJORATION_ENFANT,
} from "./constants";
import type { PrevoyanceInputSSI, ResultatSSI } from "./types";

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calcule les IJ, rentes d'invalidité, capital décès et gaps pour un profil SSI.
 *
 * @param input - Données du profil (RAM, besoin mensuel, frais pro…)
 * @returns ResultatSSI — toutes les valeurs calculées + alertes métier
 */
export function calculateSSI(input: PrevoyanceInputSSI): ResultatSSI {
  const {
    ram,
    besoinMaintienRevenu,
    besoinFraisPro = 0,
    nbEnfants = 0,
  } = input;

  // ── Éligibilité ─────────────────────────────────────────────────────────
  const eligible = ram >= SSI_RAM_SEUIL_EXCLUSION;

  // ── RAM plafonné ─────────────────────────────────────────────────────────
  const ramPlafonne = Math.min(ram, SSI_RAM_PLAFOND);

  // ── Indemnités Journalières ──────────────────────────────────────────────
  const ijBruteJour = eligible ? r2(ramPlafonne / SSI_IJ_BASE_JOURS) : 0;
  const ijNetteJour = r2(ijBruteJour * (1 - SSI_PRELEVEMENTS_CSG_CRDS));
  const ijNetteMois = r2(ijNetteJour * 30);

  // ── Gaps ITT ─────────────────────────────────────────────────────────────
  const gapMaintienRevenuMois = Math.max(0, r2(besoinMaintienRevenu - ijNetteMois));
  // La SSI ne couvre JAMAIS les frais professionnels
  const gapFraisProMois = besoinFraisPro;

  // ── Invalidité ───────────────────────────────────────────────────────────
  const renteInvaliditeCat1An = Math.min(
    r2(ramPlafonne * SSI_INVALIDITE_CAT1_TAUX),
    SSI_INVALIDITE_CAT1_MAX_AN
  );
  const renteInvaliditeCat2An = Math.min(
    r2(ramPlafonne * SSI_INVALIDITE_CAT2_TAUX),
    SSI_INVALIDITE_CAT2_MAX_AN
  );
  const besoinInvaliditeAn = r2(besoinMaintienRevenu * 12);
  const gapInvaliditeCat1An = Math.max(0, r2(besoinInvaliditeAn - renteInvaliditeCat1An));
  const gapInvaliditeCat2An = Math.max(0, r2(besoinInvaliditeAn - renteInvaliditeCat2An));

  // ── Décès ────────────────────────────────────────────────────────────────
  const capitalDeces = r2(SSI_DECES_CAPITAL_BASE + nbEnfants * SSI_DECES_MAJORATION_ENFANT);

  // ── Alertes métier ───────────────────────────────────────────────────────
  const alertes: string[] = [];

  if (!eligible) {
    alertes.push(
      `RAM ${ram} € < seuil d'exclusion ${SSI_RAM_SEUIL_EXCLUSION} € (10 % PASS) : ` +
      `AUCUNE IJ versée par la SSI — protection nulle en cas d'arrêt de travail.`
    );
  }

  if (ram > SSI_RAM_PLAFOND) {
    alertes.push(
      `RAM ${ram} € > ${SSI_RAM_PLAFOND} € (1 PASS) : au-delà du plafond, ` +
      `augmenter le revenu n'améliore plus la protection SSI (IJ bloquée à ${ijNetteMois} €/mois).`
    );
  }

  if (besoinFraisPro > 0) {
    alertes.push(
      `La SSI ne couvre JAMAIS les frais professionnels : ` +
      `gap frais pros = ${gapFraisProMois} €/mois non couvert (assurance Frais Généraux indispensable).`
    );
  }

  alertes.push(
    `Capital décès SSI = ${capitalDeces} € (forfaitaire, aucune rente conjoint ni éducation). ` +
    `Couverture famille nettement insuffisante — prévoyance Madelin fortement recommandée.`
  );

  return {
    regime: "SSI",
    pass_2026: PASS_2026,
    ram,
    ram_plafonne: ramPlafonne,
    eligible,
    ij_brute_jour: ijBruteJour,
    ij_nette_jour: ijNetteJour,
    ij_nette_mois: ijNetteMois,
    gap_maintien_revenu_mois: gapMaintienRevenuMois,
    gap_frais_pro_mois: gapFraisProMois,
    rente_invalidite_cat1_an: renteInvaliditeCat1An,
    rente_invalidite_cat2_an: renteInvaliditeCat2An,
    gap_invalidite_cat1_an: gapInvaliditeCat1An,
    gap_invalidite_cat2_an: gapInvaliditeCat2An,
    capital_deces: capitalDeces,
    couverture_duree_max_jours: SSI_DUREE_MAX_JOURS,
    alertes,
  };
}
