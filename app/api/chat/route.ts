/**
 * API Route Chat IA — Architecture « Bots Outils »
 *
 * Passerelle sécurisée : reçoit botId + message (+ history, attachments).
 * Utilise getBotContext(botId) pour charger le contexte Markdown et pilote Gemini 1.5 Pro
 * avec Vision pour images Lagon/Liasses.
 */

import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";
import { getAdminDbOrNull, Timestamp } from "@/lib/firebase/admin-config";
import { getBotRegistryEntry } from "@/lib/ai/bot-loader";
import { GoogleGenAI } from "@google/genai";
import type { BotSessionMetadata } from "@/types/bot";

const GEMINI_MODEL = "gemini-2.0-flash";

/**
 * Construit le contexte metadata optionnel pour l'agent (si dossier client ouvert).
 */
function buildMetadataContext(metadata?: BotSessionMetadata | null): string {
  if (!metadata) return "";
  const parts: string[] = ["[Metadata Session]"];
  if (metadata.client_id) parts.push(`client_id: ${metadata.client_id}`);
  if (metadata.uid_collaborateur)
    parts.push(`uid_collaborateur: ${metadata.uid_collaborateur}`);
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
 */
async function saveMessageToFirestore(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  extra?: { botId?: string }
): Promise<void> {
  try {
    const db = getAdminDbOrNull();
    if (!db) return;
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
 * Transforme l'historique + message courant en contents Gemini.
 * Supporte les attachments (images base64) pour Vision.
 */
function buildContents(
  history: Array<{ role: string; content: string }>,
  message: string,
  attachments?: Array<{ data?: string; mimeType: string; fileType?: string }>
): Array<{ role: "user" | "model"; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> {
  const contents: Array<{
    role: "user" | "model";
    parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
  }> = [];

  for (const msg of history) {
    const role = msg.role === "assistant" ? "model" : "user";
    contents.push({
      role,
      parts: [{ text: msg.content }],
    });
  }

  const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: message },
  ];

  if (attachments?.length) {
    for (const att of attachments) {
      if (att.data && att.mimeType) {
        userParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data,
          },
        });
      }
    }
  }

  contents.push({ role: "user", parts: userParts });
  return contents;
}

export function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    },
  });
}

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
 * Body: { message, botId, history?, attachments?, metadata? }
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
    const history = Array.isArray(body.history)
      ? (body.history as Array<{ role: string; content: string }>)
      : [];
    const rawAttachments = Array.isArray(body.attachments)
      ? body.attachments
      : [];
    const attachments = rawAttachments
      .filter(
        (a): a is { data?: string; mimeType: string; fileType?: string } =>
          a && typeof a === "object" && typeof (a as { mimeType?: string }).mimeType === "string"
      )
      .map((a) => ({ data: a.data, mimeType: a.mimeType, fileType: a.fileType }));
    const metadata = body.metadata as BotSessionMetadata | undefined;

    if (!message.trim() || !botId) {
      return new Response(
        JSON.stringify({ error: "message et botId sont requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const registryEntry = getBotRegistryEntry(botId);
    if (!registryEntry) {
      return new Response(
        JSON.stringify({ error: `Bot inconnu: ${botId}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "GEMINI_API_KEY non configurée. Définissez-la dans .env.local.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const { getBotContext } = await import("@/lib/ai/bot-loader");
    let systemInstruction = getBotContext(botId);

    const metadataContext = buildMetadataContext(metadata);
    if (metadataContext) {
      systemInstruction += `\n\n${metadataContext}`;
    }

    const sessionId = metadata?.client_id ?? `standalone-${auth.userId}-${botId}`;
    await saveMessageToFirestore(sessionId, "user", message, { botId });

    const ai = new GoogleGenAI({ apiKey });
    const contents = buildContents(history, message, attachments);

    const stream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
      },
    });

    let fullContent = "";
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text ?? "";
            if (text) {
              fullContent += text;
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          console.error("Erreur stream Gemini:", err);
          controller.error(err);
        }
      },
    });

    (async () => {
      await saveMessageToFirestore(sessionId, "assistant", fullContent, {
        botId,
      });
    })();

    return new Response(readable, {
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
