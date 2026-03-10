/**
 * Moteur de filtrage métier des prétermes Auto.
 *
 * Règle : conserver un client si ETP >= seuilEtp OU TauxVariation >= seuilVariation.
 * Comparaisons strictes >= (décision métier validée, section 7.2 des specs).
 */

import type { PretermeClient } from "@/types/preterme";

export interface FilterStats {
  total: number;
  conserves: number;
  exclus: number;
  ratioConservation: number; // 0–100
}

/**
 * Détermine si un client doit être conservé selon les seuils.
 */
export function doitEtreConserve(
  client: Pick<PretermeClient, "etp" | "tauxVariation">,
  seuilEtp: number,
  seuilVariation: number
): boolean {
  const etpOk =
    client.etp !== null &&
    client.etp !== undefined &&
    client.etp >= seuilEtp;

  const variationOk =
    client.tauxVariation !== null &&
    client.tauxVariation !== undefined &&
    client.tauxVariation >= seuilVariation;

  return etpOk || variationOk;
}

/**
 * Calcule les statistiques de conservation pour un ensemble de clients
 * sans modifier les objets (lecture seule, pour le preview des sliders).
 */
export function calculerStatsConservation(
  clients: Pick<PretermeClient, "etp" | "tauxVariation">[],
  seuilEtp: number,
  seuilVariation: number
): FilterStats {
  const total = clients.length;
  const conserves = clients.filter((c) =>
    doitEtreConserve(c, seuilEtp, seuilVariation)
  ).length;

  return {
    total,
    conserves,
    exclus: total - conserves,
    ratioConservation: total > 0 ? Math.round((conserves / total) * 100) : 0,
  };
}

/**
 * Applique le filtrage sur un tableau de clients (avec mutation du champ `conserve`).
 * Retourne une copie annotée.
 */
export function appliquerFiltrage(
  clients: PretermeClient[],
  seuilEtp: number,
  seuilVariation: number
): PretermeClient[] {
  return clients.map((c) => ({
    ...c,
    conserve: doitEtreConserve(c, seuilEtp, seuilVariation),
  }));
}
