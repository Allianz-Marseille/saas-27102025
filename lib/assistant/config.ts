/**
 * Configuration partagée pour l'assistant et Nina (bot secrétaire).
 * Référence : docs/agents-ia/nina_secretaire/NINA-SECRETAIRE.md
 */

/** Timeout (ms) pour les appels API Nina — évite les coupures sur analyses de documents lourds. */
export const NINA_TIMEOUT = 45000;

/** Config dérivée (compat). */
export const NINA_CONFIG = {
  timeout: NINA_TIMEOUT,
} as const;

/** Active le bot Nina en UI et logique si la variable d'env est à 'true'. */
export const ENABLE_NINA_BOT =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_ENABLE_NINA_BOT === "true";
