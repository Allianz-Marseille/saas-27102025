/**
 * Parser pour les fichiers Excel de sinistres exportés depuis le CRM Lagon
 * 
 * IMPORTANT : On extrait UNIQUEMENT les colonnes A, B, D-M
 * Les autres colonnes (C, N-U) sont ignorées
 * 
 * Colonnes extraites :
 * A: string - numéro lagon
 * B: string - nom client
 * D: string - société (AAA = Allianz)
 * E: string - numéro de contrat
 * F: string - situation (O = Ouvert)
 * G: string - Responsabilité (0 = pas responsable, 4 = responsable)
 * H: float - Provision
 * I: float - Recours encaissé
 * J: float - Règlement
 * K: string - Nom du tiers
 * L: string - garantie sinistrée 1
 * M: string - garantie sinistrée 2
 * 
 * Les champs de gestion (route, status, assignedTo) sont ajoutés dans le front
 * et ne proviennent PAS du fichier Excel
 * 
 * Première ligne = en-têtes (à ignorer)
 * Lignes partielles : seule la colonne I (Recours encaissé) ou J (Règlement) remplie
 */

import ExcelJS from "exceljs";
import { SinistreStatus, SinistreRoute } from "../../types/sinistre";

export interface ParsedExcelLine {
  // Champs de base (pour compatibilité avec le type Sinistre)
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
  // Champs supplémentaires du fichier Excel réel (colonnes A, B, D-M)
  societe?: string; // D: société (AAA = Allianz)
  situation?: string; // F: situation (O = Ouvert)
  responsabilite?: string; // G: Responsabilité (0 ou 4)
  provision?: string | number; // H: float - Provision
  recoursEncaisse?: string | number; // I: float - Recours encaissé
  reglement?: string | number; // J: float - Règlement
  nomTiers?: string; // K: Nom du tiers
  garantie1?: string; // L: garantie sinistrée 1
  garantie2?: string; // M: garantie sinistrée 2
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

  // Vérifier que les colonnes A, B, D-G sont vides et que la colonne I (Recours encaissé) ou J (Règlement) est remplie
  const colA = parseCellValue(row.getCell(1)); // Colonne A: numéro lagon
  const colB = parseCellValue(row.getCell(2)); // Colonne B: nom client
  // Colonne C: ignorée
  const colD = parseCellValue(row.getCell(4)); // Colonne D: société
  const colE = parseCellValue(row.getCell(5)); // Colonne E: numéro de contrat
  const colF = parseCellValue(row.getCell(6)); // Colonne F: situation
  const colG = parseCellValue(row.getCell(7)); // Colonne G: Responsabilité
  const colH = parseCellValue(row.getCell(8)); // Colonne H: Provision
  const colI = parseCellValue(row.getCell(9)); // Colonne I: Recours encaissé
  const colJ = parseCellValue(row.getCell(10)); // Colonne J: Règlement

  const isEmpty = (val: string | number | null): boolean => {
    if (val === null || val === undefined) return true;
    if (typeof val === "string") return val.trim() === "";
    if (typeof val === "number") return isNaN(val) || val === 0;
    return false;
  };

  return (
    isEmpty(colA) &&
    isEmpty(colB) &&
    isEmpty(colD) &&
    isEmpty(colE) &&
    isEmpty(colF) &&
    isEmpty(colG) &&
    isEmpty(colH) &&
    (!isEmpty(colI) || !isEmpty(colJ))
  );
}

/**
 * Parse une ligne Excel en objet ParsedExcelLine
 * Structure réelle du fichier Excel (colonnes A à U, on utilise seulement A, B, D-M) :
 * A: string - numéro lagon
 * B: string - nom client
 * C: ignorée
 * D: string - société (AAA = Allianz)
 * E: string - numéro de contrat
 * F: string - situation (O = Ouvert)
 * G: string - Responsabilité (0 = pas responsable, 4 = responsable)
 * H: float - Provision
 * I: float - Recours encaissé
 * J: float - Règlement
 * K: string - Nom du tiers
 * L: string - garantie sinistrée 1
 * M: string - garantie sinistrée 2
 * N-U: ignorées (seront utilisées pour la gestion en agence plus tard)
 */
function parseExcelRow(row: ExcelJS.Row, rowNumber: number): ParsedExcelLine | null {
  // Ignorer la première ligne (en-têtes)
  if (rowNumber === 1) {
    return null;
  }

  try {
    // ExcelJS utilise des index 1-based pour les colonnes
    // A=1, B=2, C=3 (ignorée), D=4, E=5, F=6, G=7, H=8, I=9, J=10, K=11, L=12, M=13
    const clientLagonNumber = String(parseCellValue(row.getCell(1)) || "").trim(); // A: numéro lagon
    const clientName = String(parseCellValue(row.getCell(2)) || "").trim(); // B: nom client
    // C: ignorée
    const societe = String(parseCellValue(row.getCell(4)) || "").trim(); // D: société (AAA = Allianz)
    const policyNumber = String(parseCellValue(row.getCell(5)) || "").trim(); // E: numéro de contrat
    const situation = String(parseCellValue(row.getCell(6)) || "").trim(); // F: situation (O = Ouvert)
    const responsabilite = String(parseCellValue(row.getCell(7)) || "").trim(); // G: Responsabilité (0 ou 4)
    const provision = parseCellValue(row.getCell(8)); // H: float - Provision
    const recoursEncaisse = parseCellValue(row.getCell(9)); // I: float - Recours encaissé
    const reglement = parseCellValue(row.getCell(10)); // J: float - Règlement
    const nomTiers = String(parseCellValue(row.getCell(11)) || "").trim(); // K: Nom du tiers
    const garantie1 = String(parseCellValue(row.getCell(12)) || "").trim(); // L: garantie sinistrée 1
    const garantie2 = String(parseCellValue(row.getCell(13)) || "").trim(); // M: garantie sinistrée 2

    // Vérifier si c'est une ligne partielle (seule la colonne I (Recours encaissé) ou J (Règlement) est remplie)
    const isPartial = isPartialLine(row, rowNumber);

    // Si c'est une ligne partielle et qu'on n'a pas de données principales, ignorer
    if (isPartial && !clientLagonNumber && !policyNumber) {
      return null;
    }

    // Combiner les garanties sinistrées
    const garantiesSinistrees = [garantie1, garantie2].filter(g => g).join(", ");

    return {
      clientName,
      clientLagonNumber,
      policyNumber,
      policyCategory: societe, // Société stockée dans policyCategory
      productType: "", // Non disponible dans le fichier Excel
      claimNumber: "", // Non disponible dans le fichier Excel (peut-être généré)
      incidentDate: "", // Non disponible dans le fichier Excel
      amountPaid: reglement || "", // J: Règlement
      remainingAmount: provision || "", // H: Provision (reste à payer)
      recourse: responsabilite === "4", // G: Responsabilité (4 = responsable = recours)
      damagedCoverage: garantiesSinistrees, // L et M: garanties sinistrées
      isPartialLine: isPartial,
      lineIndex: rowNumber,
      partialAmounts: [],
      // Champs supplémentaires du fichier Excel réel
      societe: societe,
      situation: situation,
      responsabilite: responsabilite,
      provision: provision || "",
      recoursEncaisse: recoursEncaisse || "",
      reglement: reglement || "",
      nomTiers: nomTiers,
      garantie1: garantie1,
      garantie2: garantie2,
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
    // ExcelJS accepte Buffer ou ArrayBuffer
    await workbook.xlsx.load(buffer as any);

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
  // Calculer les montants depuis les colonnes Excel
  // H: Provision (reste à payer)
  // I: Recours encaissé
  // J: Règlement (montant payé)
  const provision = parseAmount(line.provision || 0);
  const recoursEncaisse = parseAmount(line.recoursEncaisse || 0);
  const reglement = parseAmount(line.reglement || 0);
  
  // Montants partiels additionnels (lignes partielles)
  const partialAmounts = line.partialAmounts.reduce((sum, amt) => sum + amt, 0);
  
  // amountPaid = Règlement (J) + montants partiels
  const amountPaid = reglement + partialAmounts;
  
  // remainingAmount = Provision (H)
  const remainingAmount = provision;
  
  // totalAmountPaid = Règlement + Recours encaissé + montants partiels
  const totalAmountPaid = reglement + recoursEncaisse + partialAmounts;
  
  // totalAmount = Provision + Recours encaissé + Règlement
  const totalAmount = provision + recoursEncaisse + reglement;
  
  // recourse = true si Responsabilité (G) = "4"
  const recourse = line.responsabilite === "4";
  
  // Générer un claimNumber si non disponible (basé sur numéro lagon + numéro contrat)
  const claimNumber = line.claimNumber || `${line.clientLagonNumber}-${line.policyNumber}`;
  
  // incidentDate non disponible dans le fichier Excel, utiliser la date d'import
  const incidentDate = parseDate(line.incidentDate) || new Date();
  
  const now = new Date();

  // Retourner l'objet Sinistre avec uniquement les données extraites de l'Excel
  // Les champs de gestion (route, status, assignedTo) seront ajoutés dans le front
  return {
    // Données extraites de l'Excel (colonnes A, B, D-M uniquement)
    clientName: line.clientName,
    clientLagonNumber: line.clientLagonNumber,
    policyNumber: line.policyNumber,
    policyCategory: line.policyCategory, // Société (AAA = Allianz)
    productType: line.productType || "",
    claimNumber,
    incidentDate,
    amountPaid,
    remainingAmount,
    recourse,
    damagedCoverage: line.damagedCoverage, // Garanties sinistrées (L et M)
    totalAmountPaid,
    totalAmount,
    // Métadonnées d'import
    importDate: now,
    excelVersion,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    lastUpdatedBy: userId,
    source: "excel",
    // Note: route, status, assignedTo ne sont PAS définis ici
    // Ils seront ajoutés manuellement dans le front via l'interface de gestion
  };
}

