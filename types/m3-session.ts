/**
 * Types pour les sessions M+3
 */

export type M3SessionStatus = "preparation" | "appel" | "sorties" | "completed";

export interface ClientData {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  situationFamiliale?: string;
  situationPro?: string;
  typeClient?: "particulier" | "professionnel" | "entreprise";
}

export interface ContractData {
  numeroContrat?: string;
  type?: string;
  compagnie?: string;
  dateEffet?: Date;
  garanties?: string[];
  prime?: number;
}

export interface M3Analysis {
  completeness: number; // Pourcentage de complétude
  missingData?: string[];
  opportunities?: string[];
}

export interface M3Output {
  der?: string; // Document d'Engagement de Révision
  mail?: string;
  checklist?: string[];
}

export interface M3Session {
  id: string;
  userId: string;
  status: M3SessionStatus;
  clientData?: ClientData;
  contracts?: ContractData[];
  analysis?: M3Analysis;
  outputs?: M3Output;
  createdAt: Date;
  updatedAt: Date;
}
