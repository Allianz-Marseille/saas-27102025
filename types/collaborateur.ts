export type Pole =
  | "sante_ind"
  | "sante_coll"
  | "commercial"
  | "sinistre";

export type JourTravail = "L" | "M" | "Me" | "J" | "V" | "S";

export interface Collaborateur {
  id: string;
  firstName: string;
  pole: Pole;
  joursParSemaine: number; // 0.25 à 5, par pas de 0.25
  joursTravail: JourTravail[];
  createdAt: Date;
  updatedAt: Date;
}

export type CollaborateurInput = Omit<Collaborateur, "id" | "createdAt" | "updatedAt">;

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

// Génère 0.25, 0.5, … 5.0
export const JOURS_PAR_SEMAINE_OPTIONS: { value: number; label: string }[] = Array.from(
  { length: 20 },
  (_, i) => {
    const v = (i + 1) * 0.25;
    const int = Math.floor(v);
    const dec = Math.round((v - int) * 4); // quarts
    let label = "";
    if (dec === 0) label = `${int}`;
    else if (int === 0) label = `${dec}/4`;
    else label = `${int} ${dec}/4`;
    return { value: v, label };
  }
);
