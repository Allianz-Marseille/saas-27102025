/**
 * OCR via Google Cloud Vision API pour les images.
 * Utilisé par la route chat pour enrichir le contexte des bots (Nina, Sinistro, Bob).
 * Fallback : en cas d'erreur (credentials, quota, API), retourne une chaîne vide
 * pour ne pas bloquer le flux.
 */

import type { ImageAnnotatorClient } from "@google-cloud/vision";

export interface VisionOcrOptions {
  /** true = documentTextDetection (structure blocs/paragraphes), false = textDetection (simple) */
  documentTextDetection?: boolean;
}

const MAX_IMAGES_OCR_PER_REQUEST = 5;

/**
 * Retourne le client Vision. Utilise GOOGLE_APPLICATION_CREDENTIALS_JSON (inline)
 * ou GOOGLE_APPLICATION_CREDENTIALS (chemin fichier). En cas d'absence, retourne null.
 */
async function getVisionClient(): Promise<ImageAnnotatorClient | null> {
  try {
    const { ImageAnnotatorClient } = await import("@google-cloud/vision");
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (credentialsJson) {
      let credentials: object;
      try {
        credentials = JSON.parse(credentialsJson) as object;
      } catch {
        console.warn("[vision-ocr] GOOGLE_APPLICATION_CREDENTIALS_JSON invalide (JSON)");
        return null;
      }
      return new ImageAnnotatorClient({ credentials });
    }

    return new ImageAnnotatorClient();
  } catch (err) {
    console.warn("[vision-ocr] Impossible de créer le client Vision:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Extrait le texte d'une image (base64 ou dataURL) via Google Cloud Vision.
 * En cas d'échec, retourne "" pour permettre un fallback sans OCR.
 *
 * @param imageBase64OrDataUrl - Chaîne base64 ou dataURL (data:image/...;base64,...)
 * @param options - documentTextDetection: true pour Sinistro (structure document)
 */
export async function extractTextFromImageWithVision(
  imageBase64OrDataUrl: string,
  options: VisionOcrOptions = {}
): Promise<string> {
  const client = await getVisionClient();
  if (!client) {
    return "";
  }

  let base64 = imageBase64OrDataUrl.trim();
  if (base64.startsWith("data:image/")) {
    const comma = base64.indexOf(",");
    base64 = comma >= 0 ? base64.slice(comma + 1) : "";
  }
  if (!base64) {
    return "";
  }

  try {
    const [result] = options.documentTextDetection
      ? await client.documentTextDetection({ image: { content: base64 } })
      : await client.textDetection({ image: { content: base64 } });

    const annotation = options.documentTextDetection
      ? (result as { fullTextAnnotation?: { text?: string } }).fullTextAnnotation
      : (result as { textAnnotations?: Array<{ description?: string }> }).textAnnotations?.[0];

    if (annotation && "text" in annotation && typeof annotation.text === "string") {
      return annotation.text.trim();
    }
    if (annotation && "description" in annotation && typeof annotation.description === "string") {
      return annotation.description.trim();
    }
    return "";
  } catch (err) {
    console.warn("[vision-ocr] Erreur OCR Vision:", err instanceof Error ? err.message : err);
    return "";
  }
}

/**
 * Applique l'OCR Vision sur une liste d'images (dataURL ou base64).
 * Limite : MAX_IMAGES_OCR_PER_REQUEST images pour maîtriser coûts et quotas.
 * Retourne un tableau de textes (une entrée par image, "" en cas d'échec ou de skip).
 */
export async function extractTextFromImagesWithVision(
  images: string[],
  options: VisionOcrOptions & { maxImages?: number } = {}
): Promise<{ textByImage: string[]; ocrSection: string }> {
  const maxImages = options.maxImages ?? MAX_IMAGES_OCR_PER_REQUEST;
  const toProcess = images.slice(0, maxImages);
  const textByImage: string[] = [];

  for (const img of toProcess) {
    const text = await extractTextFromImageWithVision(img, {
      documentTextDetection: options.documentTextDetection,
    });
    textByImage.push(text);
  }

  const ocrSection =
    textByImage.some((t) => t.length > 0) ?
      "\n\n--- TEXTE EXTRAIT DES IMAGES (OCR) ---\n\n" +
        textByImage
          .map((t, i) => (t ? `[Image ${i + 1}]\n${t}` : ""))
          .filter(Boolean)
          .join("\n\n")
    : "";

  return { textByImage, ocrSection };
}

export { MAX_IMAGES_OCR_PER_REQUEST };
