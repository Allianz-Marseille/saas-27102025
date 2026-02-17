/**
 * Configuration des bots IA — Architecture « Bots Outils »
 * Chaque bot = 1 agent Mistral (ID depuis la console) = 1 objectif précis.
 */

export interface BotConfig {
  id: string;
  name: string;
  agentId: string;
  model: string;
  description: string;
}

/**
 * Table des bots : botId → config
 * MISTRAL_AGENT_BOB doit être défini dans .env / Vercel (ID agent depuis la console Mistral).
 */
export const BOTS: Record<string, BotConfig> = {
  bob: {
    id: "bob",
    name: "Bob",
    agentId: process.env.MISTRAL_AGENT_BOB ?? "",
    model: "mistral-large-latest",
    description: "Expert santé et prévoyance TNS",
  },
};

export function getBotConfig(botId: string): BotConfig | null {
  return BOTS[botId] ?? null;
}
