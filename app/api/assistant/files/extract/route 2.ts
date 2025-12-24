/**
 * API Route pour l'extraction de texte depuis les fichiers
 * POST : Extrait le texte d'un fichier (PDF, TXT, CSV) côté serveur
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";
import { extractTextFromFile } from "@/lib/assistant/file-extraction";

/**
 * Extrait le texte d'un fichier PDF
 */
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    // Convertir ArrayBuffer en Buffer pour pdf-parse
    const Buffer = (await import("buffer")).Buffer;
    const pdfBuffer = Buffer.from(buffer);
    
    // Utiliser createRequire pour importer pdf-parse (module CommonJS)
    // Cela garantit une compatibilité maximale avec Next.js/Turbopack
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const pdfParse = require("pdf-parse");
    
    // Vérifier que pdfParse est bien une fonction
    if (typeof pdfParse !== "function") {
      console.error("pdfParse n'est pas une fonction:", typeof pdfParse, pdfParse);
      throw new Error("Impossible de charger pdf-parse correctement");
    }
    
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    if (!text || text.trim().length === 0) {
      throw new Error("Aucun texte extrait du PDF");
    }

    return text;
  } catch (error) {
    console.error("Erreur extraction PDF:", error);
    throw new Error(
      `Impossible d'extraire le texte du PDF : ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Extrait le texte d'un fichier texte (TXT, CSV)
 */
async function extractTextFromText(buffer: ArrayBuffer): Promise<string> {
  const decoder = new TextDecoder("utf-8");
  const text = decoder.decode(buffer);
  return text;
}

/**
 * POST /api/assistant/files/extract
 * Extrait le texte d'un fichier uploadé
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Récupérer le fichier depuis FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Vérifier la taille (max 20 MB)
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Le fichier est trop volumineux (maximum ${MAX_FILE_SIZE / 1024 / 1024} MB)` },
        { status: 400 }
      );
    }

    // Vérifier que le fichier n'est pas vide
    if (file.size === 0) {
      return NextResponse.json({ error: "Le fichier est vide" }, { status: 400 });
    }

    // Lire le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const mimeType = file.type;
    const fileName = file.name.toLowerCase();

    let text: string;
    let error: string | undefined;

    try {
      // Extraire le texte selon le type de fichier
      if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
        text = await extractTextFromPDF(arrayBuffer);
      } else if (mimeType === "text/plain" || mimeType === "text/csv" || fileName.endsWith(".txt") || fileName.endsWith(".csv")) {
        text = await extractTextFromText(arrayBuffer);
      } else if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileName.endsWith(".docx")
      ) {
        // Utiliser la fonction d'extraction centralisée
        text = await extractTextFromFile(file, arrayBuffer);
      } else if (
        mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        fileName.endsWith(".xlsx")
      ) {
        // Utiliser la fonction d'extraction centralisée
        text = await extractTextFromFile(file, arrayBuffer);
      } else {
        return NextResponse.json(
          {
            error: `Type de fichier non supporté : ${mimeType || file.name}. Types supportés : PDF, Word (.docx), Excel (.xlsx), TXT, CSV`,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        text,
        fileName: file.name,
        fileSize: file.size,
        mimeType,
      });
    } catch (extractError) {
      error = extractError instanceof Error ? extractError.message : "Erreur inconnue lors de l'extraction";
      return NextResponse.json(
        {
          success: false,
          error,
          fileName: file.name,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur POST /api/assistant/files/extract:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'extraction du texte",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

