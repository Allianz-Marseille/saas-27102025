import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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
    const decodedToken = await getAuth(adminApp).verifyIdToken(token);
    
    // Vérifier que l'utilisateur est admin
    const userRecord = await getAuth(adminApp).getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims;
    
    if (customClaims?.role !== "ADMINISTRATEUR") {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux administrateurs." },
        { status: 403 }
      );
    }

    // Récupérer le fichier
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // TODO: Implémenter l'upload et l'indexation
    // 1. Uploader vers Firebase Storage
    // 2. Extraire le texte (PDF ou OCR pour images)
    // 3. Découper en chunks
    // 4. Générer les embeddings
    // 5. Indexer dans Qdrant
    // 6. Sauvegarder les métadonnées dans Firestore

    return NextResponse.json({
      message: "Fonctionnalité d'upload en cours de développement",
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error("Erreur API upload:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'upload",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

