/**
 * API Route pour gérer les documents RAG (Admin uniquement)
 * GET : Liste des documents indexés
 * DELETE : Supprimer un document et ses chunks
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { adminDb, Timestamp, getStorageBucket } from "@/lib/firebase/admin-config";
import { logAction } from "@/lib/assistant/audit";
import { getDocumentUsageStats } from "@/lib/assistant/usage-tracking";

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

    const documents = await Promise.all(
      documentsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        if (!data) {
          return null;
        }
        const stats = await getDocumentUsageStats(doc.id);
        
        return {
          id: doc.id,
          title: data.title || "",
          type: data.type || "document",
          category: data.category || undefined,
          source: data.source || "",
          storagePath: data.storagePath || undefined,
          chunkCount: data.chunkCount || 0,
          status: data.status || "unknown",
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || data.createdAt),
          tags: data.tags || [],
          version: data.version || 1,
          previousVersionId: data.previousVersionId || undefined,
          summary: data.summary || undefined,
          usageStats: stats,
        };
      })
    );

    // Filtrer les documents null (si data() retourne undefined)
    const validDocuments = documents.filter((doc): doc is NonNullable<typeof doc> => doc !== null);

    // Trier par date de création (plus récent en premier)
    validDocuments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({
      success: true,
      documents: validDocuments,
      count: validDocuments.length,
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

    // Supprimer aussi le fichier dans Storage si storagePath existe
    const documentData = documentDoc.data();
    if (documentData?.storagePath) {
      try {
        const { getStorageBucket } = await import("@/lib/firebase/admin-config");
        await getStorageBucket().file(documentData.storagePath).delete();
      } catch (storageError) {
        console.error("Erreur lors de la suppression du fichier Storage:", storageError);
        // Continuer même si la suppression Storage échoue
      }
    }

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

/**
 * PATCH /api/assistant/rag/documents
 * Met à jour un document (toggle isActive, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Vérifier l'authentification ET le rôle administrateur
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json(
        {
          error: auth.error || "Accès administrateur requis",
          details: "La modification de documents RAG est réservée aux administrateurs uniquement",
        },
        { status: 403 }
      );
    }

    // Récupérer l'ID du document et l'action depuis les query params
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("id");
    const action = searchParams.get("action");

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

    const documentData = documentDoc.data();

    if (!documentData) {
      return NextResponse.json(
        { error: "Impossible de récupérer les données du document" },
        { status: 500 }
      );
    }

    if (action === "toggle") {
      // Toggle isActive
      const newIsActive = !documentData.isActive;
      await documentRef.update({
        isActive: newIsActive,
        updatedAt: Timestamp.now(),
      });

      return NextResponse.json({
        success: true,
        message: `Document ${newIsActive ? "activé" : "désactivé"} avec succès`,
        isActive: newIsActive,
      });
    } else {
      return NextResponse.json(
        { error: "Action non reconnue. Actions supportées : toggle" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Erreur PATCH /api/assistant/rag/documents:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la modification du document",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

