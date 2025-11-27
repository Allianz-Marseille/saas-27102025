import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  email: string;
  role: "ADMINISTRATEUR" | "CDC_COMMERCIAL" | "COMMERCIAL_SANTE_INDIVIDUEL";
  active: boolean;
  createdAt: Date;
}

export interface Act {
  id: string;
  userId: string;
  kind: "AN" | "M+3" | "PRETERME_AUTO" | "PRETERME_IRD";
  clientNom: string;
  numeroContrat: string;
  contratType: string;
  compagnie: string;
  dateEffet: Date | Timestamp;
  dateSaisie: Date | Timestamp;
  primeAnnuelle?: number;
  montantVersement?: number;
  commissionPotentielle: number;
  commissionReelle?: number;
  moisKey: string;
  note?: string;
}

export interface Company {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
}

export interface KPI {
  caMensuel: number;
  caAuto: number;
  caAutres: number;
  nbContrats: number;
  nbContratsAuto: number;
  nbContratsAutres: number;
  ratio: number;
  nbProcess: number;
  commissionsPotentielles: number;
  commissionsReelles: number;
  commissionValidee: boolean;
}

export interface TimelineDay {
  date: Date;
  isSaturday: boolean;
  isSunday: boolean;
  acts: Act[];
}

// Types pour Santé Individuelle
export interface HealthAct {
  id: string;
  userId: string;
  kind: "AFFAIRE_NOUVELLE" | "REVISION" | "ADHESION_SALARIE" | "COURT_TO_AZ" | "AZ_TO_COURTAGE";
  clientNom: string;
  numeroContrat: string;
  dateEffet: Date | Timestamp;
  dateSaisie: Date | Timestamp;
  caAnnuel: number;
  coefficient: number; // Taux de l'acte (0.5 pour AZ->courtage, etc.)
  caPondere: number; // caAnnuel × coefficient
  moisKey: string;
}

export interface HealthKPI {
  caTotal: number;
  caPondere: number;
  nbAffaireNouvelle: number;
  nbRevision: number;
  nbAdhesionSalarie: number;
  nbCourtToAz: number;
  nbAzToCourtage: number;
  commissionsAcquises: number;
  seuilAtteint: number; // 1 à 5
  tauxCommission: number; // 0%, 2%, 3%, 4%, 6%
  objectifRestant: number;
  prochainSeuil: number;
}

