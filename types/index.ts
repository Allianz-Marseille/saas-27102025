import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  email: string;
  role: "ADMINISTRATEUR" | "CDC_COMMERCIAL" | "COMMERCIAL_SANTE_INDIVIDUEL" | "COMMERCIAL_SANTE_COLLECTIVE" | "GESTIONNAIRE_SINISTRE";
  active: boolean;
  createdAt: Date;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ActSuivi {
  appelTelephonique?: "OK" | "KO";
  miseAJourFicheLagoon?: "OK" | "KO";
  bilanEffectue?: "OK" | "KO";
  smsMailCoordonnees?: "OK" | "KO"; // Tag complémentaire affiché à chaque KO
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
  // Tags de suivi d'appel téléphonique
  anSuivi?: ActSuivi;
  m3Suivi?: ActSuivi;
  pretermeSuivi?: ActSuivi;
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
  compagnie: string;
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

// Types pour Santé Collective
export type HealthCollectiveActKind = 
  | "IND_AN_SANTE"
  | "IND_AN_PREVOYANCE"
  | "IND_AN_RETRAITE"
  | "COLL_AN_SANTE"
  | "COLL_AN_PREVOYANCE"
  | "COLL_AN_RETRAITE"
  | "COLL_ADHESION_RENFORT"
  | "REVISION"
  | "ADHESION_RENFORT"
  | "COURTAGE_TO_ALLIANZ"
  | "ALLIANZ_TO_COURTAGE";

export type HealthCollectiveActOrigin = "PROACTIF" | "REACTIF" | "PROSPECTION";

export interface HealthCollectiveAct {
  id: string;
  userId: string;
  kind: HealthCollectiveActKind;
  origine: HealthCollectiveActOrigin;
  clientNom: string;
  numeroContrat: string;
  compagnie: string;
  dateEffet: Date | Timestamp;
  dateSaisie: Date | Timestamp;
  prime: number; // Montant de la prime
  caAnnuel: number; // Égal à prime
  coefficientOrigine: number;
  coefficientTypeActe: number;
  coefficientCompagnie: number;
  caPondere: number; // prime × coefficientOrigine × coefficientTypeActe × coefficientCompagnie
  moisKey: string;
}

export interface HealthCollectiveKPI {
  total: number;
  caIndANSante: number;
  caIndANPrevoyance: number;
  caIndANRetraite: number;
  caCollANSante: number;
  caCollANPrevoyance: number;
  caCollANRetraite: number;
  caCollAdhesionRenfort: number;
  caRevision: number;
  caAdhesionRenfort: number;
  caCourtageToAllianz: number;
  caAllianzToCourtage: number;
  caBrut: number;
  caPondere: number;
  commissionsAcquises: number;
  seuilAtteint: number; // 1 à 5
  tauxCommission: number; // 0%, 2%, 3%, 4%, 6%
  objectifRestant: number;
  prochainSeuil: number;
}

// Types pour Commissions Agence
export interface AgencyCommission {
  id: string;
  year: number;
  month: number; // 1-12
  commissionsIARD: number;
  commissionsVie: number;
  commissionsCourtage: number;
  profitsExceptionnels: number;
  totalCommissions: number; // Calculé: IARD + Vie + Courtage + Profits
  chargesAgence: number;
  resultat: number; // Calculé: Total - Charges
  prelevementsJulien: number;
  prelevementsJeanMichel: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string;
  lastUpdatedBy: string;
}

