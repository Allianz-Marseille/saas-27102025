/**
 * Routeur CDC pour les prétermes Auto.
 *
 * Attribue chaque client conservé au bon Chargé de Clientèle selon :
 * - La première lettre du nom de famille (pour les particuliers)
 * - La première lettre du nom du gérant (pour les sociétés)
 *
 * Gestion des absences : si un CDC est absent, ses clients sont routés
 * vers le CDC remplaçant (et son mapping Trello).
 */

import type {
  PretermeClient,
  ChargeDeClientele,
  AgenceConfig,
  TrelloMapping,
} from "@/types/preterme";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoutageResult {
  client: PretermeClient;
  chargeId: string;
  chargePrenom: string;
  trello: TrelloMapping;
  lettre: string;       // lettre utilisée pour le routage
  remplace: boolean;    // true si routé vers un remplaçant
}

export interface RoutageStats {
  total: number;
  routes: number;
  nonRoutes: number; // sociétés non encore validées
  parCharge: Record<string, number>; // prénom → nb clients
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrait la première lettre significative d'un nom (uppercase, sans accent). */
function premiereLettreNom(nom: string): string {
  const clean = nom
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  // Le nom peut être "MARTIN JEAN" ou "MARTIN" — on prend la toute première lettre
  return clean[0] ?? "";
}

/**
 * Trouve le CDC responsable d'une lettre donnée dans une agence.
 * Tient compte des absences : si le CDC est absent, retourne le remplaçant.
 */
function trouverCdc(
  lettre: string,
  agence: AgenceConfig
): { cdc: ChargeDeClientele; remplace: boolean } | null {
  if (!lettre) return null;

  const responsable = agence.charges.find(
    (c) =>
      lettre >= c.lettresDebut.toUpperCase() &&
      lettre <= c.lettresFin.toUpperCase()
  );

  if (!responsable) return null;

  // Vérifier si absent
  if (responsable.absence?.remplacantId) {
    const remplacant = agence.charges.find(
      (c) => c.id === responsable.absence!.remplacantId
    );
    if (remplacant && remplacant.trello) {
      return { cdc: remplacant, remplace: true };
    }
  }

  return { cdc: responsable, remplace: false };
}

// ─── Routeur principal ────────────────────────────────────────────────────────

/**
 * Route une liste de clients conservés vers leurs CDC respectifs.
 * Les sociétés sans nom gérant renseigné sont ignorées (retournées séparément).
 */
export function routerClients(
  clients: PretermeClient[],
  agence: AgenceConfig
): { routes: RoutageResult[]; nonRoutes: PretermeClient[] } {
  const routes: RoutageResult[] = [];
  const nonRoutes: PretermeClient[] = [];

  for (const client of clients) {
    if (!client.conserve) continue;

    // Déterminer le nom à utiliser pour le routage
    let nomRoutage: string;

    if (client.typeEntite === "particulier") {
      nomRoutage = client.nomClient;
    } else if (
      (client.typeEntite === "societe" || client.typeEntite === "a_valider") &&
      client.nomGerant
    ) {
      nomRoutage = client.nomGerant;
    } else {
      // Société sans gérant renseigné → non routable
      nonRoutes.push(client);
      continue;
    }

    const lettre = premiereLettreNom(nomRoutage);
    const match = trouverCdc(lettre, agence);

    if (!match || !match.cdc.trello) {
      nonRoutes.push(client);
      continue;
    }

    routes.push({
      client,
      chargeId: match.cdc.id,
      chargePrenom: match.cdc.prenom,
      trello: match.cdc.trello,
      lettre,
      remplace: match.remplace,
    });
  }

  return { routes, nonRoutes };
}

/**
 * Calcule les statistiques de répartition sans effectuer le routage complet.
 */
export function calculerStatsRoutage(
  clients: PretermeClient[],
  agence: AgenceConfig
): RoutageStats {
  const { routes, nonRoutes } = routerClients(clients, agence);
  const parCharge: Record<string, number> = {};

  for (const r of routes) {
    parCharge[r.chargePrenom] = (parCharge[r.chargePrenom] ?? 0) + 1;
  }

  return {
    total: clients.filter((c) => c.conserve).length,
    routes: routes.length,
    nonRoutes: nonRoutes.length,
    parCharge,
  };
}
