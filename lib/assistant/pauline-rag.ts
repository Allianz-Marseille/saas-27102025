/**
 * RAG Pauline : moteur hybride (vectoriel + documents obligatoires par thème).
 * Norme commune : runHybridRag + config + fallback.
 */

import type { RagChunk } from "@/lib/assistant/rag-engine-core";
import { runHybridRag } from "@/lib/assistant/rag-engine-core";
import { PAULINE_RAG_CONFIG } from "@/lib/assistant/bot-configs";

export type PaulineRagChunk = RagChunk;

/**
 * Récupère les extraits pertinents via le RAG hybride (thèmes bonus, personnes_morales).
 * Fallback base statique si findNearest indisponible ou en erreur.
 */
export async function getPaulineRagContext(
  userMessage: string,
  openai: import("openai").default
): Promise<PaulineRagChunk[]> {
  if (!userMessage?.trim()) return [];

  try {
    return await runHybridRag(PAULINE_RAG_CONFIG, userMessage, openai);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Pauline RAG: runHybridRag échoué (", msg, "), fallback base statique");
    const { loadPaulineKnowledge } = await import("@/lib/assistant/knowledge-loader");
    const full = loadPaulineKnowledge();
    if (!full) return [];
    return [
      {
        docId: "pauline-fallback",
        title: "pauline (base complète)",
        content: full,
      },
    ];
  }
}

/**
 * Formate les chunks RAG pour injection dans le prompt système (avec titre pour sourçage).
 */
export function formatPaulineRagContext(chunks: PaulineRagChunk[]): string {
  if (chunks.length === 0) return "";
  return chunks
    .map((c) => `## Source : pauline/${c.title}.md\n\n${c.content}`)
    .join("\n\n---\n\n");
}
