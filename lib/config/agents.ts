/**
 * Table de routage des agents IA (Standard bot-agent-ia-standard.md)
 * Miroir du document de planification - chaque nouvel expert s'ajoute ici.
 */

export type IntentTag = "BILAN" | "VISION" | "SUIVI" | "GENERAL";

export interface AgentConfig {
  agentId: string;
  model: string;
  description: string;
}

/**
 * Table de routage : Tag d'intention → Agent ID Mistral
 * Remplacer les placeholders par les IDs réels depuis la console Mistral.
 */
export const AGENT_ROUTING_TABLE: Record<IntentTag, AgentConfig> = {
  BILAN: {
    agentId: "MISTRAL_AGENT_ID_BILAN_PLACEHOLDER",
    model: "mistral-large-latest",
    description: "Expert Prévoyance - Plan de découverte client",
  },
  VISION: {
    agentId: "MISTRAL_AGENT_ID_VISION_PLACEHOLDER",
    model: "pixtral-12b-2409",
    description: "Expert Analyse d'image - Extraction garanties contrat",
  },
  SUIVI: {
    agentId: "MISTRAL_AGENT_ID_SUIVI_PLACEHOLDER",
    model: "mistral-large-latest",
    description: "Expert M+3 - Conformité Allianz",
  },
  GENERAL: {
    agentId: "MISTRAL_AGENT_ID_GENERAL_PLACEHOLDER",
    model: "mistral-large-latest",
    description: "Expert par défaut (fallback)",
  },
};

export const BIG_BOSS_MODEL = "mistral-small-latest";
