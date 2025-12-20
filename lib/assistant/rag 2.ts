/**
 * Fonction principale pour le RAG (Retrieval-Augmented Generation)
 * Combine la recherche vectorielle avec la génération de réponses
 */

import { generateEmbedding } from "./embeddings";
import { searchSimilarChunks, buildRAGContext, extractSources } from "./vector-search";
import { RAGContext, RAGConfig } from "./types";

/**
 * Récupère le contexte pertinent pour une requête utilisateur
 */
export async function retrieveContext(
  query: string,
  config: Partial<RAGConfig> = {}
): Promise<RAGContext> {
  try {
    // Générer l'embedding de la requête
    const queryEmbedding = await generateEmbedding(query);

    // Rechercher les chunks similaires
    const searchResults = await searchSimilarChunks(queryEmbedding, config);

    // Construire le contexte
    const context = buildRAGContext(searchResults);
    const sources = extractSources(searchResults);

    return {
      chunks: searchResults.map((result) => result.chunk),
      query,
      sources,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du contexte:", error);
    throw error;
  }
}

/**
 * Construit un prompt enrichi avec le contexte RAG
 */
export function buildRAGPrompt(
  userQuery: string,
  context: string,
  systemPrompt?: string
): string {
  const defaultSystemPrompt = `Tu es un assistant IA spécialisé dans l'assurance. 
Tu dois répondre aux questions en utilisant le contexte fourni ci-dessous.
Si le contexte ne contient pas d'information pertinente, tu peux utiliser tes connaissances générales.
Toujours citer les sources utilisées quand c'est possible.`;

  const system = systemPrompt || defaultSystemPrompt;

  return `${system}

## Contexte disponible :

${context || "Aucun contexte spécifique disponible."}

## Question de l'utilisateur :

${userQuery}

## Ta réponse :`;
}

