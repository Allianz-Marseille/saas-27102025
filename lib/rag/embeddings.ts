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
 * Génère un embedding pour un texte donné
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();
  const model = ragConfig.openai.embeddingModel;

  try {
    // Nettoyer le texte (supprimer les espaces multiples, etc.)
    const cleanedText = text.trim().replace(/\s+/g, " ");

    if (!cleanedText) {
      throw new Error("Le texte ne peut pas être vide");
    }

    const response = await client.embeddings.create({
      model,
      input: cleanedText,
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding) {
      throw new Error("Aucun embedding retourné par OpenAI");
    }

    return embedding;
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
  const model = ragConfig.openai.embeddingModel;

  try {
    // Filtrer les textes vides
    const validTexts = texts
      .map((text) => text.trim().replace(/\s+/g, " "))
      .filter((text) => text.length > 0);

    if (validTexts.length === 0) {
      throw new Error("Aucun texte valide fourni");
    }

    const response = await client.embeddings.create({
      model,
      input: validTexts,
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    console.error("Erreur lors de la génération des embeddings en batch:", error);
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
    // Test simple avec un petit embedding
    await client.embeddings.create({
      model: ragConfig.openai.embeddingModel,
      input: "test",
    });
    return true;
  } catch (error) {
    console.error("Erreur de connexion à OpenAI:", error);
    return false;
  }
}

