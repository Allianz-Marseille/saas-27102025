/**
 * API Route Chat IA — Architecture « Bots Outils »
 *
 * Passerelle sécurisée : reçoit botId + message. En attente de migration vers Gemini,
 * retourne un message de dégradation gracieuse. Historique Firestore (optionnel) : conversations/{sessionId}/messages.
 */

import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";
import { getAdminDbOrNull, Timestamp } from "@/lib/firebase/admin-config";
import { getBotConfig } from "@/lib/config/agents";
import type { BotSessionMetadata } from "@/types/bot";

const MIGRATION_MESSAGE =
  "Les assistants IA sont en cours de migration vers Gemini. Réessayez ultérieurement.";

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
 * Sauvegarde un message dans Firestore si disponible.
 * Ne bloque pas si Firebase est indisponible.
 */
async function saveMessageToFirestore(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  extra?: { botId?: string }
): Promise<void> {
  try {
    const db = getAdminDbOrNull();
    if (!db) {
      console.warn("Firestore non disponible, message non persisté");
      return;
    }
    const ref = db
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
    console.error("Firebase fail — message non persisté:", error);
  }
}

/**
 * OPTIONS /api/chat — preflight CORS (requis quand en-tête Authorization).
 */
export function OPTIONS(request: NextRequest) {
  const origin =
    request.headers.get("origin") ?? new URL(request.url).origin;
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/**
 * GET /api/chat — non supporté.
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
 * En attente de migration vers Gemini : retourne un message de dégradation gracieuse en stream.
 */
export async function POST(request: NextRequest) {
  console.log("Démarrage de la route /api/chat");

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

    const sessionId =
      metadata?.client_id ?? `standalone-${auth.userId}-${botId}`;

    await saveMessageToFirestore(sessionId, "user", message, { botId });

    // Stub : migration vers Gemini en cours — retourner le message en stream
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(MIGRATION_MESSAGE));
        controller.close();
      },
    });

    (async () => {
      await saveMessageToFirestore(sessionId, "assistant", MIGRATION_MESSAGE, { botId });
    })();

    return new Response(stream, {
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
