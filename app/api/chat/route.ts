import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/rag/chat-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, conversationHistory, userId } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query est requis" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId est requis" },
        { status: 400 }
      );
    }

    // Utiliser le service RAG qui gère automatiquement :
    // - Mode RAG si documents disponibles
    // - Mode IA classique (fallback) si pas de documents, avec connaissances assurances
    const response = await chat({
      query,
      conversationHistory: conversationHistory || [],
      userId,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur API chat:", error);
    
    // Log détaillé pour le debugging
    if (error instanceof Error) {
      console.error("Message d'erreur:", error.message);
      console.error("Stack:", error.stack);
    }
    
    // Message d'erreur plus informatif
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Erreur inconnue";
    
    // Vérifier si c'est une erreur OpenAI
    if (errorMessage.includes("API key") || errorMessage.includes("401")) {
      return NextResponse.json(
        {
          error: "Configuration OpenAI invalide. Vérifiez votre clé API.",
          details: "OPENAI_API_KEY manquante ou invalide",
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Erreur lors du traitement de la requête",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

