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
    // Retourner un tableau vide au lieu de throw pour permettre le fonctionnement sans RAG
    return [];
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

  // Construire le prompt système selon le contexte
  let systemPrompt: string;
  
  if (contexts.length === 0) {
    // Mode IA classique : pas de documents RAG disponibles
    systemPrompt = `Vous êtes l'assistant virtuel d'Allianz Marseille, une agence d'assurances. Vous aidez les commerciaux et administrateurs avec leurs questions professionnelles.

CONTEXTE :
- Vous travaillez dans le domaine des assurances (auto, habitation, santé, prévoyance, vie, etc.)
- Vous connaissez les produits Allianz et les spécificités du secteur de l'assurance
- La base de connaissances spécifique de l'agence n'est pas encore configurée, mais vous pouvez répondre avec vos connaissances générales sur les assurances
- Vous pouvez répondre aux questions sur : les types de contrats, les garanties, les sinistres, les commissions, la réglementation, les produits d'assurance, etc.

STYLE DE RÉPONSES :
- Aérées : utilisez des paragraphes courts (2-3 phrases) avec des sauts de ligne entre chaque
- Structurées : utilisez des titres markdown (##, ###) et des listes à puces pour organiser l'information
- Complètes : donnez des réponses exhaustives avec des exemples concrets du domaine de l'assurance
- Pédagogiques : utilisez un ton accessible, des explications progressives
- Professionnel : utilisez le vocabulaire approprié du secteur de l'assurance

IMPORTANT : Si la question concerne des informations spécifiques à l'agence (procédures internes, documents particuliers, etc.), indiquez clairement que ces informations nécessitent l'indexation de documents dans la base de connaissances.

Répondez uniquement en français, sauf demande contraire.`;
  } else {
    // Mode RAG : documents disponibles
    systemPrompt = `${ragConfig.systemPrompt}

IMPORTANT : Vous avez accès à une base de connaissances avec des documents spécifiques de l'agence. Utilisez ces informations en priorité pour répondre aux questions. Si le contexte fourni ne contient pas d'information pertinente, vous pouvez compléter avec vos connaissances générales sur les assurances, mais indiquez clairement la source de vos informations.`;
  }

  // Ajouter le prompt système
  messages.push({
    role: "system",
    content: systemPrompt,
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
    // Rechercher les contextes pertinents (retourne [] si erreur)
    const searchResults = await searchRelevantContexts(query);

    // Générer la réponse (avec ou sans contexte)
    const message = await generateResponse(query, searchResults, conversationHistory);

    // Extraire les IDs des documents utilisés
    const sources = Array.from(
      new Set(searchResults.map((result) => result.documentId).filter(Boolean))
    );

    return {
      message,
      sources,
      searchResults,
      metadata: {
        model: ragConfig.openai.chatModel,
        hasContext: searchResults.length > 0,
      },
    };
  } catch (error) {
    console.error("Erreur dans le service de chat RAG:", error);
    
    // En cas d'erreur, essayer de répondre sans RAG
    try {
      const client = getOpenAIClient();
      const messages: any[] = [
        {
          role: "system",
          content: `Vous êtes l'assistant virtuel d'Allianz Marseille, une agence d'assurances. Vous aidez les commerciaux et administrateurs avec leurs questions professionnelles.

CONTEXTE :
- Vous travaillez dans le domaine des assurances (auto, habitation, santé, prévoyance, vie, etc.)
- Vous connaissez les produits Allianz et les spécificités du secteur de l'assurance
- La base de connaissances spécifique de l'agence n'est pas encore configurée, mais vous pouvez répondre avec vos connaissances générales sur les assurances
- Vous pouvez répondre aux questions sur : les types de contrats, les garanties, les sinistres, les commissions, la réglementation, les produits d'assurance, etc.

STYLE DE RÉPONSES :
- Aérées : utilisez des paragraphes courts (2-3 phrases) avec des sauts de ligne entre chaque
- Structurées : utilisez des titres markdown (##, ###) et des listes à puces
- Complètes : donnez des réponses exhaustives avec des exemples concrets du domaine de l'assurance
- Professionnel : utilisez le vocabulaire approprié du secteur de l'assurance

Répondez uniquement en français, sauf demande contraire.`,
        },
      ];

      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-10);
        for (const msg of recentHistory) {
          messages.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          });
        }
      }

      messages.push({
        role: "user",
        content: query,
      });

      const response = await client.chat.completions.create({
        model: ragConfig.openai.chatModel,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      return {
        message: response.choices[0]?.message?.content || "Désolé, je ne peux pas répondre pour le moment.",
        sources: [],
        searchResults: [],
        metadata: {
          model: ragConfig.openai.chatModel,
          hasContext: false,
          fallbackMode: true,
        },
      };
    } catch (fallbackError) {
      console.error("Erreur même en mode fallback:", fallbackError);
      throw new Error("Le service de chat est temporairement indisponible. Veuillez réessayer.");
    }
  }
}

