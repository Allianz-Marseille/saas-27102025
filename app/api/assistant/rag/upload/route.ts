/**
 * API Route pour l'upload de PDF dans la base RAG (Admin uniquement)
 * POST : Upload et indexation d'un PDF dans la base de connaissances
 */

import { NextRequest, NextResponse } from "next/server";

// Forcer l'utilisation du runtime Node.js (nécessaire pour pdf-parse)
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max pour l'indexation
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { chunkText, generateEmbeddingsBatch } from "@/lib/assistant/embeddings";
import { adminDb, adminStorage, Timestamp, getStorageBucket } from "@/lib/firebase/admin-config";
import { DocumentChunk, DocumentStatus } from "@/lib/assistant/types";
import { estimateTokens } from "@/lib/assistant/history-truncation";
import { extractTextFromFile, extractTextFromFileWithMetadata, ExtractionMetadata } from "@/lib/assistant/file-extraction";
import { categorizeDocument } from "@/lib/assistant/document-categorization";
import { generateDocumentSummary } from "@/lib/assistant/document-summarization";
import { detectContradictions } from "@/lib/assistant/contradiction-detection";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/assistant/rag/upload
 * Upload et indexation d'un PDF dans la base RAG (admin uniquement)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🚀 POST /api/assistant/rag/upload - Début du processus");
  console.log("═══════════════════════════════════════════════════════════");
  try {
    // Vérifier l'authentification ET le rôle administrateur
    console.log("📋 [Étape 0/7] Vérification de l'authentification admin...");
    const auth = await verifyAdmin(request);
    console.log("   Résultat auth:", { valid: auth.valid, error: auth.error });
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
    if (!auth.valid) {
      console.error("   ❌ Authentification échouée");
    } else {
      console.log("   ✅ Authentification OK, utilisateur admin");
    }

    // Récupérer le fichier depuis le FormData
    console.log("📋 [Étape 0.5/7] Récupération et validation du fichier...");
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const documentType = (formData.get("type") as string) || "document";
    const category = (formData.get("category") as string) || undefined;
    const tags = formData.get("tags") ? (formData.get("tags") as string).split(",") : [];

    console.log("   Fichier reçu:", file ? { name: file.name, type: file.type, size: file.size } : "null");

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
    
    // Créer le buffer UNE SEULE FOIS pour réutilisation (Storage + extraction)
    console.log("Création du buffer du fichier...");
    const arrayBuffer = await file.arrayBuffer();
    
    // Validation du buffer
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: "Le fichier est vide ou corrompu" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    console.log(`Buffer créé: ${arrayBuffer.byteLength} bytes`);
    
    // Étape 1 : Upload dans Firebase Storage
    console.log("📦 [Étape 1/7] Upload du fichier dans Firebase Storage...");
    let storagePath: string;
    try {
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
      
      console.log(`   Bucket Storage: ${bucket.name}`);
      console.log(`   Chemin Storage: ${storagePath}`);
      
      // Vérifier que le bucket existe (optionnel, mais utile pour le debug)
      try {
        const [exists] = await bucket.exists();
        if (!exists) {
          console.warn(`   ⚠️ Le bucket ${bucket.name} n'existe pas encore. Il sera créé automatiquement lors du premier upload.`);
        } else {
          console.log(`   ✅ Bucket ${bucket.name} existe`);
        }
      } catch (checkError) {
        console.warn("   ⚠️ Impossible de vérifier l'existence du bucket:", checkError);
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
      
      console.log(`   ✅ Fichier uploadé dans Storage : ${storagePath} (${(buffer.length / 1024).toFixed(2)} KB)`);
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
    
    // Fonction de nettoyage en cas d'erreur après l'upload Storage
    // Définie ici pour avoir accès à storagePath après l'upload réussi
    const cleanupOnError = async (errorStep: string) => {
      console.log(`🧹 Nettoyage des ressources après erreur à l'étape: ${errorStep}`);
      try {
        // Supprimer les chunks créés individuellement (si transaction a échoué partiellement)
        try {
          const chunksSnapshot = await adminDb
            .collection("rag_chunks")
            .where("metadata.documentId", "==", sourceId)
            .get();
          
          if (!chunksSnapshot.empty) {
            const batch = adminDb.batch();
            chunksSnapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`✅ ${chunksSnapshot.docs.length} chunk(s) supprimé(s)`);
          }
        } catch (chunksError) {
          console.error("❌ Erreur lors de la suppression des chunks:", chunksError);
        }
        
        // Supprimer le document Firestore si il existe
        try {
          await documentRef.delete();
          console.log(`✅ Document Firestore supprimé: ${sourceId}`);
        } catch (firestoreError) {
          console.error("❌ Erreur lors de la suppression du document Firestore:", firestoreError);
        }
        
        // Supprimer le fichier Storage si il existe
        if (storagePath) {
          try {
            const bucket = getStorageBucket();
            if (bucket) {
              await bucket.file(storagePath).delete();
              console.log(`✅ Fichier Storage supprimé: ${storagePath}`);
            }
          } catch (storageError) {
            console.error("❌ Erreur lors de la suppression du fichier Storage:", storageError);
          }
        }
      } catch (cleanupError) {
        console.error("❌ Erreur lors du nettoyage général:", cleanupError);
      }
    };
    
    // Étape 2 : Extraire le texte AVANT de créer le document Firestore
    console.log("📄 [Étape 2/7] Extraction du texte (AVANT création document)...");
    console.log("   Informations fichier:", {
      name: file.name,
      type: file.type,
      size: file.size,
      extension: file.name.toLowerCase().substring(file.name.lastIndexOf(".")),
    });
    
    // Validation du buffer avant extraction
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      await cleanupOnError("extract_text");
      return NextResponse.json(
        {
          error: "Le buffer du fichier est vide ou invalide",
          code: "INVALID_BUFFER",
          step: "extract_text",
        },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    let text: string;
    let extractionMetadata: ExtractionMetadata | undefined;
    let errorMessage: string | undefined;
    
    try {
      // Utiliser extractTextFromFileWithMetadata pour obtenir les métadonnées OCR
      const extractionResult = await extractTextFromFileWithMetadata(file, arrayBuffer);
      text = extractionResult.text;
      extractionMetadata = extractionResult.metadata;
      
      console.log(`   ✅ Texte extrait: ${text.length} caractères bruts`);
      console.log(`   📊 Méthode d'extraction: ${extractionMetadata.extractionMethod}`);
      if (extractionMetadata.ocrEngine) {
        console.log(`   🔍 OCR utilisé: ${extractionMetadata.ocrEngine} (${extractionMetadata.ocrPageCount || 0} page(s))`);
      }
      
      // Mettre à jour le statut si OCR est en cours
      if (extractionMetadata.extractionMethod === "ocr") {
        console.log("   🔄 OCR détecté, mise à jour du statut du document...");
        try {
          await documentRef.set({
            status: "ocr_processing" as DocumentStatus,
            updatedAt: Timestamp.now(),
          }, { merge: true });
        } catch (statusError) {
          console.warn("   ⚠️ Impossible de mettre à jour le statut OCR (document pas encore créé, normal)");
        }
      }
      
      // Validation stricte du texte : vérifier qu'il contient des caractères imprimables
      const hasPrintableContent = /[\w\u00C0-\u017F\u0400-\u04FF]/.test(text);
      const trimmedText = text.trim();
      
      console.log(`   Validation texte: longueur=${trimmedText.length}, contientImprimables=${hasPrintableContent}`);
      
      // Validation : texte doit avoir au moins 10 caractères imprimables
      if (trimmedText.length < 10 || !hasPrintableContent) {
        throw new Error(
          "Le fichier ne contient pas de texte extractible valide (minimum 10 caractères imprimables requis). " +
          "Le PDF pourrait être une image scannée, protégé, ou ne contenir que des espaces/caractères non imprimables."
        );
      }
      
      // Utiliser le texte nettoyé
      text = trimmedText;
      console.log(`   ✅ Texte validé: ${text.length} caractères imprimables`);
      
      // Mettre à jour le statut si OCR est terminé
      if (extractionMetadata.extractionMethod === "ocr") {
        console.log("   ✅ OCR terminé avec succès");
        try {
          await documentRef.set({
            status: "ocr_done" as DocumentStatus,
            updatedAt: Timestamp.now(),
          }, { merge: true });
        } catch (statusError) {
          console.warn("   ⚠️ Impossible de mettre à jour le statut OCR (document pas encore créé, normal)");
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'extraction du texte:", error);
      errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Détails extraction:", {
        message: errorMessage,
        code: (error as any)?.code,
        name: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        bufferSize: arrayBuffer.byteLength,
      });
      
      // Nettoyer les ressources en cas d'erreur (seulement Storage, pas de document à supprimer)
      await cleanupOnError("extract_text");
      
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

    // Étape 3 : Découper le texte en chunks (avec validation)
    console.log("✂️ [Étape 3/7] Découpage du texte en chunks...");
    let chunks: string[];
    try {
      chunks = chunkText(text, 500, 50);
      console.log(`   ✅ ${chunks.length} chunks créés initialement`);
      
      // Validation stricte : au moins 1 chunk valide requis
      if (chunks.length === 0) {
        throw new Error("Aucun chunk créé à partir du texte. Le texte pourrait être trop court ou invalide.");
      }
      
      // Validation : chaque chunk doit contenir du contenu valide
      const validChunks = chunks.filter(chunk => chunk.trim().length >= 10);
      console.log(`   Validation chunks: ${validChunks.length}/${chunks.length} chunks valides (>= 10 caractères)`);
      
      if (validChunks.length === 0) {
        throw new Error("Aucun chunk valide créé. Tous les chunks sont trop courts ou vides.");
      }
      
      // Utiliser uniquement les chunks valides
      chunks = validChunks;
      console.log(`   ✅ ${chunks.length} chunks valides après validation`);
    } catch (error) {
      console.error("❌ Erreur lors du découpage en chunks:", error);
      await cleanupOnError("chunk_text");
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

    // Étape 4 : Générer les embeddings pour tous les chunks (avec validation)
    const embeddingModel = "text-embedding-3-small";
    console.log("🧮 [Étape 4/7] Génération des embeddings...");
    let embeddings: number[][];
    try {
      // Validation : s'assurer que tous les chunks sont valides avant génération
      const validChunksForEmbedding = chunks.filter(chunk => chunk.trim().length > 0);
      if (validChunksForEmbedding.length !== chunks.length) {
        throw new Error("Certains chunks sont vides et ne peuvent pas être utilisés pour générer des embeddings");
      }
      
      console.log(`   Génération de ${chunks.length} embeddings avec le modèle ${embeddingModel}...`);
      embeddings = await generateEmbeddingsBatch(chunks, embeddingModel);
      console.log(`   ✅ ${embeddings.length} embeddings générés`);
      
      // Validation : nombre d'embeddings doit correspondre au nombre de chunks
      if (embeddings.length !== chunks.length) {
        throw new Error(`Nombre d'embeddings (${embeddings.length}) ne correspond pas au nombre de chunks (${chunks.length})`);
      }
      
      // Validation : chaque embedding doit être un tableau non vide
      const validEmbeddings = embeddings.filter(emb => Array.isArray(emb) && emb.length > 0);
      console.log(`   Validation embeddings: ${validEmbeddings.length}/${embeddings.length} embeddings valides`);
      
      if (validEmbeddings.length !== embeddings.length) {
        throw new Error(`Certains embeddings sont invalides (${validEmbeddings.length}/${embeddings.length} valides)`);
      }
      
      console.log(`   ✅ Tous les embeddings sont valides (dimension: ${embeddings[0]?.length || 0})`);
    } catch (error) {
      console.error("❌ Erreur lors de la génération des embeddings:", error);
      await cleanupOnError("generate_embeddings");
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

    // Étape 5 : Vérifier si un document avec le même titre existe (versionning)
    console.log("🔍 [Étape 5/7] Vérification du versionning...");
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
        console.log(`✅ Version ${version} créée (ancienne version ${previousVersionId} désactivée)`);
      }
    } catch (error) {
      console.error("⚠️ Erreur lors de la vérification du versionning:", error);
      // Continuer même en cas d'erreur
    }

    // Étape 6 : Transaction atomique pour créer document + chunks
    console.log("💾 [Étape 6/7] Stockage atomique du document et des chunks dans Firestore...");
    
    /**
     * Fonction pour stocker le document et tous les chunks de manière atomique
     */
    const storeDocumentWithChunksAtomically = async (
      documentId: string,
      documentData: any,
      chunksData: DocumentChunk[]
    ): Promise<void> => {
      console.log(`   Préparation transaction: document + ${chunksData.length} chunks`);
      return adminDb.runTransaction(async (transaction) => {
        // Créer le document avec le bon chunkCount dès le départ
        const docRef = adminDb.collection("rag_documents").doc(documentId);
        transaction.set(docRef, {
          ...documentData,
          chunkCount: chunksData.length,
          status: "indexed" as DocumentStatus,
        });
        console.log(`   Transaction: document ${documentId} préparé avec chunkCount=${chunksData.length}`);

        // Créer tous les chunks
        for (const chunkData of chunksData) {
          const chunkRef = adminDb.collection("rag_chunks").doc(chunkData.id);
          transaction.set(chunkRef, chunkData);
        }
        console.log(`   Transaction: ${chunksData.length} chunks préparés`);
      });
    };

    try {
      // Préparer les données du document
      const documentData: any = {
        id: sourceId,
        title: documentTitle.trim(),
        type: documentType || "document",
        source: file.name,
        storagePath: storagePath,
        status: "indexed" as DocumentStatus, // Directement "indexed" car tout est prêt
        isActive: true,
        uploadedBy: auth.userId,
        chunkCount: chunks.length, // Le bon nombre dès le départ
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      // Ajouter les métadonnées OCR si disponibles
      if (extractionMetadata) {
        documentData.extractionMethod = extractionMetadata.extractionMethod;
        if (extractionMetadata.ocrEngine) {
          documentData.ocrEngine = extractionMetadata.ocrEngine;
        }
        if (extractionMetadata.ocrPageCount !== undefined) {
          documentData.ocrPageCount = extractionMetadata.ocrPageCount;
          documentData.ocrAt = Timestamp.now();
        }
      }
      
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

      // Préparer les données des chunks
      const chunksData: DocumentChunk[] = chunks.map((chunk, i) => {
        const chunkRef = adminDb.collection("rag_chunks").doc();
        const tokenCount = estimateTokens(chunk);
        
        return {
          id: chunkRef.id,
          content: chunk,
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
      });

      // Exécuter la transaction atomique
      await storeDocumentWithChunksAtomically(sourceId, documentData, chunksData);
      console.log(`   ✅ Transaction réussie : document + ${chunks.length} chunks créés atomiquement`);
      
      // Étape 7 : Traitements en arrière-plan
      console.log("🔄 [Étape 7/7] Lancement des traitements en arrière-plan (catégorisation, résumé, contradictions)...");
      
      // Étape 7 : Traitements en arrière-plan (APRÈS création du document)
      // Catégorisation automatique (si non fournie)
      let finalCategory = category;
      if (!finalCategory) {
        categorizeDocument(documentTitle, text)
          .then((cat) => {
            if (cat) {
              documentRef.update({ category: cat, updatedAt: Timestamp.now() }).catch(console.error);
            }
          })
          .catch((err) => {
            console.error("Erreur lors de la catégorisation:", err);
          });
      } else {
        finalCategory = category;
      }

      // Génération du résumé (en arrière-plan)
      generateDocumentSummary(documentTitle, text)
        .then((summary) => {
          if (summary) {
            documentRef.update({ summary, updatedAt: Timestamp.now() }).catch(console.error);
          }
        })
        .catch((err) => {
          console.error("Erreur lors de la génération du résumé:", err);
        });

      // Détection de contradictions (en arrière-plan)
      detectContradictions(documentTitle, text, finalCategory)
        .then((contradictions) => {
          if (contradictions && contradictions.length > 0) {
            console.warn(`⚠️ ${contradictions.length} contradiction(s) détectée(s) avec d'autres documents`);
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
        .catch((err) => {
          console.error("Erreur lors de la détection de contradictions:", err);
        });
    } catch (error) {
      console.error("❌ Erreur lors du stockage atomique:", error);
      console.error("Détails:", {
        message: error instanceof Error ? error.message : "Erreur inconnue",
        code: (error as any)?.code,
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Cleanup nécessaire : même si la transaction a échoué (document/chunks non créés),
      // le fichier Storage a déjà été uploadé et doit être supprimé
      await cleanupOnError("store_atomic");
      return NextResponse.json(
        {
          error: "Erreur lors du stockage atomique du document et des chunks",
          message: error instanceof Error ? error.message : "Erreur inconnue",
          code: (error as any)?.code || "FIRESTORE_TRANSACTION_ERROR",
          step: "store_atomic",
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

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`✅ Upload terminé avec succès en ${duration}s`);
    console.log(`   Document ID: ${sourceId}`);
    console.log(`   Titre: ${documentTitle}`);
    console.log(`   Chunks: ${chunks.length}`);
    console.log("═══════════════════════════════════════════════════════════");
    
    return NextResponse.json(
      {
        success: true,
        message: "Document indexé avec succès",
        documentId: sourceId,
        title: documentTitle,
        chunkCount: chunks.length,
        status: "indexed",
        duration: `${duration}s`,
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

