/**
 * Service pour extraire le texte des PDFs et images, et créer les chunks
 */

import pdf from "pdf-parse";
import { createWorker } from "tesseract.js";
import { ragConfig } from "@/lib/config/rag-config";
import type { DocumentChunk, OCRResult, FileType } from "./types";

/**
 * Extrait le texte d'un fichier PDF
 */
export async function extractTextFromPDF(
  buffer: Buffer
): Promise<string> {
  try {
    // Import dynamique pour pdf-parse (pas d'export default en ESM)
    const pdfParse = await import("pdf-parse");
    const data = await pdfParse.default(buffer);
    return data.text;
  } catch (error) {
    console.error("Erreur lors de l'extraction du texte PDF:", error);
    throw new Error(
      `Impossible d'extraire le texte du PDF: ${error instanceof Error ? error.message : "Erreur inconnue"}`
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
  const { provider, language, confidenceThreshold } = ragConfig.ocr;

  if (!ragConfig.ocr.enabled) {
    throw new Error("OCR n'est pas activé dans la configuration");
  }

  try {
    if (provider === "tesseract") {
      // Utiliser Tesseract.js
      const worker = await createWorker(language);
      
      // Convertir le buffer en format approprié pour Tesseract
      const imageData = await worker.recognize(buffer);
      await worker.terminate();

      const confidence = imageData.data.confidence / 100; // Convertir de 0-100 à 0-1

      return {
        text: imageData.data.text,
        confidence,
        language: imageData.data.language,
        metadata: {
          words: imageData.data.words?.length || 0,
          lines: imageData.data.lines?.length || 0,
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
    console.error("Erreur lors de l'extraction OCR:", error);
    throw new Error(
      `Impossible d'extraire le texte de l'image: ${error instanceof Error ? error.message : "Erreur inconnue"}`
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
  try {
    // Extraire le texte
    const text = await extractTextFromPDF(buffer);

    if (!text || text.trim().length === 0) {
      throw new Error("Aucun texte trouvé dans le PDF");
    }

    // Découper en chunks
    const chunkTexts = chunkText(text);

    // Créer les DocumentChunk
    const chunks: DocumentChunk[] = chunkTexts.map((chunkText, index) => ({
      id: `${documentId}_chunk_${index}`,
      documentId,
      text: chunkText,
      chunkIndex: index,
      metadata: {
        // Pour les PDFs, on pourrait extraire le numéro de page si nécessaire
      },
    }));

    return chunks;
  } catch (error) {
    console.error("Erreur lors du traitement du PDF:", error);
    throw error;
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
  try {
    // Extraire le texte avec OCR
    const ocrResult = await extractTextFromImage(buffer, imageType);

    // Vérifier le score de confiance
    if (ocrResult.confidence < ragConfig.ocr.confidenceThreshold) {
      console.warn(
        `Score de confiance OCR faible: ${ocrResult.confidence}. Seuil: ${ragConfig.ocr.confidenceThreshold}`
      );
    }

    if (!ocrResult.text || ocrResult.text.trim().length === 0) {
      throw new Error("Aucun texte trouvé dans l'image (OCR)");
    }

    // Découper en chunks
    const chunkTexts = chunkText(ocrResult.text);

    // Créer les DocumentChunk
    const chunks: DocumentChunk[] = chunkTexts.map((chunkText, index) => ({
      id: `${documentId}_chunk_${index}`,
      documentId,
      text: chunkText,
      chunkIndex: index,
      metadata: {
        ocrConfidence: ocrResult.confidence,
      },
    }));

    return { chunks, ocrResult };
  } catch (error) {
    console.error("Erreur lors du traitement de l'image:", error);
    throw error;
  }
}

/**
 * Détermine le type de fichier à partir du MIME type
 */
export function getFileTypeFromMimeType(mimeType: string): FileType | null {
  if (ragConfig.files.allowedPDFTypes.includes(mimeType)) {
    return "pdf";
  }

  if (ragConfig.files.allowedImageTypes.includes(mimeType)) {
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

  // Vérifier le type MIME
  if (fileType === "pdf" && !allowedPDFTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Types autorisés: ${allowedPDFTypes.join(", ")}`,
    };
  }

  if (fileType === "image" && !allowedImageTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Types autorisés: ${allowedImageTypes.join(", ")}`,
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

