/**
 * Types pour le module Sinistres
 */

import { Timestamp } from "firebase/firestore";

/**
 * Statuts des sinistres (12 statuts universels)
 */
export enum SinistreStatus {
  A_QUALIFIER = "À qualifier",
  EN_ATTENTE_PIECES_ASSURE = "En attente pièces assuré",
  EN_ATTENTE_INFOS_TIERS = "En attente infos tiers",
  MISSION_EN_COURS = "Mission en cours",
  EN_ATTENTE_DEVIS = "En attente devis",
  EN_ATTENTE_RAPPORT = "En attente rapport",
  EN_ATTENTE_ACCORD_COMPAGNIE = "En attente accord compagnie",
  TRAVAUX_EN_COURS = "Travaux en cours",
  EN_ATTENTE_FACTURE = "En attente facture",
  REGLEMENT_EN_COURS = "Règlement en cours",
  CLOS = "Clos",
  LITIGE_CONTESTATION = "Litige / contestation",
}

/**
 * Routes de gestion (A à F)
 */
export enum SinistreRoute {
  ROUTE_A = "Route A - Réparation pilotée / réseau d'artisans",
  ROUTE_B = "Route B - Expertise dommages",
  ROUTE_C = "Route C - Auto matériel conventionnel (IRSA)",
  ROUTE_D = "Route D - Auto corporel (IRCA)",
  ROUTE_E = "Route E - Immeuble / dégât des eaux / incendie (IRSI)",
  ROUTE_F = "Route F - Responsabilité / litige / protection juridique",
  NON_DEFINIE = "Route non définie",
}

/**
 * Document principal d'un sinistre
 */
export interface Sinistre {
  id?: string;
  // Données de base (depuis Excel)
  clientName: string;
  clientLagonNumber: string;
  policyNumber: string; // Source de vérité pour déduplication
  policyCategory: string;
  productType: string;
  claimNumber: string; // Identifiant unique sinistre
  incidentDate: Date | Timestamp;
  amountPaid: number;
  remainingAmount: number;
  recourse: boolean;
  damagedCoverage: string;
  
  // Champs calculés
  totalAmountPaid: number; // Somme de tous les montants payés (lignes principales + partielles)
  totalAmount: number; // amountPaid + remainingAmount
  
  // Métadonnées d'import
  importDate: Date | Timestamp;
  excelVersion: string; // Nom du fichier Excel source
  
  // Gestion manuelle
  route?: SinistreRoute;
  status?: SinistreStatus;
  assignedTo?: string; // userId du chargé de clientèle
  assignedToEmail?: string; // Email du chargé de clientèle (pour affichage)
  
  // Notes et historique (sous-collections)
  notesCount?: number;
  historyCount?: number;
  
  // Métadonnées système
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy?: string;
  lastUpdatedBy?: string;
  source?: "excel" | "google-sheets" | "manual";
}

/**
 * Note sur un sinistre
 */
export interface SinistreNote {
  id?: string;
  sinistreId: string;
  content: string;
  authorId: string;
  authorEmail: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

/**
 * Historique des modifications d'un sinistre
 */
export interface SinistreHistory {
  id?: string;
  sinistreId: string;
  type: "status_change" | "route_change" | "assignment_change" | "amount_change" | "note_added" | "note_updated" | "note_deleted" | "field_update";
  field?: string; // Nom du champ modifié
  oldValue?: any;
  newValue?: any;
  authorId: string;
  authorEmail: string;
  timestamp: Date | Timestamp;
  description?: string; // Description lisible de la modification
}

/**
 * Résultat d'import Excel
 */
export interface ExcelImportResult {
  totalLines: number;
  newSinistres: number;
  existingSinistres: number;
  updatedSinistres: number;
  errors: Array<{ line: number; error: string }>;
  excelVersion: string;
  importDate: Date | Timestamp;
}

/**
 * Filtres de recherche pour les sinistres
 */
export interface SinistreFilters {
  // Filtres temporels
  year?: number;
  month?: number; // 1-12
  week?: number; // 1-52
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  // Filtres par caractéristiques
  damagedCoverage?: string;
  route?: SinistreRoute;
  status?: SinistreStatus[];
  assignedTo?: string; // userId
  
  // Filtres montants
  amountMin?: number;
  amountMax?: number;
  
  // Filtres booléens
  hasTiers?: boolean;
  hasRecourse?: boolean;
  
  // Recherche textuelle
  searchText?: string; // Recherche dans nom client, numéro police, numéro sinistre, etc.
  
  // Pagination
  limit?: number;
  offset?: number;
}

/**
 * Métriques KPIs du dashboard
 */
export interface SinistreKPI {
  // KPIs permanents
  totalOpen: number; // Sinistres ouverts
  totalAlerts: number; // Sinistres en retard/alertes
  totalUnassigned: number; // Sinistres non affectés
  totalAmountOpen: number; // Montant total ouvert (somme reste à payer)
  distributionByRoute: Record<SinistreRoute, number>; // Répartition par route
  distributionByStatus: Record<SinistreStatus, number>; // Répartition par statut
  pendingDocuments: number; // Sinistres en attente de pièces (depuis X jours)
  averageProcessingTime: number; // Délai moyen de traitement (jours)
  closureRate: number; // Taux de clôture (pourcentage)
  withRecourse: {
    count: number;
    amount: number;
  }; // Sinistres avec recours
  
  // KPI dernier import
  lastImport?: LastImportInfo;
}

/**
 * Métadonnées du dernier import Excel
 */
export interface LastImportInfo {
  importDate: Date | Timestamp;
  excelVersion: string;
  newSinistres: number;
  totalLines: number;
  isRecent: boolean; // < 7 jours
}

/**
 * Résultat CSV (pour compatibilité avec l'existant)
 */
export interface CSVImportResult {
  totalLines: number;
  newSinistres: number;
  existingSinistres: number;
  updatedSinistres: number;
  errors: Array<{ line: number; error: string }>;
  csvVersion: string;
  importDate: Date;
}
