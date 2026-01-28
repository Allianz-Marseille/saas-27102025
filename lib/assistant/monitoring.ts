/**
 * Système de monitoring et suivi des coûts pour l'assistant IA
 */

import { adminDb } from "@/lib/firebase/admin-config";

export interface UsageLog {
  userId: string;
  timestamp: Date;
  endpoint: string;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  model: string;
  hasImages: boolean;
  hasFiles: boolean;
  requestType: "text" | "image" | "file";
  duration?: number; // en millisecondes
  success: boolean;
  error?: string;
}

// Pricing OpenAI (en USD par 1M tokens)
// Source: https://openai.com/pricing (à jour au 2024)
const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": {
    input: 2.5, // $2.50 per 1M input tokens
    output: 10.0, // $10.00 per 1M output tokens
  },
  "gpt-4-turbo": {
    input: 10.0,
    output: 30.0,
  },
  "gpt-4": {
    input: 30.0,
    output: 60.0,
  },
  "gpt-3.5-turbo": {
    input: 0.5,
    output: 1.5,
  },
  "text-embedding-3-small": {
    input: 0.02,
    output: 0.02, // Pas de sortie pour embeddings
  },
};

/**
 * Calcule le coût d'une requête selon le modèle et les tokens utilisés
 */
export function calculateCost(
  tokensInput: number,
  tokensOutput: number,
  model: string
): number {
  const pricing = PRICING[model] || PRICING["gpt-4o"]; // Fallback sur gpt-4o

  const inputCost = (tokensInput / 1_000_000) * pricing.input;
  const outputCost = (tokensOutput / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Log une utilisation de l'API.
 * Ne jamais y passer de body brut, message ou contenu utilisateur (PII).
 */
export async function logUsage(data: {
  userId: string;
  endpoint: string;
  tokensInput: number;
  tokensOutput: number;
  model: string;
  hasImages?: boolean;
  hasFiles?: boolean;
  requestType: "text" | "image" | "file";
  duration?: number;
  success: boolean;
  error?: string;
}): Promise<void> {
  const cost = calculateCost(data.tokensInput, data.tokensOutput, data.model);

  const log: UsageLog = {
    userId: data.userId,
    endpoint: data.endpoint,
    tokensInput: data.tokensInput,
    tokensOutput: data.tokensOutput,
    model: data.model,
    hasImages: data.hasImages === true,
    hasFiles: data.hasFiles === true,
    requestType: data.requestType,
    success: data.success,
    cost,
    timestamp: new Date(),
  };
  if (data.duration !== undefined) {
    log.duration = data.duration;
  }
  if (data.error !== undefined) {
    log.error = data.error;
  }

  await adminDb.collection("assistant_usage_logs").add(log);
}

/**
 * Récupère les statistiques d'utilisation pour un utilisateur
 */
export async function getUserUsageStats(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRequests: number;
  totalCost: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  requestsByType: Record<"text" | "image" | "file", number>;
  requestsByModel: Record<string, number>;
}> {
  let query = adminDb
    .collection("assistant_usage_logs")
    .where("userId", "==", userId);

  if (startDate) {
    query = query.where("timestamp", ">=", startDate) as any;
  }
  if (endDate) {
    query = query.where("timestamp", "<=", endDate) as any;
  }

  const snapshot = await query.get();

  let totalRequests = 0;
  let totalCost = 0;
  let totalTokensInput = 0;
  let totalTokensOutput = 0;
  const requestsByType: Record<"text" | "image" | "file", number> = {
    text: 0,
    image: 0,
    file: 0,
  };
  const requestsByModel: Record<string, number> = {};

  snapshot.docs.forEach((doc) => {
    const data = doc.data() as UsageLog;
    totalRequests++;
    totalCost += data.cost || 0;
    totalTokensInput += data.tokensInput || 0;
    totalTokensOutput += data.tokensOutput || 0;
    requestsByType[data.requestType] = (requestsByType[data.requestType] || 0) + 1;
    requestsByModel[data.model] = (requestsByModel[data.model] || 0) + 1;
  });

  return {
    totalRequests,
    totalCost,
    totalTokensInput,
    totalTokensOutput,
    requestsByType,
    requestsByModel,
  };
}

/**
 * Récupère les statistiques globales (tous utilisateurs)
 */
export async function getGlobalUsageStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRequests: number;
  totalCost: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  uniqueUsers: number;
  requestsByType: Record<"text" | "image" | "file", number>;
  requestsByModel: Record<string, number>;
  topUsers: Array<{ userId: string; requests: number; cost: number }>;
}> {
  let query = adminDb.collection("assistant_usage_logs");

  if (startDate) {
    query = query.where("timestamp", ">=", startDate) as any;
  }
  if (endDate) {
    query = query.where("timestamp", "<=", endDate) as any;
  }

  const snapshot = await query.get();

  let totalRequests = 0;
  let totalCost = 0;
  let totalTokensInput = 0;
  let totalTokensOutput = 0;
  const uniqueUsers = new Set<string>();
  const requestsByType: Record<"text" | "image" | "file", number> = {
    text: 0,
    image: 0,
    file: 0,
  };
  const requestsByModel: Record<string, number> = {};
  const userStats: Record<
    string,
    { requests: number; cost: number }
  > = {};

  snapshot.docs.forEach((doc) => {
    const data = doc.data() as UsageLog;
    totalRequests++;
    totalCost += data.cost || 0;
    totalTokensInput += data.tokensInput || 0;
    totalTokensOutput += data.tokensOutput || 0;
    uniqueUsers.add(data.userId);
    requestsByType[data.requestType] = (requestsByType[data.requestType] || 0) + 1;
    requestsByModel[data.model] = (requestsByModel[data.model] || 0) + 1;

    if (!userStats[data.userId]) {
      userStats[data.userId] = { requests: 0, cost: 0 };
    }
    userStats[data.userId].requests++;
    userStats[data.userId].cost += data.cost || 0;
  });

  const topUsers = Object.entries(userStats)
    .map(([userId, stats]) => ({ userId, ...stats }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);

  return {
    totalRequests,
    totalCost,
    totalTokensInput,
    totalTokensOutput,
    uniqueUsers: uniqueUsers.size,
    requestsByType,
    requestsByModel,
    topUsers,
  };
}

/**
 * Récupère les statistiques par jour
 */
export async function getDailyStats(
  days: number = 30
): Promise<
  Array<{
    date: string;
    requests: number;
    cost: number;
    tokensInput: number;
    tokensOutput: number;
  }>
> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const snapshot = await adminDb
    .collection("assistant_usage_logs")
    .where("timestamp", ">=", startDate)
    .where("timestamp", "<=", endDate)
    .get();

  const dailyStats: Record<
    string,
    { requests: number; cost: number; tokensInput: number; tokensOutput: number }
  > = {};

  snapshot.docs.forEach((doc) => {
    const data = doc.data() as UsageLog;
    const date = new Date(data.timestamp).toISOString().split("T")[0];

    if (!dailyStats[date]) {
      dailyStats[date] = {
        requests: 0,
        cost: 0,
        tokensInput: 0,
        tokensOutput: 0,
      };
    }

    dailyStats[date].requests++;
    dailyStats[date].cost += data.cost || 0;
    dailyStats[date].tokensInput += data.tokensInput || 0;
    dailyStats[date].tokensOutput += data.tokensOutput || 0;
  });

  return Object.entries(dailyStats)
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

