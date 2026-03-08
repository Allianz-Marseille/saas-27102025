import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin-config";
import { verifyAuth } from "@/lib/utils/auth-utils";

/**
 * API route pour vérifier l'unicité d'un numéro de contrat.
 * Vérifie UNIQUEMENT les affaires nouvelles dans les 3 collections :
 * - acts (CDC) : kind === "AN"
 * - health_acts (santé individuelle) : kind === "AFFAIRE_NOUVELLE"
 * - health_collective_acts (santé collective) : kind in HEALTH_COLLECTIVE_AN_TYPES
 *
 * Les 3 requêtes sont lancées en parallèle. Chaque collection est filtrée
 * côté Firestore sur le kind avant de vérifier le numéro en mémoire.
 */

const HEALTH_COLLECTIVE_AN_TYPES = [
  "IND_AN_SANTE",
  "IND_AN_PREVOYANCE",
  "IND_AN_RETRAITE",
  "COLL_AN_SANTE",
  "COLL_AN_PREVOYANCE",
  "COLL_AN_RETRAITE",
] as const;

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { numeroContrat, actId, collection: collectionName } = body;

    if (!numeroContrat || typeof numeroContrat !== "string") {
      return NextResponse.json({ error: "Numéro de contrat requis" }, { status: 400 });
    }

    const normalizedNumber = numeroContrat.trim().toLowerCase();
    if (!normalizedNumber) {
      return NextResponse.json({ exists: false });
    }

    // Les 3 requêtes en parallèle — filtrées sur kind côté Firestore
    const [actsSnap, healthActsSnap, healthCollectiveSnap] = await Promise.all([
      adminDb.collection("acts").where("kind", "==", "AN").get(),
      adminDb.collection("health_acts").where("kind", "==", "AFFAIRE_NOUVELLE").get(),
      adminDb
        .collection("health_collective_acts")
        .where("kind", "in", HEALTH_COLLECTIVE_AN_TYPES)
        .get(),
    ]);

    const matchesNumber = (
      docId: string,
      data: FirebaseFirestore.DocumentData,
      targetCollection: string
    ): boolean => {
      // En mode modification, exclure l'acte en cours d'édition
      if (actId && collectionName === targetCollection && docId === actId) return false;
      const existing = (data.numeroContrat as string | undefined)?.trim().toLowerCase();
      return existing === normalizedNumber;
    };

    const exists =
      actsSnap.docs.some((d) => matchesNumber(d.id, d.data(), "acts")) ||
      healthActsSnap.docs.some((d) => matchesNumber(d.id, d.data(), "health_acts")) ||
      healthCollectiveSnap.docs.some((d) =>
        matchesNumber(d.id, d.data(), "health_collective_acts")
      );

    return NextResponse.json({ exists });
  } catch (error) {
    console.error("Erreur lors de la vérification du numéro de contrat:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la vérification" },
      { status: 500 }
    );
  }
}
