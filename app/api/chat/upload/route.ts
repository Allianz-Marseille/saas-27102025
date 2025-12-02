/**
 * API Route pour uploader des fichiers (PDF/images) pour le RAG
 * POST /api/chat/upload
 * Admin uniquement
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/rag/auth-utils";
import { adminDb, admin, Timestamp } from "@/lib/firebase/admin-config";
import { ragConfig } from "@/lib/config/rag-config";
import {
  processPDFForIndexing,
  processImageForIndexing,
  getFileTypeFromMimeType,
  getImageTypeFromMimeType,
  validateFile,
} from "@/lib/rag/pdf-processor";
import { generateEmbeddingsBatch } from "@/lib/rag/embeddings";
import { upsertVectors, createCollectionIfNotExists } from "@/lib/rag/qdrant-client";
import type { QdrantPoint, RAGDocument } from "@/lib/rag/types";
// Générer un ID unique
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback pour Node.js < 18
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const authResult = await verifyAdmin(request);
    if (!authResult.valid || !authResult.uid || !authResult.email) {
      return NextResponse.json(
        { error: authResult.error || "Accès refusé : Admin requis" },
        { status: 401 }
      );
    }

    // Parser le FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Fichier requis" },
        { status: 400 }
      );
    }

    // Déterminer le type de fichier
    const fileType = getFileTypeFromMimeType(file.type);
    if (!fileType) {
      return NextResponse.json(
        { error: `Type de fichier non supporté: ${file.type}. Types supportés: PDF, PNG, JPG, JPEG, WEBP` },
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

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Générer un ID unique pour le document
    const documentId = generateId();

    // Traiter le fichier selon son type
    let chunks;
    let ocrConfidence: number | undefined;
    let imageType: "png" | "jpg" | "jpeg" | "webp" | undefined;

    if (fileType === "pdf") {
      chunks = await processPDFForIndexing(buffer, documentId);
    } else {
      // Image avec OCR
      imageType = getImageTypeFromMimeType(file.type) || undefined;
      if (!imageType) {
        return NextResponse.json(
          { error: "Type d'image non reconnu" },
          { status: 400 }
        );
      }

      const result = await processImageForIndexing(buffer, documentId, imageType);
      chunks = result.chunks;
      ocrConfidence = result.ocrResult.confidence;
    }

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Aucun contenu textuel trouvé dans le fichier" },
        { status: 400 }
      );
    }

    // Générer les embeddings pour tous les chunks
    const chunkTexts = chunks.map((chunk) => chunk.text);
    const embeddings = await generateEmbeddingsBatch(chunkTexts);

    if (embeddings.length !== chunks.length) {
      return NextResponse.json(
        { error: "Erreur lors de la génération des embeddings" },
        { status: 500 }
      );
    }

    // Créer la collection Qdrant si elle n'existe pas
    await createCollectionIfNotExists();

    // Préparer les points pour Qdrant
    const qdrantPoints: QdrantPoint[] = chunks.map((chunk, index) => ({
      id: chunk.id,
      vector: embeddings[index],
      payload: {
        documentId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        filename: file.name,
        fileType,
        metadata: chunk.metadata,
      },
    }));

    // Uploader dans Qdrant
    await upsertVectors(qdrantPoints);

    // Uploader le fichier dans Firebase Storage
    const bucket = admin.storage().bucket(ragConfig.storage.bucket);
    const fileName = `${ragConfig.storage.folder}/${documentId}/${file.name}`;
    const fileRef = bucket.file(fileName);

    await fileRef.save(buffer, {
      contentType: file.type,
      metadata: {
        uploadedBy: authResult.uid,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Rendre le fichier public (ou utiliser signed URL selon les besoins)
    await fileRef.makePublic();
    const fileUrl = `https://storage.googleapis.com/${ragConfig.storage.bucket}/${fileName}`;

    // Enregistrer les métadonnées dans Firestore
    const ragDocument: Omit<RAGDocument, "id"> = {
      filename: file.name,
      fileType,
      imageType,
      uploadedBy: authResult.uid,
      uploadedAt: Timestamp.now(),
      fileUrl,
      fileSize: file.size,
      chunkCount: chunks.length,
      qdrantCollectionId: ragConfig.qdrant.collectionName,
      ocrConfidence,
      metadata: {
        title: title || undefined,
        description: description || undefined,
      },
    };

    await adminDb.collection("rag_documents").doc(documentId).set(ragDocument);

    return NextResponse.json({
      documentId,
      filename: file.name,
      fileUrl,
      chunkCount: chunks.length,
      success: true,
      ocrConfidence,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'upload du fichier",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

