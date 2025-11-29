/**
 * API Route pour mettre à jour automatiquement le leaderboard
 * 
 * Cette route est appelée par un cron job (Vercel Cron ou externe)
 * pour mettre à jour le leaderboard quotidiennement
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb, Timestamp } from "@/lib/firebase/admin-config";

/**
 * POST /api/cron/update-leaderboard
 * 
 * Met à jour le leaderboard pour le mois en cours
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification de la clé d'autorisation (sécurité)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const currentMonthKey = new Date().toISOString().slice(0, 7); // YYYY-MM

    console.log(`[CRON] Mise à jour du leaderboard pour ${currentMonthKey}...`);

    // 1. Récupérer tous les commerciaux
    const usersSnapshot = await adminDb.collection("users").get();
    const users = usersSnapshot.docs
      .map((doc) => doc.data())
      .filter((user) => user.role === "CDC_COMMERCIAL");

    console.log(`[CRON] ${users.length} commerciaux trouvés`);

    // 2. Récupérer tous les actes du mois
    const actsSnapshot = await adminDb
      .collection("acts")
      .where("moisKey", "==", currentMonthKey)
      .get();

    console.log(`[CRON] ${actsSnapshot.size} actes trouvés`);

    // 3. Grouper les actes par utilisateur
    const actsByUser = new Map<string, any[]>();
    actsSnapshot.docs.forEach((doc) => {
      const act = doc.data();
      if (!actsByUser.has(act.userId)) {
        actsByUser.set(act.userId, []);
      }
      actsByUser.get(act.userId)!.push(act);
    });

    // 4. Calculer les KPI et créer/mettre à jour les documents leaderboard
    const batch = adminDb.batch();
    let updatedCount = 0;

    for (const user of users) {
      const userActs = actsByUser.get(user.id) || [];
      const kpi = calculateUserKPI(userActs);
      const firstName = extractFirstName(user.email);

      const leaderboardData = {
        userId: user.id,
        email: user.email,
        firstName,
        monthKey: currentMonthKey,
        commissions: kpi.commissions,
        process: kpi.process,
        ca: kpi.ca,
        actsCount: kpi.actsCount,
        lastUpdated: Timestamp.now(),
      };

      // Vérifier si une entrée existe déjà
      const existingQuery = await adminDb
        .collection("leaderboard")
        .where("userId", "==", user.id)
        .where("monthKey", "==", currentMonthKey)
        .get();

      if (existingQuery.empty) {
        // Créer une nouvelle entrée
        const newDocRef = adminDb.collection("leaderboard").doc();
        batch.set(newDocRef, leaderboardData);
      } else {
        // Mettre à jour l'entrée existante
        const existingDocRef = existingQuery.docs[0].ref;
        batch.update(existingDocRef, leaderboardData);
      }

      updatedCount++;
    }

    // 5. Commit le batch
    await batch.commit();

    console.log(`[CRON] Leaderboard mis à jour: ${updatedCount} entrées`);

    return NextResponse.json({
      success: true,
      monthKey: currentMonthKey,
      commercialsCount: users.length,
      actsCount: actsSnapshot.size,
      updatedCount,
    });
  } catch (error: unknown) {
    console.error("[CRON] Erreur:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la mise à jour du leaderboard",
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

/**
 * Calcule les KPI d'un utilisateur
 */
function calculateUserKPI(acts: any[]): {
  commissions: number;
  process: number;
  ca: number;
  actsCount: number;
} {
  let commissions = 0;
  let process = 0;
  let ca = 0;

  acts.forEach((act) => {
    const isProcess =
      act.kind === "M+3" ||
      act.kind === "PRETERME_AUTO" ||
      act.kind === "PRETERME_IRD";

    if (isProcess) {
      process++;
    } else {
      commissions += act.commissionPotentielle || 0;
    }

    // CA = primeAnnuelle pour la plupart, montantVersement pour VIE_PU
    if (act.contratType === "VIE_PU") {
      ca += act.montantVersement || 0;
    } else {
      ca += act.primeAnnuelle || 0;
    }
  });

  return {
    commissions: Math.round(commissions * 100) / 100,
    process,
    ca: Math.round(ca * 100) / 100,
    actsCount: acts.length,
  };
}

/**
 * Extrait le prénom depuis l'email
 */
function extractFirstName(email: string): string {
  const emailParts = email.split("@")[0].split(".");
  const rawFirstName = emailParts[0] || "Commercial";
  return (
    rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase()
  );
}

