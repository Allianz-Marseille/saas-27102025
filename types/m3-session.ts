/**
 * Types TypeScript pour les sessions M+3
 * Basés sur le document docs/process/m+3/m+3_ia.md
 */

import { Timestamp } from "firebase/firestore";

/**
 * Type de client
 */
export type ClientType = "particulier" | "tns" | "entreprise";

/**
 * Statut d'une session M+3
 */
export type M3SessionStatus = "preparation" | "appel" | "completed";

/**
 * Données client - Personne physique
 */
export interface ClientDataPhysique {
  type: "particulier";
  numeroLagon?: string;
  dateCreationFiche?: Date | Timestamp;
  genre?: "M" | "F" | "Autre";
  prenom?: string;
  nom?: string;
  adresseComplete?: string;
  codePostal?: string;
  ville?: string;
  mail?: string;
  telephone?: string;
  dateNaissance?: Date | Timestamp;
  lieuNaissance?: string;
  situationMatrimoniale?: "Célibataire" | "Marié(e)" | "Pacsé(e)" | "Divorcé(e)" | "Veuf(ve)";
  enfants?: {
    aEnfants: boolean;
    nombre?: number;
  };
  situationProfessionnelle?: string;
  // Champs additionnels
  agence?: string;
  pointDeVente?: string;
  chargeDeClientele?: string;
}

/**
 * Données client - Personne morale
 */
export interface ClientDataMorale {
  type: "tns" | "entreprise";
  numeroLagon?: string;
  dateCreationFiche?: Date | Timestamp;
  raisonSociale?: string;
  quiLaGere?: string; // Personne physique qui gère
  telephone?: string;
  mail?: string;
  siret?: string;
  naf?: string;
  dateCreation?: Date | Timestamp;
  // Champs additionnels
  agence?: string;
  pointDeVente?: string;
  chargeDeClientele?: string;
  contactGestionAssurances?: string;
}

/**
 * Union type pour les données client
 */
export type ClientData = ClientDataPhysique | ClientDataMorale;

/**
 * Contrat détecté et validé
 */
export interface ContractData {
  id: string; // ID unique du contrat
  type: string; // Type de contrat (auto_moto, mrh_habitation, etc.)
  libelle: string; // Libellé lisible
  numeroContrat?: string;
  compagnie?: string;
  dateEffet?: Date | Timestamp;
  statut: "detecte" | "confirme" | "rejete";
  piecesManquantes?: string[]; // Liste des pièces manquantes
  signe?: boolean;
  notes?: string;
}

/**
 * Analyse M+3 avec les 3 catégories
 */
export interface M3Analysis {
  // ✅ Ce qui est présent mais à confirmer
  aConfirmer: {
    donneesClient: Array<{
      champ: string;
      valeur: string;
      question?: string;
    }>;
    contrats: Array<{
      contrat: string;
      question?: string;
    }>;
    pieces: Array<{
      piece: string;
      statut: "incertain" | "mentionne";
    }>;
  };
  // ❌ Ce qui est absent et à compléter
  aCompleter: {
    champsManquants: Array<{
      champ: string;
      question: string;
      priorite: "critique" | "important" | "normal";
    }>;
    piecesManquantes: Array<{
      piece: string;
      contrat: string;
      question: string;
    }>;
  };
  // 🎯 Axes commerciaux prioritaires
  axesPrioritaires: {
    trousLogiques: Array<{
      contrat: string;
      raison: string;
      priorite: number; // 1 = le plus prioritaire
    }>;
    opportunitesCommerciales: Array<{
      contrat: string;
      libelle: string;
      raison: string;
      priorite: number; // TOP 3
      lienTarificateur?: string;
    }>;
    questionsCles: string[];
    planActionSuggere: Array<{
      action: string;
      type: "devis" | "rdv" | "doc" | "relance";
      echeance?: Date | Timestamp;
    }>;
  };
}

/**
 * Sortie DER (conformité documentaire)
 */
export interface M3OutputDER {
  type: "der";
  contenu: string; // Markdown structuré
  dateGeneration: Date | Timestamp;
  conforme: boolean;
}

/**
 * Sortie Mail avec préconisations
 */
export interface M3OutputMail {
  type: "mail";
  objet: string;
  contenu: string; // Markdown avec liens tarificateurs
  opportunites: Array<{
    contrat: string;
    libelle: string;
    lienTarificateur: string;
  }>;
  planAction: Array<{
    action: string;
    date: Date | Timestamp;
  }>;
  dateGeneration: Date | Timestamp;
}

/**
 * Sortie Checklist qualité
 */
export interface M3OutputChecklist {
  type: "checklist";
  contenu: string; // Markdown avec ✅/❌/⚠️
  resume: {
    total: number;
    valide: number;
    aConfirmer: number;
    aCompleter: number;
  };
  dateGeneration: Date | Timestamp;
}

/**
 * Union type pour les sorties
 */
export type M3Output = M3OutputDER | M3OutputMail | M3OutputChecklist;

/**
 * Session M+3 complète
 */
export interface M3Session {
  id: string;
  userId: string;
  status: M3SessionStatus;
  clientData?: ClientData;
  contracts: ContractData[];
  analysis?: M3Analysis;
  outputs: M3Output[];
  // Données brutes des fiches Lagon (pour référence)
  rawClientFiche?: string;
  rawContractFiche?: string;
  // Métadonnées
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  completedAt?: Date | Timestamp;
}

/**
 * Réponse structurée du bot avec boutons
 */
export interface M3BotResponse {
  message: string;
  buttons?: Array<{
    label: string;
    value: string;
    type: "binary" | "multiple" | "validation";
  }>;
  analysis?: Partial<M3Analysis>;
  metadata?: {
    phase: "preparation" | "appel" | "sorties";
    requiresInput?: boolean;
  };
}
