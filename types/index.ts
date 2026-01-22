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
  contrat?: string; // CDI, Alternant, etc.
  etp?: string; // Équivalent Temps Plein : 100%, 60%, 50%, etc.
  currentMonthlySalary?: number; // Rémunération mensuelle actuelle en euros
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

// Types pour Rémunérations
export interface SalaryHistory {
  id: string;
  userId: string;
  year: number; // Année d'application de la rémunération
  monthlySalary: number; // Salaire mensuel en euros
  previousMonthlySalary?: number; // Salaire mensuel précédent (pour traçabilité)
  changeType: "initial" | "increase" | "decrease"; // Type de modification
  changeAmount?: number; // Montant de l'augmentation en euros
  changePercentage?: number; // Pourcentage d'augmentation
  validatedAt: Date | Timestamp; // Date de validation
  validatedBy: string; // UID de l'admin qui a validé
  createdAt: Date | Timestamp; // Date de création de l'enregistrement
}

// Types pour les utilisateurs simulés (recrutements)
export interface SimulatedUser {
  id: string; // ID temporaire unique (ex: "simulated-{timestamp}-{index}")
  firstName: string;
  lastName: string;
  email?: string; // Optionnel pour simulation
  currentMonthlySalary: number; // Salaire de départ
  contrat?: string; // Optionnel
  etp?: string; // Optionnel
  role?: string; // Optionnel, pour info
  isSimulated: true; // Flag pour différencier des vrais users
}

// Types pour les brouillons d'augmentations
export interface SalaryDraftItem {
  userId: string;
  type: "percentage" | "amount"; // Type d'augmentation
  value: number; // Valeur (% ou montant)
  currentSalary: number; // Salaire actuel
  newSalary: number; // Nouveau salaire calculé
  isSimulated?: boolean; // Flag pour indiquer si c'est un utilisateur simulé
  simulatedUserData?: {
    firstName: string;
    lastName: string;
    email?: string;
    contrat?: string;
    etp?: string;
  };
}

export interface SalaryDraft {
  id: string;
  year: number; // Année d'application prévue
  items: SalaryDraftItem[]; // Liste des augmentations
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string; // UID du premier admin qui a créé le brouillon
  lastUpdatedBy?: string; // UID du dernier admin qui a modifié le brouillon
}

