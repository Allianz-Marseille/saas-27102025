/**
 * Client Qdrant pour la gestion de la base de données vectorielle
 */

import { QdrantClient as QdrantClientSDK } from "@qdrant/js-client-rest";
import { ragConfig } from "@/lib/config/rag-config";
import type { QdrantPoint, SearchResult } from "./types";

let qdrantClient: QdrantClientSDK | null = null;

/**
 * Initialise et retourne le client Qdrant
 */
export function getQdrantClient(): QdrantClientSDK {
  if (!qdrantClient) {
    const { url, apiKey } = ragConfig.qdrant;

    if (!url || !apiKey) {
      throw new Error(
        "Configuration Qdrant manquante. Veuillez définir QDRANT_URL et QDRANT_API_KEY dans vos variables d'environnement."
      );
    }

    qdrantClient = new QdrantClientSDK({
      url,
      apiKey,
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
      // Créer la collection avec la dimension des embeddings OpenAI
      // text-embedding-3-small = 1536 dimensions
      // text-embedding-ada-002 = 1536 dimensions
      await client.createCollection(collectionName, {
        vectors: {
          size: 1536, // Dimension des embeddings OpenAI
          distance: "Cosine", // Distance cosinus pour la similarité
        },
      });

      console.log(`Collection "${collectionName}" créée avec succès`);
    }
  } catch (error) {
    console.error("Erreur lors de la création de la collection:", error);
    throw new Error(
      `Impossible de créer la collection Qdrant: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Ajoute ou met à jour des vecteurs dans Qdrant
 */
export async function upsertVectors(
  points: QdrantPoint[]
): Promise<void> {
  const client = getQdrantClient();
  const collectionName = ragConfig.qdrant.collectionName;

  try {
    await client.upsert(collectionName, {
      wait: true, // Attendre que l'opération soit terminée
      points: points.map((point) => ({
        id: point.id,
        vector: point.vector,
        payload: point.payload,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de l'upsert des vecteurs:", error);
    throw new Error(
      `Impossible d'ajouter les vecteurs dans Qdrant: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Recherche vectorielle dans Qdrant
 */
export async function searchVectors(
  queryVector: number[],
  limit: number = ragConfig.search.limit,
  scoreThreshold: number = ragConfig.search.scoreThreshold
): Promise<SearchResult[]> {
  const client = getQdrantClient();
  const collectionName = ragConfig.qdrant.collectionName;

  try {
    const searchResult = await client.search(collectionName, {
      vector: queryVector,
      limit,
      score_threshold: scoreThreshold,
    });

    return searchResult.map((result) => ({
      id: result.id as string,
      score: result.score,
      text: result.payload?.text as string,
      documentId: result.payload?.documentId as string,
      filename: result.payload?.filename as string,
      fileType: result.payload?.fileType as "pdf" | "image",
      metadata: result.payload?.metadata as Record<string, unknown> | undefined,
    }));
  } catch (error) {
    console.error("Erreur lors de la recherche vectorielle:", error);
    throw new Error(
      `Impossible de rechercher dans Qdrant: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Supprime des vecteurs de Qdrant
 */
export async function deleteVectors(
  pointIds: string[]
): Promise<void> {
  const client = getQdrantClient();
  const collectionName = ragConfig.qdrant.collectionName;

  try {
    await client.delete(collectionName, {
      wait: true,
      points: pointIds,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression des vecteurs:", error);
    throw new Error(
      `Impossible de supprimer les vecteurs de Qdrant: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Supprime tous les vecteurs d'un document
 */
export async function deleteDocumentVectors(
  documentId: string
): Promise<void> {
  const client = getQdrantClient();
  const collectionName = ragConfig.qdrant.collectionName;

  try {
    // Rechercher tous les points du document
    const scrollResult = await client.scroll(collectionName, {
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
      limit: 10000, // Limite maximale
    });

    if (scrollResult.points && scrollResult.points.length > 0) {
      const pointIds = scrollResult.points.map((point) => point.id as string);
      await deleteVectors(pointIds);
    }
  } catch (error) {
    console.error("Erreur lors de la suppression des vecteurs du document:", error);
    throw new Error(
      `Impossible de supprimer les vecteurs du document: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

