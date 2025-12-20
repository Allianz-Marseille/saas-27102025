/**
 * Extraction de texte depuis différents formats de fichiers
 * Supporte PDF, Word, Excel, et images (via OCR)
 */

/**
 * Métadonnées d'extraction de texte
 */
export interface ExtractionMetadata {
  extractionMethod: "pdf-parse" | "ocr" | "word" | "excel" | "image-ocr";
  ocrEngine?: "openai_vision" | "google_vision" | "none";
  ocrPageCount?: number;
}

/**
 * Résultat d'extraction avec métadonnées
 */
export interface ExtractionResult {
  text: string;
  metadata: ExtractionMetadata;
}

/**
 * Extrait le texte d'un fichier selon son type
 */
export async function extractTextFromFile(
  file: File,
  arrayBuffer: ArrayBuffer
): Promise<string> {
  const result = await extractTextFromFileWithMetadata(file, arrayBuffer);
  return result.text;
}

/**
 * Extrait le texte d'un fichier selon son type avec métadonnées
 */
export async function extractTextFromFileWithMetadata(
  file: File,
  arrayBuffer: ArrayBuffer
): Promise<ExtractionResult> {
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
  const fileType = file.type;

  try {
    if (fileExtension === ".pdf" || fileType === "application/pdf") {
      return await extractTextFromPDFWithMetadata(arrayBuffer);
    } else if (fileExtension === ".docx" || fileType.includes("wordprocessingml")) {
      const text = await extractTextFromWord(arrayBuffer);
      return {
        text,
        metadata: {
          extractionMethod: "word",
        },
      };
    } else if (fileExtension === ".xlsx" || fileType.includes("spreadsheetml")) {
      const text = await extractTextFromExcel(arrayBuffer);
      return {
        text,
        metadata: {
          extractionMethod: "excel",
        },
      };
    } else if (fileType.startsWith("image/")) {
      const text = await extractTextFromImage(arrayBuffer, fileType);
      return {
        text,
        metadata: {
          extractionMethod: "image-ocr",
          ocrEngine: "openai_vision",
        },
      };
    } else {
      throw new Error(`Type de fichier non supporté : ${fileType}`);
    }
  } catch (error) {
    console.error(`Erreur lors de l'extraction depuis ${fileExtension}:`, error);
    throw error;
  }
}

/**
 * Convertit un PDF en images (une par page)
 * Retourne un tableau de buffers d'images (PNG)
 */
async function convertPDFToImages(arrayBuffer: ArrayBuffer): Promise<ArrayBuffer[]> {
  try {
    const Buffer = (await import("buffer")).Buffer;
    const pdfBuffer = Buffer.from(arrayBuffer);
    
    // Importer pdfjs-dist pour Node.js
    // Note: pdfjs-dist nécessite une configuration spéciale pour Node.js
    const pdfjsLib = await import("pdfjs-dist");
    
    // Configurer le worker pour Node.js (nécessaire pour pdfjs-dist)
    if (typeof window === "undefined") {
      // Côté serveur Node.js - configurer le worker
      try {
        // Utiliser le chemin du worker directement (sans import dynamique pour éviter les erreurs TypeScript)
        if (pdfjsLib.GlobalWorkerOptions) {
          // En Node.js, pdfjs-dist peut fonctionner sans worker configuré explicitement
          // Le worker est optionnel pour certaines opérations
          pdfjsLib.GlobalWorkerOptions.workerSrc = "";
        }
      } catch (workerError) {
        // Si la configuration échoue, continuer sans worker
        console.warn("⚠️ [convertPDFToImages] Configuration worker échouée, continuation sans worker");
      }
    }
    
    // Charger le document PDF
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      verbosity: 0, // Désactiver les logs
    });
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    
    console.log(`📄 [convertPDFToImages] PDF chargé: ${numPages} page(s)`);
    
    // Limite de sécurité : max 50 pages
    const MAX_PAGES = 50;
    if (numPages > MAX_PAGES) {
      throw new Error(
        `Le PDF contient trop de pages (${numPages}). Maximum autorisé: ${MAX_PAGES} pages. ` +
        `Veuillez diviser le document en plusieurs fichiers plus petits.`
      );
    }
    
    const imageBuffers: ArrayBuffer[] = [];
    
    // Convertir chaque page en image
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        
        // Configuration du viewport (résolution élevée pour meilleure qualité OCR)
        const viewport = page.getViewport({ scale: 2.0 });
        
        // Essayer d'utiliser canvas si disponible (environnement local)
        // Sur Vercel, canvas n'est pas disponible, donc on lance une erreur explicite
        let imageBuffer: ArrayBuffer | null = null;
        
        try {
          // Tentative : Utiliser canvas (si disponible localement)
          // Utiliser require dynamique pour éviter les erreurs TypeScript quand canvas n'est pas disponible
          const canvasModule = await new Promise<any>((resolve, reject) => {
            try {
              // @ts-ignore - canvas est optionnel, peut ne pas être disponible
              const { createRequire } = require("module");
              const requireFn = createRequire(import.meta.url || __filename || process.cwd());
              const canvas = requireFn("canvas");
              resolve(canvas);
            } catch (err) {
              reject(err);
            }
          });
          const createCanvas = canvasModule.createCanvas || canvasModule.default?.createCanvas;
          
          if (createCanvas) {
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext("2d") as any;
            
            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            };
            
            await page.render(renderContext).promise;
            const buffer = canvas.toBuffer("image/png");
            imageBuffer = new Uint8Array(buffer).buffer;
          } else {
            throw new Error("canvas.createCanvas non disponible");
          }
        } catch (canvasError) {
          // Canvas n'est pas disponible (environnement Vercel)
          // Sur Vercel ou environnement sans canvas, on ne peut pas convertir le PDF en images
          // L'OCR via OpenAI Vision nécessite des images, donc on doit utiliser une alternative
          // Solution : Utiliser Google Cloud Vision API qui supporte directement les PDFs
          throw new Error(
            `L'OCR des PDFs scannés nécessite la bibliothèque 'canvas' qui n'est pas disponible dans cet environnement (Vercel). ` +
            `Solutions alternatives : ` +
            `1. Utiliser Google Cloud Vision API qui supporte directement les PDFs (recommandé pour Vercel) ` +
            `2. Utiliser un environnement avec canvas installé (développement local) ` +
            `3. Désactiver l'OCR pour les PDFs scannés dans cet environnement. ` +
            `Erreur: ${canvasError instanceof Error ? canvasError.message : "Erreur inconnue"}`
          );
        }
        
        if (!imageBuffer) {
          throw new Error("Impossible de générer l'image de la page");
        }
        
        imageBuffers.push(imageBuffer);
        
        console.log(`   ✅ Page ${pageNum}/${numPages} convertie en image`);
      } catch (pageError) {
        console.error(`   ❌ Erreur lors de la conversion de la page ${pageNum}:`, pageError);
        // Continuer avec les autres pages même si une échoue
        throw new Error(
          `Erreur lors de la conversion de la page ${pageNum}: ${pageError instanceof Error ? pageError.message : "Erreur inconnue"}`
        );
      }
    }
    
    console.log(`✅ [convertPDFToImages] ${imageBuffers.length} image(s) créée(s)`);
    return imageBuffers;
  } catch (error) {
    if (error instanceof Error && error.message.includes("trop de pages")) {
      throw error;
    }
    console.error("❌ [convertPDFToImages] Erreur lors de la conversion PDF → images:", error);
    throw new Error(
      `Impossible de convertir le PDF en images: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Initialise le client Google Vision AI avec credentials depuis variable d'environnement
 */
async function getVisionClient() {
  const { ImageAnnotatorClient } = await import("@google-cloud/vision");
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!credentialsJson) {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS_JSON manquante dans les variables d'environnement"
    );
  }

  let credentials;
  try {
    credentials = JSON.parse(credentialsJson);
  } catch (error) {
    throw new Error(
      "Erreur lors du parsing de GOOGLE_APPLICATION_CREDENTIALS_JSON: " +
        (error instanceof Error ? error.message : "Format JSON invalide")
    );
  }

  return new ImageAnnotatorClient({
    credentials,
  });
}

/**
 * Extrait le texte d'un PDF via OCR Google Cloud Vision AI (pour PDFs scannés)
 * Utilise asyncBatchAnnotateFiles pour un support natif des PDFs multi-pages
 */
async function extractTextFromPDFViaOCR(arrayBuffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  console.log("🔍 [extractTextFromPDFViaOCR] Début extraction OCR PDF via Google Vision AI");
  
  try {
    const Buffer = (await import("buffer")).Buffer;
    const pdfBuffer = Buffer.from(arrayBuffer);
    
    // Vérifier la taille (max 20MB pour Vision AI)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (pdfBuffer.length > maxSize) {
      throw new Error(
        `Le fichier PDF est trop volumineux (max 20MB). Taille actuelle: ${Math.round(pdfBuffer.length / 1024 / 1024)}MB`
      );
    }

    console.log(`📄 [extractTextFromPDFViaOCR] PDF à traiter: ${Math.round(pdfBuffer.length / 1024)}KB`);

    // Initialiser le client Vision AI
    const client = await getVisionClient();

    // Convertir le buffer en base64 pour Vision AI
    const base64Content = pdfBuffer.toString("base64");

    // Préparer la requête pour asyncBatchAnnotateFiles
    const visionRequest = {
      requests: [
        {
          inputConfig: {
            mimeType: "application/pdf",
            content: base64Content,
          },
          features: [
            {
              type: "DOCUMENT_TEXT_DETECTION" as const,
            },
          ],
        },
      ],
    };

    // Appeler Vision AI avec asyncBatchAnnotateFiles (support PDF natif multi-pages)
    console.log("   🔄 Appel à Google Vision AI (asyncBatchAnnotateFiles)...");
    const [operation] = await client.asyncBatchAnnotateFiles(visionRequest);
    
    // Attendre la fin du traitement asynchrone
    console.log("   ⏳ Attente de la fin du traitement asynchrone...");
    const [result] = await operation.promise();

    // Vérifier que la réponse contient des données
    if (!result.responses || result.responses.length === 0) {
      throw new Error("Aucune réponse de Google Vision AI");
    }

    // Extraire le texte de toutes les pages
    const responses = result.responses;
    let fullText = "";
    let pageCount = 0;

    for (const fileResponse of responses) {
      // Vérifier s'il y a une erreur dans cette réponse
      const responseWithError = fileResponse as unknown as { error?: { message?: string }; responses?: Array<{ fullTextAnnotation?: { text?: string } }> };
      if (responseWithError.error) {
        throw new Error(
          `Erreur lors du traitement OCR par Google Vision AI: ${responseWithError.error.message || "Erreur inconnue"}`
        );
      }

      // Extraire le texte des réponses de pages
      const pageResponses = (fileResponse as unknown as { responses?: Array<{ fullTextAnnotation?: { text?: string } }> }).responses;
      if (pageResponses) {
        pageCount = pageResponses.length;
        for (const pageResponse of pageResponses) {
          if (pageResponse.fullTextAnnotation?.text) {
            fullText += pageResponse.fullTextAnnotation.text + "\n\n";
          }
        }
      }
    }

    // Nettoyer le texte (supprimer les espaces multiples, etc.)
    const cleanedText = fullText.trim().replace(/\n{3,}/g, "\n\n");

    if (cleanedText.length === 0) {
      throw new Error("Aucun texte extrait du PDF via OCR Google Vision AI");
    }

    console.log(`✅ [extractTextFromPDFViaOCR] Extraction OCR réussie: ${cleanedText.length} caractères sur ${pageCount} page(s)`);
    
    return { text: cleanedText, pageCount };
  } catch (error) {
    console.error("❌ [extractTextFromPDFViaOCR] Erreur lors de l'extraction OCR:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Erreur OCR PDF: ${String(error)}`);
  }
}

/**
 * Extrait le texte d'un PDF
 * Essaie d'abord pdf-parse (texte natif), puis OCR si échec
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
      
      console.warn("⚠️ [extractTextFromPDF] PDF parsé mais aucun texte extrait. Tentative OCR automatique...");
      console.log("   Diagnostic:", diagnosticInfo);
      
      // Si le PDF a des pages, essayer l'OCR automatiquement
      if (numPages > 0) {
        try {
          console.log("🔄 [extractTextFromPDF] Déclenchement du fallback OCR...");
          const ocrResult = await extractTextFromPDFViaOCR(arrayBuffer);
          console.log(`✅ [extractTextFromPDF] OCR réussi: ${ocrResult.text.length} caractères extraits de ${ocrResult.pageCount} page(s)`);
          return ocrResult.text;
        } catch (ocrError) {
          console.error("❌ [extractTextFromPDF] OCR a échoué:", ocrError);
          // Si l'OCR échoue aussi, lancer une erreur explicite
          throw new Error(
            `Aucun texte extrait du PDF (${numPages} page(s)). ` +
            `Le PDF pourrait être une image scannée, mais l'OCR a également échoué. ` +
            `Erreur OCR: ${ocrError instanceof Error ? ocrError.message : "Erreur inconnue"}`
          );
        }
      } else {
        // PDF sans pages ou corrompu
        throw new Error(
          `Aucun texte extrait du PDF. Le PDF semble vide ou corrompu. ` +
          `Vérifiez que le fichier est un PDF valide contenant du texte.`
        );
      }
    }
    
    // Vérifier si le texte est trop court (moins de 10 caractères imprimables)
    // Cela peut indiquer un PDF scanné mal détecté
    const printableChars = text.replace(/[\s\n\r\t]/g, "");
    if (printableChars.length < 10 && numPages > 0) {
      console.warn("⚠️ [extractTextFromPDF] Texte extrait très court, possible PDF scanné. Tentative OCR...");
      try {
        const ocrResult = await extractTextFromPDFViaOCR(arrayBuffer);
        if (ocrResult.text.length > text.length) {
          console.log(`✅ [extractTextFromPDF] OCR a extrait plus de texte (${ocrResult.text.length} vs ${text.length}), utilisation du résultat OCR`);
          return ocrResult.text;
        }
      } catch (ocrError) {
        console.warn("⚠️ [extractTextFromPDF] OCR a échoué, utilisation du texte extrait par pdf-parse:", ocrError);
        // Continuer avec le texte extrait par pdf-parse même s'il est court
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
 * Extrait le texte d'un PDF avec métadonnées
 * Détecte automatiquement si l'OCR a été utilisé
 */
async function extractTextFromPDFWithMetadata(
  arrayBuffer: ArrayBuffer
): Promise<ExtractionResult> {
  try {
    // Essayer d'abord avec pdf-parse
    const Buffer = (await import("buffer")).Buffer;
    const pdfBuffer = Buffer.from(arrayBuffer);
    
    // Importer pdf-parse
    const { createRequire } = await import("module");
    let requireUrl: string | URL;
    if (typeof import.meta !== "undefined" && import.meta.url) {
      requireUrl = import.meta.url;
    } else if (typeof __filename !== "undefined") {
      requireUrl = __filename;
    } else {
      requireUrl = new URL(".", "file://" + process.cwd() + "/");
    }
    const require = createRequire(requireUrl);
    const pdfParse = require("pdf-parse");
    
    let pdfData: any;
    try {
      pdfData = await pdfParse(pdfBuffer);
    } catch (parseError) {
      // Si le parsing échoue, utiliser OCR directement
      console.log("🔄 [extractTextFromPDFWithMetadata] Parsing échoué, utilisation OCR...");
      const ocrResult = await extractTextFromPDFViaOCR(arrayBuffer);
      return {
        text: ocrResult.text,
        metadata: {
          extractionMethod: "ocr",
          ocrEngine: "google_vision",
          ocrPageCount: ocrResult.pageCount,
        },
      };
    }
    
    const text = pdfData.text || "";
    const numPages = pdfData.numpages || 0;
    
    // Si texte vide ou trop court, utiliser OCR
    if (!text || text.trim().length === 0) {
      if (numPages > 0) {
        console.log("🔄 [extractTextFromPDFWithMetadata] Texte vide, utilisation OCR...");
        const ocrResult = await extractTextFromPDFViaOCR(arrayBuffer);
        return {
          text: ocrResult.text,
          metadata: {
            extractionMethod: "ocr",
            ocrEngine: "openai_vision",
            ocrPageCount: ocrResult.pageCount,
          },
        };
      }
    }
    
    // Vérifier si texte trop court (possible PDF scanné)
    const printableChars = text.replace(/[\s\n\r\t]/g, "");
    if (printableChars.length < 10 && numPages > 0) {
      try {
        const ocrResult = await extractTextFromPDFViaOCR(arrayBuffer);
        if (ocrResult.text.length > text.length) {
          console.log("🔄 [extractTextFromPDFWithMetadata] OCR a extrait plus de texte, utilisation OCR");
          return {
            text: ocrResult.text,
            metadata: {
              extractionMethod: "ocr",
              ocrEngine: "openai_vision",
              ocrPageCount: ocrResult.pageCount,
            },
          };
        }
      } catch (ocrError) {
        // Continuer avec pdf-parse si OCR échoue
        console.warn("⚠️ [extractTextFromPDFWithMetadata] OCR a échoué, utilisation du texte pdf-parse");
      }
    }
    
    // Utiliser le texte de pdf-parse
    return {
      text: text.trim(),
      metadata: {
        extractionMethod: "pdf-parse",
      },
    };
  } catch (error) {
    console.error("❌ [extractTextFromPDFWithMetadata] Erreur:", error);
    // En dernier recours, essayer OCR
    try {
      console.log("🔄 [extractTextFromPDFWithMetadata] Dernière tentative avec OCR...");
      const ocrResult = await extractTextFromPDFViaOCR(arrayBuffer);
      return {
        text: ocrResult.text,
        metadata: {
          extractionMethod: "ocr",
          ocrEngine: "google_vision",
          ocrPageCount: ocrResult.pageCount,
        },
      };
    } catch (ocrError) {
      // Si tout échoue, propager l'erreur originale
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Erreur lors de l'extraction PDF: ${String(error)}`);
    }
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
 * Utilise exceljs (alternative sécurisée à xlsx)
 */
async function extractTextFromExcel(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Utiliser exceljs (alternative sécurisée à xlsx)
    const ExcelJS = await import("exceljs");
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
              // Cellule avec formatage riche
              cellValue = cell.value.text || "";
            } else if (typeof cell.value === "object" && "result" in cell.value) {
              // Cellule avec formule (utiliser le résultat)
              cellValue = String(cell.value.result || "");
            } else {
              // Valeur simple
              cellValue = String(cell.value);
            }
          }
          cells.push(cellValue.trim());
        });
        
        if (cells.length > 0) {
          rows.push(cells.join("\t")); // Séparateur tabulation pour préserver la structure
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
      throw new Error("La bibliothèque 'exceljs' n'est pas installée. Installez-la avec: npm install exceljs");
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

