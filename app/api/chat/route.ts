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

    // Appel au service de chat RAG
    const response = await chat({
      query,
      conversationHistory: conversationHistory || [],
      userId,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur API chat:", error);
    return NextResponse.json(
      {
        error: "Erreur lors du traitement de la requête",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

