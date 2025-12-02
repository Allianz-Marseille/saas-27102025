/**
 * API Route pour supprimer un document RAG
 * DELETE /api/chat/documents/[id]
 * Admin uniquement
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/rag/auth-utils";
import { adminDb, admin } from "@/lib/firebase/admin-config";
import { ragConfig } from "@/lib/config/rag-config";
import { deleteDocumentVectors } from "@/lib/rag/qdrant-client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier que l'utilisateur est admin
    const authResult = await verifyAdmin(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error || "Accès refusé : Admin requis" },
        { status: 401 }
      );
    }

    // Récupérer l'ID du document depuis les params
    const { id: documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        { error: "ID du document requis" },
        { status: 400 }
      );
    }

    // Récupérer le document depuis Firestore
    const docRef = adminDb.collection("rag_documents").doc(documentId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    const documentData = docSnapshot.data();
    if (!documentData) {
      return NextResponse.json(
        { error: "Données du document invalides" },
        { status: 500 }
      );
    }

    // Supprimer les vecteurs de Qdrant
    try {
      await deleteDocumentVectors(documentId);
    } catch (error) {
      console.error("Erreur lors de la suppression des vecteurs Qdrant:", error);
      // Continuer même si la suppression des vecteurs échoue
    }

    // Supprimer le fichier de Firebase Storage
    try {
      const bucket = admin.storage().bucket(ragConfig.storage.bucket);
      const fileName = `${ragConfig.storage.folder}/${documentId}/${documentData.filename}`;
      const fileRef = bucket.file(fileName);
      
      // Vérifier si le fichier existe avant de le supprimer
      const [exists] = await fileRef.exists();
      if (exists) {
        await fileRef.delete();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du fichier Storage:", error);
      // Continuer même si la suppression du fichier échoue
    }

    // Supprimer le document de Firestore
    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Document supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du document:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la suppression du document",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

