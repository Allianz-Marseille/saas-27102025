/**
 * Types pour les agents IA (Standard bot-agent-ia-standard.md)
 */

export type CurrentStep = "decouverte" | "devis" | "m_plus_3";

/**
 * Metadata de session injectées dans chaque appel API Mistral.
 * Chaque bot doit lire ces champs pour ancrer la conversation au dossier client
 * et reprendre là où elle s'est arrêtée.
 */
export interface BotSessionMetadata {
  /** Obligatoire : identifie le dossier client */
  client_id: string;
  /** Étape précise dans le parcours (ex: "revenus_bnc") */
  step_id?: string;
  /** Contexte métier agrégé : RO, revenus, garanties déjà collectées */
  context_pro?: Record<string, unknown>;
  /** UID du collaborateur connecté */
  uid_collaborateur: string;
  /** Statut RO : kiné, médecin, etc. */
  client_statut?: string;
  /** Phase dans le tunnel de vente ou de suivi */
  current_step?: CurrentStep;
  /** Indique si une image attend l'analyse de l'expert VISION */
  has_uploaded_file?: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}
