/**
 * Recherche vectorielle dans Firestore
 * Utilise la similarité cosinus pour trouver les chunks les plus pertinents
 */

import { adminDb } from "@/lib/firebase/admin-config";
import { DocumentChunk, SearchResult, RAGConfig } from "./types";

const DEFAULT_CONFIG: RAGConfig = {
  topK: 5,
  minScore: 0.7,
  embeddingModel: "text-embedding-3-small",
};

/**
 * Calcule la similarité cosinus entre deux vecteurs
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error("Les vecteurs doivent avoir la même dimension");
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Recherche les chunks les plus similaires à un embedding de requête
 */
export async function searchSimilarChunks(
  queryEmbedding: number[],
  config: Partial<RAGConfig> = {}
): Promise<SearchResult[]> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // Récupérer tous les chunks depuis Firestore
    // Note: Pour de grandes collections, il faudrait utiliser une base vectorielle dédiée
    const chunksSnapshot = await adminDb
      .collection("rag_chunks")
      .get();

    const results: SearchResult[] = [];

    for (const doc of chunksSnapshot.docs) {
      const chunkData = doc.data() as DocumentChunk;
      
      if (!chunkData.embedding || chunkData.embedding.length === 0) {
        continue;
      }

      const score = cosineSimilarity(queryEmbedding, chunkData.embedding);

      if (score >= finalConfig.minScore) {
        results.push({
          chunk: {
            ...chunkData,
            id: doc.id,
          },
          score,
        });
      }
    }

    // Trier par score décroissant et prendre les top-k
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, finalConfig.topK);
  } catch (error) {
    console.error("Erreur lors de la recherche vectorielle:", error);
    throw new Error("Impossible d'effectuer la recherche vectorielle");
  }
}

/**
 * Construit le contexte RAG à partir des résultats de recherche
 */
export function buildRAGContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return "";
  }

  const contextParts = results.map((result, index) => {
    return `[Source ${index + 1}]\n${result.chunk.content}\n`;
  });

  return contextParts.join("\n---\n\n");
}

/**
 * Extrait les sources uniques depuis les résultats
 */
export function extractSources(results: SearchResult[]): string[] {
  const sources = new Set<string>();
  
  for (const result of results) {
    if (result.chunk.metadata.source) {
      sources.add(result.chunk.metadata.source);
    } else if (result.chunk.metadata.documentTitle) {
      sources.add(result.chunk.metadata.documentTitle);
    }
  }

  return Array.from(sources);
}

