export type Pole =
  | "sante_ind"
  | "sante_coll"
  | "commercial"
  | "sinistre";

export type Contrat = "cdi" | "cdd" | "alternant";

export type JourTravail = "L" | "M" | "Me" | "J" | "V" | "S";

export interface Collaborateur {
  id: string;
  firstName: string;
  pole: Pole;
  contrat: Contrat;
  joursTravail: JourTravail[];
  createdAt: Date;
  updatedAt: Date;
}

export type CollaborateurInput = Omit<Collaborateur, "id" | "createdAt" | "updatedAt">;

/** ETP calculé : alternant = 0.5 fixe, sinon nb de jours travaillés / 5 */
export function etpOf(c: Pick<Collaborateur, "contrat" | "joursTravail">): number {
  return c.contrat === "alternant" ? 0.5 : c.joursTravail.length / 5;
}

export const CONTRAT_LABELS: Record<Contrat, string> = {
  cdi: "CDI",
  cdd: "CDD",
  alternant: "Alternant",
};

export const POLE_LABELS: Record<Pole, string> = {
  sante_ind: "Santé Individuelle",
  sante_coll: "Santé Collective",
  commercial: "Commercial",
  sinistre: "Sinistre",
};

export const JOURS_LABELS: Record<JourTravail, string> = {
  L: "Lundi",
  M: "Mardi",
  Me: "Mercredi",
  J: "Jeudi",
  V: "Vendredi",
  S: "Samedi",
};

export const JOURS_ORDER: JourTravail[] = ["L", "M", "Me", "J", "V", "S"];
