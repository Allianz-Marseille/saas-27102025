/**
 * Service pour générer les embeddings avec OpenAI
 */

import OpenAI from "openai";
import { ragConfig } from "@/lib/config/rag-config";

let openaiClient: OpenAI | null = null;

/**
 * Initialise et retourne le client OpenAI
 */
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
 * Génère un embedding pour un texte
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  try {
    const response = await client.embeddings.create({
      model: ragConfig.openai.embeddingModel,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Erreur lors de la génération de l'embedding:", error);
    throw new Error(
      `Impossible de générer l'embedding: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Génère des embeddings pour plusieurs textes en batch
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  const client = getOpenAIClient();

  try {
    const response = await client.embeddings.create({
      model: ragConfig.openai.embeddingModel,
      input: texts,
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    console.error("Erreur lors de la génération des embeddings batch:", error);
    throw new Error(
      `Impossible de générer les embeddings: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Vérifie la connexion à OpenAI
 */
export async function checkOpenAIConnection(): Promise<boolean> {
  try {
    const client = getOpenAIClient();
    await client.models.list();
    return true;
  } catch (error) {
    console.error("Erreur de connexion à OpenAI:", error);
    return false;
  }
}

