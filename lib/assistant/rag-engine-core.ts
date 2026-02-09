/**
 * Moteur RAG hybride commun : fusion vectoriel + documents obligatoires par thème,
 * déduplication par docId, limite de chunks. Norme pour tous les bots (actuels et à venir).
 */

export interface RagChunk {
  docId: string;
  title: string;
  content: string;
}

export interface ThemeConfig {
  id: string;
  keywords: string[];
  mandatoryDocIds: string[];
}

/** Config minimale pour exécuter le RAG hybride (sans botId). */
export interface HybridRagConfig {
  firestoreCollection: string;
  embeddingModel: string;
  embeddingField: string;
  topK: number;
  maxChunksTotal: number;
  themes: ThemeConfig[];
  sortChunks?: (chunks: RagChunk[], userMessage: string) => RagChunk[];
}

/**
 * Détecte les thèmes activés par le message utilisateur (mots-clés en minuscules).
 * Retourne la liste des ids de thèmes dont au moins un keyword est présent dans le message.
 */
export function detectThemes(userMessage: string, themes: ThemeConfig[]): string[] {
  const lower = userMessage.toLowerCase().trim();
  if (!lower) return [];
  const activated: string[] = [];
  for (const theme of themes) {
    const hasMatch = theme.keywords.some((k) => lower.includes(k.toLowerCase()));
    if (hasMatch) activated.push(theme.id);
  }
  return activated;
}

/**
 * Fusionne les chunks vectoriels et obligatoires, déduplique par docId, limite le nombre total.
 * Ordre : d'abord les obligatoires (dans l'ordre fourni), puis les vectoriels non déjà présents.
 */
export function mergeAndDedupe(
  vectorChunks: RagChunk[],
  mandatoryChunks: RagChunk[],
  maxChunks: number
): RagChunk[] {
  const seen = new Set<string>();
  const result: RagChunk[] = [];

  for (const chunk of mandatoryChunks) {
    if (result.length >= maxChunks) break;
    if (seen.has(chunk.docId)) continue;
    seen.add(chunk.docId);
    result.push(chunk);
  }

  for (const chunk of vectorChunks) {
    if (result.length >= maxChunks) break;
    if (seen.has(chunk.docId)) continue;
    seen.add(chunk.docId);
    result.push(chunk);
  }

  return result;
}

/** Type minimal pour une collection Firestore (doc().get() et findNearest). */
interface FirestoreCollectionRef {
  doc(id: string): { get(): Promise<{ exists: boolean; data: () => Record<string, unknown> }> };
}

type VectorQuery = {
  get: () => Promise<{
    forEach: (cb: (doc: { id: string; data: () => Record<string, unknown> }) => void) => void;
  }>;
};

async function getQueryEmbedding(
  text: string,
  openai: import("openai").default,
  model: string
): Promise<number[]> {
  const response = await openai.embeddings.create({
    model,
    input: text.slice(0, 8_000),
  });
  const embedding = response.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Réponse embedding OpenAI invalide");
  }
  return embedding;
}

async function fetchDocById(
  collection: FirestoreCollectionRef,
  docId: string
): Promise<RagChunk | null> {
  const snap = await collection.doc(docId).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (data?.title == null || data?.content == null) return null;
  return {
    docId,
    title: String(data.title),
    content: String(data.content),
  };
}

/**
 * Exécute le RAG hybride : vectoriel (findNearest) + documents obligatoires des thèmes détectés,
 * fusion, déduplication par docId, limite maxChunksTotal, tri optionnel.
 * Lance une erreur si findNearest est indisponible ou en échec — le appelant gère le fallback.
 */
export async function runHybridRag(
  config: HybridRagConfig,
  userMessage: string,
  openai: import("openai").default
): Promise<RagChunk[]> {
  const trimmed = userMessage.trim();
  if (!trimmed) return [];

  const { adminDb } = await import("@/lib/firebase/admin-config");
  const coll = adminDb.collection(config.firestoreCollection) as FirestoreCollectionRef & {
    findNearest?: (opts: {
      vectorField: string;
      queryVector: number[];
      limit: number;
      distanceMeasure: string;
    }) => VectorQuery;
  };

  if (typeof coll.findNearest !== "function") {
    throw new Error("findNearest non disponible");
  }

  const queryVector = await getQueryEmbedding(trimmed, openai, config.embeddingModel);
  const vectorQuery = coll.findNearest({
    vectorField: config.embeddingField,
    queryVector,
    limit: config.topK,
    distanceMeasure: "COSINE",
  });

  const snapshot = await vectorQuery.get();
  const vectorChunks: RagChunk[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data?.title != null && data?.content != null) {
      vectorChunks.push({
        docId: doc.id,
        title: String(data.title),
        content: String(data.content),
      });
    }
  });

  const themeIds = detectThemes(trimmed, config.themes);
  const mandatoryDocIdsSet = new Set<string>();
  for (const theme of config.themes) {
    if (themeIds.includes(theme.id)) {
      for (const id of theme.mandatoryDocIds) mandatoryDocIdsSet.add(id);
    }
  }

  const vectorDocIds = new Set(vectorChunks.map((c) => c.docId));
  const mandatoryChunks: RagChunk[] = [];
  for (const docId of mandatoryDocIdsSet) {
    if (vectorDocIds.has(docId)) continue;
    const chunk = await fetchDocById(coll, docId);
    if (chunk) mandatoryChunks.push(chunk);
  }

  let merged = mergeAndDedupe(vectorChunks, mandatoryChunks, config.maxChunksTotal);
  if (config.sortChunks) {
    merged = config.sortChunks(merged, userMessage);
  }
  return merged;
}
