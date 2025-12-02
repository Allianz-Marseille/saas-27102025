import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminStorage, adminDb } from "@/lib/firebase/admin-config";
import { ragConfig } from "@/lib/config/rag-config";
import { deleteDocumentVectors } from "@/lib/rag/qdrant-client";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Vérifier que l'utilisateur est admin
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims;
    
    if (customClaims?.role !== "ADMINISTRATEUR") {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux administrateurs." },
        { status: 403 }
      );
    }

    // Dans Next.js 16, params est une Promise
    const params = await context.params;
    const documentId = params.id;

    if (!documentId) {
      return NextResponse.json(
        { error: "ID du document requis" },
        { status: 400 }
      );
    }

    // Récupérer les métadonnées du document depuis Firestore
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
        { status: 400 }
      );
    }

    // Supprimer dans l'ordre : Qdrant, Storage, Firestore
    const errors: string[] = [];

    // 1. Supprimer les vecteurs de Qdrant
    try {
      await deleteDocumentVectors(documentId);
    } catch (error) {
      console.error("Erreur suppression Qdrant:", error);
      errors.push(`Qdrant: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }

    // 2. Supprimer le fichier de Firebase Storage
    try {
      const fileUrl = documentData.fileUrl as string;
      if (fileUrl) {
        // Extraire le chemin du fichier depuis l'URL
        const urlParts = fileUrl.split("/");
        const fileName = urlParts[urlParts.length - 1];
        const storagePath = `${ragConfig.storage.folder}/${fileName}`;
        
        const bucket = adminStorage.bucket(ragConfig.storage.bucket);
        const fileRef = bucket.file(storagePath);
        await fileRef.delete();
      }
    } catch (error) {
      console.error("Erreur suppression Storage:", error);
      errors.push(`Storage: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }

    // 3. Supprimer les métadonnées de Firestore
    try {
      await docRef.delete();
    } catch (error) {
      console.error("Erreur suppression Firestore:", error);
      errors.push(`Firestore: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }

    // Si toutes les suppressions ont échoué, retourner une erreur
    if (errors.length === 3) {
      return NextResponse.json(
        {
          error: "Erreur lors de la suppression du document",
          details: errors.join("; "),
        },
        { status: 500 }
      );
    }

    // Si au moins une suppression a réussi, retourner un succès avec warnings
    return NextResponse.json({
      message: "Document supprimé avec succès",
      documentId: documentId,
      warnings: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Erreur API delete document:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la suppression du document",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

