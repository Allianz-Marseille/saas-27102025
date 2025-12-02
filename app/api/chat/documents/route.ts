import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin-config";

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

    // Récupérer la liste des documents depuis Firestore
    const documentsSnapshot = await adminDb
      .collection("rag_documents")
      .orderBy("uploadedAt", "desc")
      .get();

    const documents = documentsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        filename: data.filename,
        fileType: data.fileType,
        imageType: data.imageType,
        uploadedBy: data.uploadedBy,
        uploadedAt: data.uploadedAt,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        chunkCount: data.chunkCount || 0,
        ocrConfidence: data.ocrConfidence,
        metadata: data.metadata || {},
      };
    });

    return NextResponse.json({
      documents,
      total: documents.length,
    });
  } catch (error) {
    console.error("Erreur API documents:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des documents",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

