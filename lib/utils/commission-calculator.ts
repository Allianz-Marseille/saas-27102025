import { AgencyCommission } from "@/types";

/**
 * Formate un montant avec séparateurs de milliers
 * @param amount - Montant entier (ex: 83717)
 * @returns Montant formaté (ex: "83 717 €")
 */
export function formatCurrencyInteger(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formate un nombre avec séparateurs de milliers (sans symbole €)
 * @param value - Nombre entier (ex: 83717)
 * @returns Nombre formaté (ex: "83 717")
 */
export function formatThousands(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Parse une chaîne formatée en nombre entier
 * @param formatted - Chaîne formatée (ex: "83 717", "83 717 €", "83717")
 * @returns Nombre entier (ex: 83717)
 */
export function parseCurrency(formatted: string): number {
  // Supprimer tous les espaces, €, et autres caractères non numériques sauf le signe -
  const cleaned = formatted.replace(/[^\d-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calcule le total des commissions
 */
export function calculateTotal(
  iard: number,
  vie: number,
  courtage: number,
  profits: number
): number {
  return iard + vie + courtage + profits;
}

/**
 * Calcule le résultat (Total - Charges)
 */
export function calculateResultat(total: number, charges: number): number {
  return total - charges;
}

/**
 * Extrapole une année incomplète sur 12 mois
 * @param data - Données des mois disponibles
 * @returns Données extrapolées sur 12 mois
 */
export function extrapolateYear(data: AgencyCommission[]): {
  totalCommissions: number;
  chargesAgence: number;
  resultat: number;
  commissionsIARD: number;
  commissionsVie: number;
  commissionsCourtage: number;
  profitsExceptionnels: number;
  prelevementsJulien: number;
  prelevementsJeanMichel: number;
  monthsCount: number;
} {
  // Mois complets = mois avec résultat déterminé (total ou charges renseignés)
  const completeMonths = data.filter(
    (d) => d.totalCommissions > 0 || d.chargesAgence > 0
  );

  if (completeMonths.length === 0) {
    return {
      totalCommissions: 0,
      chargesAgence: 0,
      resultat: 0,
      commissionsIARD: 0,
      commissionsVie: 0,
      commissionsCourtage: 0,
      profitsExceptionnels: 0,
      prelevementsJulien: 0,
      prelevementsJeanMichel: 0,
      monthsCount: 0,
    };
  }

  // Totaux uniquement sur les mois complets (extrapolation basée sur eux seuls)
  const totals = completeMonths.reduce(
    (acc, month) => ({
      totalCommissions: acc.totalCommissions + month.totalCommissions,
      chargesAgence: acc.chargesAgence + month.chargesAgence,
      resultat: acc.resultat + month.resultat,
      commissionsIARD: acc.commissionsIARD + month.commissionsIARD,
      commissionsVie: acc.commissionsVie + month.commissionsVie,
      commissionsCourtage: acc.commissionsCourtage + month.commissionsCourtage,
      profitsExceptionnels: acc.profitsExceptionnels + month.profitsExceptionnels,
      prelevementsJulien: acc.prelevementsJulien + month.prelevementsJulien,
      prelevementsJeanMichel: acc.prelevementsJeanMichel + month.prelevementsJeanMichel,
    }),
    {
      totalCommissions: 0,
      chargesAgence: 0,
      resultat: 0,
      commissionsIARD: 0,
      commissionsVie: 0,
      commissionsCourtage: 0,
      profitsExceptionnels: 0,
      prelevementsJulien: 0,
      prelevementsJeanMichel: 0,
    }
  );

  // Extrapolation: (Somme mois complets / Nb mois complets) × 12
  const n = completeMonths.length;
  return {
    totalCommissions: Math.round((totals.totalCommissions / n) * 12),
    chargesAgence: Math.round((totals.chargesAgence / n) * 12),
    resultat: Math.round((totals.resultat / n) * 12),
    commissionsIARD: Math.round((totals.commissionsIARD / n) * 12),
    commissionsVie: Math.round((totals.commissionsVie / n) * 12),
    commissionsCourtage: Math.round((totals.commissionsCourtage / n) * 12),
    profitsExceptionnels: Math.round((totals.profitsExceptionnels / n) * 12),
    prelevementsJulien: Math.round((totals.prelevementsJulien / n) * 12),
    prelevementsJeanMichel: Math.round((totals.prelevementsJeanMichel / n) * 12),
    monthsCount: n,
  };
}

/**
 * Compare deux années
 * @returns Taux de croissance en pourcentage
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Obtient le nom du mois en français
 */
export function getMonthName(month: number): string {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return months[month - 1] || '';
}

/**
 * Obtient le nom court du mois
 */
export function getMonthShortName(month: number): string {
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
  ];
  return months[month - 1] || '';
}

