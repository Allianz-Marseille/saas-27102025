import { z } from "zod";

/**
 * Schéma de validation pour les données de commissions mensuelles
 */
export const monthCommissionSchema = z.object({
  year: z.number()
    .int("L'année doit être un nombre entier")
    .min(2020, "L'année doit être supérieure à 2020")
    .max(2100, "L'année doit être inférieure à 2100"),
  
  month: z.number()
    .int("Le mois doit être un nombre entier")
    .min(1, "Le mois doit être entre 1 et 12")
    .max(12, "Le mois doit être entre 1 et 12"),
  
  commissionsIARD: z.number()
    .int("Les commissions IARD doivent être un nombre entier")
    .nonnegative("Les commissions IARD ne peuvent pas être négatives"),
  
  commissionsVie: z.number()
    .int("Les commissions Vie doivent être un nombre entier")
    .nonnegative("Les commissions Vie ne peuvent pas être négatives"),
  
  commissionsCourtage: z.number()
    .int("Les commissions Courtage doivent être un nombre entier")
    .nonnegative("Les commissions Courtage ne peuvent pas être négatives"),
  
  profitsExceptionnels: z.number()
    .int("Les profits exceptionnels doivent être un nombre entier")
    .nonnegative("Les profits exceptionnels ne peuvent pas être négatifs"),
  
  chargesAgence: z.number()
    .int("Les charges agence doivent être un nombre entier")
    .nonnegative("Les charges agence ne peuvent pas être négatives"),
  
  prelevementsJulien: z.number()
    .int("Les prélèvements Julien doivent être un nombre entier")
    .nonnegative("Les prélèvements Julien ne peuvent pas être négatifs"),
  
  prelevementsJeanMichel: z.number()
    .int("Les prélèvements Jean-Michel doivent être un nombre entier")
    .nonnegative("Les prélèvements Jean-Michel ne peuvent pas être négatifs"),
});

export type MonthCommissionInput = z.infer<typeof monthCommissionSchema>;

/**
 * Schéma pour la création d'une nouvelle année
 */
export const createYearSchema = z.object({
  year: z.number()
    .int("L'année doit être un nombre entier")
    .min(2020, "L'année doit être supérieure à 2020")
    .max(2100, "L'année doit être inférieure à 2100"),
});

export type CreateYearInput = z.infer<typeof createYearSchema>;

