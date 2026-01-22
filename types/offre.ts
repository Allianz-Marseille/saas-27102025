import { Timestamp } from "firebase/firestore";

export interface OffreCommerciale {
  id: string;
  segment: string;
  sous_segment: string;
  offre: string;
  code: string;
  conditions: string;
  categorie_client: "particulier" | "professionnel" | "entreprise" | "TNS" | "agriculteur" | "viticulteur";
  periode: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type OffreCommercialeInput = Omit<OffreCommerciale, "id" | "createdAt" | "updatedAt">;

export interface OffreFilter {
  segment?: string;
  categorie_client?: string;
  periode?: string;
  search?: string;
}

