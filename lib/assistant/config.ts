/**
 * Configuration partagée pour l'assistant et Nina (bot secrétaire).
 * Référence : docs/agents-ia/nina_secretaire/NINA-SECRETAIRE.md
 */

/** Timeout (ms) pour les appels API Nina — évite les coupures sur analyses de documents lourds. */
export const NINA_TIMEOUT = 45000;

/** Fenêtre glissante : nombre de messages d'historique envoyés à l'API (au-delà, troncation). */
export const SUMMARY_WINDOW = 12;

/** Historique max (compat) — préférer SUMMARY_WINDOW pour la troncation. */
export const MAX_HISTORY_MESSAGES = 20;

/** Longueur max de contenu exporté en PDF par réponse (caractères) ; au-delà, pagination / avertissement. */
export const PDF_EXPORT_MAX_CHARS = 50_000;

/** Config dérivée (compat). */
export const NINA_CONFIG = {
  timeout: NINA_TIMEOUT,
  summaryWindow: SUMMARY_WINDOW,
  pdfExportMaxChars: PDF_EXPORT_MAX_CHARS,
} as const;

/** Active le bot Nina en UI et logique si la variable d'env est à 'true'. */
export const ENABLE_NINA_BOT =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_ENABLE_NINA_BOT === "true";
