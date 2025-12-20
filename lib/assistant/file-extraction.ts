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
    const Buffer = (await import("buffer")).Buffer;
    const pdfBuffer = Buffer.from(arrayBuffer);
    
    // Vérifier que le buffer n'est pas vide
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("Le buffer PDF est vide");
    }
    
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
    
    console.log(`Extraction PDF: buffer size = ${pdfBuffer.length} bytes`);
    
    // Parser le PDF
    let pdfData: any;
    try {
      pdfData = await pdfParse(pdfBuffer);
    } catch (parseError) {
      console.error("Erreur lors du parsing PDF:", parseError);
      throw new Error(
        `Erreur lors du parsing du PDF: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    }
    
    if (!pdfData) {
      throw new Error("pdf-parse n'a retourné aucune donnée");
    }
    
    const text = pdfData.text || "";
    
    if (!text || text.trim().length === 0) {
      console.warn("PDF parsé mais aucun texte extrait. Info:", {
        numPages: pdfData.numpages,
        info: pdfData.info,
        metadata: pdfData.metadata,
        hasText: !!pdfData.text,
        textLength: pdfData.text ? pdfData.text.length : 0,
      });
      throw new Error(
        "Aucun texte extrait du PDF. Le PDF pourrait être une image scannée, protégé, ou corrompu. " +
        `Nombre de pages: ${pdfData.numpages || "inconnu"}. ` +
        `Si le PDF contient du texte mais est une image scannée, utilisez un outil OCR.`
      );
    }
    
    console.log(`Extraction PDF réussie: ${text.length} caractères extraits sur ${pdfData.numpages || "?"} page(s)`);
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

