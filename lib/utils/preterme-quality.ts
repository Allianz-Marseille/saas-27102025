/**
 * Normalisation des noms client pour les règles de qualité.
 * Utilisé pour matcher de manière stable un même client dans le temps.
 */
export function normalizeClientName(rawName: string): string {
  return rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}
