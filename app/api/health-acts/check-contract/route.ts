import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";

/**
 * API route pour vérifier l'unicité d'un numéro de contrat
 * Utilise Firebase Admin SDK pour avoir accès à tous les actes
 * Vérifie UNIQUEMENT les affaires nouvelles dans TOUTES les collections :
 * - acts (commerciaux CDC) : kind === "AN"
 * - health_acts (santé individuelle) : kind === "AFFAIRE_NOUVELLE"
 * - health_collective_acts (santé collective) : types *_AN_*
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { numeroContrat, actId, collection: collectionName } = body;

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

    // Types d'affaires nouvelles pour health_collective_acts
    const healthCollectiveANTypes = [
      "IND_AN_SANTE",
      "IND_AN_PREVOYANCE",
      "IND_AN_RETRAITE",
      "COLL_AN_SANTE",
      "COLL_AN_PREVOYANCE",
      "COLL_AN_RETRAITE",
    ];

    // Vérifier l'unicité dans TOUTES les collections, UNIQUEMENT pour les affaires nouvelles
    // 1. Collection acts (commerciaux CDC) - uniquement kind === "AN"
    const actsSnapshot = await adminDb
      .collection("acts")
      .where("kind", "==", "AN")
      .get();

    const existsInActs = actsSnapshot.docs.some((doc) => {
      const actData = doc.data();
      if (!actData) return false;
      const existingNumber = actData.numeroContrat?.trim().toLowerCase();
      return existingNumber === normalizedNumber;
    });

    if (existsInActs) {
      return NextResponse.json({ exists: true });
    }

    // 2. Collection health_acts (santé individuelle) - uniquement kind === "AFFAIRE_NOUVELLE"
    const healthActsSnapshot = await adminDb
      .collection("health_acts")
      .where("kind", "==", "AFFAIRE_NOUVELLE")
      .get();

    const existsInHealthActs = healthActsSnapshot.docs.some((doc) => {
      // Exclure l'acte actuel si on est en mode modification
      if (actId && collectionName === "health_acts" && doc.id === actId) {
        return false;
      }

      const actData = doc.data();
      if (!actData) return false;
      const existingNumber = actData.numeroContrat?.trim().toLowerCase();
      return existingNumber === normalizedNumber;
    });

    if (existsInHealthActs) {
      return NextResponse.json({ exists: true });
    }

    // 3. Collection health_collective_acts (santé collective) - uniquement types *_AN_*
    const healthCollectiveActsSnapshot = await adminDb
      .collection("health_collective_acts")
      .get();

    const existsInHealthCollectiveActs = healthCollectiveActsSnapshot.docs.some((doc) => {
      // Exclure l'acte actuel si on est en mode modification
      if (actId && collectionName === "health_collective_acts" && doc.id === actId) {
        return false;
      }

      const actData = doc.data();
      if (!actData) return false;

      // Vérifier uniquement si c'est une affaire nouvelle
      if (!healthCollectiveANTypes.includes(actData.kind)) {
        return false;
      }

      const existingNumber = actData.numeroContrat?.trim().toLowerCase();
      return existingNumber === normalizedNumber;
    });

    if (existsInHealthCollectiveActs) {
      return NextResponse.json({ exists: true });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error("Erreur lors de la vérification du numéro de contrat:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la vérification" },
      { status: 500 }
    );
  }
}

