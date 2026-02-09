/**
 * RAG Bob : moteur hybride (vectoriel + documents obligatoires par thème).
 * Norme commune : runHybridRag + config (tri ro_* si métier mentionné) + fallback.
 */

import type { RagChunk } from "@/lib/assistant/rag-engine-core";
import { runHybridRag } from "@/lib/assistant/rag-engine-core";
import { BOB_RAG_CONFIG } from "@/lib/assistant/bot-configs";

export type BobRagChunk = RagChunk;

/**
 * Récupère les extraits pertinents via le RAG hybride.
 * Fallback base statique si findNearest indisponible ou en erreur.
 */
export async function getBobRagContext(
  userMessage: string,
  openai: import("openai").default
): Promise<BobRagChunk[]> {
  if (!userMessage?.trim()) return [];

  try {
    return await runHybridRag(BOB_RAG_CONFIG, userMessage, openai);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Bob RAG: runHybridRag échoué (", msg, "), fallback base statique");
    const { loadBobKnowledge } = await import("@/lib/assistant/knowledge-loader");
    const full = loadBobKnowledge();
    if (!full) return [];
    return [
      {
        docId: "bob-fallback",
        title: "bob (base complète)",
        content: full,
      },
    ];
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
