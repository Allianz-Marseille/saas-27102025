/**
 * Client Qdrant pour la base de données vectorielle
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import { ragConfig } from "@/lib/config/rag-config";
import type { QdrantPoint, SearchResult } from "./types";

let qdrantClient: QdrantClient | null = null;

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
 * Vérifie la connexion à Qdrant
 */
export async function checkQdrantConnection(): Promise<boolean> {
  try {
    const client = getQdrantClient();
    await client.getCollections();
    return true;
  } catch (error) {
    console.error("Erreur de connexion à Qdrant:", error);
    return false;
  }
}

/**
 * Crée la collection si elle n'existe pas
 */
export async function createCollectionIfNotExists(): Promise<void> {
  const client = getQdrantClient();
  const collectionName = ragConfig.qdrant.collectionName;

  try {
    // Vérifier si la collection existe
    const collections = await client.getCollections();
    const exists = collections.collections.some(
      (col) => col.name === collectionName
    );

    if (!exists) {
      // Créer la collection avec la dimension des embeddings OpenAI text-embedding-3-small (1536)
      await client.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: "Cosine",
        },
      });
      console.log(`Collection "${collectionName}" créée avec succès.`);
    }
  } catch (error) {
    console.error("Erreur lors de la création de la collection:", error);
    throw error;
  }
}

/**
 * Ajoute ou met à jour des vecteurs dans Qdrant
 */
export async function upsertVectors(points: QdrantPoint[]): Promise<void> {
  const client = getQdrantClient();
  const collectionName = ragConfig.qdrant.collectionName;

  try {
    await client.upsert(collectionName, {
      wait: true,
      points: points.map((point) => ({
        id: point.id,
        vector: point.vector,
        payload: point.payload,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de l'upsert des vecteurs:", error);
    throw error;
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

  try {
    const results = await client.search(collectionName, {
      vector: queryVector,
      limit,
      score_threshold: ragConfig.search.scoreThreshold,
    });

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
    console.error("Erreur lors de la recherche vectorielle:", error);
    throw error;
  }
}

/**
 * Supprime les vecteurs d'un document
 */
export async function deleteDocumentVectors(documentId: string): Promise<void> {
  const client = getQdrantClient();
  const collectionName = ragConfig.qdrant.collectionName;

  try {
    // Supprimer tous les points avec ce documentId dans le payload
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
  } catch (error) {
    console.error("Erreur lors de la suppression des vecteurs:", error);
    throw error;
  }
}

