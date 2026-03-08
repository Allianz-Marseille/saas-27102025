/**
 * Moteur de calcul Libéraux — Professions libérales (médecins, kinés, architectes…).
 *
 * NE PAS FUSIONNER avec engine-ssi.ts : les libéraux ont une rupture CPAM au J91
 * que les SSI n'ont pas (eux couverts jusqu'à 3 ans).
 *
 * Référence : docs 03-professions-liberales-general-2026.md + caisses spécifiques.
 */

import {
  PASS_2026,
  LIBERAL_RAM_PLAFOND,
  LIBERAL_IJ_MAX_JOUR,
  SSI_IJ_BASE_JOURS,
  LIBERAL_RUPTURE_J,
  CAISSES_PRO_DATA,
} from "./constants";
import type { PrevoyanceInputLiberal, ResultatLiberal, CaissePro } from "./types";

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Résout la clé de caisse à utiliser dans CAISSES_PRO_DATA.
 * CARMF est sub-divisé en 3 classes selon le RAM (N-2 ≈ RAM ici).
 */
function resolveCaisseKey(caisse: CaissePro, ram: number): string {
  if (caisse === "CARMF") {
    if (ram < PASS_2026) return "CARMF_A";
    if (ram < LIBERAL_RAM_PLAFOND) return "CARMF_B";
    return "CARMF_C";
  }
  return caisse;
}

/**
 * Calcule les IJ CPAM (J4-J90), le relais caisse pro (J91+) et les gaps
 * pour un profil de profession libérale.
 *
 * @param input - Données du profil (RAM, caisse pro, besoin mensuel…)
 * @returns ResultatLiberal — toutes les valeurs calculées + alertes J91
 */
export function calculateLiberal(input: PrevoyanceInputLiberal): ResultatLiberal {
  const {
    ram,
    besoinMaintienRevenu,
    besoinFraisPro = 0,
    caissePro = "AUTRE",
    nbEnfants = 0,
  } = input;

  // ── RAM plafonné à 3 PASS ────────────────────────────────────────────────
  const ramPlafonne = Math.min(ram, LIBERAL_RAM_PLAFOND);

  // ── IJ CPAM J4-J90 ───────────────────────────────────────────────────────
  const ijCpamJourBrut = r2(ramPlafonne / SSI_IJ_BASE_JOURS);
  const ijCpamJour = Math.min(ijCpamJourBrut, LIBERAL_IJ_MAX_JOUR);
  const ijCpamMois = r2(ijCpamJour * 30);

  const gapJ4J90Mois = Math.max(0, r2(besoinMaintienRevenu - ijCpamMois));

  // ── Relais caisse pro J91+ ───────────────────────────────────────────────
  const caisseKey = resolveCaisseKey(caissePro, ram);
  const caisseData = CAISSES_PRO_DATA[caisseKey] ?? CAISSES_PRO_DATA["AUTRE"];

  const caisseIjJour = caisseData.ij_jour;
  const caisseDureeMaxJ = caisseData.duree_max_j;
  const caisseLabel = caisseData.label;

  const ijTotaleMoisJ91 = r2(caisseIjJour * 30);
  const gapJ91PlusMois = Math.max(0, r2(besoinMaintienRevenu - ijTotaleMoisJ91));

  // ── Alerte rupture J91 (obligatoire pour tous les libéraux) ─────────────
  const alerteRuptureJ91 = caisseIjJour === 0
    ? `⚠️ RUPTURE DE REVENUS CRITIQUE AU 91ème JOUR : ` +
      `la CPAM s'arrête et ${caissePro} ne verse AUCUNE IJ. ` +
      `Le client passe de ${ijCpamMois} €/mois à 0 € — gap total = ${besoinMaintienRevenu} €/mois.`
    : `⚠️ RUPTURE CPAM AU 91ème JOUR : ` +
      `la CPAM s'arrête (${ijCpamMois} €/mois → 0 €). ` +
      `Relais ${caissePro} : ${ijTotaleMoisJ91} €/mois — gap résiduel = ${gapJ91PlusMois} €/mois.`;

  // ── Alertes métier ───────────────────────────────────────────────────────
  const alertes: string[] = [alerteRuptureJ91];

  if (besoinFraisPro > 0) {
    alertes.push(
      `Frais professionnels non couverts par la CPAM ni la caisse pro : ` +
      `gap frais pros = ${besoinFraisPro} €/mois (garantie Frais Généraux Allianz indispensable).`
    );
  }

  if (nbEnfants > 0) {
    alertes.push(
      `Volet familial : prévoir Rente Éducation (${nbEnfants} enfant(s)) — ` +
      `les caisses libérales versent généralement 5 000–9 000 €/an/enfant selon la caisse.`
    );
  }

  if (ram > LIBERAL_RAM_PLAFOND) {
    alertes.push(
      `RAM ${ram} € > 3 PASS (${LIBERAL_RAM_PLAFOND} €) : IJ CPAM plafonnée à ` +
      `${LIBERAL_IJ_MAX_JOUR} €/j (${r2(LIBERAL_IJ_MAX_JOUR * 30)} €/mois).`
    );
  }

  return {
    regime: "LIBERAL",
    pass_2026: PASS_2026,
    ram,
    ram_plafonne: ramPlafonne,
    caisse_pro: caisseData.ij_jour > 0 ? caissePro : (caissePro ?? "INCONNUE"),
    ij_cpam_jour: ijCpamJour,
    ij_cpam_mois_j4_j90: ijCpamMois,
    gap_j4_j90_mois: gapJ4J90Mois,
    rupture_j91: true,
    caisse_ij_jour_j91: caisseIjJour,
    caisse_duree_max_j: caisseDureeMaxJ,
    caisse_label: caisseLabel,
    ij_totale_mois_j91: ijTotaleMoisJ91,
    gap_j91_plus_mois: gapJ91PlusMois,
    alerte_rupture_j91: alerteRuptureJ91,
    alertes,
  };
}
