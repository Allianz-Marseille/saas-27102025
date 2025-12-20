/**
 * API Route pour l'upload de PDF dans la base RAG (Admin uniquement)
 * POST : Upload et indexation d'un PDF dans la base de connaissances
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { chunkText, generateEmbeddingsBatch } from "@/lib/assistant/embeddings";
import { adminDb, adminStorage, Timestamp, getStorageBucket } from "@/lib/firebase/admin-config";
import { DocumentChunk, DocumentStatus } from "@/lib/assistant/types";
import { estimateTokens } from "@/lib/assistant/history-truncation";
import { extractTextFromFile } from "@/lib/assistant/file-extraction";
import { categorizeDocument } from "@/lib/assistant/document-categorization";
import { generateDocumentSummary } from "@/lib/assistant/document-summarization";
import { detectContradictions } from "@/lib/assistant/contradiction-detection";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/assistant/rag/upload
 * Upload et indexation d'un PDF dans la base RAG (admin uniquement)
 */
export async function POST(request: NextRequest) {
  console.log("POST /api/assistant/rag/upload - Début");
  try {
    // Vérifier l'authentification ET le rôle administrateur
    console.log("Vérification de l'authentification admin...");
    const auth = await verifyAdmin(request);
    console.log("Résultat auth:", { valid: auth.valid, error: auth.error });
    if (!auth.valid) {
      console.error("Accès refusé - pas admin");
      return NextResponse.json(
        {
          error: auth.error || "Accès administrateur requis",
          details: "L'upload de documents dans la base RAG est réservé aux administrateurs uniquement",
        },
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    console.log("Authentification OK, utilisateur admin");

    // Récupérer le fichier depuis le FormData
    console.log("Récupération du FormData...");
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const documentType = (formData.get("type") as string) || "document";
    const category = (formData.get("category") as string) || undefined;
    const tags = formData.get("tags") ? (formData.get("tags") as string).split(",") : [];

    console.log("Fichier reçu:", file ? { name: file.name, type: file.type, size: file.size } : "null");

    if (!file) {
      console.error("Aucun fichier fourni");
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Vérifier le type de fichier (PDF, Word, Excel, images)
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    
    const allowedExtensions = [".pdf", ".docx", ".xlsx", ".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: "Type de fichier non supporté. Formats acceptés : PDF, Word (.docx), Excel (.xlsx), Images" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Vérifier la taille (max 20 MB)
    const maxSize = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (maximum 20 MB)" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Générer un ID unique pour le document
    const sourceId = uuidv4();
    const documentRef = adminDb.collection("rag_documents").doc(sourceId);
    const documentTitle = title || file.name.replace(/\.[^/.]+$/, "");
    
    // Étape 1 : Upload dans Firebase Storage
    console.log("Upload du fichier dans Firebase Storage...");
    let storagePath: string;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      storagePath = `knowledge-base/pdf/${sourceId}${fileExtension}`;
      
      // Vérifier que adminStorage est bien initialisé
      if (!adminStorage) {
        throw new Error("adminStorage n'est pas initialisé");
      }
      
      // Obtenir le bucket Storage configuré
      const bucket = getStorageBucket();
      if (!bucket) {
        throw new Error(`Impossible d'accéder au bucket Storage`);
      }
      
      console.log(`Bucket Storage: ${bucket.name}`);
      console.log(`Chemin Storage: ${storagePath}`);
      
      // Vérifier que le bucket existe (optionnel, mais utile pour le debug)
      try {
        const [exists] = await bucket.exists();
        if (!exists) {
          console.warn(`⚠️ Le bucket ${bucket.name} n'existe pas encore. Il sera créé automatiquement lors du premier upload.`);
        } else {
          console.log(`✅ Bucket ${bucket.name} existe`);
        }
      } catch (checkError) {
        console.warn("⚠️ Impossible de vérifier l'existence du bucket:", checkError);
        // Continuer quand même, le bucket sera créé si nécessaire
      }
      
      const storageFile = bucket.file(storagePath);
      
      await storageFile.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedBy: auth.userId,
          },
        },
      });
      
      console.log(`Fichier uploadé dans Storage : ${storagePath}`);
    } catch (error) {
      console.error("Erreur lors de l'upload dans Storage:", error);
      const errorDetails: any = {
        message: error instanceof Error ? error.message : "Erreur inconnue",
        code: (error as any)?.code,
        details: (error as any)?.details,
      };
      
      // Ajouter des informations de debug utiles
      if (process.env.NODE_ENV === "development") {
        errorDetails.stack = error instanceof Error ? error.stack : undefined;
        errorDetails.bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
                                   process.env.FIREBASE_STORAGE_BUCKET ||
                                   `${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`;
      }
      
      console.error("Détails de l'erreur:", errorDetails);
      
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      const errorCode = (error as any)?.code || "UNKNOWN";
      
      // Messages d'erreur plus explicites selon le code d'erreur
      let userMessage = "Erreur lors de l'upload du fichier dans Storage";
      if (errorCode === "ENOENT" || errorMessage.includes("not found")) {
        userMessage = "Le bucket Storage n'existe pas. Vérifiez la configuration dans Firebase Console.";
      } else if (errorCode === "403" || errorMessage.includes("permission")) {
        userMessage = "Permissions insuffisantes. Vérifiez que le service account a les droits Storage Admin.";
      } else if (errorCode === "401" || errorMessage.includes("unauthorized")) {
        userMessage = "Authentification échouée. Vérifiez les credentials Firebase Admin.";
      }
      
      return NextResponse.json(
        {
          error: userMessage,
          message: errorMessage,
          code: errorCode,
          details: process.env.NODE_ENV === "development" ? errorDetails : undefined,
        },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // Étape 2 : Vérifier si un document avec le même titre existe (versionning)
    let version = 1;
    let previousVersionId: string | undefined;
    try {
      const existingDocsSnapshot = await adminDb
        .collection("rag_documents")
        .where("title", "==", documentTitle)
        .where("isActive", "==", true)
        .get();

      if (!existingDocsSnapshot.empty) {
        // Un document avec le même titre existe, créer une nouvelle version
        const latestDoc = existingDocsSnapshot.docs[0];
        const latestData = latestDoc.data();
        if (latestData) {
          previousVersionId = latestDoc.id;
          version = (latestData.version || 1) + 1;
        }

        // Désactiver l'ancienne version
        await latestDoc.ref.update({
          isActive: false,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du versionning:", error);
      // Continuer même en cas d'erreur
    }

    // Étape 3 : Créer le document avec statut "uploaded"
    console.log("Création du document Firestore...");
    console.log("Données du document:", {
      id: sourceId,
      title: documentTitle,
      type: documentType,
      category: category,
      source: file.name,
      storagePath: storagePath,
      uploadedBy: auth.userId,
      version: version,
    });
    
    // Validation des données avant création
    if (!auth.userId) {
      throw new Error("userId manquant dans l'authentification");
    }
    if (!storagePath) {
      throw new Error("storagePath manquant");
    }
    if (!documentTitle || documentTitle.trim() === "") {
      throw new Error("title manquant ou vide");
    }
    
    try {
      const documentData: any = {
        id: sourceId,
        title: documentTitle.trim(),
        type: documentType || "document",
        source: file.name,
        storagePath: storagePath,
        status: "uploaded" as DocumentStatus,
        isActive: true,
        uploadedBy: auth.userId,
        chunkCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      // Ajouter les champs optionnels seulement s'ils existent
      if (category && category.trim() !== "") {
        documentData.category = category.trim();
      }
      if (tags && tags.length > 0) {
        documentData.tags = tags.filter((tag: string) => tag.trim() !== "");
      }
      if (version !== undefined) {
        documentData.version = version;
      }
      if (previousVersionId) {
        documentData.previousVersionId = previousVersionId;
      }
      
      await documentRef.set(documentData);
      console.log(`✅ Document Firestore créé : ${sourceId}`);
    } catch (error) {
      console.error("❌ Erreur lors de la création du document Firestore:", error);
      console.error("Détails:", {
        message: error instanceof Error ? error.message : "Erreur inconnue",
        code: (error as any)?.code,
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Nettoyer Storage en cas d'erreur
      try {
        console.log("Nettoyage du fichier Storage...");
        await getStorageBucket().file(storagePath).delete();
        console.log("✅ Fichier Storage supprimé");
      } catch (cleanupError) {
        console.error("❌ Erreur lors du nettoyage Storage:", cleanupError);
      }
      return NextResponse.json(
        {
          error: "Erreur lors de la création du document Firestore",
          message: error instanceof Error ? error.message : "Erreur inconnue",
          code: (error as any)?.code || "FIRESTORE_ERROR",
          step: "create_document",
          details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
        },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // Étape 4 : Mettre à jour le statut à "processing"
    console.log("Mise à jour du statut à 'processing'...");
    try {
      await documentRef.update({
        status: "processing" as DocumentStatus,
        updatedAt: Timestamp.now(),
      });
      console.log("✅ Statut mis à jour à 'processing'");
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du statut:", error);
      // Ne pas bloquer le processus, continuer quand même
    }
    
    // Étape 5 : Extraire le texte selon le type de fichier
    console.log("Extraction du texte...");
    const arrayBuffer = await file.arrayBuffer();
    let text: string;
    let errorMessage: string | undefined;
    
    try {
      text = await extractTextFromFile(file, arrayBuffer);
      console.log(`✅ Texte extrait: ${text.length} caractères`);
      if (text.length === 0) {
        throw new Error("Le fichier ne contient pas de texte extractible");
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'extraction du texte:", error);
      errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Détails extraction:", {
        message: errorMessage,
        code: (error as any)?.code,
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Mettre à jour le statut à "error"
      try {
        await documentRef.update({
          status: "error" as DocumentStatus,
          errorMessage: errorMessage,
          updatedAt: Timestamp.now(),
        });
      } catch (updateError) {
        console.error("❌ Erreur lors de la mise à jour du statut d'erreur:", updateError);
      }
      
      return NextResponse.json(
        {
          error: "Impossible d'extraire le texte du fichier",
          message: errorMessage,
          code: (error as any)?.code || "EXTRACTION_ERROR",
          step: "extract_text",
          details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
        },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Étape 5 : Catégorisation automatique (en arrière-plan, ne pas bloquer)
    let finalCategory = category;
    if (!finalCategory) {
      categorizeDocument(documentTitle, text)
        .then((cat) => {
          finalCategory = cat;
          // Mettre à jour la catégorie en arrière-plan
          documentRef.update({ category: cat, updatedAt: Timestamp.now() }).catch(console.error);
        })
        .catch(console.error);
    }

    // Étape 6 : Génération du résumé (en arrière-plan)
    generateDocumentSummary(documentTitle, text)
      .then((summary) => {
        documentRef.update({ summary, updatedAt: Timestamp.now() }).catch(console.error);
      })
      .catch(console.error);

    // Étape 7 : Détection de contradictions (en arrière-plan)
    detectContradictions(documentTitle, text, finalCategory)
      .then((contradictions) => {
        if (contradictions.length > 0) {
          console.warn(`⚠️ ${contradictions.length} contradiction(s) détectée(s) avec d'autres documents`);
          // Loguer les contradictions (pourrait être envoyé par email à l'admin)
          documentRef.update({
            contradictions: contradictions.map((c) => ({
              documentId: c.documentId,
              documentTitle: c.documentTitle,
              text: c.contradictionText,
              severity: c.severity,
            })),
            updatedAt: Timestamp.now(),
          }).catch(console.error);
        }
      })
      .catch(console.error);

    // Étape 6 : Découper le texte en chunks
    console.log("Découpage du texte en chunks...");
    let chunks: string[];
    try {
      chunks = chunkText(text, 500, 50);
      console.log(`✅ ${chunks.length} chunks créés`);
      if (chunks.length === 0) {
        throw new Error("Aucun chunk créé à partir du texte");
      }
    } catch (error) {
      console.error("❌ Erreur lors du découpage en chunks:", error);
      await documentRef.update({
        status: "error" as DocumentStatus,
        errorMessage: error instanceof Error ? error.message : "Erreur lors du découpage",
        updatedAt: Timestamp.now(),
      });
      return NextResponse.json(
        {
          error: "Erreur lors du découpage du texte en chunks",
          message: error instanceof Error ? error.message : "Erreur inconnue",
          code: "CHUNKING_ERROR",
          step: "chunk_text",
        },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Étape 7 : Générer les embeddings pour tous les chunks
    const embeddingModel = "text-embedding-3-small";
    console.log("Génération des embeddings...");
    let embeddings: number[][];
    try {
      embeddings = await generateEmbeddingsBatch(chunks, embeddingModel);
      console.log(`✅ ${embeddings.length} embeddings générés`);
      if (embeddings.length !== chunks.length) {
        throw new Error(`Nombre d'embeddings (${embeddings.length}) ne correspond pas au nombre de chunks (${chunks.length})`);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la génération des embeddings:", error);
      await documentRef.update({
        status: "error" as DocumentStatus,
        errorMessage: error instanceof Error ? error.message : "Erreur lors de la génération des embeddings",
        updatedAt: Timestamp.now(),
      });
      return NextResponse.json(
        {
          error: "Erreur lors de la génération des embeddings",
          message: error instanceof Error ? error.message : "Erreur inconnue",
          code: (error as any)?.code || "EMBEDDING_ERROR",
          step: "generate_embeddings",
          details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
        },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Étape 8 : Stocker chaque chunk dans Firestore
    console.log("Stockage des chunks dans Firestore...");
    try {
      const batch = adminDb.batch();

      // Créer les chunks avec leurs embeddings
      for (let i = 0; i < chunks.length; i++) {
        const chunkRef = adminDb.collection("rag_chunks").doc();
        const tokenCount = estimateTokens(chunks[i]);
        
        const chunkData: DocumentChunk = {
          id: chunkRef.id,
          content: chunks[i],
          embedding: embeddings[i],
          tokenCount: tokenCount,
          embeddingModel: embeddingModel,
          metadata: {
            documentId: sourceId,
            documentTitle: documentTitle,
            documentType: documentType,
            chunkIndex: i,
            createdAt: new Date(),
            source: file.name,
            tags: tags,
          },
        };

        batch.set(chunkRef, chunkData);
      }

      // Mettre à jour le document avec le nombre de chunks et le statut "indexed"
      batch.update(documentRef, {
        chunkCount: chunks.length,
        status: "indexed" as DocumentStatus,
        updatedAt: Timestamp.now(),
      });

      await batch.commit();
      console.log(`✅ ${chunks.length} chunks stockés dans Firestore`);
    } catch (error) {
      console.error("❌ Erreur lors du stockage des chunks:", error);
      console.error("Détails:", {
        message: error instanceof Error ? error.message : "Erreur inconnue",
        code: (error as any)?.code,
        stack: error instanceof Error ? error.stack : undefined,
      });
      await documentRef.update({
        status: "error" as DocumentStatus,
        errorMessage: error instanceof Error ? error.message : "Erreur lors du stockage des chunks",
        updatedAt: Timestamp.now(),
      });
      return NextResponse.json(
        {
          error: "Erreur lors du stockage des chunks dans Firestore",
          message: error instanceof Error ? error.message : "Erreur inconnue",
          code: (error as any)?.code || "FIRESTORE_BATCH_ERROR",
          step: "store_chunks",
          details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
        },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("Upload terminé avec succès");
    return NextResponse.json(
      {
        success: true,
        message: "Document indexé avec succès",
        documentId: sourceId,
        title: documentTitle,
        chunkCount: chunks.length,
        status: "indexed",
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ Erreur POST /api/assistant/rag/upload (catch global):", error);
    console.error("Stack:", error instanceof Error ? error.stack : "N/A");
    console.error("Détails complets:", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      code: (error as any)?.code,
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorCode = (error as any)?.code || "UNKNOWN_ERROR";

    return NextResponse.json(
      {
        error: "Erreur lors de l'upload et de l'indexation du document",
        message: errorMessage,
        code: errorCode,
        step: "unknown",
        details: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

