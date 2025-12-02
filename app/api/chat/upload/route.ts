import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminStorage, adminDb, Timestamp } from "@/lib/firebase/admin-config";
import { v4 as uuidv4 } from "uuid";
import { ragConfig } from "@/lib/config/rag-config";
import {
  processPDFForIndexing,
  processImageForIndexing,
  getFileTypeFromMimeType,
  getImageTypeFromMimeType,
  validateFile,
} from "@/lib/rag/pdf-processor";
import { generateEmbeddingsBatch } from "@/lib/rag/embeddings";
import { createCollectionIfNotExists, upsertVectors } from "@/lib/rag/qdrant-client";
import type { QdrantPoint } from "@/lib/rag/types";

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
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Vérifier que l'utilisateur est admin (rôle stocké dans Firestore, pas customClaims)
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    if (!userData?.active) {
      return NextResponse.json(
        { error: "Compte désactivé" },
        { status: 403 }
      );
    }

    if (userData?.role !== "ADMINISTRATEUR") {
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

    // Déterminer le type de fichier
    const fileType = getFileTypeFromMimeType(file.type);
    if (!fileType) {
      return NextResponse.json(
        { error: "Type de fichier non supporté. Types autorisés: PDF, PNG, JPG, JPEG, WEBP" },
        { status: 400 }
      );
    }

    // Valider le fichier
    const validation = validateFile(file, fileType);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Vérifier que le bucket Firebase Storage est configuré
    if (!ragConfig.storage.bucket) {
      return NextResponse.json(
        { error: "Configuration Firebase Storage manquante. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET n'est pas configurée." },
        { status: 500 }
      );
    }

    // Générer un ID unique pour le document
    const documentId = uuidv4();
    const fileExtension = file.name.split(".").pop() || "";
    const storageFileName = `${documentId}.${fileExtension}`;
    const storagePath = `${ragConfig.storage.folder}/${storageFileName}`;

    try {
      // 1. Uploader vers Firebase Storage
      const buffer = Buffer.from(await file.arrayBuffer());
      const bucket = adminStorage.bucket(ragConfig.storage.bucket);
      
      // Vérifier que le bucket existe et est accessible
      try {
        await bucket.exists();
      } catch (bucketError) {
        console.error("Erreur accès bucket Firebase Storage:", bucketError);
        return NextResponse.json(
          { error: "Impossible d'accéder au bucket Firebase Storage. Vérifiez la configuration." },
          { status: 500 }
        );
      }
      
      const fileRef = bucket.file(storagePath);

      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedBy: decodedToken.uid,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Rendre le fichier public (ou utiliser signed URL selon vos besoins)
      await fileRef.makePublic();
      const fileUrl = `https://storage.googleapis.com/${ragConfig.storage.bucket}/${storagePath}`;

      // 2. Extraire le texte (PDF ou OCR pour images)
      console.log(`[Upload] Début extraction texte pour ${file.name} (type: ${fileType})`);
      let chunks;
      let ocrResult;
      let imageType: "png" | "jpg" | "jpeg" | "webp" | undefined;

      try {
        if (fileType === "pdf") {
          chunks = await processPDFForIndexing(buffer, documentId);
          console.log(`[Upload] PDF traité: ${chunks.length} chunks générés`);
        } else {
          // Image
          const detectedImageType = getImageTypeFromMimeType(file.type);
          if (!detectedImageType) {
            throw new Error("Type d'image non reconnu");
          }
          imageType = detectedImageType;
          const result = await processImageForIndexing(buffer, documentId, imageType);
          chunks = result.chunks;
          ocrResult = result.ocrResult;
          console.log(`[Upload] Image traitée: ${chunks.length} chunks générés (OCR confiance: ${ocrResult?.confidence})`);
        }
      } catch (extractError) {
        console.error(`[Upload] Erreur extraction texte:`, extractError);
        await fileRef.delete().catch(() => {});
        throw new Error(`Erreur lors de l'extraction du texte: ${extractError instanceof Error ? extractError.message : "Erreur inconnue"}`);
      }

      if (!chunks || chunks.length === 0) {
        // Supprimer le fichier uploadé si aucun texte n'a été extrait
        await fileRef.delete();
        return NextResponse.json(
          { error: "Aucun texte n'a pu être extrait du fichier" },
          { status: 400 }
        );
      }

      // 3. Générer les embeddings pour tous les chunks
      console.log(`[Upload] Génération embeddings pour ${chunks.length} chunks...`);
      let embeddings: number[][];
      try {
        const chunkTexts = chunks.map((chunk) => chunk.text);
        embeddings = await generateEmbeddingsBatch(chunkTexts);
        console.log(`[Upload] ${embeddings.length} embeddings générés`);
      } catch (embeddingError) {
        console.error(`[Upload] Erreur génération embeddings:`, embeddingError);
        await fileRef.delete().catch(() => {});
        throw new Error(`Erreur lors de la génération des embeddings: ${embeddingError instanceof Error ? embeddingError.message : "Erreur inconnue"}`);
      }

      // 4. Créer la collection Qdrant si elle n'existe pas
      console.log(`[Upload] Vérification collection Qdrant...`);
      try {
        await createCollectionIfNotExists();
        console.log(`[Upload] Collection Qdrant prête`);
      } catch (qdrantError) {
        console.error(`[Upload] Erreur Qdrant:`, qdrantError);
        await fileRef.delete().catch(() => {});
        throw new Error(`Erreur de connexion à Qdrant: ${qdrantError instanceof Error ? qdrantError.message : "Erreur inconnue"}`);
      }

      // 5. Préparer les points pour Qdrant
      const points: QdrantPoint[] = chunks.map((chunk, index) => ({
        id: chunk.id,
        vector: embeddings[index],
        payload: {
          text: chunk.text,
          documentId: documentId,
          filename: file.name,
          fileType: fileType,
          chunkIndex: chunk.chunkIndex,
          metadata: chunk.metadata || {},
        },
      }));

      // 6. Indexer dans Qdrant
      console.log(`[Upload] Indexation ${points.length} points dans Qdrant...`);
      try {
        await upsertVectors(points);
        console.log(`[Upload] Points indexés avec succès`);
      } catch (indexError) {
        console.error(`[Upload] Erreur indexation Qdrant:`, indexError);
        await fileRef.delete().catch(() => {});
        throw new Error(`Erreur lors de l'indexation dans Qdrant: ${indexError instanceof Error ? indexError.message : "Erreur inconnue"}`);
      }

      // 7. Sauvegarder les métadonnées dans Firestore
      const documentData = {
        id: documentId,
        filename: file.name,
        fileType: fileType,
        imageType: imageType,
        uploadedBy: decodedToken.uid,
        uploadedAt: Timestamp.now(),
        fileUrl: fileUrl,
        fileSize: file.size,
        chunkCount: chunks.length,
        ocrConfidence: ocrResult?.confidence,
        qdrantCollectionId: ragConfig.qdrant.collectionName,
        metadata: {
          originalName: file.name,
        },
      };

      await adminDb.collection("rag_documents").doc(documentId).set(documentData);

      return NextResponse.json({
        message: "Document uploadé et indexé avec succès",
        documentId: documentId,
        fileName: file.name,
        fileSize: file.size,
        fileType: fileType,
        chunkCount: chunks.length,
        fileUrl: fileUrl,
      });
    } catch (error) {
      console.error("Erreur lors du traitement du fichier:", error);
      
      // Log détaillé pour debugging
      if (error instanceof Error) {
        console.error("Message d'erreur:", error.message);
        console.error("Stack:", error.stack);
        console.error("Nom du fichier:", file.name);
        console.error("Type de fichier:", file.type);
        console.error("Taille:", file.size);
      }
      
      // Nettoyer en cas d'erreur : supprimer le fichier de Storage si uploadé
      try {
        const bucket = adminStorage.bucket(ragConfig.storage.bucket);
        const fileRef = bucket.file(storagePath);
        await fileRef.delete().catch(() => {
          // Ignorer les erreurs de suppression
        });
      } catch {
        // Ignorer
      }

      // Message d'erreur plus détaillé pour l'utilisateur
      let errorMessage = "Erreur lors du traitement du fichier";
      let errorDetails = error instanceof Error ? error.message : "Erreur inconnue";
      
      // Messages d'erreur spécifiques selon le type d'erreur
      if (errorDetails.includes("QDRANT") || errorDetails.includes("Qdrant")) {
        errorMessage = "Erreur de connexion à Qdrant. Vérifiez la configuration.";
      } else if (errorDetails.includes("OPENAI") || errorDetails.includes("OpenAI")) {
        errorMessage = "Erreur de connexion à OpenAI. Vérifiez la configuration.";
      } else if (errorDetails.includes("Storage") || errorDetails.includes("bucket")) {
        errorMessage = "Erreur de stockage Firebase. Vérifiez la configuration.";
      } else if (errorDetails.includes("pdf-parse") || errorDetails.includes("PDF")) {
        errorMessage = "Erreur lors de l'extraction du texte du PDF. Le fichier est peut-être corrompu.";
      } else if (errorDetails.includes("OCR") || errorDetails.includes("Tesseract")) {
        errorMessage = "Erreur lors de l'extraction OCR. Vérifiez la configuration.";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorDetails,
        },
        { status: 500 }
      );
    }
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

