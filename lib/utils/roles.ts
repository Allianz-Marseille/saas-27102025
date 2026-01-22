import { UserData } from "@/lib/firebase/auth";

export type UserRole = "ADMINISTRATEUR" | "CDC_COMMERCIAL" | "COMMERCIAL_SANTE_INDIVIDUEL" | "COMMERCIAL_SANTE_COLLECTIVE" | "GESTIONNAIRE_SINISTRE";

export const ROLES = {
  ADMINISTRATEUR: "ADMINISTRATEUR",
  CDC_COMMERCIAL: "CDC_COMMERCIAL",
  COMMERCIAL_SANTE_INDIVIDUEL: "COMMERCIAL_SANTE_INDIVIDUEL",
  COMMERCIAL_SANTE_COLLECTIVE: "COMMERCIAL_SANTE_COLLECTIVE",
  GESTIONNAIRE_SINISTRE: "GESTIONNAIRE_SINISTRE",
} as const;

/**
 * Vérifie si l'utilisateur est un administrateur
 */
export function isAdmin(userData: UserData | null): boolean {
  return userData?.role === ROLES.ADMINISTRATEUR && userData?.active === true;
}

/**
 * Vérifie si l'utilisateur est un CDC Commercial
 */
export function isCommercial(userData: UserData | null): boolean {
  return userData?.role === ROLES.CDC_COMMERCIAL && userData?.active === true;
}

/**
 * Vérifie si l'utilisateur est un Commercial Santé Individuel
 */
export function isCommercialSanteIndividuel(userData: UserData | null): boolean {
  return userData?.role === ROLES.COMMERCIAL_SANTE_INDIVIDUEL && userData?.active === true;
}

/**
 * Vérifie si l'utilisateur est un Commercial Santé Collective
 */
export function isCommercialSanteCollective(userData: UserData | null): boolean {
  return userData?.role === ROLES.COMMERCIAL_SANTE_COLLECTIVE && userData?.active === true;
}

/**
 * Vérifie si l'utilisateur est un Gestionnaire Sinistre
 */
export function isGestionnaireSinistre(userData: UserData | null): boolean {
  return userData?.role === ROLES.GESTIONNAIRE_SINISTRE && userData?.active === true;
}

/**
 * Vérifie si l'utilisateur a accès à une fonctionnalité
 */
export function hasAccess(
  userData: UserData | null,
  requiredRole: UserRole
): boolean {
  if (!userData || !userData.active) {
    return false;
  }

  // L'administrateur a accès à tout
  if (userData.role === ROLES.ADMINISTRATEUR) {
    return true;
  }

  return userData.role === requiredRole;
}

/**
 * Retourne le libellé du rôle
 */
export function getRoleLabel(role: UserRole): string {
  const labels = {
    ADMINISTRATEUR: "Administrateur",
    CDC_COMMERCIAL: "CDC Commercial",
    COMMERCIAL_SANTE_INDIVIDUEL: "Commercial Santé Individuel",
    COMMERCIAL_SANTE_COLLECTIVE: "Commercial Santé Collective",
    GESTIONNAIRE_SINISTRE: "Gestionnaire Sinistre",
  };
  return labels[role] || role;
}

/**
 * Vérifie si l'utilisateur peut accéder à l'interface admin
 */
export function canAccessAdmin(userData: UserData | null): boolean {
  return isAdmin(userData);
}

/**
 * Vérifie si l'utilisateur peut accéder au dashboard commercial
 */
export function canAccessDashboard(userData: UserData | null): boolean {
  return isAdmin(userData) || isCommercial(userData);
}

/**
 * Vérifie si l'utilisateur peut accéder au dashboard santé individuelle
 */
export function canAccessHealthDashboard(userData: UserData | null): boolean {
  return isAdmin(userData) || isCommercialSanteIndividuel(userData);
}

/**
 * Vérifie si l'utilisateur peut accéder au dashboard santé collective
 */
export function canAccessHealthCollectiveDashboard(userData: UserData | null): boolean {
  return isAdmin(userData) || isCommercialSanteCollective(userData);
}
