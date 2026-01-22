/**
 * Utilitaires pour le traitement des fichiers dans l'assistant IA
 */

export interface ProcessedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string; // Texte extrait
  data?: string; // Données brutes en base64 (pour parsing côté serveur si parsing client échoue)
  error?: string;
}

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
export const MAX_FILES_PER_MESSAGE = 10;

// Types de fichiers acceptés
export const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
};

/**
 * Vérifie le type MIME réel d'un fichier (pas seulement l'extension)
 * @param file Fichier à vérifier
 * @returns Type MIME réel ou null si non détecté
 */
export async function getRealMimeType(file: File): Promise<string | null> {
  // Le type MIME du File object est généralement fiable pour les fichiers uploadés
  // mais on peut ajouter une vérification supplémentaire si nécessaire
  
  // Vérifier les magic bytes (signature de fichier) pour une validation plus robuste
  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // PDF: %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }
  
  // ZIP-based formats (DOCX, XLSX sont des ZIP)
  if (bytes[0] === 0x50 && bytes[1] === 0x4B && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)) {
    // Vérifier l'extension pour distinguer DOCX et XLSX
    if (file.name.toLowerCase().endsWith(".docx")) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    if (file.name.toLowerCase().endsWith(".xlsx")) {
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }
  }
  
  // Fallback sur le type MIME du File object
  return file.type || null;
}

/**
 * Valide un fichier (type, taille, signature MIME)
 * @param file Fichier à valider
 * @returns Erreur si invalide, null si valide
 */
export async function validateFile(file: File): Promise<{ valid: boolean; error?: string; quarantined?: boolean }> {
  // Vérifier la taille
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Le fichier "${file.name}" est trop volumineux (maximum ${MAX_FILE_SIZE / 1024 / 1024} MB)`,
    };
  }

  // Vérifier que le fichier n'est pas vide
  if (file.size === 0) {
    return {
      valid: false,
      error: `Le fichier "${file.name}" est vide`,
    };
  }

  // Vérifier le type MIME réel (signature de fichier)
  const mimeType = await getRealMimeType(file);
  
  // Vérifier que le type MIME correspond à l'extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
  const acceptedExtensions = Object.values(ACCEPTED_FILE_TYPES).flat();
  const hasValidExtension = acceptedExtensions.includes(extension);
  
  if (!mimeType || !Object.keys(ACCEPTED_FILE_TYPES).includes(mimeType)) {
    if (!hasValidExtension) {
      return {
        valid: false,
        error: `Le type de fichier "${file.name}" n'est pas accepté. Types acceptés : PDF, Word, Excel, TXT, CSV`,
      };
    }
    
    // Extension valide mais type MIME non détecté - mettre en quarantaine
    return {
      valid: false,
      error: `Le type MIME du fichier "${file.name}" ne correspond pas à son extension. Fichier mis en quarantaine.`,
      quarantined: true,
    };
  }

  // Vérifier la cohérence entre extension et type MIME
  const expectedMimeTypes = Object.keys(ACCEPTED_FILE_TYPES).filter((mime) =>
    ACCEPTED_FILE_TYPES[mime as keyof typeof ACCEPTED_FILE_TYPES].includes(extension)
  );
  
  if (expectedMimeTypes.length > 0 && !expectedMimeTypes.includes(mimeType)) {
    // Extension et type MIME ne correspondent pas - suspect
    return {
      valid: false,
      error: `Le type MIME du fichier "${file.name}" ne correspond pas à son extension. Fichier suspect mis en quarantaine.`,
      quarantined: true,
    };
  }

  // Vérifications de sécurité supplémentaires
  // Détecter les fichiers potentiellement dangereux
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i,
  ];
  
  if (suspiciousPatterns.some((pattern) => pattern.test(file.name))) {
    return {
      valid: false,
      error: `Le fichier "${file.name}" est de type exécutable et n'est pas autorisé pour des raisons de sécurité.`,
      quarantined: true,
    };
  }

  return { valid: true };
}

/**
 * Extrait le texte d'un fichier selon son type
 * @param file Fichier à traiter
 * @returns Texte extrait
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const mimeType = (await getRealMimeType(file)) || "";

  // PDF
  if (mimeType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return extractTextFromPDF(file);
  }

  // Word (DOCX)
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  ) {
    return extractTextFromDOCX(file);
  }

  // Word (DOC) - nécessite une bibliothèque externe
  if (mimeType === "application/msword" || file.name.toLowerCase().endsWith(".doc")) {
    throw new Error("Les fichiers .doc (ancien format Word) ne sont pas encore supportés. Veuillez convertir en .docx");
  }

  // Excel (XLSX)
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.name.toLowerCase().endsWith(".xlsx")
  ) {
    return extractTextFromXLSX(file);
  }

  // Excel (XLS) - nécessite une bibliothèque externe
  if (mimeType === "application/vnd.ms-excel" || file.name.toLowerCase().endsWith(".xls")) {
    throw new Error("Les fichiers .xls (ancien format Excel) ne sont pas encore supportés. Veuillez convertir en .xlsx");
  }

  // TXT et CSV
  if (mimeType === "text/plain" || mimeType === "text/csv" || 
      file.name.toLowerCase().endsWith(".txt") || file.name.toLowerCase().endsWith(".csv")) {
    return extractTextFromText(file);
  }

  throw new Error(`Type de fichier non supporté : ${mimeType || file.name}`);
}

/**
 * Extrait le texte d'un fichier PDF
 * Note: Le traitement PDF nécessite des modules Node.js et ne peut être fait que côté serveur
 * Cette fonction retourne une erreur côté client - le PDF sera traité côté serveur lors de l'envoi
 */
async function extractTextFromPDF(file: File): Promise<string> {
  // Côté client : retourner une erreur - le PDF sera traité côté serveur
  if (typeof window !== 'undefined') {
    throw new Error("Le traitement PDF se fait côté serveur. Le fichier sera traité lors de l'envoi du message.");
  }

  // Côté serveur uniquement : utiliser pdf-parse
  // Cette partie ne sera jamais exécutée côté client grâce à la vérification ci-dessus
  // Mais Next.js essaie quand même de bundler le code, donc on utilise une approche dynamique
  try {
    // Utiliser Function constructor pour éviter que Next.js ne résolve l'import statiquement
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    const moduleImport = await dynamicImport("module");
    const { createRequire } = moduleImport;
    const require = createRequire(import.meta.url);
    const pdfParseModule = require("pdf-parse");
    const PDFParseClass = (pdfParseModule as any).PDFParse;

    if (!PDFParseClass) {
      throw new Error("PDFParse class not found in pdf-parse module");
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const parser = new PDFParseClass({ data: uint8Array });
    const textResult = await parser.getText();

    let text: string;
    if (textResult && typeof textResult === "object") {
      text = (textResult as any).text;
      if (typeof text !== "string") {
        text = String(text || "");
      }
    } else if (typeof textResult === "string") {
      text = textResult;
    } else {
      text = String(textResult || "");
    }

    await parser.destroy();

    if (!text || text.trim().length === 0) {
      throw new Error("Aucun texte extrait du PDF");
    }

    return text;
  } catch (error) {
    console.error("Erreur extraction PDF:", error);
    throw new Error(`Impossible d'extraire le texte du PDF : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
  }
}

/**
 * Extrait le texte d'un fichier DOCX
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  // Côté client : retourner une erreur - le DOCX sera traité côté serveur
  if (typeof window !== 'undefined') {
    throw new Error("Le traitement Word se fait côté serveur. Le fichier sera traité lors de l'envoi du message.");
  }

  // Côté serveur uniquement
  try {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    if (!text || text.trim().length === 0) {
      throw new Error("Aucun texte extrait du fichier Word");
    }
    
    return text;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cannot find module")) {
      throw new Error("La bibliothèque 'mammoth' n'est pas installée");
    }
    throw error;
  }
}

/**
 * Extrait le texte d'un fichier XLSX
 */
async function extractTextFromXLSX(file: File): Promise<string> {
  // Côté client : retourner une erreur - le XLSX sera traité côté serveur
  if (typeof window !== 'undefined') {
    throw new Error("Le traitement Excel se fait côté serveur. Le fichier sera traité lors de l'envoi du message.");
  }

  // Côté serveur uniquement
  try {
    // Utiliser exceljs (alternative sécurisée à xlsx)
    const ExcelJS = await import("exceljs");
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    
    // Charger le workbook depuis le buffer
    await workbook.xlsx.load(arrayBuffer);
    
    const textParts: string[] = [];
    
    // Parcourir toutes les feuilles
    workbook.eachSheet((worksheet, sheetId) => {
      const sheetName = worksheet.name;
      const rows: string[] = [];
      
      // Parcourir toutes les lignes
      worksheet.eachRow((row, rowNumber) => {
        const cells: string[] = [];
        
        // Parcourir toutes les cellules de la ligne
        row.eachCell((cell, colNumber) => {
          // Extraire la valeur de la cellule (texte brut)
          let cellValue = "";
          if (cell.value !== null && cell.value !== undefined) {
            if (typeof cell.value === "object" && "text" in cell.value) {
              cellValue = cell.value.text || "";
            } else if (typeof cell.value === "object" && "result" in cell.value) {
              cellValue = String(cell.value.result || "");
            } else {
              cellValue = String(cell.value);
            }
          }
          cells.push(cellValue.trim());
        });
        
        if (cells.length > 0) {
          rows.push(cells.join("\t"));
        }
      });
      
      if (rows.length > 0) {
        textParts.push(`=== ${sheetName} ===\n${rows.join("\n")}`);
      }
    });
    
    const text = textParts.join("\n\n");
    
    if (!text || text.trim().length === 0) {
      throw new Error("Aucun texte extrait du fichier Excel");
    }
    
    return text;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cannot find module")) {
      throw new Error("La bibliothèque 'exceljs' n'est pas installée");
    }
    throw error;
  }
}

/**
 * Extrait le texte d'un fichier texte (TXT, CSV)
 */
async function extractTextFromText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      resolve(text);
    };
    reader.onerror = () => {
      reject(new Error("Erreur lors de la lecture du fichier texte"));
    };
    reader.readAsText(file);
  });
}

/**
 * Traite une liste de fichiers et extrait le texte
 * @param files Fichiers à traiter
 * @returns Liste de fichiers traités avec texte extrait
 */
export async function processFiles(files: File[]): Promise<ProcessedFile[]> {
  // Limiter le nombre de fichiers
  if (files.length > MAX_FILES_PER_MESSAGE) {
    throw new Error(`Trop de fichiers (maximum ${MAX_FILES_PER_MESSAGE} fichiers par message)`);
  }

  const processedFiles: ProcessedFile[] = [];

  for (const file of files) {
    // Valider le fichier
    const validationResult = await validateFile(file);
    if (!validationResult.valid && validationResult.error) {
      processedFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        error: validationResult.error,
      });
      continue;
    }

    // Extraire le texte
    try {
      const content = await extractTextFromFile(file);
      processedFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        content,
      });
    } catch (error) {
      // Si le parsing échoue côté client (Excel/PDF nécessitent Node.js),
      // convertir le fichier en base64 pour que le backend puisse le parser
      let base64Data: string | undefined;
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'extraction du texte";
      
      // Pour Excel et PDF, on envoie les données brutes pour parsing côté serveur
      const isExcelOrPDF = 
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.xls') ||
        file.name.toLowerCase().endsWith('.xlsx') ||
        file.name.toLowerCase().endsWith('.pdf');
      
      if (isExcelOrPDF) {
        try {
          // Convertir le fichier en base64
          const arrayBuffer = await file.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
          base64Data = btoa(binaryString);
          // Ajouter le préfixe MIME type pour faciliter le parsing côté serveur
          base64Data = `data:${file.type || 'application/octet-stream'};base64,${base64Data}`;
        } catch (base64Error) {
          console.error("Erreur lors de la conversion en base64:", base64Error);
        }
      }
      
      processedFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        error: errorMessage,
        data: base64Data, // Données brutes pour parsing côté serveur
      });
    }
  }

  return processedFiles;
}

