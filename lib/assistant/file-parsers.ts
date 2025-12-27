/**
 * Fonctions de parsing pour les fichiers uploadés
 * Supporte Excel, PDF, CSV
 * 
 * NOTE: Ce fichier est uniquement utilisé côté serveur (API routes)
 * Les imports sont dynamiques pour éviter le bundling côté client
 * 
 * @server-only
 */

/**
 * Convertit un File ou Buffer en ArrayBuffer
 * ExcelJS accepte directement ArrayBuffer, ce qui évite les problèmes de type Buffer
 */
async function toArrayBuffer(file: File | Buffer): Promise<ArrayBuffer> {
  if (file instanceof File) {
    return await file.arrayBuffer();
  }
  // Si c'est un Buffer, le convertir en ArrayBuffer
  // file.buffer peut être SharedArrayBuffer, on doit créer un nouvel ArrayBuffer pur
  const uint8Array = new Uint8Array(file);
  // Créer un nouvel ArrayBuffer en copiant les données
  const newArrayBuffer = new ArrayBuffer(uint8Array.length);
  new Uint8Array(newArrayBuffer).set(uint8Array);
  return newArrayBuffer;
}

/**
 * Convertit un File ou Buffer en Buffer Node.js standard
 * Pour pdf-parse qui nécessite un Buffer
 */
async function toNodeBuffer(file: File | Buffer): Promise<Buffer> {
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    // Créer un Buffer en copiant les données pour garantir le type correct
    return Buffer.from(new Uint8Array(arrayBuffer));
  }
  // Si c'est déjà un Buffer, le retourner tel quel
  return file;
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
    
    // ExcelJS accepte directement ArrayBuffer (évite les problèmes de type Buffer)
    const arrayBuffer = await toArrayBuffer(file);
    await workbook.xlsx.load(arrayBuffer);
    
    let result = "";
    
    workbook.eachSheet((worksheet, sheetId) => {
      result += `\n=== Feuille: ${worksheet.name} ===\n`;
      
      // Parcourir les lignes
      worksheet.eachRow((row, rowNumber) => {
        const values: (string | number | boolean | null | undefined)[] = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          // cell.value peut être undefined, null, ou un objet complexe
          const cellValue = cell.value;
          
          // Formater les valeurs
          if (cellValue === null || cellValue === undefined) {
            values.push("");
          } else if (typeof cellValue === 'object' && 'text' in cellValue) {
            // Cellule avec formatage
            values.push(String(cellValue.text));
          } else if (typeof cellValue === 'object' && 'result' in cellValue) {
            // Formule calculée
            values.push(String(cellValue.result));
          } else {
            // Valeur simple (string, number, boolean)
            values.push(String(cellValue));
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
    // pdf-parse est un module CommonJS, donc pas de .default
    const pdfParseModule = await import('pdf-parse');
    // Gérer les deux cas : ES module (avec default) ou CommonJS (sans default)
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    
    // Convertir File en Buffer Node.js standard
    const buffer = await toNodeBuffer(file);
    
    // pdf-parse attend un Buffer Node.js standard
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

