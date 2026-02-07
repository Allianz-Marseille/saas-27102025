/**
 * RAG Bob : recherche vectorielle Firestore (collection bob_knowledge).
 * Utilise OpenAI text-embedding-3-small pour la requête puis findNearest sur Firestore.
 * Fallback sur loadBobKnowledge() si findNearest indisponible ou en erreur.
 */

const COLLECTION = "bob_knowledge";
const EMBEDDING_FIELD = "embedding";
const EMBEDDING_MODEL = "text-embedding-3-small";
const TOP_K = 8;

/** Mots-clés métiers : si présents dans le message, on priorise les fiches ro_* dans les résultats. */
const METIER_KEYWORDS = [
  "dentiste", "sage-femme", "médecin", "kiné", "infirmier", "orthophoniste", "pharmacien", "vétérinaire",
  "expert-comptable", "commissaire aux comptes", "avocat", "notaire", "architecte", "ingénieur", "psychologue",
  "agent général", "assurance", "carmf", "carpimko", "carcdsf", "cavec", "cnbf", "cavp", "carpv", "cipav", "ssi",
];

export interface BobRagChunk {
  title: string;
  content: string;
}

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
 * Récupère les extraits les plus pertinents pour la question (TOP_K documents).
 * En cas d'erreur ou si findNearest n'existe pas : fallback sur loadBobKnowledge().
 */
export async function getBobRagContext(
  userMessage: string,
  openai: import("openai").default
): Promise<BobRagChunk[]> {
  if (!userMessage?.trim()) return [];

  const { adminDb } = await import("@/lib/firebase/admin-config");
  const coll = adminDb.collection(COLLECTION);

  const queryVector = await getQueryEmbedding(userMessage.trim(), openai);

  type VectorQuery = { get: () => Promise<{ forEach: (cb: (doc: { data: () => Record<string, unknown> }) => void) => void }> };
  const collWithVector = coll as typeof coll & { findNearest?: (opts: { vectorField: string; queryVector: number[]; limit: number; distanceMeasure: string }) => VectorQuery };

  if (typeof collWithVector.findNearest !== "function") {
    console.warn("Bob RAG: findNearest non disponible, fallback base statique");
    const { loadBobKnowledge } = await import("@/lib/assistant/knowledge-loader");
    const full = loadBobKnowledge();
    if (!full) return [];
    return [{ title: "bob (base complète)", content: full }];
  }

  try {
    const vectorQuery = collWithVector.findNearest({
      vectorField: EMBEDDING_FIELD,
      queryVector,
      limit: TOP_K,
      distanceMeasure: "COSINE",
    });

    const snapshot = await vectorQuery.get();
    const chunks: BobRagChunk[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data?.title != null && data?.content != null) {
        chunks.push({
          title: String(data.title),
          content: String(data.content),
        });
      }
    });

    // Prioriser les fiches ro_* lorsque l'utilisateur mentionne un métier (bilan TNS / caisse RO).
    const msgLower = userMessage.toLowerCase();
    const mentionsMetier = METIER_KEYWORDS.some((k) => msgLower.includes(k));
    if (mentionsMetier && chunks.length > 1) {
      chunks.sort((a, b) => {
        const aRo = a.title.startsWith("ro_") ? 1 : 0;
        const bRo = b.title.startsWith("ro_") ? 1 : 0;
        return bRo - aRo; // ro_ en premier
      });
    }

    return chunks;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Bob RAG: findNearest échoué (", msg, "), fallback base statique");
    const { loadBobKnowledge } = await import("@/lib/assistant/knowledge-loader");
    const full = loadBobKnowledge();
    if (!full) return [];
    return [{ title: "bob (base complète)", content: full }];
  }
}

/**
 * Formate les chunks RAG pour injection dans le prompt (sourçage bob/ ou bob/ro/).
 */
export function formatBobRagContext(chunks: BobRagChunk[]): string {
  if (chunks.length === 0) return "";
  return chunks
    .map((c) => {
      const path = c.title.startsWith("ro_") ? `bob/ro/${c.title.slice(3)}.md` : `bob/${c.title}.md`;
      return `## Source : ${path}\n\n${c.content}`;
    })
    .join("\n\n---\n\n");
}
