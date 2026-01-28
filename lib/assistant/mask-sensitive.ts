/**
 * Utilitaires pour masquer les données sensibles avant copie/export.
 * Référence : docs/agents-ia/nina_secretaire/NINA-SECRETAIRE.md
 */

const IBAN_RE = /\b[A-Z]{2}\s?\d{2}\s?(?:[\dA-Z]\s?){12,30}\b/gi;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/g;

const MASK = "****";

/**
 * Remplace IBAN, email et téléphone par **** dans le texte.
 * Utilisable avant copie ou export PDF pour limiter l'exposition de données sensibles.
 */
export function maskSensitive(text: string): string {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(IBAN_RE, MASK)
    .replace(EMAIL_RE, MASK)
    .replace(PHONE_RE, MASK);
}
