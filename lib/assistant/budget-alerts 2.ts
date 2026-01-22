/**
 * Système d'alertes budget pour l'assistant IA
 */

import { adminDb } from "@/lib/firebase/admin-config";
import { getGlobalUsageStats } from "./monitoring";

export interface BudgetConfig {
  monthlyBudget: number; // Budget mensuel en USD
  warningThreshold: number; // Seuil d'avertissement (80% par défaut)
  criticalThreshold: number; // Seuil critique (95% par défaut)
  blockAtLimit: boolean; // Bloquer à 100% (optionnel)
}

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  monthlyBudget: 100, // $100 par défaut
  warningThreshold: 0.8, // 80%
  criticalThreshold: 0.95, // 95%
  blockAtLimit: false, // Ne pas bloquer par défaut
};

export type AlertLevel = "none" | "warning" | "critical" | "blocked";

export interface BudgetStatus {
  currentMonthCost: number;
  budget: number;
  percentage: number;
  level: AlertLevel;
  remaining: number;
  daysUntilReset: number;
}

/**
 * Récupère ou crée la configuration budget
 */
export async function getBudgetConfig(): Promise<BudgetConfig> {
  const doc = await adminDb.collection("assistant_config").doc("budget").get();
  
  if (doc.exists) {
    const data = doc.data();
    return {
      monthlyBudget: data?.monthlyBudget || DEFAULT_BUDGET_CONFIG.monthlyBudget,
      warningThreshold: data?.warningThreshold || DEFAULT_BUDGET_CONFIG.warningThreshold,
      criticalThreshold: data?.criticalThreshold || DEFAULT_BUDGET_CONFIG.criticalThreshold,
      blockAtLimit: data?.blockAtLimit ?? DEFAULT_BUDGET_CONFIG.blockAtLimit,
    };
  }

  // Créer la configuration par défaut
  await adminDb.collection("assistant_config").doc("budget").set(DEFAULT_BUDGET_CONFIG);
  return DEFAULT_BUDGET_CONFIG;
}

/**
 * Met à jour la configuration budget
 */
export async function updateBudgetConfig(config: Partial<BudgetConfig>): Promise<void> {
  await adminDb.collection("assistant_config").doc("budget").update({
    ...config,
    updatedAt: new Date(),
  });
}

/**
 * Calcule le statut du budget pour le mois en cours
 */
export async function getBudgetStatus(): Promise<BudgetStatus> {
  const config = await getBudgetConfig();
  
  // Date de début du mois en cours
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const stats = await getGlobalUsageStats(startOfMonth, endOfMonth);
  const currentMonthCost = stats.totalCost;
  const percentage = (currentMonthCost / config.monthlyBudget) * 100;
  const remaining = Math.max(0, config.monthlyBudget - currentMonthCost);
  
  // Calculer les jours jusqu'à la fin du mois
  const daysUntilReset = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let level: AlertLevel = "none";
  if (percentage >= 100) {
    level = config.blockAtLimit ? "blocked" : "critical";
  } else if (percentage >= config.criticalThreshold * 100) {
    level = "critical";
  } else if (percentage >= config.warningThreshold * 100) {
    level = "warning";
  }

  return {
    currentMonthCost,
    budget: config.monthlyBudget,
    percentage,
    level,
    remaining,
    daysUntilReset,
  };
}

/**
 * Vérifie si une requête peut être effectuée selon le budget
 */
export async function checkBudgetLimit(): Promise<{ allowed: boolean; reason?: string }> {
  const status = await getBudgetStatus();

  if (status.level === "blocked") {
    return {
      allowed: false,
      reason: `Budget mensuel dépassé (${status.currentMonthCost.toFixed(2)} $ / ${status.budget} $). Les requêtes sont bloquées jusqu'au prochain mois.`,
    };
  }

  return { allowed: true };
}

/**
 * Envoie une alerte si nécessaire
 */
export async function checkAndSendAlerts(): Promise<void> {
  const status = await getBudgetStatus();

  if (status.level === "none") {
    return; // Pas d'alerte nécessaire
  }

  // Vérifier si une alerte a déjà été envoyée pour ce niveau ce mois-ci
  const alertKey = `budget_alert_${status.level}_${new Date().getFullYear()}_${new Date().getMonth()}`;
  const alertDoc = await adminDb.collection("assistant_alerts").doc(alertKey).get();

  if (alertDoc.exists) {
    return; // Alerte déjà envoyée
  }

  // Créer l'alerte
  await adminDb.collection("assistant_alerts").doc(alertKey).set({
    level: status.level,
    message: getAlertMessage(status),
    budgetStatus: status,
    sentAt: new Date(),
  });

  // TODO: Envoyer notification (email, in-app, etc.)
  console.log(`[BUDGET ALERT ${status.level.toUpperCase()}]`, getAlertMessage(status));
}

/**
 * Génère le message d'alerte selon le niveau
 */
function getAlertMessage(status: BudgetStatus): string {
  switch (status.level) {
    case "warning":
      return `Avertissement budget : ${status.percentage.toFixed(1)}% du budget mensuel utilisé (${status.currentMonthCost.toFixed(2)} $ / ${status.budget} $). ${status.remaining.toFixed(2)} $ restants.`;
    case "critical":
      return `Alerte critique budget : ${status.percentage.toFixed(1)}% du budget mensuel utilisé (${status.currentMonthCost.toFixed(2)} $ / ${status.budget} $). ${status.remaining.toFixed(2)} $ restants.`;
    case "blocked":
      return `Budget mensuel dépassé (${status.currentMonthCost.toFixed(2)} $ / ${status.budget} $). Les requêtes sont bloquées jusqu'au prochain mois.`;
    default:
      return "";
  }
}

