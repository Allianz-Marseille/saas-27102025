/**
 * Utilitaires pour l'extraction PDF et la génération de slugs.
 * Partagés par l'API ingest et les scripts d'extraction.
 */

/**
 * Extrait le texte d'un buffer PDF via pdf-parse.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const { createRequire } = await import("module");
  const require = createRequire(import.meta.url);
  const pdfParse = require("pdf-parse");

  if (typeof pdfParse !== "function") {
    throw new Error("Impossible de charger pdf-parse correctement");
  }

  const pdfData = await pdfParse(buffer);
  const text = pdfData?.text;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Aucun texte extrait du PDF");
  }

  return text.trim();
}

/**
 * Génère un slug unique à partir du nom de fichier pour docId/title.
 * @param filename - Nom du fichier (ex. "Vademecum_Bonus_malus_V04-23.pdf")
 * @param maxLength - Longueur max du slug (défaut 80)
 */
export function slugFromFilename(filename: string, maxLength = 80): string {
  const base = filename.replace(/\.pdf$/i, "");
  return base
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, maxLength);
}
