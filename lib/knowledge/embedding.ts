/**
 * Génération d'embeddings via l'API OpenAI pour le RAG.
 */

import type OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small";

/**
 * Génère un embedding pour un bloc de texte.
 * Utilisé lors de l'ingestion de documents dans la base de connaissance.
 */
export async function generateEmbedding(
  text: string,
  openai: OpenAI
): Promise<number[]> {
  const truncated = text.slice(0, 8191);
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncated,
  });

  const embedding = response.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Réponse OpenAI embedding invalide");
  }

  return embedding as number[];
}
