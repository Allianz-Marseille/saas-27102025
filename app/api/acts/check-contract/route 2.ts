import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";

/**
 * API route pour vérifier l'unicité d'un numéro de contrat
 * Utilise Firebase Admin SDK pour avoir accès à tous les actes
 */
export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const { numeroContrat } = body;

    if (!numeroContrat || typeof numeroContrat !== "string") {
      return NextResponse.json(
        { error: "Numéro de contrat requis" },
        { status: 400 }
      );
    }

    const normalizedNumber = numeroContrat.trim().toLowerCase();
    if (!normalizedNumber) {
      return NextResponse.json({ exists: false });
    }

    // Récupérer TOUS les actes de type "AN" (tous commerciaux confondus) pour la vérification d'unicité
    // IMPORTANT : Pas de filtre par userId - on vérifie l'unicité globale
    // Les prétermes peuvent avoir le même numéro plusieurs fois (suivi temporel)
    const actsSnapshot = await adminDb
      .collection("acts")
      .where("kind", "==", "AN")
      .get();

    // Vérifier si un numéro de contrat existe (comparaison insensible à la casse)
    // UNIQUEMENT parmi les actes AN
    const exists = actsSnapshot.docs.some((doc) => {
      const actData = doc.data();
      if (!actData) return false;
      const existingNumber = actData.numeroContrat?.trim().toLowerCase();
      return existingNumber === normalizedNumber;
    });

    return NextResponse.json({ exists });
  } catch (error) {
    console.error("Erreur lors de la vérification du numéro de contrat:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la vérification" },
      { status: 500 }
    );
  }
}

