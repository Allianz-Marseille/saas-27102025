/**
 * Service principal pour le RAG (Retrieval Augmented Generation)
 * Combine la recherche vectorielle et la génération de réponse avec OpenAI
 */

import OpenAI from "openai";
import { ragConfig } from "@/lib/config/rag-config";
import { generateEmbedding } from "./embeddings";
import { searchVectors } from "./qdrant-client";
import type { ChatMessage, ChatRequest, ChatResponse, SearchResult } from "./types";

let openaiClient: OpenAI | null = null;

/**
 * Initialise et retourne le client OpenAI
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = ragConfig.openai.apiKey;

    if (!apiKey) {
      throw new Error(
        "Configuration OpenAI manquante. Veuillez définir OPENAI_API_KEY dans vos variables d'environnement."
      );
    }

    openaiClient = new OpenAI({
      apiKey,
    });
  }

  return openaiClient;
}

/**
 * Recherche les contextes pertinents pour une question
 */
export async function searchRelevantContexts(
  query: string,
  limit: number = ragConfig.search.limit
): Promise<SearchResult[]> {
  try {
    // Générer l'embedding de la question
    const queryEmbedding = await generateEmbedding(query);

    // Rechercher dans Qdrant
    const results = await searchVectors(queryEmbedding, limit);

    return results;
  } catch (error) {
    console.error("Erreur lors de la recherche de contextes:", error);
    throw new Error(
      `Impossible de rechercher les contextes pertinents: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
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
  const model = ragConfig.openai.chatModel;

  try {
    // Construire le contexte à partir des résultats de recherche
    const contextText = contexts
      .map((result, index) => {
        return `[Source ${index + 1}: ${result.filename}]\n${result.text}`;
      })
      .join("\n\n");

    // Construire les messages pour OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    // Message système avec instructions
    messages.push({
      role: "system",
      content: ragConfig.systemPrompt,
    });

    // Ajouter l'historique de conversation si disponible
    if (conversationHistory && conversationHistory.length > 0) {
      // Limiter l'historique aux 10 derniers messages pour éviter de dépasser les limites
      const recentHistory = conversationHistory.slice(-10);
      
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }

    // Message utilisateur avec contexte
    const userMessage = `Contexte disponible :
${contextText}

Question de l'utilisateur : ${query}

Répondez en vous basant uniquement sur le contexte fourni. Si le contexte ne contient pas d'informations pertinentes, indiquez-le clairement.`;

    messages.push({
      role: "user",
      content: userMessage,
    });

    // Appeler OpenAI
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7, // Créativité modérée
      max_tokens: 2000, // Limite de tokens pour la réponse
    });

    const assistantMessage = response.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error("Aucune réponse générée par OpenAI");
    }

    return assistantMessage;
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
export async function chat(
  request: ChatRequest
): Promise<ChatResponse> {
  const startTime = Date.now();

  try {
    // 1. Rechercher les contextes pertinents
    const searchResults = await searchRelevantContexts(request.query);

    if (searchResults.length === 0) {
      return {
        message:
          "Je n'ai pas trouvé d'informations pertinentes dans la base de connaissances pour répondre à votre question. Pouvez-vous reformuler votre question ou vérifier que les documents nécessaires ont bien été indexés ?",
        sources: [],
        searchResults: [],
        metadata: {
          model: ragConfig.openai.chatModel,
          responseTime: Date.now() - startTime,
        },
      };
    }

    // 2. Générer la réponse avec OpenAI
    const message = await generateResponse(
      request.query,
      searchResults,
      request.conversationHistory
    );

    // 3. Extraire les IDs des documents uniques utilisés
    const uniqueDocumentIds = [
      ...new Set(searchResults.map((result) => result.documentId)),
    ];

    // 4. Calculer les tokens utilisés (approximation)
    const tokensUsed = Math.ceil(
      (message.length + request.query.length) / 4
    ); // Approximation : 1 token ≈ 4 caractères

    return {
      message,
      sources: uniqueDocumentIds,
      searchResults,
      metadata: {
        model: ragConfig.openai.chatModel,
        tokensUsed,
        responseTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("Erreur lors du chat RAG:", error);
    throw error;
  }
}

