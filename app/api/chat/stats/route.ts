import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin-config";
import { checkQdrantHealth } from "@/lib/rag/qdrant-client";
import { ragConfig } from "@/lib/config/rag-config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);

    // 1. Compter les documents dans Firestore
    const documentsSnapshot = await adminDb
      .collection("rag_documents")
      .count()
      .get();
    const documentsCount = documentsSnapshot.data().count;

    // 2. Récupérer le nombre de chunks depuis Qdrant
    let chunksCount = 0;
    try {
      const qdrantHealth = await checkQdrantHealth();
      if (qdrantHealth.healthy) {
        // Import dynamique du client Qdrant
        const { getQdrantClient } = await import("@/lib/rag/qdrant-client");
        const client = getQdrantClient();
        const collectionInfo = await client.getCollection(ragConfig.qdrant.collectionName);
        chunksCount = collectionInfo.points_count || 0;
      }
    } catch (error) {
      console.error("Erreur récupération chunks Qdrant:", error);
      // Si Qdrant n'est pas disponible, on peut calculer depuis Firestore
      const docs = await adminDb.collection("rag_documents").get();
      chunksCount = docs.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.chunkCount || 0);
      }, 0);
    }

    // 3. Compter les requêtes du mois en cours (si implémenté)
    // Pour l'instant, on retourne 0
    const requestsCount = 0;

    return NextResponse.json({
      documents: documentsCount,
      chunks: chunksCount,
      requests: requestsCount,
    });
  } catch (error) {
    console.error("Erreur récupération stats:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des statistiques",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

