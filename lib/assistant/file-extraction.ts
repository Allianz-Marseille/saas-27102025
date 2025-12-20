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
  console.log("🔍 [extractTextFromPDF] Début extraction PDF");
  try {
    // Validation du buffer avant traitement
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      console.error("❌ [extractTextFromPDF] Buffer vide ou invalide");
      throw new Error("Le buffer PDF est vide ou invalide");
    }
    
    console.log(`✅ [extractTextFromPDF] Buffer valide: ${arrayBuffer.byteLength} bytes`);
    
    const Buffer = (await import("buffer")).Buffer;
    const pdfBuffer = Buffer.from(arrayBuffer);
    
    // Vérifier que le buffer n'est pas vide après conversion
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error("❌ [extractTextFromPDF] Buffer vide après conversion");
      throw new Error("Le buffer PDF est vide après conversion");
    }
    
    // Vérifier la taille minimale d'un PDF valide (header PDF = %PDF)
    if (pdfBuffer.length < 4) {
      console.error(`❌ [extractTextFromPDF] Fichier trop petit: ${pdfBuffer.length} bytes`);
      throw new Error("Le fichier est trop petit pour être un PDF valide");
    }
    
    // Vérifier que c'est bien un PDF (header commence par %PDF)
    const header = pdfBuffer.slice(0, 4).toString("ascii");
    console.log(`📄 [extractTextFromPDF] Header PDF: "${header}" (${Buffer.from(header).toString('hex')})`);
    
    if (!header.startsWith("%PDF")) {
      console.warn(`⚠️ [extractTextFromPDF] Le fichier ne semble pas être un PDF valide. Header: ${header}`);
      // Continuer quand même, certains PDF peuvent avoir des headers différents
    }
    
    console.log(`✅ [extractTextFromPDF] Buffer préparé: ${pdfBuffer.length} bytes, header = ${header}`);
    
    // Importer pdf-parse - utiliser plusieurs méthodes de fallback pour compatibilité maximale
    let pdfParse: any;
    try {
      console.log("📦 [extractTextFromPDF] Chargement de pdf-parse...");
      
      // Méthode 1 : Essayer avec createRequire (si import.meta.url est disponible)
      try {
        const { createRequire } = await import("module");
        // Utiliser __filename ou __dirname si disponible, sinon utiliser import.meta.url
        let requireUrl: string | URL;
        if (typeof import.meta !== "undefined" && import.meta.url) {
          requireUrl = import.meta.url;
        } else if (typeof __filename !== "undefined") {
          requireUrl = __filename;
        } else {
          // Fallback : utiliser le chemin du module courant
          requireUrl = new URL(".", "file://" + process.cwd() + "/");
        }
        const require = createRequire(requireUrl);
        pdfParse = require("pdf-parse");
        console.log(`✅ [extractTextFromPDF] pdf-parse chargé via createRequire, type: ${typeof pdfParse}`);
      } catch (createRequireError) {
        console.warn("⚠️ [extractTextFromPDF] createRequire a échoué, essai méthode alternative:", createRequireError);
        
        // Méthode 2 : Essayer avec require direct (si disponible dans le contexte)
        try {
          // @ts-ignore - require peut ne pas être disponible en ESM
          pdfParse = require("pdf-parse");
          console.log(`✅ [extractTextFromPDF] pdf-parse chargé via require direct, type: ${typeof pdfParse}`);
        } catch (requireError) {
          console.warn("⚠️ [extractTextFromPDF] require direct a échoué, essai import dynamique:", requireError);
          
          // Méthode 3 : Essayer avec import dynamique
          const pdfParseModule = await import("pdf-parse");
          // Gérer les différents formats d'export (CommonJS vs ESM)
          pdfParse = (pdfParseModule as any).default || pdfParseModule;
          console.log(`✅ [extractTextFromPDF] pdf-parse chargé via import dynamique, type: ${typeof pdfParse}`);
        }
      }
      
      // Vérifier que pdfParse est bien une fonction
      if (typeof pdfParse !== "function") {
        console.error(`❌ [extractTextFromPDF] pdfParse n'est pas une fonction:`, typeof pdfParse, pdfParse);
        // Essayer d'accéder à default si présent
        if (pdfParse && typeof (pdfParse as any).default === "function") {
          console.log("🔄 [extractTextFromPDF] Utilisation de pdfParse.default");
          pdfParse = (pdfParse as any).default;
        } else if (pdfParse && typeof pdfParse === "object" && "default" in pdfParse) {
          // Essayer d'autres propriétés possibles
          const possibleFunctions = Object.values(pdfParse).filter(v => typeof v === "function");
          if (possibleFunctions.length > 0) {
            pdfParse = possibleFunctions[0];
            console.log("🔄 [extractTextFromPDF] Utilisation d'une fonction trouvée dans l'objet");
          } else {
            throw new Error(`pdf-parse n'est pas une fonction. Type: ${typeof pdfParse}, valeur: ${JSON.stringify(Object.keys(pdfParse || {}))}`);
          }
        } else {
          throw new Error(`pdf-parse n'est pas une fonction. Type: ${typeof pdfParse}`);
        }
      }
      
      console.log("✅ [extractTextFromPDF] pdfParse est une fonction, prêt pour parsing");
    } catch (error) {
      console.error("❌ [extractTextFromPDF] Erreur lors du chargement de pdf-parse:", error);
      const errorDetails = error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
      } : { error: String(error) };
      console.error("   Détails complets:", errorDetails);
      throw new Error(
        `Impossible de charger pdf-parse. Vérifiez que la dépendance est installée: npm install pdf-parse. ` +
        `Erreur: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    
    // Parser le PDF
    let pdfData: any;
    try {
      console.log("🔄 [extractTextFromPDF] Début du parsing PDF...");
      pdfData = await pdfParse(pdfBuffer);
      console.log("✅ [extractTextFromPDF] Parsing réussi");
    } catch (parseError) {
      console.error("❌ [extractTextFromPDF] Erreur lors du parsing PDF:", parseError);
      const errorDetails = parseError instanceof Error ? {
        message: parseError.message,
        name: parseError.name,
        stack: parseError.stack,
        code: (parseError as any).code,
      } : { error: String(parseError) };
      console.error("   Détails complets de l'erreur:", errorDetails);
      
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
          `Erreur lors du parsing du PDF: ${errorMessage}. ` +
          `Détails: ${JSON.stringify(errorDetails)}`
        );
      }
    }
    
    // Validation des données retournées par pdf-parse
    if (!pdfData || typeof pdfData !== "object") {
      console.error("❌ [extractTextFromPDF] pdf-parse n'a retourné aucune donnée valide:", pdfData);
      throw new Error("pdf-parse n'a retourné aucune donnée valide");
    }
    
    console.log("✅ [extractTextFromPDF] pdfData reçu:", {
      type: typeof pdfData,
      hasText: !!pdfData.text,
      hasNumpages: pdfData.numpages !== undefined,
      keys: Object.keys(pdfData),
    });
    
    // Vérifier que pdfData contient les propriétés attendues
    if (pdfData.numpages === undefined || pdfData.numpages === null) {
      console.warn("⚠️ [extractTextFromPDF] pdfData.numpages est undefined/null, le PDF pourrait être corrompu");
    }
    
    const text = pdfData.text || "";
    const numPages = pdfData.numpages || 0;
    
    // Logs détaillés pour diagnostic
    console.log(`📊 [extractTextFromPDF] PDF parsé: ${numPages} page(s), texte: ${text.length} caractères`, {
      numPages: numPages,
      textLength: text.length,
      hasText: !!text && text.length > 0,
      hasInfo: !!pdfData.info,
      hasMetadata: !!pdfData.metadata,
      textPreview: text.substring(0, 100),
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

