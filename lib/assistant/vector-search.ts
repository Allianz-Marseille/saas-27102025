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

export interface SearchFilters {
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  keywords?: string;
  searchMode?: "vector" | "keyword" | "hybrid";
}

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
 * Filtre uniquement les chunks dont le document parent est actif et indexé
 */
export async function searchSimilarChunks(
  queryEmbedding: number[],
  config: Partial<RAGConfig> = {},
  filters?: SearchFilters
): Promise<SearchResult[]> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // Construire la requête de documents avec filtres
    let documentsQuery = adminDb
      .collection("rag_documents")
      .where("isActive", "==", true)
      .where("status", "==", "indexed");

    // Filtrer par catégorie si fourni
    if (filters?.category) {
      documentsQuery = documentsQuery.where("category", "==", filters.category);
    }

    // Filtrer par date si fourni
    if (filters?.dateFrom) {
      documentsQuery = documentsQuery.where("createdAt", ">=", filters.dateFrom);
    }
    if (filters?.dateTo) {
      documentsQuery = documentsQuery.where("createdAt", "<=", filters.dateTo);
    }

    const activeDocumentsSnapshot = await documentsQuery.get();

    const activeDocumentIds = new Set<string>();
    activeDocumentsSnapshot.docs.forEach((doc) => {
      activeDocumentIds.add(doc.id);
    });

    if (activeDocumentIds.size === 0) {
      console.log("Aucun document actif trouvé avec les filtres appliqués");
      return [];
    }

    // Recherche par mots-clés si demandée
    if (filters?.searchMode === "keyword" || filters?.searchMode === "hybrid") {
      return await searchByKeywords(filters.keywords || "", activeDocumentIds, finalConfig, filters.searchMode === "hybrid" ? queryEmbedding : undefined);
    }

    // Recherche vectorielle classique
    // Récupérer tous les chunks depuis Firestore
    // Note: Pour de grandes collections, il faudrait utiliser une base vectorielle dédiée
    const chunksSnapshot = await adminDb
      .collection("rag_chunks")
      .get();

    const results: SearchResult[] = [];

    for (const doc of chunksSnapshot.docs) {
      const chunkData = doc.data() as DocumentChunk;
      
      // Filtrer uniquement les chunks des documents actifs
      if (!activeDocumentIds.has(chunkData.metadata.documentId)) {
        continue;
      }
      
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
 * Recherche par mots-clés dans le contenu des chunks
 */
export async function searchByKeywords(
  keywords: string,
  activeDocumentIds: Set<string>,
  config: RAGConfig,
  queryEmbedding?: number[]
): Promise<SearchResult[]> {
  try {
    const keywordsLower = keywords.toLowerCase().split(/\s+/);
    const results: SearchResult[] = [];

    // Récupérer tous les chunks
    const chunksSnapshot = await adminDb
      .collection("rag_chunks")
      .get();

    for (const doc of chunksSnapshot.docs) {
      const chunkData = doc.data() as DocumentChunk;
      
      // Filtrer uniquement les chunks des documents actifs
      if (!activeDocumentIds.has(chunkData.metadata.documentId)) {
        continue;
      }

      const contentLower = chunkData.content.toLowerCase();
      
      // Calculer le score basé sur le nombre de mots-clés trouvés
      let keywordScore = 0;
      for (const keyword of keywordsLower) {
        if (contentLower.includes(keyword)) {
          keywordScore += 1;
        }
      }
      
      // Normaliser le score (0 à 1)
      const normalizedScore = keywordsLower.length > 0 ? keywordScore / keywordsLower.length : 0;

      // Si recherche hybride, combiner avec score vectoriel
      if (queryEmbedding && chunkData.embedding && chunkData.embedding.length > 0) {
        const vectorScore = cosineSimilarity(queryEmbedding, chunkData.embedding);
        // Moyenne pondérée : 50% keyword, 50% vector
        const hybridScore = (normalizedScore * 0.5) + (vectorScore * 0.5);
        
        if (hybridScore >= config.minScore) {
          results.push({
            chunk: {
              ...chunkData,
              id: doc.id,
            },
            score: hybridScore,
          });
        }
      } else if (normalizedScore >= 0.3) { // Seuil plus bas pour recherche keyword pure
        results.push({
          chunk: {
            ...chunkData,
            id: doc.id,
          },
          score: normalizedScore,
        });
      }
    }

    // Trier par score décroissant et prendre les top-k
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, config.topK);
  } catch (error) {
    console.error("Erreur lors de la recherche par mots-clés:", error);
    throw new Error("Impossible d'effectuer la recherche par mots-clés");
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

