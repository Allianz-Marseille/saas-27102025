/**
 * RAG Sinistro : moteur hybride (vectoriel + documents obligatoires par thème).
 * Norme commune : runHybridRag + config + fallback.
 */

import type { RagChunk } from "@/lib/assistant/rag-engine-core";
import { runHybridRag } from "@/lib/assistant/rag-engine-core";
import { SINISTRO_RAG_CONFIG } from "@/lib/assistant/bot-configs";

export type SinistroRagChunk = RagChunk;

/**
 * Récupère les extraits pertinents via le RAG hybride.
 * Fallback base statique si findNearest indisponible ou en erreur.
 */
export async function getSinistroRagContext(
  userMessage: string,
  openai: import("openai").default
): Promise<SinistroRagChunk[]> {
  if (!userMessage?.trim()) return [];

  try {
    return await runHybridRag(SINISTRO_RAG_CONFIG, userMessage, openai);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Sinistro RAG: runHybridRag échoué (", msg, "), fallback base statique");
    const { loadSinistroKnowledge } = await import("@/lib/assistant/knowledge-loader");
    const full = loadSinistroKnowledge();
    if (!full) return [];
    return [
      {
        docId: "sinistro-fallback",
        title: "sinistro (base complète)",
        content: full,
      },
    ];
  }
}

/**
 * Formate les chunks RAG pour injection dans le prompt système (avec titre pour sourçage).
 */
export function formatSinistroRagContext(chunks: SinistroRagChunk[]): string {
  if (chunks.length === 0) return "";
  return chunks
    .map((c) => `## Source : sinistro/${c.title}.md\n\n${c.content}`)
    .join("\n\n---\n\n");
}
