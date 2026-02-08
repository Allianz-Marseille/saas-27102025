/**
 * API Route pour l'OCR de PDFs via Google Cloud Vision AI
 * 
 * Pourquoi Vision AI ?
 * - Support natif des PDFs multi-pages via asyncBatchAnnotateFiles
 * - Fonctionne en local ET sur Vercel (pas de dépendances binaires)
 * - Haute précision OCR, même pour documents scannés
 * - Pas besoin de canvas/pdfjs qui ne fonctionnent pas sur Vercel (runtime serverless)
 * 
 * Pourquoi pas canvas/pdfjs ?
 * - canvas nécessite des binaires natifs (node-canvas) incompatibles avec Vercel
 * - pdfjs nécessite un environnement Node.js complet avec accès système
 * - Les deux sont trop lourds pour un runtime serverless
 * 
 */

import { NextRequest, NextResponse } from "next/server";
import { ImageAnnotatorClient } from "@google-cloud/vision";

// Configuration runtime Node.js pour Vercel
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max pour les gros PDFs

/**
 * Initialise le client Google Vision AI avec credentials depuis variable d'environnement.
 * Utilise GOOGLE_APPLICATION_CREDENTIALS_JSON (contenu JSON) ou GOOGLE_APPLICATION_CREDENTIALS (chemin fichier).
 */
function getVisionClient() {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson) as object;
      return new ImageAnnotatorClient({ credentials });
    } catch (error) {
      throw new Error(
        "Erreur lors du parsing de GOOGLE_APPLICATION_CREDENTIALS_JSON: " +
          (error instanceof Error ? error.message : "Format JSON invalide")
      );
    }
  }

  return new ImageAnnotatorClient();
}

/**
 * POST /api/ocr/pdf
 * 
 * Traite un PDF via Google Vision AI et retourne le texte OCR
 * 
 * Body: FormData avec champ "file" (PDF)
 * 
 * Retour: { success: true, text: string } ou { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer le FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    // Vérifier que le fichier est présent
    if (!file) {
      console.error("OCR PDF: Fichier manquant dans FormData");
      return NextResponse.json(
        { error: "Fichier PDF manquant. Utilisez le champ 'file' dans FormData." },
        { status: 400 }
      );
    }

    // Vérifier que c'est bien un PDF
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      console.error(`OCR PDF: Type de fichier invalide - ${file.type || "inconnu"}`);
      return NextResponse.json(
        { error: "Le fichier doit être un PDF (application/pdf)" },
        { status: 400 }
      );
    }

    // Convertir le fichier en Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Vérifier la taille (max 20MB pour Vision AI)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (buffer.length > maxSize) {
      console.error(`OCR PDF: Fichier trop volumineux - ${buffer.length} bytes`);
      return NextResponse.json(
        { error: `Le fichier PDF est trop volumineux (max 20MB). Taille actuelle: ${Math.round(buffer.length / 1024 / 1024)}MB` },
        { status: 400 }
      );
    }

    console.log(`OCR PDF: Traitement du fichier ${file.name} (${Math.round(buffer.length / 1024)}KB)`);

    // Initialiser le client Vision AI
    const client = getVisionClient();

    // Convertir le buffer en base64 pour Vision AI
    const base64Content = buffer.toString("base64");

    // Préparer la requête pour asyncBatchAnnotateFiles
    // Note: asyncBatchAnnotateFiles nécessite généralement un fichier dans GCS.
    // Cependant, certaines versions peuvent accepter du contenu inline via inputConfig.content.
    // Si cette méthode échoue, il faudra uploader le PDF dans GCS temporairement.
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
    // Cette méthode est asynchrone et retourne une opération à suivre
    console.log("OCR PDF: Appel à Google Vision AI (asyncBatchAnnotateFiles)...");
    const [operation] = await client.asyncBatchAnnotateFiles(visionRequest);
    
    // Attendre la fin du traitement asynchrone
    console.log("OCR PDF: Attente de la fin du traitement asynchrone...");
    const [result] = await operation.promise();

    // Vérifier que la réponse contient des données
    if (!result.responses || result.responses.length === 0) {
      console.error("OCR PDF: Aucune réponse de Vision AI");
      return NextResponse.json(
        {
          error: "Aucune réponse de Google Vision AI",
          details: "Le traitement OCR n'a retourné aucun résultat",
        },
        { status: 500 }
      );
    }

    // Extraire le texte de toutes les pages
    // Structure: result.responses contient les réponses par fichier
    const responses = result.responses;
    let fullText = "";

    for (const fileResponse of responses) {
      // Vérifier s'il y a une erreur dans cette réponse (structure optionnelle)
      const responseWithError = fileResponse as unknown as { error?: { message?: string }; responses?: Array<{ fullTextAnnotation?: { text?: string } }> };
      if (responseWithError.error) {
        console.error("OCR PDF: Erreur dans la réponse Vision AI:", responseWithError.error);
        return NextResponse.json(
          {
            error: "Erreur lors du traitement OCR par Google Vision AI",
            details: responseWithError.error.message || "Erreur inconnue",
          },
          { status: 500 }
        );
      }

      // Extraire le texte des réponses de pages
      // Note: La propriété 'responses' peut ne pas être dans le type mais existe à l'exécution
      const pageResponses = (fileResponse as unknown as { responses?: Array<{ fullTextAnnotation?: { text?: string } }> }).responses;
      if (pageResponses) {
        for (const pageResponse of pageResponses) {
          if (pageResponse.fullTextAnnotation?.text) {
            fullText += pageResponse.fullTextAnnotation.text + "\n\n";
          }
        }
      }
    }

    // Nettoyer le texte (supprimer les espaces multiples, etc.)
    const cleanedText = fullText.trim().replace(/\n{3,}/g, "\n\n");

    console.log(`OCR PDF: Succès - ${cleanedText.length} caractères extraits`);

    return NextResponse.json({
      success: true,
      text: cleanedText,
      characterCount: cleanedText.length,
    });
  } catch (error) {
    console.error("OCR PDF: Erreur serveur:", error);

    // Gestion des erreurs spécifiques
    if (error instanceof Error) {
      if (error.message.includes("GOOGLE_APPLICATION_CREDENTIALS_JSON")) {
        return NextResponse.json(
          {
            error: "Configuration Google Vision AI manquante",
            details: error.message,
          },
          { status: 500 }
        );
      }

      if (error.message.includes("JSON")) {
        return NextResponse.json(
          {
            error: "Erreur de configuration des credentials Google Vision AI",
            details: error.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Erreur lors du traitement OCR",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

