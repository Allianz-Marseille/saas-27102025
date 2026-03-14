/**
 * Moteur de filtrage métier des prétermes IARD.
 *
 * Règle : conserver un client si ETP >= seuilEtp OU TauxVariation >= seuilVariation.
 * Différence vs Auto :
 *   - Règle OU (Auto utilise aussi OU mais la logique métier IARD est documentée comme OU explicitement)
 *   - seuilEtp est stocké en décimal (1.20) — comparaison directe, PAS de /100
 */

import type { ClientIrdImporte } from "@/types/preterme-ird"

export interface FilterStats {
  total: number
  conserves: number
  exclus: number
  ratioConservation: number // 0–100
}

// Nullable pour accepter les valeurs manquantes issues du parsing Excel
type ClientForFilter = { etp: number | null; tauxVariation: number | null }

/**
 * Détermine si un client IRD doit être retenu selon les seuils.
 * seuilEtp est décimal (ex: 1.20) — comparaison directe avec etp.
 */
export function doitEtreIrdRetenu(
  client: ClientForFilter,
  seuilEtp: number,
  seuilVariation: number
): boolean {
  if (seuilEtp <= 0 && seuilVariation <= 0) return true

  const etpOk =
    client.etp != null &&
    client.etp >= seuilEtp  // décimal direct : 1.20 >= 1.20

  const variationOk =
    client.tauxVariation != null &&
    client.tauxVariation >= seuilVariation

  return etpOk || variationOk
}

/**
 * Calcule les statistiques de conservation pour un ensemble de clients
 * sans modifier les objets (lecture seule, pour le preview des sliders).
 */
export function calculerIrdStatsConservation(
  clients: ClientForFilter[],
  seuilEtp: number,
  seuilVariation: number
): FilterStats {
  const total = clients.length
  const conserves = clients.filter(c => doitEtreIrdRetenu(c, seuilEtp, seuilVariation)).length
  return {
    total,
    conserves,
    exclus: total - conserves,
    ratioConservation: total > 0 ? Math.round((conserves / total) * 100) : 0,
  }
}

/**
 * Applique le filtrage sur un tableau de clients (retourne un nouveau tableau avec `retenu` mis à jour).
 */
export function appliquerIrdFiltrage(
  clients: ClientIrdImporte[],
  seuilEtp: number,
  seuilVariation: number
): ClientIrdImporte[] {
  return clients.map(c => ({
    ...c,
    retenu: doitEtreIrdRetenu(c, seuilEtp, seuilVariation),
  }))
}
