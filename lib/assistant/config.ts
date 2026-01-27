/**
 * Configuration partagée pour l'assistant et Nina (bot secrétaire).
 * Référence : docs/agents-ia/nina_secretaire/NINA-SECRETAIRE.md
 */

/** Timeout (ms) pour les appels API Nina — évite les coupures sur réponses longues ou analyse de documents. */
export const NINA_CONFIG = {
  timeout: 30000,
} as const;

/** Active le bot Nina en UI et logique si la variable d'env est à 'true'. */
export const ENABLE_NINA_BOT =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_ENABLE_NINA_BOT === "true";
