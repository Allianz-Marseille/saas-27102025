import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";

/**
 * API route pour vérifier l'unicité d'un numéro de contrat santé
 * Utilise Firebase Admin SDK pour avoir accès à tous les actes santé
 * Vérifie dans TOUTES les collections santé (health_acts et health_collective_acts)
 * pour TOUS les types d'actes (tous les commerciaux confondus)
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

    // Vérifier l'unicité dans TOUTES les collections santé
    // health_acts (santé individuelle) et health_collective_acts (santé collective)
    const collections = ["health_acts", "health_collective_acts"];

    for (const collName of collections) {
      // Récupérer TOUS les actes de cette collection (tous commerciaux confondus)
      // IMPORTANT : Pas de filtre par userId ou kind - on vérifie l'unicité globale
      const snapshot = await adminDb.collection(collName).get();

      // Vérifier si un numéro de contrat existe (comparaison insensible à la casse)
      const exists = snapshot.docs.some((doc) => {
        // Exclure l'acte actuel si on est en mode modification
        if (actId && collectionName === collName && doc.id === actId) {
          return false;
        }

        const actData = doc.data();
        if (!actData) return false;
        const existingNumber = actData.numeroContrat?.trim().toLowerCase();
        return existingNumber === normalizedNumber;
      });

      if (exists) {
        return NextResponse.json({ exists: true });
      }
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error("Erreur lors de la vérification du numéro de contrat santé:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la vérification" },
      { status: 500 }
    );
  }
}

