// @ts-nocheck
/**
 * Moteur de filtrage métier des prétermes IARD.
 *
 * Règle : conserver un client si ETP >= seuilEtp/100 OU TauxVariation >= seuilVariation.
 * Différence vs Auto : l'ETP IARD est stocké en décimal (1.20 = 20% d'augmentation).
 * Le seuilEtp est conservé en entier dans la config UI (ex: 120) pour cohérence,
 * mais la comparaison utilise seuilEtp / 100.
 */

import type { PretermeClient } from "@/types/preterme";

export interface FilterStats {
  total: number;
  conserves: number;
  exclus: number;
  ratioConservation: number; // 0–100
}

/**
 * Détermine si un client IRD doit être conservé selon les seuils.
 * ETP IARD est décimal : etp >= seuilEtp / 100.
 */
export function doitEtreIrdConserve(
  client: Pick<PretermeClient, "etp" | "tauxVariation">,
  seuilEtp: number,
  seuilVariation: number
): boolean {
  // Seuils à 0 = tout conserver
  if (seuilEtp <= 0 && seuilVariation <= 0) {
    return true;
  }

  const etpOk =
    client.etp !== null &&
    client.etp !== undefined &&
    client.etp >= seuilEtp / 100; // décimal : 1.20 >= 120/100

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
export function calculerIrdStatsConservation(
  clients: Pick<PretermeClient, "etp" | "tauxVariation">[],
  seuilEtp: number,
  seuilVariation: number
): FilterStats {
  const total = clients.length;
  const conserves = clients.filter((c) =>
    doitEtreIrdConserve(c, seuilEtp, seuilVariation)
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
 */
export function appliquerIrdFiltrage(
  clients: PretermeClient[],
  seuilEtp: number,
  seuilVariation: number
): PretermeClient[] {
  return clients.map((c) => ({
    ...c,
    conserve: doitEtreIrdConserve(c, seuilEtp, seuilVariation),
  }));
}
