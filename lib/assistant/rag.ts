/**
 * Fonction principale pour le RAG (Retrieval-Augmented Generation)
 * Combine la recherche vectorielle avec la génération de réponses
 */

import { generateEmbedding } from "./embeddings";
import { searchSimilarChunks, buildRAGContext, extractSources, SearchFilters } from "./vector-search";
import { RAGContext, RAGConfig } from "./types";

/**
 * Récupère le contexte pertinent pour une requête utilisateur
 */
export async function retrieveContext(
  query: string,
  config: Partial<RAGConfig> = {},
  filters?: SearchFilters
): Promise<RAGContext> {
  try {
    // Générer l'embedding de la requête (sauf si recherche keyword pure)
    let queryEmbedding: number[] | undefined;
    if (!filters?.searchMode || filters.searchMode === "vector" || filters.searchMode === "hybrid") {
      queryEmbedding = await generateEmbedding(query);
    }

    // Rechercher les chunks similaires
    // Si recherche keyword pure, utiliser searchByKeywords directement
    if (filters?.searchMode === "keyword" && filters.keywords) {
      // Récupérer les documents actifs
      const { searchByKeywords } = await import("./vector-search");
      const activeDocsSnapshot = await (await import("@/lib/firebase/admin-config")).adminDb
        .collection("rag_documents")
        .where("isActive", "==", true)
        .where("status", "==", "indexed")
        .get();
      
      const activeDocumentIds = new Set<string>();
      activeDocsSnapshot.docs.forEach((doc) => activeDocumentIds.add(doc.id));
      
      const searchResults = await searchByKeywords(
        filters.keywords,
        activeDocumentIds,
        { ...config, topK: config.topK || 5, minScore: config.minScore || 0.7, embeddingModel: config.embeddingModel || "text-embedding-3-small" },
        undefined
      );
      
      const context = buildRAGContext(searchResults);
      const sources = extractSources(searchResults);
      
      return {
        chunks: searchResults.map((result) => result.chunk),
        query,
        sources,
      };
    }
    
    // Recherche vectorielle ou hybride
    if (!queryEmbedding) {
      queryEmbedding = await generateEmbedding(query);
    }
    
    const searchResults = await searchSimilarChunks(queryEmbedding, config, filters);

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

