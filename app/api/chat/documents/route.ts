/**
 * API Route pour lister les documents RAG
 * GET /api/chat/documents
 * Tous les utilisateurs authentifiés peuvent voir la liste
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/rag/auth-utils";
import { adminDb } from "@/lib/firebase/admin-config";
import type { RAGDocument } from "@/lib/rag/types";

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authResult = await verifyAuth(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error || "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer tous les documents
    const documentsSnapshot = await adminDb
      .collection("rag_documents")
      .orderBy("uploadedAt", "desc")
      .get();

    const documents: RAGDocument[] = documentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RAGDocument[];

    return NextResponse.json({
      documents,
      count: documents.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des documents:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des documents",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

