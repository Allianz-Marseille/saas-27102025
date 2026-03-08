/**
 * Module Prévoyance — moteurs de calcul déterministes SSI et Libéraux.
 *
 * Deux moteurs strictement séparés :
 * - calculateSSI()    → Artisans, Commerçants, Gérants Majoritaires
 * - calculateLiberal() → Professions libérales (CPAM J4-J90 + caisse pro J91+)
 *
 * Utilisé par l'agent Bob pour ancrer ses calculs sur des valeurs exactes
 * plutôt que de laisser le LLM les estimer.
 */

export { calculateSSI } from "./engine-ssi";
export { calculateLiberal } from "./engine-liberaux";
export type {
  PrevoyanceInput,
  PrevoyanceInputSSI,
  PrevoyanceInputLiberal,
  ResultatPrevoyance,
  ResultatSSI,
  ResultatLiberal,
  RegimePrevoyance,
  CaissePro,
} from "./types";
export { PASS_2026, CAISSES_PRO_DATA } from "./constants";

import { calculateSSI } from "./engine-ssi";
import { calculateLiberal } from "./engine-liberaux";
import type { PrevoyanceInput, ResultatPrevoyance } from "./types";

/**
 * Point d'entrée unifié — route vers le bon moteur selon le régime.
 * Ne jamais appeler directement : préférer calculateSSI() ou calculateLiberal()
 * quand le régime est déjà connu.
 */
export function calculatePrevoyance(input: PrevoyanceInput): ResultatPrevoyance {
  if (input.regime === "SSI") return calculateSSI(input);
  return calculateLiberal(input);
}

/**
 * Formate un résultat de calcul en bloc texte pour injection dans le contexte Gemini.
 * Structure identique au bloc déterministe Sinistro.
 */
export function formatResultatForBob(resultat: ResultatPrevoyance): string {
  const lines: string[] = [
    "",
    "## RÉSULTAT MOTEUR DÉTERMINISTE PRÉVOYANCE (utiliser ces chiffres exactement)",
  ];

  if (resultat.regime === "SSI") {
    const r = resultat;
    const ssiLines: string[] = [
      `- Régime : SSI (Artisan / Commerçant / Gérant)`,
      `- PASS 2026 : ${r.pass_2026.toLocaleString("fr-FR")} €`,
      `- RAM déclaré : ${r.ram.toLocaleString("fr-FR")} €`,
      `- RAM plafonné : ${r.ram_plafonne.toLocaleString("fr-FR")} € (plafond = 1 PASS)`,
      `- Éligibilité IJ : ${r.eligible ? "OUI" : "NON — RAM sous le seuil d'exclusion (10 % PASS)"}`,
      `- IJ brute : ${r.ij_brute_jour} €/jour`,
      `- IJ nette (après CSG/CRDS 6,7 %) : ${r.ij_nette_jour} €/jour → ${r.ij_nette_mois} €/mois`,
      `- Gap maintien de revenu : ${r.gap_maintien_revenu_mois} €/mois`,
    ];
    if (r.gap_frais_pro_mois > 0) {
      ssiLines.push(`- Gap frais professionnels : ${r.gap_frais_pro_mois} €/mois (non couvert SSI)`);
    }
    ssiLines.push(
      `- Durée de couverture maximale : ${r.couverture_duree_max_jours} jours (3 ans)`,
      `- Invalidité Cat. 1 (30 % RAM, max) : ${r.rente_invalidite_cat1_an.toLocaleString("fr-FR")} €/an — gap : ${r.gap_invalidite_cat1_an.toLocaleString("fr-FR")} €/an`,
      `- Invalidité Cat. 2 (50 % RAM, max) : ${r.rente_invalidite_cat2_an.toLocaleString("fr-FR")} €/an — gap : ${r.gap_invalidite_cat2_an.toLocaleString("fr-FR")} €/an`,
      `- Capital décès SSI : ${r.capital_deces.toLocaleString("fr-FR")} € (forfaitaire, aucune rente)`,
      "",
      "### Alertes SSI",
      ...r.alertes.map((a) => `- ${a}`)
    );
    lines.push(...ssiLines);
  } else {
    const r = resultat;
    lines.push(
      `- Régime : Profession Libérale`,
      `- PASS 2026 : ${r.pass_2026.toLocaleString("fr-FR")} €`,
      `- RAM déclaré : ${r.ram.toLocaleString("fr-FR")} €`,
      `- RAM plafonné : ${r.ram_plafonne.toLocaleString("fr-FR")} € (plafond = 3 PASS = ${(r.pass_2026 * 3).toLocaleString("fr-FR")} €)`,
      ``,
      `- [J4–J90] IJ CPAM : ${r.ij_cpam_jour} €/jour → ${r.ij_cpam_mois_j4_j90} €/mois`,
      `- [J4–J90] Gap maintien de revenu : ${r.gap_j4_j90_mois} €/mois`,
      ``,
      `- [J91+] Caisse pro : ${r.caisse_label}`,
      r.caisse_ij_jour_j91 > 0
        ? `- [J91+] IJ caisse : ${r.caisse_ij_jour_j91} €/jour → ${r.ij_totale_mois_j91} €/mois (jusqu'au J${r.caisse_duree_max_j})`
        : `- [J91+] IJ caisse : 0 € — aucun relais`,
      `- [J91+] Gap maintien de revenu : ${r.gap_j91_plus_mois} €/mois`,
      ``,
      "### Alerte rupture J91",
      `- ${r.alerte_rupture_j91}`,
      "",
      "### Alertes libéraux",
      ...r.alertes.filter((a) => a !== r.alerte_rupture_j91).map((a) => `- ${a}`)
    );
  }

  return lines.join("\n");
}
