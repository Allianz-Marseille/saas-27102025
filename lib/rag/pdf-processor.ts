/**
 * Service pour extraire le texte des PDFs et images, et créer les chunks
 */

import { createWorker } from "tesseract.js";
import { ragConfig } from "@/lib/config/rag-config";
import type { DocumentChunk, OCRResult, FileType } from "./types";

// Polyfill pour DOMMatrix dans l'environnement serverless (nécessaire pour pdf-parse)
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).DOMMatrix === 'undefined') {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    constructor() {
      // Polyfill minimal pour pdf-parse
    }
  };
}

// Import dynamique de pdf-parse avec cache
let pdfParseFunction: any = null;

async function getPdfParse(): Promise<any> {
  if (pdfParseFunction) {
    return pdfParseFunction;
  }

  try {
    const pdfParse = await import("pdf-parse");
    
    // pdf-parse exporte soit une fonction directe, soit un objet avec default
    if (typeof pdfParse === "function") {
      pdfParseFunction = pdfParse;
    } else if (typeof (pdfParse as any).default === "function") {
      pdfParseFunction = (pdfParse as any).default;
    } else {
      // Dernier recours : chercher une fonction dans l'objet
      const keys = Object.keys(pdfParse);
      for (const key of keys) {
        if (typeof (pdfParse as any)[key] === "function") {
          pdfParseFunction = (pdfParse as any)[key];
          break;
        }
      }
    }
    
    if (!pdfParseFunction || typeof pdfParseFunction !== "function") {
      throw new Error("pdf-parse n'a pas exporté de fonction valide");
    }
    
    return pdfParseFunction;
  } catch (error) {
    console.error("[PDF] Erreur import pdf-parse:", error);
    throw new Error(
      `Impossible de charger le module pdf-parse: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Valide la structure d'un PDF avant extraction
 */
function validatePDFStructure(buffer: Buffer): { valid: boolean; error?: string } {
  try {
    // Vérifier que le buffer commence par le header PDF (%PDF)
    const header = buffer.subarray(0, 4).toString("ascii");
    if (header !== "%PDF") {
      return {
        valid: false,
        error: "Le fichier ne semble pas être un PDF valide (header manquant)",
      };
    }

    // Vérifier la taille minimale (un PDF doit avoir au moins quelques centaines d'octets)
    if (buffer.length < 100) {
      return {
        valid: false,
        error: "Le fichier PDF est trop petit pour être valide",
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Erreur lors de la validation du PDF: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
    };
  }
}

/**
 * Extrait le texte d'un fichier PDF
 */
export async function extractTextFromPDF(
  buffer: Buffer
): Promise<string> {
  const startTime = Date.now();
  
  try {
    // 1. Valider la structure du PDF
    console.log(`[PDF] Validation de la structure (taille: ${buffer.length} bytes)`);
    const validation = validatePDFStructure(buffer);
    if (!validation.valid) {
      throw new Error(validation.error || "PDF invalide");
    }

    // 2. Extraire le texte avec pdf-parse
    console.log(`[PDF] Début extraction texte...`);
    const pdfParse = await getPdfParse();
    const data = await pdfParse(buffer, {
      // Options pour gérer les PDFs protégés ou complexes
      max: 0, // Pas de limite de pages
    });

    const extractionTime = Date.now() - startTime;
    const textLength = data.text?.length || 0;
    const numPages = data.numpages || 0;

    console.log(`[PDF] Extraction réussie en ${extractionTime}ms - ${numPages} pages, ${textLength} caractères`);

    // 3. Vérifier que du texte a été extrait
    if (!data.text || data.text.trim().length === 0) {
      // Vérifier si le PDF est protégé par mot de passe
      if (data.info?.Encrypted || data.info?.Trapped === "True") {
        throw new Error(
          "Le PDF semble être protégé par mot de passe ou crypté. Impossible d'extraire le texte."
        );
      }
      
      throw new Error(
        "Aucun texte n'a pu être extrait du PDF. Le fichier pourrait être une image scannée ou un PDF vide."
      );
    }

    return data.text;
  } catch (error) {
    const extractionTime = Date.now() - startTime;
    console.error(`[PDF] Erreur après ${extractionTime}ms:`, error);
    
    // Distinguer les erreurs récupérables des erreurs fatales
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    
    // Erreurs récupérables (ne pas supprimer le fichier)
    if (
      errorMessage.includes("mot de passe") ||
      errorMessage.includes("protégé") ||
      errorMessage.includes("crypté") ||
      errorMessage.includes("scanné")
    ) {
      throw new Error(`PDF non traitable: ${errorMessage}`);
    }
    
    // Erreurs fatales (fichier corrompu)
    if (
      errorMessage.includes("corrompu") ||
      errorMessage.includes("invalide") ||
      errorMessage.includes("header")
    ) {
      throw new Error(`PDF corrompu: ${errorMessage}`);
    }
    
    // Erreur générique
    throw new Error(
      `Erreur lors de l'extraction du texte du PDF: ${errorMessage}`
    );
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

    // Créer les DocumentChunk
    const chunks: DocumentChunk[] = chunkTexts.map((chunkText, index) => ({
      id: `${documentId}_chunk_${index}`,
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

    // Créer les DocumentChunk
    const chunks: DocumentChunk[] = chunkTexts.map((chunkText, index) => ({
      id: `${documentId}_chunk_${index}`,
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
  // Utiliser une vérification explicite pour éviter les problèmes de type avec readonly arrays
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

