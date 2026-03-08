/**
 * API Route pour mettre à jour automatiquement le leaderboard
 *
 * Appelée par un cron job (Vercel Cron ou externe) quotidiennement.
 * Sécurisée par Bearer CRON_SECRET.
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb, Timestamp } from "@/lib/firebase/admin-config";

// Sous-ensemble des champs Act utilisés pour les calculs KPI
interface ActSnapshot {
  userId?: string;
  kind?: string;
  contratType?: string;
  commissionPotentielle?: number;
  primeAnnuelle?: number;
  montantVersement?: number;
}

interface UserSnapshot {
  id?: string;
  email?: string;
  role?: string;
}

interface LeaderboardEntry {
  userId: string;
  email: string;
  firstName: string;
  monthKey: string;
  commissions: number;
  process: number;
  ca: number;
  actsCount: number;
  lastUpdated: ReturnType<typeof Timestamp.now>;
}

/**
 * POST /api/cron/update-leaderboard
 */
export async function POST(request: NextRequest) {
  // Vérification du secret CRON
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const currentMonthKey = new Date().toISOString().slice(0, 7); // YYYY-MM

    // 1. Récupérer les commerciaux et les actes du mois en parallèle
    const [usersSnapshot, actsSnapshot, existingLeaderboardSnapshot] = await Promise.all([
      adminDb.collection("users").get(),
      adminDb.collection("acts").where("moisKey", "==", currentMonthKey).get(),
      adminDb.collection("leaderboard").where("monthKey", "==", currentMonthKey).get(),
    ]);

    const users = usersSnapshot.docs
      .map((d) => d.data() as UserSnapshot)
      .filter((u) => u.role === "CDC_COMMERCIAL" && u.id);

    // 2. Grouper les actes par utilisateur
    const actsByUser = new Map<string, ActSnapshot[]>();
    actsSnapshot.docs.forEach((d) => {
      const act = d.data() as ActSnapshot;
      if (!act.userId) return;
      const existing = actsByUser.get(act.userId) ?? [];
      existing.push(act);
      actsByUser.set(act.userId, existing);
    });

    // 3. Pré-indexer les entrées leaderboard existantes (évite N+1 requêtes)
    const existingByUser = new Map<string, FirebaseFirestore.DocumentReference>();
    existingLeaderboardSnapshot.docs.forEach((d) => {
      const data = d.data() as { userId?: string };
      if (data.userId) existingByUser.set(data.userId, d.ref);
    });

    // 4. Construire le batch
    const batch = adminDb.batch();
    let updatedCount = 0;

    for (const user of users) {
      if (!user.id || !user.email) continue;

      const userActs = actsByUser.get(user.id) ?? [];
      const kpi = calculateUserKPI(userActs);

      const entry: LeaderboardEntry = {
        userId: user.id,
        email: user.email,
        firstName: extractFirstName(user.email),
        monthKey: currentMonthKey,
        commissions: kpi.commissions,
        process: kpi.process,
        ca: kpi.ca,
        actsCount: kpi.actsCount,
        lastUpdated: Timestamp.now(),
      };

      if (existingByUser.has(user.id)) {
        batch.update(existingByUser.get(user.id)!, entry as unknown as Record<string, unknown>);
      } else {
        batch.set(adminDb.collection("leaderboard").doc(), entry);
      }

      updatedCount++;
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      monthKey: currentMonthKey,
      commercialsCount: users.length,
      actsCount: actsSnapshot.size,
      updatedCount,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[CRON] Erreur update-leaderboard:", errorMessage);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du leaderboard", details: errorMessage },
      { status: 500 }
    );
  }
}

function calculateUserKPI(acts: ActSnapshot[]): {
  commissions: number;
  process: number;
  ca: number;
  actsCount: number;
} {
  let commissions = 0;
  let process = 0;
  let ca = 0;

  for (const act of acts) {
    const isProcess =
      act.kind === "M+3" || act.kind === "PRETERME_AUTO" || act.kind === "PRETERME_IRD";

    if (isProcess) {
      process++;
    } else {
      commissions += act.commissionPotentielle ?? 0;
    }

    ca += act.contratType === "VIE_PU"
      ? (act.montantVersement ?? 0)
      : (act.primeAnnuelle ?? 0);
  }

  return {
    commissions: Math.round(commissions * 100) / 100,
    process,
    ca: Math.round(ca * 100) / 100,
    actsCount: acts.length,
  };
}

function extractFirstName(email: string): string {
  const raw = email.split("@")[0].split(".")[0] ?? "Commercial";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}
