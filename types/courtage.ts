export interface Courtage {
  id: string;
  compagnie: string;
  identifiant: string;
  password: string;
  internet: string;
  dateModification: string | null; // format YYYY-MM-DD-HH-MM ou null
  qui: string | null;              // partie avant @ de l'email, ou null
  createdAt?: string;
  // Tags
  tags?: string[];
  tagsUpdatedBy?: string | null;
  tagsUpdatedAt?: string | null;
}

export type CourtageFormData = Pick<Courtage, "compagnie" | "identifiant" | "password" | "internet">;
