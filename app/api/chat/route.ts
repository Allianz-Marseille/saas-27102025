/**
 * API Route Chat IA — Architecture « Bots Outils »
 *
 * Passerelle sécurisée : reçoit botId + message, appelle l'agent Mistral correspondant en un seul appel.
 * Streaming maintenu. Historique Firestore : conversations/{sessionId}/messages.
 */

import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";
import { adminDb, Timestamp } from "@/lib/firebase/admin-config";
import { getBotConfig } from "@/lib/config/agents";
import type { BotSessionMetadata } from "@/types/bot";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

/**
 * Construit le contexte metadata optionnel pour l'agent (si dossier client ouvert).
 */
function buildMetadataContext(metadata?: BotSessionMetadata | null): string {
  if (!metadata) return "";
  const parts: string[] = ["[Metadata Session]"];
  if (metadata.client_id) parts.push(`client_id: ${metadata.client_id}`);
  if (metadata.uid_collaborateur) parts.push(`uid_collaborateur: ${metadata.uid_collaborateur}`);
  if (metadata.current_step) parts.push(`current_step: ${metadata.current_step}`);
  if (metadata.step_id) parts.push(`step_id: ${metadata.step_id}`);
  if (metadata.client_statut) parts.push(`client_statut: ${metadata.client_statut}`);
  if (metadata.has_uploaded_file) parts.push(`has_uploaded_file: true`);
  if (metadata.context_pro && Object.keys(metadata.context_pro).length > 0) {
    parts.push(`context_pro: ${JSON.stringify(metadata.context_pro)}`);
  }
  return parts.length > 1 ? parts.join("\n") : "";
}

/**
 * Sauvegarde un message dans Firestore.
 * sessionId = client_id si présent, sinon un id de session standalone (ex: uid_collaborateur + botId).
 */
async function saveMessageToFirestore(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  extra?: { botId?: string }
): Promise<void> {
  try {
    const ref = adminDb
      .collection("conversations")
      .doc(sessionId)
      .collection("messages");
    await ref.add({
      role,
      content,
      ...extra,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Erreur sauvegarde Firestore conversations:", error);
  }
}

/**
 * OPTIONS /api/chat — preflight CORS (requis si en-tête Authorization).
 * Sans cela, le navigateur reçoit 405 sur OPTIONS et bloque le POST.
 */
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/**
 * GET /api/chat — non supporté.
 * Cache-Control no-store évite qu'un CDN renvoie ce 405 pour des POST.
 */
export function GET() {
  return new Response(
    JSON.stringify({ error: "Méthode non autorisée. Utilisez POST." }),
    {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        Allow: "POST, OPTIONS",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

/**
 * POST /api/chat
 * Body: { message: string, botId: string, history?: Array<{role, content}>, metadata?: BotSessionMetadata }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid || !auth.userId) {
      return new Response(JSON.stringify({ error: auth.error ?? "Non autorisé" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Body JSON invalide ou vide" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const message = typeof body.message === "string" ? body.message : "";
    const botId = typeof body.botId === "string" ? body.botId : "";
    const history = Array.isArray(body.history) ? body.history : [];
    const metadata = body.metadata as BotSessionMetadata | undefined;

    if (!message.trim() || !botId) {
      return new Response(
        JSON.stringify({ error: "message et botId sont requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const botConfig = getBotConfig(botId);
    if (!botConfig) {
      return new Response(
        JSON.stringify({ error: `Bot inconnu: ${botId}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!botConfig.agentId) {
      return new Response(
        JSON.stringify({ error: `Agent Mistral non configuré pour le bot: ${botId}` }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!MISTRAL_API_KEY) {
      return new Response(
        JSON.stringify({ error: "MISTRAL_API_KEY manquante" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const sessionId =
      metadata?.client_id ?? `standalone-${auth.userId}-${botId}`;
    const metadataContext = buildMetadataContext(metadata);

    await saveMessageToFirestore(sessionId, "user", message, { botId });

    const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];
    if (metadataContext) {
      messages.push({ role: "system", content: metadataContext });
    }
    messages.push(
      ...history
        .filter((m): m is { role: string; content: string } => typeof m === "object" && m !== null && "role" in m && "content" in m)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: String(m.content ?? ""),
        })),
      { role: "user", content: message }
    );

    const requestBody: { agent_id: string; messages: unknown[]; stream?: boolean } = {
      agent_id: botConfig.agentId,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    };

    const streamResponse = await fetch("https://api.mistral.ai/v1/agents/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!streamResponse.ok) {
      const err = await streamResponse.text();
      return new Response(
        JSON.stringify({ error: `Mistral API error: ${streamResponse.status} ${err}` }),
        { status: streamResponse.status >= 500 ? 502 : 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const reader = streamResponse.body;
    if (!reader) {
      return new Response(
        JSON.stringify({ error: "Pas de stream disponible" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    let fullContent = "";
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              controller.enqueue(new TextEncoder().encode(delta));
            }
          } catch {
            // Ignorer les lignes mal formées
          }
        }
      },
      async flush() {
        await saveMessageToFirestore(sessionId, "assistant", fullContent, { botId });
      },
    });

    return new Response(reader.pipeThrough(new TextDecoderStream()).pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Erreur API chat:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erreur serveur",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
