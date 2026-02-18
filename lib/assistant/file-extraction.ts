/**
 * Extraction de texte générique pour fichiers DOCX, XLSX et PDF
 * Utilisé par l'assistant et la base de connaissance RAG
 */

import ExcelJS from "exceljs";

/**
 * Extrait le texte brut d'un buffer PDF.
 * Utilisé par l'API knowledge-base/ingest pour l'ingestion RAG.
 */
export async function extractTextFromPDFBuffer(buffer: Buffer): Promise<string> {
  try {
    const { createRequire } = await import("module");
    const requireFromProject = createRequire(import.meta.url);
    const pdfParse = requireFromProject("pdf-parse");

    if (typeof pdfParse !== "function") {
      throw new Error("Impossible de charger pdf-parse correctement");
    }

    const pdfData = await pdfParse(buffer);
    const text = (pdfData.text || "").trim();

    if (!text || text.length === 0) {
      throw new Error("Aucun texte extrait du PDF");
    }

    return text;
  } catch (error) {
    console.error("Erreur extraction PDF:", error);
    throw new Error(
      `Impossible d'extraire le texte du PDF : ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Extrait le texte brut d'un fichier DOCX ou XLSX
 * @param file - Objet File du formulaire
 * @param arrayBuffer - Contenu binaire du fichier
 * @returns Le texte extrait du document
 */
export async function extractTextFromFile(
  file: File,
  arrayBuffer: ArrayBuffer
): Promise<string> {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type;

  const isDocx =
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx");
  const isXlsx =
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileName.endsWith(".xlsx");

  if (isDocx) {
    return extractTextFromDocx(arrayBuffer);
  }
  if (isXlsx) {
    return extractTextFromXlsx(arrayBuffer);
  }

  throw new Error(`Type de fichier non supporté : ${file.name}`);
}

/**
 * Extrait le texte d'un fichier Word (.docx) via mammoth
 */
async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const { Buffer } = await import("buffer");
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value?.trim();

    if (!text || text.length === 0) {
      throw new Error("Aucun texte extrait du document Word");
    }

    return text;
  } catch (error) {
    console.error("Erreur extraction DOCX:", error);
    throw new Error(
      `Impossible d'extraire le texte du Word : ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Extrait le texte d'un fichier Excel (.xlsx) via ExcelJS
 * Parcourt toutes les feuilles et concatène les valeurs des cellules
 */
async function extractTextFromXlsx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const { Buffer } = await import("buffer");
    const buffer = Buffer.from(arrayBuffer);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    const lines: string[] = [];

    for (const worksheet of workbook.worksheets) {
      if (!worksheet) continue;

      worksheet.eachRow((row, rowNumber) => {
        const rowValues: string[] = [];
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          const value = getCellText(cell);
          if (value) {
            rowValues.push(value);
          }
        });
        if (rowValues.length > 0) {
          lines.push(rowValues.join("\t"));
        }
      });
    }

    const text = lines.join("\n").trim();
    if (!text) {
      throw new Error("Aucun contenu extrait du fichier Excel");
    }

    return text;
  } catch (error) {
    console.error("Erreur extraction XLSX:", error);
    throw new Error(
      `Impossible d'extraire le texte de l'Excel : ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Convertit la valeur d'une cellule Excel en texte
 */
function getCellText(cell: ExcelJS.Cell): string {
  if (!cell || cell.value === null || cell.value === undefined) {
    return "";
  }

  const v = cell.value;

  if (typeof v === "object" && v !== null && "result" in v) {
    return String((v as { result: unknown }).result ?? "");
  }
  if (typeof v === "object" && v !== null && "text" in v) {
    return String((v as { text: unknown }).text ?? "");
  }
  if (typeof v === "object" && v !== null && "richText" in v) {
    const richText = (v as { richText: Array<{ text: string }> }).richText;
    return richText.map((rt) => rt.text).join("");
  }

  return String(v);
}
