import { Timestamp } from "firebase/firestore";

// ─── Agences ───────────────────────────────────────────────────────────────

export type AgenceCode = "H91358" | "H92083";

export const AGENCES: Record<AgenceCode, { nom: string; label: string }> = {
  H91358: { nom: "La Corniche (Kennedy)", label: "H91358 – Corniche" },
  H92083: { nom: "La Rouvière", label: "H92083 – Rouvière" },
};

// ─── Chargé de clientèle ───────────────────────────────────────────────────

export interface TrelloMapping {
  trelloBoardId: string;
  trelloListId: string;
  trelloListName?: string;  // nom lisible de la colonne cible
  trelloBoardUrl: string;
  trelloListUrl: string;
  trelloMemberId?: string;
}

export interface Absence {
  remplacantId: string; // id du CDC remplaçant (dans la même config)
  dateDebut?: string;   // ISO date optionnelle
  dateFin?: string;     // ISO date optionnelle
}

export interface ChargeDeClientele {
  id: string;           // UUID généré côté client
  prenom: string;
  lettresDebut: string; // ex: "A"
  lettresFin: string;   // ex: "C"
  trello: TrelloMapping | null;
  absence?: Absence;    // présent si le CDC est absent ce mois
}

// ─── Config mensuelle ──────────────────────────────────────────────────────

export interface AgenceConfig {
  code: AgenceCode;
  charges: ChargeDeClientele[];
}

export interface PretermeConfig {
  id: string;
  moisKey: string;        // ex: "2026-04"
  branche: "AUTO";
  seuilEtp: number;       // défaut 120
  seuilVariation: number; // défaut 20 (%)
  agences: AgenceConfig[];
  slackChannelId?: string;
  valide: boolean;
  workflow?: {
    lastStep?: PretermeWorkflowStep;
    completedSteps?: Partial<Record<PretermeWorkflowStep, boolean>>;
  };
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string;
}

export type PretermeWorkflowStep =
  | "periode"
  | "upload"
  | "filtrage"
  | "validation"
  | "modulation"
  | "dispatch"
  | "synthese";

// ─── Import ────────────────────────────────────────────────────────────────

export type ImportStatut =
  | "DRAFT"
  | "CLASSIFICATION"
  | "VALIDATION_SOCIETES"
  | "PRET"
  | "DISPATCH_TRELLO"
  | "TERMINE";

export interface PretermeImport {
  id: string;
  moisKey: string;
  agence: AgenceCode;
  branche: "AUTO";
  statut: ImportStatut;
  typesValidatedAt?: Date | Timestamp | null;
  pretermesGlobaux: number;
  pretermesConserves: number;
  seuilEtpApplique: number;
  seuilVariationApplique: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string;
}

// ─── Client (ligne préterme) ───────────────────────────────────────────────

export type TypeEntite = "particulier" | "societe" | "a_valider";
export type ClientStatut = "EN_ATTENTE" | "CARTE_CREEE" | "ERREUR";

export interface PretermeClient {
  id: string;
  importId: string;
  moisKey: string;
  agence: AgenceCode;
  branche: "AUTO";

  // Colonnes export Allianz (20 colonnes)
  nomClient: string;
  numeroContrat: string;
  brancheContrat: string;
  echeancePrincipale: string;
  codeProduit: string;
  modeReglement: string;
  codeFractionnement: string;
  primeTTCAnnuellePrecedente: number | null;
  primeTTCAnnuelleActualisee: number | null;
  tauxVariation: number | null;
  surveillancePortefeuille: string;
  avantageClient: string;
  formule: string;
  packs: string;
  nbSinistres: number | null;
  bonusMalus: string;
  etp: number | null;
  codeGestionCentrale: string;
  tauxModulationCommission: string;
  dateDernierAvenant: string;

  // Traitement
  typeEntite: TypeEntite;
  nomGerant?: string;
  geminiConfidence?: number;
  conserve: boolean;
  chargeAttribue?: string;   // prénom du CDC
  chargeId?: string;         // id du CDC dans la config

  // Trello
  trelloCardId?: string;
  trelloCardUrl?: string;
  statut: ClientStatut;

  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// ─── Log Trello ────────────────────────────────────────────────────────────

export interface PretermeLog {
  id: string;
  importId: string;
  moisKey: string;
  numeroContrat: string;
  agence: AgenceCode;
  chargeAttribue: string;
  trelloBoardId: string;
  trelloListId: string;
  trelloCardId: string;
  createdAt: Date | Timestamp;
}

// ─── Overrides qualité (mémoire IA) ─────────────────────────────────────────

export interface PretermeQualityOverride {
  id: string;
  normalizedName: string;
  entityType: "particulier" | "societe";
  source: "manual";
  createdBy: string;
  updatedBy: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  examples?: string[];
}

// ─── KPI ───────────────────────────────────────────────────────────────────

export interface PretermeKPI {
  moisKey: string;
  globaux: number;
  conserves: number;
  ratioConservation: number;
  parAgence: Record<AgenceCode, { globaux: number; conserves: number; ratio: number }>;
  parCharge: Record<string, number>; // prénom → nb clients conservés
}
