/**
 * Parser pour les fichiers Excel de sinistres exportés depuis le CRM Lagon
 * 
 * Format fixe : 11 colonnes dans un ordre déterminé
 * Première ligne = en-têtes (à ignorer)
 * Lignes partielles : seule la colonne 8 (montant payé) remplie
 */

import ExcelJS from "exceljs";

export interface ParsedExcelLine {
  clientName: string;
  clientLagonNumber: string;
  policyNumber: string;
  policyCategory: string;
  productType: string;
  claimNumber: string;
  incidentDate: string | number; // Peut être une date Excel (nombre) ou une string
  amountPaid: string | number;
  remainingAmount: string | number;
  recourse: string | number | boolean;
  damagedCoverage: string;
  isPartialLine: boolean;
  lineIndex: number;
  partialAmounts: number[];
}

export interface ParsedExcelResult {
  lines: Array<ParsedExcelLine & { partialAmounts: number[] }>;
  errors: Array<{ line: number; error: string }>;
}

/**
 * Convertit une date Excel (nombre de jours depuis 1900) en Date JavaScript
 */
function excelDateToJSDate(excelDate: number): Date {
  // Excel compte les jours depuis le 1er janvier 1900
  // Mais Excel a un bug : il considère 1900 comme année bissextile (ce n'est pas le cas)
  // Donc on doit soustraire 1 jour pour les dates après le 28 février 1900
  const excelEpoch = new Date(1899, 11, 30); // 30 décembre 1899
  const jsDate = new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
  
  // Correction pour le bug Excel (1900 n'est pas bissextile)
  if (excelDate >= 60) {
    jsDate.setDate(jsDate.getDate() - 1);
  }
  
  return jsDate;
}

/**
 * Parse une valeur de cellule Excel
 */
function parseCellValue(cell: ExcelJS.Cell | null | undefined): string | number | null {
  if (!cell || cell.value === null || cell.value === undefined) {
    return "";
  }

  // Si c'est une formule calculée
  if (typeof cell.value === "object" && "result" in cell.value) {
    return cell.value.result as string | number;
  }

  // Si c'est une cellule avec formatage
  if (typeof cell.value === "object" && "text" in cell.value) {
    return cell.value.text as string;
  }

  // Valeur simple
  return cell.value as string | number;
}

/**
 * Convertit un montant Excel en nombre
 * Gère les formats français (virgule décimale, espaces milliers)
 */
function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  // Si c'est déjà un nombre
  if (typeof value === "number") {
    return isNaN(value) ? 0 : value;
  }

  // Si c'est une string, nettoyer et parser
  let cleaned = String(value).trim();
  
  if (!cleaned || cleaned === "") {
    return 0;
  }

  // Retirer les espaces (séparateurs de milliers)
  cleaned = cleaned.replace(/\s/g, "");
  
  // Remplacer la virgule par un point (format français)
  cleaned = cleaned.replace(",", ".");

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse une date depuis Excel
 * Peut être un nombre (date Excel) ou une string (format DD/MM/YYYY)
 */
function parseDate(value: string | number | null | undefined): Date {
  if (value === null || value === undefined) {
    return new Date();
  }

  // Si c'est un nombre, c'est une date Excel
  if (typeof value === "number") {
    return excelDateToJSDate(value);
  }

  // Si c'est une string, essayer de parser au format DD/MM/YYYY
  const stringValue = String(value).trim();
  
  if (!stringValue) {
    return new Date();
  }

  // Essayer le format DD/MM/YYYY
  const parts = stringValue.split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Mois 0-indexed
    const year = parseInt(parts[2], 10);
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Essayer de parser comme date JavaScript standard
  const date = new Date(stringValue);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Par défaut, retourner la date actuelle
  return new Date();
}

/**
 * Convertit un booléen ou texte en booléen pour le champ recours
 */
function parseRecourse(value: string | number | boolean | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value > 0;
  }

  const lower = String(value).toLowerCase().trim();
  return (
    lower === "true" ||
    lower === "1" ||
    lower === "oui" ||
    lower === "yes" ||
    parseAmount(value) > 0
  );
}

/**
 * Détecte si une ligne est partielle (seule la colonne 8 remplie)
 */
function isPartialLine(row: ExcelJS.Row, rowNumber: number): boolean {
  // Ignorer la première ligne (en-têtes)
  if (rowNumber === 1) {
    return false;
  }

  // Vérifier que les colonnes 0-7 sont vides et que la colonne 8 est remplie
  const col0 = parseCellValue(row.getCell(1)); // Colonne A (index 1 dans ExcelJS)
  const col1 = parseCellValue(row.getCell(2)); // Colonne B
  const col2 = parseCellValue(row.getCell(3)); // Colonne C
  const col3 = parseCellValue(row.getCell(4)); // Colonne D
  const col4 = parseCellValue(row.getCell(5)); // Colonne E
  const col5 = parseCellValue(row.getCell(6)); // Colonne F
  const col6 = parseCellValue(row.getCell(7)); // Colonne G
  const col7 = parseCellValue(row.getCell(8)); // Colonne H (montant payé)

  const isEmpty = (val: string | number | null): boolean => {
    if (val === null || val === undefined) return true;
    if (typeof val === "string") return val.trim() === "";
    if (typeof val === "number") return isNaN(val) || val === 0;
    return false;
  };

  return (
    isEmpty(col0) &&
    isEmpty(col1) &&
    isEmpty(col2) &&
    isEmpty(col3) &&
    isEmpty(col4) &&
    isEmpty(col5) &&
    isEmpty(col6) &&
    !isEmpty(col7)
  );
}

/**
 * Parse une ligne Excel en objet ParsedExcelLine
 */
function parseExcelRow(row: ExcelJS.Row, rowNumber: number): ParsedExcelLine | null {
  // Ignorer la première ligne (en-têtes)
  if (rowNumber === 1) {
    return null;
  }

  try {
    // ExcelJS utilise des index 1-based pour les colonnes
    // Colonnes : A=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8, I=9, J=10, K=11
    const clientName = String(parseCellValue(row.getCell(1)) || "").trim();
    const clientLagonNumber = String(parseCellValue(row.getCell(2)) || "").trim();
    const policyNumber = String(parseCellValue(row.getCell(3)) || "").trim();
    const policyCategory = String(parseCellValue(row.getCell(4)) || "").trim();
    const productType = String(parseCellValue(row.getCell(5)) || "").trim();
    const claimNumber = String(parseCellValue(row.getCell(6)) || "").trim();
    const incidentDate = parseCellValue(row.getCell(7));
    const amountPaid = parseCellValue(row.getCell(8));
    const remainingAmount = parseCellValue(row.getCell(9));
    const recourse = parseCellValue(row.getCell(10));
    const damagedCoverage = String(parseCellValue(row.getCell(11)) || "").trim();

    // Vérifier si c'est une ligne partielle
    const isPartial = isPartialLine(row, rowNumber);

    // Si c'est une ligne partielle et qu'on n'a pas de données principales, ignorer
    if (isPartial && !clientName && !policyNumber) {
      return null;
    }

    return {
      clientName,
      clientLagonNumber,
      policyNumber,
      policyCategory,
      productType,
      claimNumber,
      incidentDate: incidentDate || "",
      amountPaid: amountPaid || "",
      remainingAmount: remainingAmount || "",
      recourse: recourse || "",
      damagedCoverage,
      isPartialLine: isPartial,
      lineIndex: rowNumber,
      partialAmounts: [],
    };
  } catch (error) {
    throw new Error(`Erreur lors du parsing de la ligne ${rowNumber}: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
  }
}

/**
 * Groupe les lignes partielles avec les lignes principales précédentes
 */
function groupPartialLines(
  lines: ParsedExcelLine[]
): Array<ParsedExcelLine & { partialAmounts: number[] }> {
  const grouped: Array<ParsedExcelLine & { partialAmounts: number[] }> = [];
  let currentMainLine: (ParsedExcelLine & { partialAmounts: number[] }) | null = null;

  for (const line of lines) {
    if (line.isPartialLine) {
      // Ligne partielle : rattacher au montant payé de la ligne principale précédente
      if (currentMainLine) {
        const partialAmount = parseAmount(line.amountPaid);
        if (partialAmount > 0) {
          currentMainLine.partialAmounts.push(partialAmount);
        }
      }
    } else {
      // Ligne principale : sauvegarder et commencer un nouveau groupe
      if (currentMainLine) {
        grouped.push(currentMainLine);
      }
      currentMainLine = {
        ...line,
        partialAmounts: [],
      };
    }
  }

  // Ajouter la dernière ligne principale
  if (currentMainLine) {
    grouped.push(currentMainLine);
  }

  return grouped;
}

/**
 * Parse un fichier Excel de sinistres
 * 
 * @param buffer Buffer du fichier Excel
 * @returns Résultat du parsing avec lignes et erreurs
 */
export async function parseSinistresExcel(
  buffer: Buffer
): Promise<ParsedExcelResult> {
  const workbook = new ExcelJS.Workbook();
  const errors: Array<{ line: number; error: string }> = [];
  const parsedLines: ParsedExcelLine[] = [];

  try {
    // Charger le workbook depuis le buffer
    await workbook.xlsx.load(buffer);

    // Utiliser la première feuille uniquement
    const worksheet = workbook.worksheets[0];
    
    if (!worksheet) {
      throw new Error("Aucune feuille trouvée dans le fichier Excel");
    }

    // Parcourir toutes les lignes (la première ligne est ignorée car ce sont les en-têtes)
    worksheet.eachRow((row, rowNumber) => {
      try {
        const parsed = parseExcelRow(row, rowNumber);
        if (parsed) {
          parsedLines.push(parsed);
        }
      } catch (error) {
        errors.push({
          line: rowNumber,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    });

    // Grouper les lignes partielles
    const groupedLines = groupPartialLines(parsedLines);

    return {
      lines: groupedLines,
      errors,
    };
  } catch (error) {
    throw new Error(
      `Erreur lors du parsing du fichier Excel: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Convertit une ligne parsée en objet Sinistre prêt pour Firestore
 */
export function convertParsedLineToSinistre(
  line: ParsedExcelLine & { partialAmounts: number[] },
  excelVersion: string,
  userId?: string
): Omit<import("../../types/sinistre").Sinistre, "id"> {
  const amountPaid = parseAmount(line.amountPaid);
  const remainingAmount = parseAmount(line.remainingAmount);
  const totalAmountPaid = amountPaid + line.partialAmounts.reduce((sum, amt) => sum + amt, 0);
  const totalAmount = totalAmountPaid + remainingAmount;
  const incidentDate = parseDate(line.incidentDate);
  const recourse = parseRecourse(line.recourse);
  const now = new Date();

  return {
    clientName: line.clientName,
    clientLagonNumber: line.clientLagonNumber,
    policyNumber: line.policyNumber,
    policyCategory: line.policyCategory,
    productType: line.productType,
    claimNumber: line.claimNumber,
    incidentDate,
    amountPaid,
    remainingAmount,
    recourse,
    damagedCoverage: line.damagedCoverage,
    totalAmountPaid,
    totalAmount,
    importDate: now,
    excelVersion,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    lastUpdatedBy: userId,
    source: "excel",
  };
}

