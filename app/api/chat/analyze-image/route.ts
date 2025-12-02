import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase/auth";
import { extractTextFromImage, getImageTypeFromMimeType } from "@/lib/rag/pdf-processor";
import { ragConfig } from "@/lib/config/rag-config";
import { adminStorage } from "@/lib/firebase/admin-config";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification (tous les utilisateurs authentifiés peuvent analyser des images)
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    
    // Note: On utilise auth (client-side) pour vérifier le token, pas adminAuth
    // car tous les utilisateurs authentifiés peuvent analyser des images
    let decodedToken;
    try {
      // Pour l'instant, on accepte le token sans vérification stricte côté serveur
      // Dans un environnement de production, vous devriez vérifier le token avec adminAuth
      decodedToken = { uid: "user" }; // Placeholder
    } catch (error) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 401 }
      );
    }

    // Récupérer l'image
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: "Aucune image fournie" },
        { status: 400 }
      );
    }

    // Vérifier le type d'image
    const imageType = getImageTypeFromMimeType(imageFile.type);
    if (!imageType) {
      return NextResponse.json(
        { error: "Type d'image non supporté. Types autorisés: PNG, JPG, JPEG, WEBP" },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 5MB)
    const maxSize = ragConfig.files.maxSizeImage;
    if (imageFile.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      return NextResponse.json(
        { error: `Image trop volumineuse. Taille maximale: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Convertir l'image en buffer
    const buffer = Buffer.from(await imageFile.arrayBuffer());

    // Extraire le texte avec OCR
    const ocrResult = await extractTextFromImage(buffer, imageType);

    // Optionnel : sauvegarder l'image dans Firebase Storage pour référence
    let imageUrl = "";
    try {
      const imageId = uuidv4();
      const fileExtension = imageFile.name.split(".").pop() || imageType;
      const storageFileName = `chat-images/${imageId}.${fileExtension}`;
      const bucket = adminStorage.bucket(ragConfig.storage.bucket);
      const fileRef = bucket.file(storageFileName);

      await fileRef.save(buffer, {
        metadata: {
          contentType: imageFile.type,
          metadata: {
            originalName: imageFile.name,
            analyzedAt: new Date().toISOString(),
          },
        },
      });

      await fileRef.makePublic();
      imageUrl = `https://storage.googleapis.com/${ragConfig.storage.bucket}/${storageFileName}`;
    } catch (storageError) {
      console.warn("Erreur lors de la sauvegarde de l'image:", storageError);
      // Continuer même si la sauvegarde échoue
    }

    return NextResponse.json({
      text: ocrResult.text,
      confidence: ocrResult.confidence,
      imageUrl: imageUrl,
      language: ocrResult.language,
    });
  } catch (error) {
    console.error("Erreur API analyze-image:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'analyse de l'image",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

