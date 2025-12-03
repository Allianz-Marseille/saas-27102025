import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin-config";
import { getVisionClient } from "@/lib/google-cloud/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * API Route pour analyser un document (image/PDF) avec Google Vision AI
 * Utilisé pour l'analyse ponctuelle dans le chatbot
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Authentification
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token d'authentification manquant" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error("[Vision AI] Erreur vérification token:", error);
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    // 2. Récupérer le fichier
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    console.log(`[Vision AI] Début analyse pour ${decodedToken.uid} - ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    // 3. Convertir le fichier en buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 4. Appeler Google Vision AI
    const client = getVisionClient();
    const [result] = await client.documentTextDetection({
      image: { content: buffer.toString("base64") },
    });

    const text = result.fullTextAnnotation?.text || "";
    const confidence = result.fullTextAnnotation?.pages?.[0]?.confidence || 0;

    if (!text || text.trim().length === 0) {
      console.warn(`[Vision AI] Aucun texte détecté dans ${file.name}`);
      return NextResponse.json(
        {
          text: "",
          confidence: 0,
          warning: "Aucun texte détecté dans le document",
        },
        { status: 200 }
      );
    }

    const extractionTime = Date.now() - startTime;
    console.log(`[Vision AI] Analyse réussie en ${extractionTime}ms - ${text.length} caractères, confiance: ${(confidence * 100).toFixed(1)}%`);

    return NextResponse.json({
      text,
      confidence,
      metadata: {
        extractionTime,
        textLength: text.length,
        fileName: file.name,
      },
    });
  } catch (error) {
    const extractionTime = Date.now() - startTime;
    console.error(`[Vision AI] Erreur après ${extractionTime}ms:`, error);
    
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      {
        error: "Erreur lors de l'analyse du document",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

