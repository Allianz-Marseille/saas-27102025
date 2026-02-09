/**
 * Génération d'embeddings OpenAI pour la base de connaissance RAG.
 * Partagée par ingest et enrich pour garantir la cohérence vectorielle.
 */

import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_INPUT_MAX_CHARS = 8_000;

export async function generateEmbedding(text: string, openai: OpenAI): Promise<number[]> {
  const input = text.slice(0, EMBEDDING_INPUT_MAX_CHARS);
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  });
  const embedding = response.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Réponse embedding OpenAI invalide");
  }
  return embedding;
}
