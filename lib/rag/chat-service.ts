/**
 * Service RAG principal pour la recherche et la génération de réponses
 */

import { generateEmbedding } from "./embeddings";
import { searchVectors, createCollectionIfNotExists } from "./qdrant-client";
import OpenAI from "openai";
import { ragConfig } from "@/lib/config/rag-config";
import type { ChatMessage, ChatResponse, SearchResult } from "./types";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!ragConfig.openai.apiKey) {
      throw new Error("OPENAI_API_KEY est requis");
    }
    openaiClient = new OpenAI({
      apiKey: ragConfig.openai.apiKey,
    });
  }
  return openaiClient;
}

/**
 * Recherche les contextes pertinents pour une requête
 */
export async function searchRelevantContexts(
  query: string,
  limit: number = ragConfig.search.limit
): Promise<SearchResult[]> {
  try {
    // S'assurer que la collection existe
    await createCollectionIfNotExists();

    // Générer l'embedding de la requête
    const queryEmbedding = await generateEmbedding(query);

    // Rechercher les contextes pertinents
    const results = await searchVectors(queryEmbedding, limit);

    return results;
  } catch (error) {
    console.error("Erreur lors de la recherche de contextes:", error);
    throw error;
  }
}

/**
 * Génère une réponse avec OpenAI en utilisant les contextes trouvés
 */
export async function generateResponse(
  query: string,
  contexts: SearchResult[],
  conversationHistory?: ChatMessage[]
): Promise<string> {
  const client = getOpenAIClient();

  // Construire le contexte à partir des résultats de recherche
  const contextText = contexts
    .map((result, index) => `[${index + 1}] ${result.text}`)
    .join("\n\n");

  // Construire les messages pour OpenAI
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  // Ajouter le prompt système
  messages.push({
    role: "system",
    content: ragConfig.systemPrompt,
  });

  // Ajouter l'historique de conversation (limité aux 10 derniers messages)
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }
  }

  // Ajouter le contexte et la requête actuelle
  const userMessage = contextText
    ? `Contexte disponible:\n\n${contextText}\n\nQuestion: ${query}\n\nRépondez en vous basant sur le contexte fourni. Si le contexte ne contient pas d'information pertinente, indiquez-le clairement.`
    : query;

  messages.push({
    role: "user",
    content: userMessage,
  });

  try {
    const response = await client.chat.completions.create({
      model: ragConfig.openai.chatModel,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";
  } catch (error) {
    console.error("Erreur lors de la génération de la réponse:", error);
    throw new Error(
      `Impossible de générer la réponse: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Méthode principale pour le chat RAG
 */
export async function chat(params: {
  query: string;
  conversationHistory?: ChatMessage[];
  userId: string;
}): Promise<ChatResponse> {
  const { query, conversationHistory, userId } = params;

  try {
    // Rechercher les contextes pertinents
    const searchResults = await searchRelevantContexts(query);

    // Générer la réponse
    const message = await generateResponse(query, searchResults, conversationHistory);

    // Extraire les IDs des documents utilisés
    const sources = Array.from(
      new Set(searchResults.map((result) => result.documentId))
    );

    return {
      message,
      sources,
      searchResults,
      metadata: {
        model: ragConfig.openai.chatModel,
      },
    };
  } catch (error) {
    console.error("Erreur dans le service de chat RAG:", error);
    throw error;
  }
}

