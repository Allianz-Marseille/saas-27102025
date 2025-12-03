import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminStorage, adminDb, Timestamp } from "@/lib/firebase/admin-config";
import { v4 as uuidv4 } from "uuid";
import { ragConfig, validateRagConfig } from "@/lib/config/rag-config";
import { getFileTypeFromMimeType, getImageTypeFromMimeType, validateFile } from "@/lib/rag/pdf-processor";
import { generateEmbeddingsBatch, checkOpenAIConnection } from "@/lib/rag/embeddings";
import { createCollectionIfNotExists, upsertVectors, checkQdrantConnection } from "@/lib/rag/qdrant-client";
import { deleteDocumentVectors } from "@/lib/rag/qdrant-client";
import type { QdrantPoint } from "@/lib/rag/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Génère un ID de trace unique pour le logging
 */
function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Log structuré avec trace ID
 */
function logWithTrace(traceId: string, message: string, data?: Record<string, unknown>) {
  const logData = { traceId, ...data };
  console.log(`[${traceId}] ${message}`, logData);
}

/**
 * Vérifie toutes les configurations avant traitement
 */
async function validateSystemConfiguration(traceId: string): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // 1. Vérifier la configuration RAG
  const configValidation = validateRagConfig();
  if (!configValidation.valid) {
    errors.push(...configValidation.errors);
    return { valid: false, errors };
  }

  // 2. Vérifier la connexion Qdrant
  logWithTrace(traceId, "Vérification connexion Qdrant...");
  const qdrantConnected = await checkQdrantConnection();
  if (!qdrantConnected) {
    errors.push("Impossible de se connecter à Qdrant. Vérifiez QDRANT_URL et QDRANT_API_KEY.");
  }

  // 3. Vérifier la connexion OpenAI
  logWithTrace(traceId, "Vérification connexion OpenAI...");
  const openAIConnected = await checkOpenAIConnection();
  if (!openAIConnected) {
    errors.push("Impossible de se connecter à OpenAI. Vérifiez OPENAI_API_KEY.");
  }

  // 4. Vérifier Firebase Storage
  logWithTrace(traceId, "Vérification Firebase Storage...");
  if (!ragConfig.storage.bucket) {
    errors.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET n'est pas configurée.");
  } else {
    try {
      const bucket = adminStorage.bucket(ragConfig.storage.bucket);
      const [exists] = await bucket.exists();
      if (!exists) {
        logWithTrace(traceId, "Bucket n'existe pas encore, sera créé automatiquement");
      }
    } catch (error) {
      errors.push(`Erreur vérification Storage: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function POST(request: NextRequest) {
  const traceId = generateTraceId();
  const startTime = Date.now();
  let documentId: string | null = null;
  let storagePath: string | null = null;
  let fileRef: any = null;
  let chunksCreated = false;
  let vectorsIndexed = false;
  let firestoreSaved = false;

  try {
    logWithTrace(traceId, "Début upload document");

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

    logWithTrace(traceId, "Fichier reçu", {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

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

    // Validation préalable du système
    logWithTrace(traceId, "Validation préalable du système...");
    const systemValidation = await validateSystemConfiguration(traceId);
    if (!systemValidation.valid) {
      logWithTrace(traceId, "Validation système échouée", { errors: systemValidation.errors });
      return NextResponse.json(
        {
          error: "Configuration système invalide",
          details: systemValidation.errors.join("; "),
        },
        { status: 500 }
      );
    }

    logWithTrace(traceId, "Validation système réussie");

    // Générer un ID unique pour le document
    documentId = uuidv4();
    const fileExtension = file.name.split(".").pop() || "";
    const storageFileName = `${documentId}.${fileExtension}`;
    storagePath = `${ragConfig.storage.folder}/${storageFileName}`;

    logWithTrace(traceId, "Document ID généré", { documentId, storagePath });

    // 1. Uploader vers Firebase Storage
    logWithTrace(traceId, "Étape 1/7: Upload vers Firebase Storage", { bucket: ragConfig.storage.bucket });
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = adminStorage.bucket(ragConfig.storage.bucket);
    
    fileRef = bucket.file(storagePath);
    const uploadStartTime = Date.now();

    try {
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedBy: decodedToken.uid,
            uploadedAt: new Date().toISOString(),
            traceId,
          },
        },
      });
      const uploadTime = Date.now() - uploadStartTime;
      logWithTrace(traceId, "Fichier uploadé avec succès", { uploadTime });
    } catch (saveError) {
      const errorMessage = saveError instanceof Error ? saveError.message : "Erreur inconnue";
      logWithTrace(traceId, "Erreur upload Storage", { error: errorMessage });
      throw new Error(`Erreur lors de l'upload vers Firebase Storage: ${errorMessage}`);
    }

    // Rendre le fichier public (ou utiliser signed URL selon vos besoins)
    try {
      await fileRef.makePublic();
      logWithTrace(traceId, "Fichier rendu public");
    } catch (publicError) {
      logWithTrace(traceId, "Impossible de rendre le fichier public (non bloquant)", {
        error: publicError instanceof Error ? publicError.message : "Erreur inconnue",
      });
      // Continuer même si makePublic échoue, on peut utiliser signed URLs
    }
    
    const fileUrl = `https://storage.googleapis.com/${ragConfig.storage.bucket}/${storagePath}`;
    logWithTrace(traceId, "URL du fichier générée", { fileUrl });

    // 2. Extraire le texte (PDF ou OCR pour images)
    logWithTrace(traceId, "Étape 2/7: Extraction du texte", { fileType });
    let chunks;
    let ocrResult;
    let imageType: "png" | "jpg" | "jpeg" | "webp" | undefined;
    const extractionStartTime = Date.now();

    try {
      // Import dynamique pour éviter les problèmes de build avec pdfjs-dist et tesseract.js
      const { processPDFForIndexing, processImageForIndexing } = await import("@/lib/rag/pdf-processor");
      
      if (fileType === "pdf") {
        chunks = await processPDFForIndexing(buffer, documentId);
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
      }
      chunksCreated = true;
      const extractionTime = Date.now() - extractionStartTime;
      logWithTrace(traceId, "Extraction réussie", {
        chunksCount: chunks.length,
        extractionTime,
        ocrConfidence: ocrResult?.confidence,
      });
    } catch (extractError) {
      const errorMessage = extractError instanceof Error ? extractError.message : "Erreur inconnue";
      logWithTrace(traceId, "Erreur extraction texte", { error: errorMessage });
      // Rollback: supprimer le fichier de Storage
      await fileRef.delete().catch(() => {});
      throw new Error(`Erreur lors de l'extraction du texte: ${errorMessage}`);
    }

    if (!chunks || chunks.length === 0) {
      logWithTrace(traceId, "Aucun texte extrait, rollback");
      // Rollback: supprimer le fichier uploadé
      await fileRef.delete().catch(() => {});
      return NextResponse.json(
        { error: "Aucun texte n'a pu être extrait du fichier" },
        { status: 400 }
      );
    }

    // 3. Générer les embeddings pour tous les chunks
    logWithTrace(traceId, "Étape 3/7: Génération des embeddings", { chunksCount: chunks.length });
    let embeddings: number[][];
    const embeddingStartTime = Date.now();

    try {
      const chunkTexts = chunks.map((chunk) => chunk.text);
      embeddings = await generateEmbeddingsBatch(chunkTexts);
      const embeddingTime = Date.now() - embeddingStartTime;
      logWithTrace(traceId, "Embeddings générés", {
        embeddingsCount: embeddings.length,
        embeddingTime,
      });
    } catch (embeddingError) {
      const errorMessage = embeddingError instanceof Error ? embeddingError.message : "Erreur inconnue";
      logWithTrace(traceId, "Erreur génération embeddings", { error: errorMessage });
      // Rollback: supprimer le fichier de Storage
      await fileRef.delete().catch(() => {});
      throw new Error(`Erreur lors de la génération des embeddings: ${errorMessage}`);
    }

    // 4. Créer la collection Qdrant si elle n'existe pas
    logWithTrace(traceId, "Étape 4/7: Vérification collection Qdrant");
    try {
      await createCollectionIfNotExists();
      logWithTrace(traceId, "Collection Qdrant prête");
    } catch (qdrantError) {
      const errorMessage = qdrantError instanceof Error ? qdrantError.message : "Erreur inconnue";
      logWithTrace(traceId, "Erreur Qdrant", { error: errorMessage });
      // Rollback: supprimer le fichier de Storage
      await fileRef.delete().catch(() => {});
      throw new Error(`Erreur de connexion à Qdrant: ${errorMessage}`);
    }

    // 5. Préparer les points pour Qdrant
    logWithTrace(traceId, "Étape 5/7: Préparation des points Qdrant");
    
    // Vérifier que documentId est défini (ne devrait jamais être null à ce point)
    if (!documentId) {
      throw new Error("documentId n'est pas défini");
    }
    
    // Créer une variable locale avec le type correct pour TypeScript
    const finalDocumentId: string = documentId;
    
    const points: QdrantPoint[] = chunks.map((chunk, index) => ({
      id: chunk.id,
      vector: embeddings[index],
      payload: {
        text: chunk.text,
        documentId: finalDocumentId,
        filename: file.name,
        fileType: fileType,
        chunkIndex: chunk.chunkIndex,
        metadata: chunk.metadata || {},
      },
    }));

    // 6. Indexer dans Qdrant
    logWithTrace(traceId, "Étape 6/7: Indexation dans Qdrant", { pointsCount: points.length });
    const indexStartTime = Date.now();

    try {
      await upsertVectors(points);
      vectorsIndexed = true;
      const indexTime = Date.now() - indexStartTime;
      logWithTrace(traceId, "Points indexés avec succès", { indexTime });
    } catch (indexError) {
      const errorMessage = indexError instanceof Error ? indexError.message : "Erreur inconnue";
      logWithTrace(traceId, "Erreur indexation Qdrant", { error: errorMessage });
      // Rollback: supprimer le fichier de Storage
      await fileRef.delete().catch(() => {});
      throw new Error(`Erreur lors de l'indexation dans Qdrant: ${errorMessage}`);
    }

    // 7. Sauvegarder les métadonnées dans Firestore
    logWithTrace(traceId, "Étape 7/7: Sauvegarde métadonnées Firestore");
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
        traceId,
      },
    };

    try {
      await adminDb.collection("rag_documents").doc(documentId).set(documentData);
      firestoreSaved = true;
      logWithTrace(traceId, "Métadonnées sauvegardées dans Firestore");
    } catch (firestoreError) {
      const errorMessage = firestoreError instanceof Error ? firestoreError.message : "Erreur inconnue";
      logWithTrace(traceId, "Erreur sauvegarde Firestore", { error: errorMessage });
      // Rollback complet: supprimer Storage, Qdrant
      await fileRef.delete().catch(() => {});
      if (vectorsIndexed) {
        await deleteDocumentVectors(documentId).catch(() => {});
      }
      throw new Error(`Erreur lors de la sauvegarde dans Firestore: ${errorMessage}`);
    }

    const totalTime = Date.now() - startTime;
    logWithTrace(traceId, "Upload terminé avec succès", {
      totalTime,
      documentId,
      chunksCount: chunks.length,
    });

    return NextResponse.json({
      message: "Document uploadé et indexé avec succès",
      documentId: documentId,
      fileName: file.name,
      fileSize: file.size,
      fileType: fileType,
      chunkCount: chunks.length,
      fileUrl: fileUrl,
      traceId,
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    
    logWithTrace(traceId, "Erreur lors du traitement", {
      error: errorMessage,
      totalTime,
      documentId,
      chunksCreated,
      vectorsIndexed,
      firestoreSaved,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Rollback complet selon l'état
    const rollbackErrors: string[] = [];

    if (fileRef && storagePath) {
      try {
        await fileRef.delete();
        logWithTrace(traceId, "Fichier Storage supprimé (rollback)");
      } catch (deleteError) {
        rollbackErrors.push(`Storage: ${deleteError instanceof Error ? deleteError.message : "Erreur inconnue"}`);
      }
    }

    if (vectorsIndexed && documentId) {
      try {
        await deleteDocumentVectors(documentId);
        logWithTrace(traceId, "Vecteurs Qdrant supprimés (rollback)");
      } catch (deleteError) {
        rollbackErrors.push(`Qdrant: ${deleteError instanceof Error ? deleteError.message : "Erreur inconnue"}`);
      }
    }

    if (firestoreSaved && documentId) {
      try {
        await adminDb.collection("rag_documents").doc(documentId).delete();
        logWithTrace(traceId, "Document Firestore supprimé (rollback)");
      } catch (deleteError) {
        rollbackErrors.push(`Firestore: ${deleteError instanceof Error ? deleteError.message : "Erreur inconnue"}`);
      }
    }

    if (rollbackErrors.length > 0) {
      logWithTrace(traceId, "Erreurs lors du rollback", { rollbackErrors });
    }

    // Messages d'erreur spécifiques selon le type d'erreur
    let userErrorMessage = "Erreur lors du traitement du fichier";
    
    if (errorMessage.includes("QDRANT") || errorMessage.includes("Qdrant")) {
      userErrorMessage = "Erreur de connexion à Qdrant. Vérifiez la configuration.";
    } else if (errorMessage.includes("OPENAI") || errorMessage.includes("OpenAI")) {
      userErrorMessage = "Erreur de connexion à OpenAI. Vérifiez la configuration.";
    } else if (errorMessage.includes("Storage") || errorMessage.includes("bucket")) {
      userErrorMessage = "Erreur de stockage Firebase. Vérifiez la configuration.";
    } else if (errorMessage.includes("pdf-parse") || errorMessage.includes("PDF") || errorMessage.includes("corrompu")) {
      userErrorMessage = "Erreur lors de l'extraction du texte du PDF. Le fichier est peut-être corrompu ou protégé.";
    } else if (errorMessage.includes("OCR") || errorMessage.includes("Tesseract")) {
      userErrorMessage = "Erreur lors de l'extraction OCR. Vérifiez la configuration.";
    } else if (errorMessage.includes("mot de passe") || errorMessage.includes("protégé")) {
      userErrorMessage = "Le PDF est protégé par mot de passe. Impossible d'extraire le texte.";
    }

    return NextResponse.json(
      {
        error: userErrorMessage,
        details: errorMessage,
        traceId,
      },
      { status: 500 }
    );
  }
}

