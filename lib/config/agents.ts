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
  /** Bot visible uniquement sur la page Test des Bots (admin) tant que true. */
  inTestMode?: boolean;
}

/**
 * Table des bots : botId → config
 * agentId vide tant que les bots Gemini ne sont pas déployés.
 */
export const BOTS: Record<string, BotConfig> = {
  bob: {
    id: "bob",
    name: "Bob TNS",
    agentId: "",
    model: "",
    description: "Expert en prévoyance",
    inTestMode: false,
  },
  lea: {
    id: "lea",
    name: "Léa",
    agentId: "",
    model: "",
    description: "Expert Santé Individuelle",
  },
  "john-coll": {
    id: "john-coll",
    name: "John",
    agentId: "",
    model: "",
    description: "Expert Santé, Prévoyance et Retraite Collectives",
  },
  dede: {
    id: "dede",
    name: "Dédé",
    agentId: "",
    model: "",
    description: "Expert marchés du professionnel : artisans, commerçants et professions libérales",
  },
};

export function getBotConfig(botId: string): BotConfig | null {
  return BOTS[botId] ?? null;
}

export function getBotsInTestMode(): string[] {
  return Object.entries(BOTS)
    .filter(([, config]) => config.inTestMode === true)
    .map(([botId]) => botId);
}
