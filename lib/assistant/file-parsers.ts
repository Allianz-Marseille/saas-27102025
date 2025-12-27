/**
 * Fonctions de parsing pour les fichiers uploadés
 * Supporte Excel, PDF, CSV
 * 
 * NOTE: Ce fichier est uniquement utilisé côté serveur (API routes)
 * Les imports sont dynamiques pour éviter le bundling côté client
 * 
 * @server-only
 */

// Vérification que nous sommes bien côté serveur
if (typeof window !== 'undefined') {
  throw new Error('file-parsers.ts ne peut être utilisé que côté serveur');
}

/**
 * Parse un fichier Excel (XLS, XLSX)
 * Retourne le contenu sous forme de texte structuré
 */
export async function parseExcelFile(file: File | Buffer): Promise<string> {
  try {
    // Import dynamique pour éviter le bundling côté client
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    
    // Convertir File en Buffer si nécessaire
    let buffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }
    
    await workbook.xlsx.load(buffer);
    
    let result = "";
    
    workbook.eachSheet((worksheet, sheetId) => {
      result += `\n=== Feuille: ${worksheet.name} ===\n`;
      
      // Parcourir les lignes
      worksheet.eachRow((row, rowNumber) => {
        const values: (string | number | boolean | null)[] = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          let value: string | number | boolean | null = cell.value;
          
          // Formater les valeurs
          if (value === null || value === undefined) {
            values.push("");
          } else if (typeof value === 'object' && 'text' in value) {
            // Cellule avec formatage
            values.push(String(value.text));
          } else if (typeof value === 'object' && 'result' in value) {
            // Formule calculée
            values.push(String(value.result));
          } else {
            values.push(String(value));
          }
        });
        
        if (values.some(v => v !== "")) {
          result += values.join(" | ") + "\n";
        }
      });
      
      result += "\n";
    });
    
    return result;
  } catch (error) {
    console.error("Erreur lors du parsing Excel:", error);
    throw new Error(`Impossible de parser le fichier Excel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Parse un fichier PDF
 * Retourne le texte extrait
 */
export async function parsePDFFile(file: File | Buffer): Promise<string> {
  try {
    // Import dynamique pour éviter le bundling côté client
    const pdfParse = (await import('pdf-parse')).default;
    
    let buffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }
    
    const data = await pdfParse(buffer);
    return data.text || "Aucun texte extrait du PDF";
  } catch (error) {
    console.error("Erreur lors du parsing PDF:", error);
    throw new Error(`Impossible de parser le fichier PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Parse un fichier CSV
 * Retourne le contenu sous forme de texte structuré
 */
export async function parseCSVFile(file: File | Buffer): Promise<string> {
  try {
    let text: string;
    if (file instanceof File) {
      text = await file.text();
    } else {
      text = file.toString('utf-8');
    }
    
    // Parser le CSV ligne par ligne
    const lines = text.split('\n');
    let result = "";
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        // Séparer par virgule ou point-virgule
        const values = line.split(/[,;]/).map(v => v.trim());
        result += values.join(" | ") + "\n";
      }
    });
    
    return result;
  } catch (error) {
    console.error("Erreur lors du parsing CSV:", error);
    throw new Error(`Impossible de parser le fichier CSV: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Détermine le type de fichier et appelle le parser approprié
 */
export async function parseFile(file: File | Buffer, fileName?: string): Promise<string> {
  const fileType = file instanceof File ? file.type : (fileName ? getMimeTypeFromFileName(fileName) : '');
  
  // Excel
  if (fileType === 'application/vnd.ms-excel' || 
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileName?.endsWith('.xls') || fileName?.endsWith('.xlsx')) {
    return await parseExcelFile(file);
  }
  
  // PDF
  if (fileType === 'application/pdf' || fileName?.endsWith('.pdf')) {
    return await parsePDFFile(file);
  }
  
  // CSV
  if (fileType === 'text/csv' || fileName?.endsWith('.csv')) {
    return await parseCSVFile(file);
  }
  
  throw new Error(`Type de fichier non supporté: ${fileType || fileName}`);
}

/**
 * Détermine le MIME type à partir du nom de fichier
 */
function getMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'pdf':
      return 'application/pdf';
    case 'csv':
      return 'text/csv';
    default:
      return '';
  }
}

