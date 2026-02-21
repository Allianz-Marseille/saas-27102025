/**
 * API Route pour récupérer le solde de crédits Societe.com
 * GET : Appelle l'endpoint infoclient et renvoie le solde
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";

/**
 * GET /api/societe/credits
 * Retourne le solde de crédits du compte API Societe.com
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const apiKey = process.env.SOCIETE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Configuration API manquante",
          details: "SOCIETE_API_KEY n'est pas configurée.",
        },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.societe.com/api/v1/infoclient", {
      headers: {
        "X-Authorization": `socapi ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur API Societe.com (infoclient):", response.status, errorText);
      return NextResponse.json(
        {
          error: "Impossible de récupérer le solde de crédits",
          details: response.status === 401 || response.status === 403
            ? "Clé API invalide ou non autorisée."
            : `Status ${response.status}`,
        },
        { status: response.status >= 400 ? response.status : 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      solde: data.solde ?? data.credits ?? data,
    });
  } catch (error) {
    console.error("Erreur GET /api/societe/credits:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération du solde",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
