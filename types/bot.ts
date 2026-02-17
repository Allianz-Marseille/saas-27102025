/**
 * Types pour les agents IA (Standard bot-agent-ia-standard.md)
 */

export type CurrentStep = "decouverte" | "devis" | "m_plus_3";

/**
 * Metadata de session injectées dans chaque appel API Mistral (optionnel).
 * En mode standalone (page Agents IA), client_id et uid_collaborateur peuvent être absents.
 * Depuis un dossier client, ces champs ancrent la conversation au bon dossier.
 */
export interface BotSessionMetadata {
  /** Identifie le dossier client (optionnel en mode standalone) */
  client_id?: string;
  /** Étape précise dans le parcours (ex: "revenus_bnc") */
  step_id?: string;
  /** Contexte métier agrégé : RO, revenus, garanties déjà collectées */
  context_pro?: Record<string, unknown>;
  /** UID du collaborateur connecté (optionnel en mode standalone) */
  uid_collaborateur?: string;
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
