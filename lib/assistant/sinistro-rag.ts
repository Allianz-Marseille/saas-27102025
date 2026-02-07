/**
 * RAG Sinistro : recherche vectorielle Firestore (collection sinistro_knowledge).
 * Utilise OpenAI text-embedding-3-small pour la requête puis findNearest sur Firestore.
 */

const COLLECTION = "sinistro_knowledge";
const EMBEDDING_FIELD = "embedding";
const EMBEDDING_MODEL = "text-embedding-3-small";
const TOP_K = 3;

export interface SinistroRagChunk {
  title: string;
  content: string;
}

/**
 * Génère l'embedding de la requête via OpenAI.
 */
async function getQueryEmbedding(text: string, openai: import("openai").default): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8_000),
  });
  const embedding = response.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Réponse embedding OpenAI invalide");
  }
  return embedding;
}

/**
 * Récupère les extraits les plus pertinents pour la question (3 documents).
 * Retourne un tableau de { title, content } pour injection dans le prompt.
 */
export async function getSinistroRagContext(
  userMessage: string,
  openai: import("openai").default
): Promise<SinistroRagChunk[]> {
  if (!userMessage?.trim()) return [];

  const { adminDb } = await import("@/lib/firebase/admin-config");
  const coll = adminDb.collection(COLLECTION);

  const queryVector = await getQueryEmbedding(userMessage.trim(), openai);

  type VectorQuery = { get: () => Promise<{ forEach: (cb: (doc: { data: () => Record<string, unknown> }) => void) => void }> };
  const collWithVector = coll as typeof coll & { findNearest?: (opts: { vectorField: string; queryVector: number[]; limit: number; distanceMeasure: string }) => VectorQuery };

  if (typeof collWithVector.findNearest !== "function") {
    console.warn("Sinistro RAG: findNearest non disponible, fallback base statique");
    const { loadSinistroKnowledge } = await import("@/lib/assistant/knowledge-loader");
    const full = loadSinistroKnowledge();
    if (!full) return [];
    return [{ title: "sinistro (base complète)", content: full }];
  }

  const vectorQuery = collWithVector.findNearest({
    vectorField: EMBEDDING_FIELD,
    queryVector,
    limit: TOP_K,
    distanceMeasure: "COSINE",
  });

  const snapshot = await vectorQuery.get();
  const chunks: SinistroRagChunk[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data?.title != null && data?.content != null) {
      chunks.push({
        title: String(data.title),
        content: String(data.content),
      });
    }
  });

  return chunks;
}

/**
 * Formate les chunks RAG pour injection dans le prompt système (avec titre pour sourçage).
 */
export function formatSinistroRagContext(chunks: SinistroRagChunk[]): string {
  if (chunks.length === 0) return "";
  return chunks
    .map(
      (c) =>
        `## Source : sinistro/${c.title}.md\n\n${c.content}`
    )
    .join("\n\n---\n\n");
}
