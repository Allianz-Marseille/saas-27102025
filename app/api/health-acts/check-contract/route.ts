import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { verifyAuth } from "@/lib/utils/auth-utils";

/**
 * Vérifie l'unicité d'un numéro de contrat dans la collection health_acts
 * (actes santé individuelle — COMMERCIAL_SANTE_INDIVIDUEL)
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

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

    // Vérification globale (tous commerciaux santé individuelle confondus)
    const snapshot = await adminDb
      .collection("health_acts")
      .where("kind", "==", "AFFAIRE_NOUVELLE")
      .get();

    const exists = snapshot.docs.some((doc) => {
      const data = doc.data();
      if (!data) return false;
      return data.numeroContrat?.trim().toLowerCase() === normalizedNumber;
    });

    return NextResponse.json({ exists });
  } catch (error) {
    console.error("Erreur vérification numéro de contrat santé:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la vérification" },
      { status: 500 }
    );
  }
}
