/**
 * Parse une valeur ETP au format "100%", "60%", etc. en nombre décimal
 * @param etp - Valeur ETP au format string (ex: "100%", "60%", "50%")
 * @returns Nombre décimal (ex: 1.0 pour 100%, 0.6 pour 60%)
 */
export function parseEtpToDecimal(etp: string | undefined): number {
  if (!etp) return 0;
  const match = etp.match(/(\d+(\.\d+)?)/);
  if (!match) return 0;
  return parseFloat(match[1]) / 100;
}

/**
 * Calcule le total des ETP depuis une liste d'utilisateurs
 * @param users - Liste d'utilisateurs avec propriétés etp et active
 * @returns Total des ETP (somme des ETP des utilisateurs actifs)
 */
export function calculateTotalEtp(users: Array<{ etp?: string; active: boolean }>): number {
  return users
    .filter((user) => user.active)
    .reduce((sum, user) => sum + parseEtpToDecimal(user.etp), 0);
}

/**
 * Formate un nombre décimal ETP en affichage lisible
 * @param etp - Nombre décimal ETP (ex: 2.5 pour 2.5 ETP)
 * @returns Chaîne formatée (ex: "2.50")
 */
export function formatEtp(etp: number): string {
  return etp.toFixed(2);
}

/**
 * Calcule le ratio Commissions / ETP pour une année
 * @param totalCommissions - Total des commissions (réel ou extrapolé)
 * @param totalEtp - Total des ETP
 * @returns Ratio arrondi (Commissions / ETP)
 */
export function calculateCommissionsPerEtp(totalCommissions: number, totalEtp: number): number {
  if (totalEtp === 0) return 0;
  return Math.round(totalCommissions / totalEtp);
}

