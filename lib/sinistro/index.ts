/**
 * Module Sinistro — qualification des sinistres et conventions inter-assurances.
 * Utilisé par l'agent IA Sinistro et par les API/UI pour afficher convention, assureur gestionnaire et recours.
 */

export { qualifySinister } from "./qualify-sinister";
export { IRSA_CASES, getIrsaCase } from "./irsa-cases";
export type { IrsaCaseDefinition } from "./irsa-cases";
export type {
  SinisterInput,
  SinisterType,
  ConventionCode,
  IrsaCaseCode,
  RecourseType,
  QualifySinisterResult,
  AssureurGestionnaire,
  RecourseDetail,
  ResponsibilitySplit,
} from "./types";
