/**
 * API Route pour le monitoring et les statistiques
 * GET : Récupère les statistiques d'utilisation et le statut du budget
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { getUserUsageStats, getGlobalUsageStats, getDailyStats } from "@/lib/assistant/monitoring";
import { getBudgetStatus, getBudgetConfig, updateBudgetConfig } from "@/lib/assistant/budget-alerts";
import { logAction } from "@/lib/assistant/audit";

/**
 * GET /api/assistant/monitoring
 * Récupère les statistiques d'utilisation
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope"); // "user" ou "global" (admin uniquement)
    const days = parseInt(searchParams.get("days") || "30");

    // Statistiques utilisateur
    if (scope === "user" || !scope) {
      const stats = await getUserUsageStats(auth.userId!);
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Statistiques globales (admin uniquement)
    if (scope === "global") {
      const adminAuth = await verifyAdmin(request);
      if (!adminAuth.valid) {
        return NextResponse.json(
          { error: "Accès administrateur requis" },
          { status: 403 }
        );
      }

      const globalStats = await getGlobalUsageStats();
      const dailyStats = await getDailyStats(days);
      const budgetStatus = await getBudgetStatus();

      return NextResponse.json({
        success: true,
        global: globalStats,
        daily: dailyStats,
        budget: budgetStatus,
      });
    }

    return NextResponse.json(
      { error: "Scope invalide. Utilisez 'user' ou 'global'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur GET /api/assistant/monitoring:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des statistiques",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/assistant/monitoring
 * Met à jour la configuration du budget (admin uniquement)
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json(
        { error: "Accès administrateur requis" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { monthlyBudget, warningThreshold, criticalThreshold, blockAtLimit } = body;

    await updateBudgetConfig({
      monthlyBudget,
      warningThreshold,
      criticalThreshold,
      blockAtLimit,
    });

    // Logger l'action
    await logAction(
      auth.userId!,
      "budget_config_updated",
      {},
      { ip: request.headers.get("x-forwarded-for") || undefined }
    ).catch((err) => console.error("Erreur logging audit:", err));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Erreur PATCH /api/assistant/monitoring:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour de la configuration",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

