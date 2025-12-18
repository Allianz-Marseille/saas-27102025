/**
 * API Route pour gérer les documents RAG (Admin uniquement)
 * GET : Liste des documents indexés
 * DELETE : Supprimer un document et ses chunks
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { adminDb } from "@/lib/firebase/admin-config";
import { logAction } from "@/lib/assistant/audit";

/**
 * GET /api/assistant/rag/documents
 * Liste tous les documents indexés dans la base RAG
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification ET le rôle administrateur
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json(
        {
          error: auth.error || "Accès administrateur requis",
          details: "L'accès aux documents RAG est réservé aux administrateurs uniquement",
        },
        { status: 403 }
      );
    }

    // Récupérer tous les documents
    const documentsSnapshot = await adminDb.collection("rag_documents").get();

    const documents = documentsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "",
        type: data.type || "document",
        source: data.source || "",
        chunkCount: data.chunkCount || 0,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        tags: data.tags || [],
      };
    });

    // Trier par date de création (plus récent en premier)
    documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({
      success: true,
      documents,
      count: documents.length,
    });
  } catch (error) {
    console.error("Erreur GET /api/assistant/rag/documents:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des documents",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assistant/rag/documents
 * Supprime un document et tous ses chunks associés
 */
export async function DELETE(request: NextRequest) {
  try {
    // Vérifier l'authentification ET le rôle administrateur
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json(
        {
          error: auth.error || "Accès administrateur requis",
          details: "La suppression de documents RAG est réservée aux administrateurs uniquement",
        },
        { status: 403 }
      );
    }

    // Récupérer l'ID du document depuis les query params
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json(
        { error: "ID du document manquant" },
        { status: 400 }
      );
    }

    // Vérifier que le document existe
    const documentRef = adminDb.collection("rag_documents").doc(documentId);
    const documentDoc = await documentRef.get();

    if (!documentDoc.exists) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer tous les chunks associés à ce document
    const chunksSnapshot = await adminDb
      .collection("rag_chunks")
      .where("metadata.documentId", "==", documentId)
      .get();

    // Supprimer tous les chunks
    const batch = adminDb.batch();
    chunksSnapshot.docs.forEach((chunkDoc) => {
      batch.delete(chunkDoc.ref);
    });

    // Supprimer le document
    batch.delete(documentRef);

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: "Document et chunks associés supprimés avec succès",
      deletedChunks: chunksSnapshot.docs.length,
    });
  } catch (error) {
    console.error("Erreur DELETE /api/assistant/rag/documents:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la suppression du document",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

