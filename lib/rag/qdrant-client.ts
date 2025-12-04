/**
 * Client Qdrant pour la base de données vectorielle
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import { ragConfig } from "@/lib/config/rag-config";
import type { QdrantPoint, SearchResult } from "./types";

let qdrantClient: QdrantClient | null = null;

/**
 * Retry avec backoff exponentiel
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[Qdrant] Tentative ${attempt + 1}/${maxRetries} échouée, retry dans ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Erreur inconnue lors du retry");
}

/**
 * Log structuré pour Qdrant
 */
function logQdrant(operation: string, data?: Record<string, unknown>) {
  console.log(`[Qdrant] ${operation}`, data || {});
}

/**
 * Initialise et retourne le client Qdrant
 */
export function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    if (!ragConfig.qdrant.url || !ragConfig.qdrant.apiKey) {
      throw new Error("Configuration Qdrant manquante. Vérifiez QDRANT_URL et QDRANT_API_KEY.");
    }

    qdrantClient = new QdrantClient({
      url: ragConfig.qdrant.url,
      apiKey: ragConfig.qdrant.apiKey,
    });
  }

  return qdrantClient;
}

/**
 * Vérifie la santé de la connexion à Qdrant
 */
export async function checkQdrantHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    const client = getQdrantClient();
    await client.getCollections();
    const latency = Date.now() - startTime;
    logQdrant("Health check réussi", { latency });
    return { healthy: true, latency };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    logQdrant("Health check échoué", { latency, error: errorMessage });
    return { healthy: false, latency, error: errorMessage };
  }
}

/**
 * Vérifie la connexion à Qdrant (alias pour compatibilité)
 */
export async function checkQdrantConnection(): Promise<boolean> {
  const health = await checkQdrantHealth();
  return health.healthy;
}

/**
 * Crée la collection si elle n'existe pas
 */
export async function createCollectionIfNotExists(): Promise<void> {
  const client = getQdrantClient();
  const collectionName = ragConfig.qdrant.collectionName;
  const startTime = Date.now();

  try {
    logQdrant("Vérification collection", { collectionName });
    
    // Vérifier si la collection existe avec retry
    const collections = await retryWithBackoff(async () => {
      return await client.getCollections();
    });
    
    const exists = collections.collections.some(
      (col) => col.name === collectionName
    );

    if (!exists) {
      logQdrant("Création collection", { collectionName });
      // Créer la collection avec la dimension des embeddings OpenAI text-embedding-3-small (1536)
      await retryWithBackoff(async () => {
      await client.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: "Cosine",
        },
      });
      });
      const creationTime = Date.now() - startTime;
      logQdrant("Collection créée", { collectionName, creationTime });
    } else {
      const checkTime = Date.now() - startTime;
      logQdrant("Collection existe déjà", { collectionName, checkTime });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    logQdrant("Erreur création collection", { collectionName, error: errorMessage });
    throw new Error(`Erreur lors de la création de la collection: ${errorMessage}`);
  }
}

/**
 * Ajoute ou met à jour des vecteurs dans Qdrant
 */
export async function upsertVectors(points: QdrantPoint[]): Promise<void> {
  const client = getQdrantClient();
  const collectionName = ragConfig.qdrant.collectionName;
  const startTime = Date.now();

  try {
    logQdrant("Upsert vecteurs", { pointsCount: points.length, collectionName });
    
    await retryWithBackoff(async () => {
    await client.upsert(collectionName, {
      wait: true,
      points: points.map((point) => ({
        id: point.id,
        vector: point.vector,
        payload: point.payload,
      })),
    });
    });

    const upsertTime = Date.now() - startTime;
    logQdrant("Vecteurs upsertés", { pointsCount: points.length, upsertTime });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    logQdrant("Erreur upsert vecteurs", { pointsCount: points.length, error: errorMessage });
    throw new Error(`Erreur lors de l'upsert des vecteurs: ${errorMessage}`);
  }
}

/**
 * Recherche vectorielle dans Qdrant
 */
export async function searchVectors(
  queryVector: number[],
  limit: number = ragConfig.search.limit
): Promise<SearchResult[]> {
  const client = getQdrantClient();
  const collectionName = ragConfig.qdrant.collectionName;
  const startTime = Date.now();

  try {
    logQdrant("Recherche vectorielle", { limit, collectionName });
    
    const results = await retryWithBackoff(async () => {
      return await client.search(collectionName, {
      vector: queryVector,
      limit,
      score_threshold: ragConfig.search.scoreThreshold,
    });
    });

    const searchTime = Date.now() - startTime;
    logQdrant("Recherche terminée", { resultsCount: results.length, searchTime });

    return results.map((result) => ({
      id: result.id as string,
      score: result.score,
      text: result.payload?.text as string,
      documentId: result.payload?.documentId as string,
      filename: result.payload?.filename as string,
      fileType: result.payload?.fileType as "pdf" | "image",
      metadata: result.payload?.metadata as Record<string, unknown>,
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    logQdrant("Erreur recherche vectorielle", { error: errorMessage });
    throw new Error(`Erreur lors de la recherche vectorielle: ${errorMessage}`);
  }
}

/**
 * Supprime les vecteurs d'un document
 */
export async function deleteDocumentVectors(documentId: string): Promise<void> {
  const client = getQdrantClient();
  const collectionName = ragConfig.qdrant.collectionName;
  const startTime = Date.now();

  try {
    logQdrant("Suppression vecteurs document", { documentId, collectionName });
    
    // Supprimer tous les points avec ce documentId dans le payload
    await retryWithBackoff(async () => {
    await client.delete(collectionName, {
      wait: true,
      filter: {
        must: [
          {
            key: "documentId",
            match: {
              value: documentId,
            },
          },
        ],
      },
    });
    });

    const deleteTime = Date.now() - startTime;
    logQdrant("Vecteurs supprimés", { documentId, deleteTime });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    logQdrant("Erreur suppression vecteurs", { documentId, error: errorMessage });
    throw new Error(`Erreur lors de la suppression des vecteurs: ${errorMessage}`);
  }
}

