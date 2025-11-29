/**
 * Configuration centralisée pour l'authentification
 * 
 * Ce fichier centralise les paramètres d'authentification pour éviter
 * la duplication et faciliter la maintenance.
 */

/**
 * Domaine(s) email autorisé(s) pour l'authentification
 * Peut être surchargé via la variable d'environnement NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN
 */
export const ALLOWED_EMAIL_DOMAINS = [
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "@allianz-nogaro.fr"
];

/**
 * Vérifie si un email appartient à un domaine autorisé
 */
export function isEmailDomainAllowed(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some(domain => 
    normalizedEmail.endsWith(domain.toLowerCase())
  );
}

/**
 * Obtient le message d'erreur formaté pour les domaines non autorisés
 */
export function getInvalidDomainErrorMessage(): string {
  if (ALLOWED_EMAIL_DOMAINS.length === 1) {
    return `L'email doit se terminer par ${ALLOWED_EMAIL_DOMAINS[0]}`;
  }
  return `L'email doit se terminer par ${ALLOWED_EMAIL_DOMAINS.join(' ou ')}`;
}

