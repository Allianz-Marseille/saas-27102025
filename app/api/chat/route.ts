/**
 * API Route pour les requêtes de chat RAG
 * POST /api/chat
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/rag/auth-utils";
import { chat } from "@/lib/rag/chat-service";
import type { ChatRequest } from "@/lib/rag/types";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || "Non authentifié" },
        { status: 401 }
      );
    }

    // Parser le body
    const body = await request.json();
    const { query, conversationHistory } = body;

    // Validation
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "La question est requise" },
        { status: 400 }
      );
    }

    // Préparer la requête de chat
    const chatRequest: ChatRequest = {
      query: query.trim(),
      conversationHistory: conversationHistory || [],
      userId: authResult.uid,
    };

    // Appeler le service RAG
    const response = await chat(chatRequest);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors du chat RAG:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération de la réponse",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

