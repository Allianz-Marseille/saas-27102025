/**
 * Extraction de texte depuis différents formats de fichiers
 * Supporte PDF, Word, Excel, et images (via OCR)
 */

/**
 * Extrait le texte d'un fichier selon son type
 */
export async function extractTextFromFile(
  file: File,
  arrayBuffer: ArrayBuffer
): Promise<string> {
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
  const fileType = file.type;

  try {
    if (fileExtension === ".pdf" || fileType === "application/pdf") {
      return await extractTextFromPDF(arrayBuffer);
    } else if (fileExtension === ".docx" || fileType.includes("wordprocessingml")) {
      return await extractTextFromWord(arrayBuffer);
    } else if (fileExtension === ".xlsx" || fileType.includes("spreadsheetml")) {
      return await extractTextFromExcel(arrayBuffer);
    } else if (fileType.startsWith("image/")) {
      return await extractTextFromImage(arrayBuffer, fileType);
    } else {
      throw new Error(`Type de fichier non supporté : ${fileType}`);
    }
  } catch (error) {
    console.error(`Erreur lors de l'extraction depuis ${fileExtension}:`, error);
    throw error;
  }
}

/**
 * Extrait le texte d'un PDF
 */
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Validation du buffer avant traitement
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("Le buffer PDF est vide ou invalide");
    }
    
    const Buffer = (await import("buffer")).Buffer;
    const pdfBuffer = Buffer.from(arrayBuffer);
    
    // Vérifier que le buffer n'est pas vide après conversion
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("Le buffer PDF est vide après conversion");
    }
    
    // Vérifier la taille minimale d'un PDF valide (header PDF = %PDF)
    if (pdfBuffer.length < 4) {
      throw new Error("Le fichier est trop petit pour être un PDF valide");
    }
    
    // Vérifier que c'est bien un PDF (header commence par %PDF)
    const header = pdfBuffer.slice(0, 4).toString("ascii");
    if (!header.startsWith("%PDF")) {
      console.warn(`⚠️ Le fichier ne semble pas être un PDF valide. Header: ${header}`);
      // Continuer quand même, certains PDF peuvent avoir des headers différents
    }
    
    console.log(`Extraction PDF: buffer size = ${pdfBuffer.length} bytes, header = ${header}`);
    
    // Importer pdf-parse (même méthode que dans app/api/assistant/files/extract/route.ts)
    let pdfParse: any;
    try {
      // Utiliser createRequire pour importer pdf-parse (module CommonJS)
      // Cela garantit une compatibilité maximale avec Next.js/Turbopack
      const { createRequire } = await import("module");
      const require = createRequire(import.meta.url);
      pdfParse = require("pdf-parse");
      
      // Vérifier que pdfParse est bien une fonction
      if (typeof pdfParse !== "function") {
        console.error("pdfParse n'est pas une fonction:", typeof pdfParse, pdfParse);
        // Essayer d'accéder à default si présent
        if (pdfParse && typeof (pdfParse as any).default === "function") {
          pdfParse = (pdfParse as any).default;
        } else {
          throw new Error(`pdf-parse n'est pas une fonction. Type: ${typeof pdfParse}`);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement de pdf-parse:", error);
      throw new Error(
        `Impossible de charger pdf-parse. Vérifiez que la dépendance est installée: npm install pdf-parse. ` +
        `Erreur: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    
    // Parser le PDF
    let pdfData: any;
    try {
      pdfData = await pdfParse(pdfBuffer);
    } catch (parseError) {
      console.error("Erreur lors du parsing PDF:", parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      
      // Messages d'erreur plus spécifiques selon le type d'erreur
      if (errorMessage.includes("Invalid PDF") || errorMessage.includes("corrupt")) {
        throw new Error(
          `Le PDF est corrompu ou invalide: ${errorMessage}. ` +
          `Vérifiez que le fichier est un PDF valide et non endommagé.`
        );
      } else if (errorMessage.includes("password") || errorMessage.includes("encrypted")) {
        throw new Error(
          `Le PDF est protégé par un mot de passe ou chiffré: ${errorMessage}. ` +
          `Déverrouillez le PDF avant de l'uploader.`
        );
      } else {
        throw new Error(
          `Erreur lors du parsing du PDF: ${errorMessage}`
        );
      }
    }
    
    // Validation des données retournées par pdf-parse
    if (!pdfData || typeof pdfData !== "object") {
      throw new Error("pdf-parse n'a retourné aucune donnée valide");
    }
    
    // Vérifier que pdfData contient les propriétés attendues
    if (pdfData.numpages === undefined || pdfData.numpages === null) {
      console.warn("⚠️ pdfData.numpages est undefined/null, le PDF pourrait être corrompu");
    }
    
    const text = pdfData.text || "";
    const numPages = pdfData.numpages || 0;
    
    // Logs détaillés pour diagnostic
    console.log(`PDF parsé: ${numPages} page(s), texte: ${text.length} caractères`, {
      numPages: numPages,
      textLength: text.length,
      hasText: !!text && text.length > 0,
      hasInfo: !!pdfData.info,
      hasMetadata: !!pdfData.metadata,
    });
    
    // Vérifier que du texte a été extrait
    if (!text || text.trim().length === 0) {
      const diagnosticInfo = {
        numPages: numPages,
        info: pdfData.info || null,
        metadata: pdfData.metadata || null,
        hasText: !!pdfData.text,
        textLength: pdfData.text ? pdfData.text.length : 0,
        bufferSize: pdfBuffer.length,
      };
      
      console.warn("PDF parsé mais aucun texte extrait. Diagnostic:", diagnosticInfo);
      
      // Message d'erreur plus informatif selon le contexte
      if (numPages > 0) {
        throw new Error(
          `Aucun texte extrait du PDF (${numPages} page(s)). ` +
          `Le PDF pourrait être une image scannée, contenir uniquement des images, ou être protégé. ` +
          `Si le PDF contient du texte mais est une image scannée, utilisez un outil OCR.`
        );
      } else {
        throw new Error(
          `Aucun texte extrait du PDF. Le PDF semble vide ou corrompu. ` +
          `Vérifiez que le fichier est un PDF valide contenant du texte.`
        );
      }
    }
    
    console.log(`✅ Extraction PDF réussie: ${text.length} caractères extraits sur ${numPages} page(s)`);
    return text;
  } catch (error) {
    console.error("Erreur détaillée extraction PDF:", error);
    if (error instanceof Error) {
      // Améliorer le message d'erreur
      if (error.message.includes("Cannot find module") || error.message.includes("pdf-parse")) {
        throw new Error(
          "La bibliothèque 'pdf-parse' n'est pas installée ou n'est pas accessible. " +
          "Installez-la avec: npm install pdf-parse"
        );
      }
      // Propager l'erreur avec son message amélioré
      throw error;
    }
    throw new Error(`Erreur inconnue lors de l'extraction PDF: ${String(error)}`);
  }
}

/**
 * Extrait le texte d'un fichier Word (.docx)
 */
async function extractTextFromWord(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Vérifier si mammoth est installé
    const mammoth = await import("mammoth");
    
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    if (!text || text.trim().length === 0) {
      throw new Error("Aucun texte extrait du fichier Word");
    }
    
    return text;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cannot find module")) {
      throw new Error("La bibliothèque 'mammoth' n'est pas installée. Installez-la avec: npm install mammoth");
    }
    throw error;
  }
}

/**
 * Extrait le texte d'un fichier Excel (.xlsx)
 */
async function extractTextFromExcel(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Vérifier si xlsx est installé
    const XLSX = await import("xlsx");
    
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const textParts: string[] = [];
    
    // Parcourir toutes les feuilles
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetText = XLSX.utils.sheet_to_txt(worksheet);
      if (sheetText) {
        textParts.push(`=== ${sheetName} ===\n${sheetText}`);
      }
    });
    
    const text = textParts.join("\n\n");
    
    if (!text || text.trim().length === 0) {
      throw new Error("Aucun texte extrait du fichier Excel");
    }
    
    return text;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cannot find module")) {
      throw new Error("La bibliothèque 'xlsx' n'est pas installée. Installez-la avec: npm install xlsx");
    }
    throw error;
  }
}

/**
 * Extrait le texte d'une image via OCR (OpenAI Vision API)
 */
async function extractTextFromImage(arrayBuffer: ArrayBuffer, mimeType: string): Promise<string> {
  try {
    const openaiModule = await import("openai");
    const OpenAI = (openaiModule as any).default || openaiModule.OpenAI || openaiModule;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Convertir ArrayBuffer en base64
    const Buffer = (await import("buffer")).Buffer;
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    // Utiliser Vision API pour OCR
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extrait tout le texte visible dans cette image. Retourne uniquement le texte, sans commentaires ni explications.",
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 4000,
    });
    
    const text = response.choices[0]?.message?.content || "";
    
    if (!text || text.trim().length === 0) {
      throw new Error("Aucun texte extrait de l'image");
    }
    
    return text;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Erreur OCR: ${error.message}`);
    }
    throw error;
  }
}

