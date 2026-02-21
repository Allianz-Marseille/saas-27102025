/**
 * Configuration des bots IA — Architecture « Bots Outils »
 * Chaque bot = un objectif précis. Cerveau et base de connaissance à fournir via Gemini (phase ultérieure).
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
 * agentId vide tant que les bots Gemini ne sont pas déployés.
 */
export const BOTS: Record<string, BotConfig> = {
  bob: {
    id: "bob",
    name: "Bob",
    agentId: "",
    model: "",
    description: "Expert santé et prévoyance TNS",
  },
};

export function getBotConfig(botId: string): BotConfig | null {
  return BOTS[botId] ?? null;
}
