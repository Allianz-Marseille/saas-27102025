/**
 * Service pour extraire le texte des PDFs et images, et créer les chunks
 * Utilise Google Document AI pour les PDFs (avec fallback pdf-parse) et tesseract.js pour l'OCR
 */

import { ragConfig } from "@/lib/config/rag-config";
import type { DocumentChunk, OCRResult, FileType } from "./types";
import { getDocumentAIClient, googleConfig } from "@/lib/google-cloud/config";
import { v4 as uuidv4 } from "uuid";

/**
 * Extrait le texte d'un fichier PDF avec Google Document AI, avec fallback sur pdf-parse
 */
export async function extractTextFromPDF(
  buffer: Buffer
): Promise<string> {
  const startTime = Date.now();
  console.log(`[PDF Extraction] Début extraction PDF (${(buffer.length / 1024).toFixed(2)} KB)`);

  // Essayer d'abord avec Document AI
  try {
    const client = getDocumentAIClient();
    
    // Construire le nom du processeur
    const processorName = `projects/${googleConfig.projectId}/locations/${googleConfig.documentAI.location}/processors/${googleConfig.documentAI.processorId}`;
    
    console.log(`[Document AI] Tentative extraction avec Document AI (processeur: ${processorName})`);

    // Préparer la requête
    const request = {
      name: processorName,
      rawDocument: {
        content: buffer.toString("base64"),
        mimeType: "application/pdf",
      },
    };

    // Appeler l'API Document AI
    const [result] = await client.processDocument(request);
    const { document } = result;

    if (!document || !document.text) {
      throw new Error("Aucun texte extrait du PDF par Document AI");
    }

    const extractionTime = Date.now() - startTime;
    const textLength = document.text.length;

    console.log(`[Document AI] Extraction réussie en ${extractionTime}ms - ${textLength} caractères`);

    return document.text;
  } catch (documentAIError) {
    const documentAITime = Date.now() - startTime;
    const errorMessage = documentAIError instanceof Error ? documentAIError.message : "Erreur inconnue";
    
    // Vérifier si c'est une erreur récupérable (INVALID_ARGUMENT, PDF protégé, etc.)
    const isRecoverableError = 
      errorMessage.includes("INVALID_ARGUMENT") ||
      errorMessage.includes("3 INVALID_ARGUMENT") ||
      errorMessage.includes("corrompu") ||
      errorMessage.includes("protégé") ||
      errorMessage.includes("password") ||
      errorMessage.includes("encrypted");

    if (isRecoverableError) {
      console.warn(`[Document AI] Erreur récupérable après ${documentAITime}ms: ${errorMessage}`);
      console.log(`[PDF Parse] Activation du fallback avec pdf-parse...`);
    } else {
      console.error(`[Document AI] Erreur non récupérable après ${documentAITime}ms: ${errorMessage}`);
      // Pour les erreurs non récupérables (connexion, authentification, etc.), on essaie quand même le fallback
      console.log(`[PDF Parse] Tentative avec pdf-parse en dernier recours...`);
    }

    // Fallback: utiliser pdf-parse
    try {
      const fallbackStartTime = Date.now();
      // Import dynamique pour éviter les problèmes de build
      const pdfParse = await import("pdf-parse");
      
      const data = await pdfParse.default(buffer);
      const extractedText = data.text || "";

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("Aucun texte extrait du PDF avec pdf-parse");
      }

      const fallbackTime = Date.now() - fallbackStartTime;
      const totalTime = Date.now() - startTime;
      const textLength = extractedText.length;

      console.log(`[PDF Parse] Extraction réussie en ${fallbackTime}ms (total: ${totalTime}ms) - ${textLength} caractères`);
      console.log(`[PDF Parse] Fallback utilisé car Document AI a échoué: ${errorMessage.substring(0, 100)}...`);

      return extractedText;
    } catch (fallbackError) {
      const totalTime = Date.now() - startTime;
      const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : "Erreur inconnue";
      
      console.error(`[PDF Extraction] Échec complet après ${totalTime}ms`);
      console.error(`[Document AI] Erreur: ${errorMessage}`);
      console.error(`[PDF Parse] Erreur: ${fallbackErrorMessage}`);

      // Déterminer le type d'erreur pour un message plus clair
      if (fallbackErrorMessage.includes("password") || fallbackErrorMessage.includes("encrypted")) {
        throw new Error("Le PDF est protégé par mot de passe. Impossible d'extraire le texte.");
      } else if (fallbackErrorMessage.includes("corrupted") || fallbackErrorMessage.includes("invalid")) {
        throw new Error("Le fichier PDF est corrompu ou invalide. Impossible d'extraire le texte.");
      } else {
        throw new Error(
          `Impossible d'extraire le texte du PDF. Document AI: ${errorMessage.substring(0, 100)}. PDF Parse: ${fallbackErrorMessage.substring(0, 100)}`
        );
      }
    }
  }
}

/**
 * Extrait le texte d'une image avec OCR
 */
export async function extractTextFromImage(
  buffer: Buffer,
  imageType: "png" | "jpg" | "jpeg" | "webp"
): Promise<OCRResult> {
  const startTime = Date.now();
  const { provider, language, confidenceThreshold } = ragConfig.ocr;

  if (!ragConfig.ocr.enabled) {
    throw new Error("OCR n'est pas activé dans la configuration");
  }

  try {
    if (provider === "tesseract") {
      console.log(`[OCR] Début extraction avec Tesseract (langue: ${language}, taille: ${(buffer.length / 1024).toFixed(2)} KB)`);
      
      // Import dynamique de tesseract.js pour éviter l'évaluation au build time
      const { createWorker } = await import("tesseract.js");
      
      // Utiliser Tesseract.js
      const worker = await createWorker(language);
      
      // Convertir le buffer en format approprié pour Tesseract
      const imageData = await worker.recognize(buffer);
      await worker.terminate();

      const confidence = imageData.data.confidence / 100; // Convertir de 0-100 à 0-1
      const extractionTime = Date.now() - startTime;
      const textLength = imageData.data.text?.length || 0;

      console.log(`[OCR] Extraction réussie en ${extractionTime}ms - ${textLength} caractères, confiance: ${(confidence * 100).toFixed(1)}%`);

      if (confidence < confidenceThreshold) {
        console.warn(`[OCR] Confiance faible (${(confidence * 100).toFixed(1)}%) - seuil: ${(confidenceThreshold * 100).toFixed(1)}%`);
      }

      return {
        text: imageData.data.text,
        confidence,
        language, // Utiliser le langage de configuration
        metadata: {
          provider: "tesseract",
          extractionTime,
        },
      };
    } else {
      // Pour les autres providers (Google Vision, AWS Textract, Azure)
      // À implémenter selon le provider choisi
      throw new Error(
        `Provider OCR "${provider}" non implémenté. Utilisez "tesseract" pour le moment.`
      );
    }
  } catch (error) {
    const extractionTime = Date.now() - startTime;
    console.error(`[OCR] Erreur après ${extractionTime}ms:`, error);
    
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    throw new Error(
      `Impossible d'extraire le texte de l'image: ${errorMessage}`
    );
  }
}

/**
 * Découpe un texte en chunks avec overlap
 */
export function chunkText(
  text: string,
  chunkSize: number = ragConfig.chunking.chunkSize,
  overlap: number = ragConfig.chunking.overlap
): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Si on n'est pas à la fin, essayer de couper à un espace ou ponctuation
    if (end < text.length) {
      // Chercher le dernier espace, point, ou saut de ligne avant la limite
      const lastSpace = text.lastIndexOf(" ", end);
      const lastPeriod = text.lastIndexOf(".", end);
      const lastNewline = text.lastIndexOf("\n", end);

      const cutPoint = Math.max(lastSpace, lastPeriod, lastNewline);

      if (cutPoint > start) {
        end = cutPoint + 1; // Inclure le caractère de coupure
      }
    }

    const chunk = text.slice(start, end).trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Avancer avec overlap
    start = end - overlap;
    if (start < 0) start = 0;
  }

  return chunks;
}

/**
 * Traite un PDF pour l'indexation
 */
export async function processPDFForIndexing(
  buffer: Buffer,
  documentId: string
): Promise<DocumentChunk[]> {
  const startTime = Date.now();
  console.log(`[PDF Processing] Début traitement pour document ${documentId} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

  try {
    // Extraire le texte
    const text = await extractTextFromPDF(buffer);

    if (!text || text.trim().length === 0) {
      throw new Error("Aucun texte trouvé dans le PDF après extraction");
    }

    console.log(`[PDF Processing] Texte extrait: ${text.length} caractères`);

    // Découper en chunks
    const chunkTexts = chunkText(text);
    console.log(`[PDF Processing] ${chunkTexts.length} chunks créés`);

    if (chunkTexts.length === 0) {
      throw new Error("Aucun chunk n'a pu être créé à partir du texte extrait");
    }

    // Créer les DocumentChunk avec des UUID valides pour Qdrant
    const chunks: DocumentChunk[] = chunkTexts.map((chunkText, index) => ({
      id: uuidv4(), // UUID valide pour Qdrant
      documentId,
      text: chunkText,
      chunkIndex: index,
      metadata: {
        chunkSize: chunkText.length,
        // Pour les PDFs, on pourrait extraire le numéro de page si nécessaire
      },
    }));

    const processingTime = Date.now() - startTime;
    console.log(`[PDF Processing] Traitement terminé en ${processingTime}ms - ${chunks.length} chunks générés`);

    return chunks;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[PDF Processing] Erreur après ${processingTime}ms:`, error);
    
    // Préserver le message d'erreur original
    if (error instanceof Error) {
      // Ajouter le contexte du document
      error.message = `[Document ${documentId}] ${error.message}`;
    throw error;
    }
    
    throw new Error(`Erreur lors du traitement du PDF: ${error}`);
  }
}

/**
 * Traite une image pour l'indexation avec OCR
 */
export async function processImageForIndexing(
  buffer: Buffer,
  documentId: string,
  imageType: "png" | "jpg" | "jpeg" | "webp"
): Promise<{ chunks: DocumentChunk[]; ocrResult: OCRResult }> {
  const startTime = Date.now();
  console.log(`[Image Processing] Début traitement pour document ${documentId} (type: ${imageType}, ${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

  try {
    // Extraire le texte avec OCR
    const ocrResult = await extractTextFromImage(buffer, imageType);

    // Vérifier le score de confiance
    if (ocrResult.confidence < ragConfig.ocr.confidenceThreshold) {
      console.warn(
        `[Image Processing] Score de confiance OCR faible: ${(ocrResult.confidence * 100).toFixed(1)}%. Seuil: ${(ragConfig.ocr.confidenceThreshold * 100).toFixed(1)}%`
      );
    }

    if (!ocrResult.text || ocrResult.text.trim().length === 0) {
      throw new Error("Aucun texte trouvé dans l'image après OCR");
    }

    console.log(`[Image Processing] Texte extrait: ${ocrResult.text.length} caractères (confiance: ${(ocrResult.confidence * 100).toFixed(1)}%)`);

    // Découper en chunks
    const chunkTexts = chunkText(ocrResult.text);
    console.log(`[Image Processing] ${chunkTexts.length} chunks créés`);

    if (chunkTexts.length === 0) {
      throw new Error("Aucun chunk n'a pu être créé à partir du texte OCR");
    }

    // Créer les DocumentChunk avec des UUID valides pour Qdrant
    const chunks: DocumentChunk[] = chunkTexts.map((chunkText, index) => ({
      id: uuidv4(), // UUID valide pour Qdrant
      documentId,
      text: chunkText,
      chunkIndex: index,
      metadata: {
        ocrConfidence: ocrResult.confidence,
        chunkSize: chunkText.length,
      },
    }));

    const processingTime = Date.now() - startTime;
    console.log(`[Image Processing] Traitement terminé en ${processingTime}ms - ${chunks.length} chunks générés`);

    return { chunks, ocrResult };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[Image Processing] Erreur après ${processingTime}ms:`, error);
    
    // Préserver le message d'erreur original
    if (error instanceof Error) {
      error.message = `[Document ${documentId}] ${error.message}`;
    throw error;
    }
    
    throw new Error(`Erreur lors du traitement de l'image: ${error}`);
  }
}

/**
 * Détermine le type de fichier à partir du MIME type
 */
export function getFileTypeFromMimeType(mimeType: string): FileType | null {
  const pdfTypes = ragConfig.files.allowedPDFTypes as readonly string[];
  const imageTypes = ragConfig.files.allowedImageTypes as readonly string[];
  
  if (pdfTypes.includes(mimeType)) {
    return "pdf";
  }

  if (imageTypes.includes(mimeType)) {
    return "image";
  }

  return null;
}

/**
 * Détermine le type d'image à partir du MIME type
 */
export function getImageTypeFromMimeType(
  mimeType: string
): "png" | "jpg" | "jpeg" | "webp" | null {
  const mapping: Record<string, "png" | "jpg" | "jpeg" | "webp"> = {
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "image/webp": "webp",
  };

  return mapping[mimeType] || null;
}

/**
 * Valide un fichier avant traitement
 */
export function validateFile(
  file: File,
  fileType: FileType
): { valid: boolean; error?: string } {
  const { maxSizePDF, maxSizeImage, allowedPDFTypes, allowedImageTypes } =
    ragConfig.files;

  // Cast en readonly string[] pour permettre l'utilisation de .includes()
  const pdfTypes = allowedPDFTypes as readonly string[];
  const imageTypes = allowedImageTypes as readonly string[];

  // Vérifier le type MIME
  if (fileType === "pdf" && !pdfTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Types autorisés: ${pdfTypes.join(", ")}`,
    };
  }

  if (fileType === "image" && !imageTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Types autorisés: ${imageTypes.join(", ")}`,
    };
  }

  // Vérifier la taille
  const maxSize = fileType === "pdf" ? maxSizePDF : maxSizeImage;
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille maximale: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

