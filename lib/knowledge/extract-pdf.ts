/**
 * Utilitaires pour l'extraction et le traitement des noms de fichiers PDF.
 */

/**
 * Génère un slug à partir d'un nom de fichier (sans extension).
 * Ex: "Document Allianz - COM123.pdf" → "document-allianz-com123"
 */
export function slugFromFilename(filename: string): string {
  const withoutExt = filename.replace(/\.pdf$/i, "").trim();
  if (!withoutExt) return "";

  return withoutExt
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "";
}
