/**
 * Utilitaires partagés pour les sinistres
 */

import { SinistreRoute, SinistreStatus } from "@/types/sinistre";

/**
 * Obtient le label court d'une route (A, B, C, etc.)
 */
export function getRouteLabel(route?: SinistreRoute): string {
  if (!route || route === SinistreRoute.NON_DEFINIE) return "Non définie";
  return route.charAt(5); // "Route A" -> "A"
}

/**
 * Obtient la couleur du badge pour une route
 */
export function getRouteBadgeColor(route?: SinistreRoute): string {
  if (!route || route === SinistreRoute.NON_DEFINIE) {
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
  
  const routeLetter = route.charAt(5); // "Route A" -> "A"
  switch (routeLetter) {
    case "A":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300";
    case "B":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300";
    case "C":
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300";
    case "D":
      return "bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300";
    case "E":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300";
    case "F":
      return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

/**
 * Obtient la couleur du badge pour un statut
 */
export function getStatusBadgeColor(status?: SinistreStatus): string {
  if (!status) return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  
  switch (status) {
    case SinistreStatus.A_QUALIFIER:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    case SinistreStatus.EN_ATTENTE_PIECES_ASSURE:
    case SinistreStatus.EN_ATTENTE_INFOS_TIERS:
    case SinistreStatus.EN_ATTENTE_FACTURE:
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300";
    case SinistreStatus.MISSION_EN_COURS:
    case SinistreStatus.TRAVAUX_EN_COURS:
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300";
    case SinistreStatus.EN_ATTENTE_DEVIS:
    case SinistreStatus.EN_ATTENTE_RAPPORT:
    case SinistreStatus.EN_ATTENTE_ACCORD_COMPAGNIE:
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300";
    case SinistreStatus.REGLEMENT_EN_COURS:
      return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300";
    case SinistreStatus.CLOS:
      return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300";
    case SinistreStatus.LITIGE_CONTESTATION:
      return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

