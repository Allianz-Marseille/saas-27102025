/**
 * Génération d'embeddings pour le RAG.
 * En attente de migration vers Gemini — stub qui lance une erreur si appelé.
 */

const MIGRATION_MSG = "Embeddings en migration vers Gemini. Ingestion suspendue.";

/**
 * Génère un embedding pour un bloc de texte.
 * Sera réimplémenté avec l'API Gemini.
 */
export async function generateEmbedding(
  _text: string,
  _client?: unknown
): Promise<number[]> {
  throw new Error(MIGRATION_MSG);
}
