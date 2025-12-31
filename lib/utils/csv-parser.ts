/**
 * Utilitaires pour parser les fichiers CSV de sinistres
 */

export interface ParsedCSVLine {
  clientName: string;
  clientLagonNumber: string;
  policyNumber: string;
  policyCategory: string;
  productType: string;
  claimNumber: string;
  incidentDate: string;
  amountPaid: string;
  remainingAmount: string;
  recourse: string;
  damagedCoverage: string;
  isPartialLine: boolean;
  lineIndex: number;
  partialAmounts?: number[];
}

/**
 * Parse une ligne CSV avec gestion des guillemets et virgules
 */
export function parseCSVLine(line: string, index: number): ParsedCSVLine | null {
  // Ignorer les lignes vides
  if (!line.trim()) {
    return null;
  }

  // Parser avec gestion des guillemets et virgules
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current.trim()); // Dernière partie

  // Vérifier si c'est une ligne partielle (seulement montant payé)
  const isPartialLine =
    !parts[0] &&
    !parts[1] &&
    !parts[2] &&
    !parts[3] &&
    !parts[4] &&
    !parts[5] &&
    !parts[6] &&
    !!parts[7]; // Seulement colonne 8 (montant payé) remplie

  return {
    clientName: parts[0] || "",
    clientLagonNumber: parts[1] || "",
    policyNumber: parts[2] || "",
    policyCategory: parts[3] || "",
    productType: parts[4] || "",
    claimNumber: parts[5] || "",
    incidentDate: parts[6] || "",
    amountPaid: parts[7] || "",
    remainingAmount: parts[8] || "",
    recourse: parts[9] || "",
    damagedCoverage: parts[10] || "",
    isPartialLine,
    lineIndex: index + 1,
    partialAmounts: [],
  };
}

/**
 * Groupe les lignes partielles avec les lignes principales précédentes
 */
export function groupPartialLines(
  lines: ParsedCSVLine[]
): Array<ParsedCSVLine & { partialAmounts: number[] }> {
  const grouped: Array<ParsedCSVLine & { partialAmounts: number[] }> = [];
  let currentMainLine: (ParsedCSVLine & { partialAmounts: number[] }) | null = null;

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
 * Convertit un montant string format français en nombre
 */
export function parseAmount(amountStr: string): number {
  if (!amountStr || amountStr.trim() === "") {
    return 0;
  }

  // Retirer les guillemets et espaces
  let cleaned = amountStr.replace(/"/g, "").replace(/\s/g, "");

  // Remplacer la virgule par un point
  cleaned = cleaned.replace(",", ".");

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse une date au format DD/MM/YYYY
 */
export function parseDate(dateStr: string): Date {
  if (!dateStr || dateStr.trim() === "") {
    return new Date();
  }

  const parts = dateStr.split("/");
  if (parts.length !== 3) {
    return new Date();
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Mois 0-indexed
  const year = parseInt(parts[2], 10);

  return new Date(year, month, day);
}

/**
 * Convertit un booléen ou texte en booléen pour le champ recours
 */
export function parseRecourse(recourse: string): boolean {
  if (!recourse || recourse.trim() === "") {
    return false;
  }

  const lower = recourse.toLowerCase().trim();
  return (
    lower === "true" ||
    lower === "1" ||
    lower === "oui" ||
    lower === "yes" ||
    parseAmount(recourse) > 0
  );
}

/**
 * Parse un fichier CSV complet de sinistres
 */
export function parseSinistresCSV(
  content: string
): {
  lines: Array<ParsedCSVLine & { partialAmounts: number[] }>;
  errors: Array<{ line: number; error: string }>;
} {
  const lines = content.split("\n").filter((line) => line.trim());
  const parsedLines: ParsedCSVLine[] = [];
  const errors: Array<{ line: number; error: string }> = [];

  // Parser toutes les lignes
  for (let i = 0; i < lines.length; i++) {
    try {
      const parsed = parseCSVLine(lines[i], i);
      if (parsed) {
        parsedLines.push(parsed);
      }
    } catch (error) {
      errors.push({
        line: i + 1,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  // Grouper les lignes partielles
  const groupedLines = groupPartialLines(parsedLines);

  return {
    lines: groupedLines,
    errors,
  };
}

/**
 * Valide le nom de fichier CSV selon la convention DDMMYYYY.csv
 */
export function validateCSVFileName(fileName: string): {
  valid: boolean;
  date?: Date;
  error?: string;
} {
  const pattern = /^(\d{2})(\d{2})(\d{4})\.csv$/i;
  const match = fileName.match(pattern);

  if (!match) {
    return {
      valid: false,
      error: "Le nom de fichier doit être au format DDMMYYYY.csv (ex: 29122025.csv)",
    };
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // Mois 0-indexed
  const year = parseInt(match[3], 10);

  const date = new Date(year, month, day);

  // Vérifier que la date est valide
  if (
    date.getDate() !== day ||
    date.getMonth() !== month ||
    date.getFullYear() !== year
  ) {
    return {
      valid: false,
      error: "La date dans le nom de fichier n'est pas valide",
    };
  }

  return {
    valid: true,
    date,
  };
}

