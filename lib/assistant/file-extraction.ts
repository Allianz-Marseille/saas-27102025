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
    
    // Importer pdf-parse
    let pdfParse: any;
    try {
      // Utiliser require pour pdf-parse (meilleure compatibilité avec les dépendances natives)
      const { createRequire } = await import("module");
      const require = createRequire(import.meta.url);
      pdfParse = require("pdf-parse");
      
      // Vérifier que c'est bien une fonction
      if (typeof pdfParse !== "function") {
        // Parfois pdf-parse exporte une fonction par défaut
        pdfParse = pdfParse.default || pdfParse;
      }
    } catch (requireError) {
      // Si require échoue, essayer avec import ES6
      try {
        const pdfParseModule = await import("pdf-parse");
        pdfParse = pdfParseModule.default || pdfParseModule;
      } catch (importError) {
        throw new Error(
          `Impossible de charger pdf-parse. Vérifiez que la dépendance est installée: npm install pdf-parse. ` +
          `Erreur require: ${requireError instanceof Error ? requireError.message : String(requireError)}, ` +
          `Erreur import: ${importError instanceof Error ? importError.message : String(importError)}`
        );
      }
    }
    
    if (typeof pdfParse !== "function") {
      throw new Error(
        `pdf-parse n'est pas une fonction. Type: ${typeof pdfParse}. ` +
        `Vérifiez que la dépendance est correctement installée: npm install pdf-parse`
      );
    }
    
    console.log(`Extraction PDF: buffer size = ${pdfBuffer.length} bytes`);
    const pdfData = await pdfParse(pdfBuffer);
    
    if (!pdfData) {
      throw new Error("pdf-parse n'a retourné aucune donnée");
    }
    
    const text = pdfData.text || "";
    
    if (!text || text.trim().length === 0) {
      console.warn("PDF parsé mais aucun texte extrait. Info:", {
        numPages: pdfData.numpages,
        info: pdfData.info,
        metadata: pdfData.metadata,
      });
      throw new Error(
        "Aucun texte extrait du PDF. Le PDF pourrait être une image scannée ou protégé. " +
        `Nombre de pages: ${pdfData.numpages || "inconnu"}`
      );
    }
    
    console.log(`Extraction PDF réussie: ${text.length} caractères extraits`);
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
    const OpenAI = (await import("openai")).default;
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

