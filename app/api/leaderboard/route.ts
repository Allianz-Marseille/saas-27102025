/**
 * API Route pour récupérer les données du leaderboard
 * 
 * Cette route utilise Firebase Admin SDK côté serveur pour accéder
 * à la collection leaderboard de manière sécurisée.
 * 
 * Exemple d'utilisation du module admin-config.ts pour les Server Actions
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";

/**
 * GET /api/leaderboard
 * 
 * Query params:
 * - monthKey: format YYYY-MM (défaut: mois en cours)
 * - limit: nombre de résultats (défaut: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Récupérer le mois depuis les params ou utiliser le mois actuel
    const monthKey = searchParams.get("monthKey") || 
      new Date().toISOString().slice(0, 7);
    
    const limitCount = parseInt(searchParams.get("limit") || "10", 10);

    // Exemple d'utilisation de Firebase Admin SDK
    const leaderboardRef = adminDb.collection("leaderboard");
    const query = leaderboardRef
      .where("monthKey", "==", monthKey)
      .orderBy("commissions", "desc")
      .limit(limitCount);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json({
        monthKey,
        data: [],
        message: "Aucune donnée disponible pour ce mois"
      });
    }

    const leaderboardData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      monthKey,
      data: leaderboardData,
      count: leaderboardData.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching leaderboard:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        error: "Failed to fetch leaderboard data",
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

