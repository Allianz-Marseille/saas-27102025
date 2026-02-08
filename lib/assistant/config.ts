/**
 * Configuration partagée pour l'assistant et Nina (bot secrétaire).
 * Référence : docs/agents-ia/nina_secretaire/NINA-SECRETAIRE.md
 */

/** Timeout (ms) pour les appels API Nina — évite les coupures sur analyses de documents lourds. */
export const NINA_TIMEOUT = 45000;

/** Fenêtre glissante : nombre de messages d'historique envoyés à l'API (au-delà, troncation). */
export const SUMMARY_WINDOW = 12;

/** Taille max du contexte documentaire (PDF/fichiers) conservé pour la conversation (caractères). */
export const DOCUMENT_CONTEXT_MAX_CHARS = 80_000;

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

/** Active le bot Nina (Secrétaire) en UI. Affiché par défaut ; mettre NEXT_PUBLIC_ENABLE_NINA_BOT=false pour le masquer. */
export const ENABLE_NINA_BOT =
  typeof process === "undefined" || process.env.NEXT_PUBLIC_ENABLE_NINA_BOT !== "false";

/** Timeout (ms) pour les appels API Bob — évite les coupures sur analyses de documents lourds (liasses 2035, etc.). */
export const BOB_TIMEOUT = 60000;

/** Active le bot Bob (Santé & Prévoyance) en UI et logique si la variable d'env est à 'true'. */
export const ENABLE_BOB_BOT =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_ENABLE_BOB_BOT === "true";

/** Timeout (ms) pour les appels API Sinistro (analyse constats, conventions). */
export const SINISTRO_TIMEOUT = 60000;

/** Active le bot Sinistro (Sinistres) en UI. Affiché par défaut ; mettre NEXT_PUBLIC_ENABLE_SINISTRO_BOT=false pour le masquer. */
export const ENABLE_SINISTRO_BOT =
  typeof process === "undefined" || process.env.NEXT_PUBLIC_ENABLE_SINISTRO_BOT !== "false";

/** Timeout (ms) pour les appels API Pauline (produits particuliers). */
export const PAULINE_TIMEOUT = 45000;

/** Active le bot Pauline (Produits Particuliers) en UI. Affiché par défaut ; mettre NEXT_PUBLIC_ENABLE_PAULINE_BOT=false pour le masquer. */
export const ENABLE_PAULINE_BOT =
  typeof process === "undefined" || process.env.NEXT_PUBLIC_ENABLE_PAULINE_BOT !== "false";

/** Date limite d'affichage de la modale d'intro Nina (6 fév 00:00 = affichage jusqu'au 5 fév inclus). */
export const NINA_INTRO_MODAL_END_DATE = new Date("2026-02-06T00:00:00");

/** Indique si la modale d'intro Nina doit encore être proposée (avant le 6 février 2026). */
export function isNinaIntroModalActive(): boolean {
  return new Date() < NINA_INTRO_MODAL_END_DATE;
}
