/**
 * Utilitaires pour générer des embeddings avec OpenAI
 */

import OpenAI from "openai";
import { DocumentChunk } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Génère un embedding pour un texte donné
 */
export async function generateEmbedding(
  text: string,
  model: string = "text-embedding-3-small"
): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Erreur lors de la génération d'embedding:", error);
    throw new Error("Impossible de générer l'embedding");
  }
}

/**
 * Génère des embeddings pour plusieurs textes en batch
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  model: string = "text-embedding-3-small"
): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model,
      input: texts,
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    console.error("Erreur lors de la génération d'embeddings batch:", error);
    throw new Error("Impossible de générer les embeddings");
  }
}

/**
 * Découpe un texte en chunks de taille raisonnable
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    const wordLength = word.length + 1; // +1 pour l'espace

    if (currentLength + wordLength > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));
      
      // Overlap : garder les derniers mots pour la continuité
      const overlapWords = currentChunk.slice(-overlap);
      currentChunk = overlapWords;
      currentLength = overlapWords.join(" ").length;
    }

    currentChunk.push(word);
    currentLength += wordLength;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks.filter((chunk) => chunk.trim().length > 0);
}

