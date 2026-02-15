/**
 * API Route Chat IA - Standard bot-agent-ia-standard.md
 *
 * 1. Premier message : Big-Boss (Mistral Small) identifie l'intention
 * 2. Sélection de l'expert via AGENT_ROUTING_TABLE
 * 3. Streaming avec l'expert + injection des Metadata
 * 4. Sauvegarde Firestore : conversations/${client_id}/messages
 */

import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";
import { adminDb, Timestamp } from "@/lib/firebase/admin-config";
import {
  AGENT_ROUTING_TABLE,
  BIG_BOSS_MODEL,
  type IntentTag,
} from "@/lib/config/agents";
import type { BotSessionMetadata } from "@/types/bot";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const INTENT_REGEX = /INTENT:\s*(BILAN|VISION|SUIVI|GENERAL)/i;

/**
 * Récupère le prompt système du Big-Boss
 */
async function getBigBossPrompt(): Promise<string> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const promptPath = path.join(process.cwd(), "prompts", "big-boss.txt");
  return fs.readFile(promptPath, "utf-8");
}

/**
 * Extrait le tag d'intention de la réponse du Big-Boss
 */
function parseIntent(response: string): IntentTag {
  const match = response.trim().match(INTENT_REGEX);
  if (match) {
    return match[1].toUpperCase() as IntentTag;
  }
  return "GENERAL";
}

/**
 * Appelle le Big-Boss pour identifier l'intention (premier message uniquement)
 */
async function routeToIntent(
  userMessage: string,
  metadata: BotSessionMetadata
): Promise<IntentTag> {
  if (!MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY manquante");
  }
  const systemPrompt = await getBigBossPrompt();
  const metadataContext = `Contexte session: client_id=${metadata.client_id}, current_step=${metadata.current_step ?? "?"}`;

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: BIG_BOSS_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `${metadataContext}\n\nMessage utilisateur:\n${userMessage}`,
        },
      ],
      max_tokens: 20,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Big-Boss API error: ${response.status} ${err}`);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? "";
  return parseIntent(content);
}

/**
 * Construit le contexte Metadata pour l'expert
 */
function buildExpertContext(metadata: BotSessionMetadata): string {
  const parts: string[] = [
    `[Metadata Session]`,
    `client_id: ${metadata.client_id}`,
    `uid_collaborateur: ${metadata.uid_collaborateur}`,
  ];
  if (metadata.current_step) parts.push(`current_step: ${metadata.current_step}`);
  if (metadata.step_id) parts.push(`step_id: ${metadata.step_id}`);
  if (metadata.client_statut) parts.push(`client_statut: ${metadata.client_statut}`);
  if (metadata.has_uploaded_file) parts.push(`has_uploaded_file: true`);
  if (metadata.context_pro && Object.keys(metadata.context_pro).length > 0) {
    parts.push(`context_pro: ${JSON.stringify(metadata.context_pro)}`);
  }
  return parts.join("\n");
}

/**
 * Sauvegarde un message dans Firestore
 * Structure : conversations/${client_id}/messages (subcollection)
 * Chaque document : { role, content, intent?, createdAt }
 */
async function saveMessageToFirestore(
  clientId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: { intent?: string }
): Promise<void> {
  try {
    const ref = adminDb
      .collection("conversations")
      .doc(clientId)
      .collection("messages");
    await ref.add({
      role,
      content,
      ...metadata,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Erreur sauvegarde Firestore conversations:", error);
    // Ne pas faire échouer la requête si la sauvegarde échoue
  }
}

/**
 * POST /api/chat
 * Body: { message: string, metadata: BotSessionMetadata, isFirstMessage?: boolean, history?: Array<{role, content}> }
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

    const body = await request.json();
    const {
      message,
      metadata,
      isFirstMessage = false,
      history = [],
    }: {
      message: string;
      metadata: BotSessionMetadata;
      isFirstMessage?: boolean;
      history?: Array<{ role: string; content: string }>;
    } = body;

    if (!message || !metadata?.client_id || !metadata?.uid_collaborateur) {
      return new Response(
        JSON.stringify({ error: "message, metadata.client_id et metadata.uid_collaborateur requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Premier message : routage Big-Boss
    let intent: IntentTag = "GENERAL";
    if (isFirstMessage) {
      intent = await routeToIntent(message, metadata);
    }
    // TODO: Pour les messages suivants, récupérer l'intent depuis la session stockée
    // (ex: dans conversations/${client_id}/session)

    const expertConfig = AGENT_ROUTING_TABLE[intent];

    // 2. Injection Metadata dans le contexte
    const metadataContext = buildExpertContext(metadata);

    // 3. Sauvegarde message utilisateur dans Firestore
    await saveMessageToFirestore(metadata.client_id, "user", message, {
      intent,
    });

    // 4. Appel Mistral (streaming) avec l'expert
    const messages = [
      {
        role: "system" as const,
        content: `${metadataContext}\n\nTu es l'expert ${intent}. Réponds de manière professionnelle et ancrée au dossier client.`,
      },
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const streamResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: expertConfig.model,
        messages,
        stream: true,
        max_tokens: 4096,
      }),
    });

    if (!MISTRAL_API_KEY) {
      throw new Error("MISTRAL_API_KEY manquante");
    }

    if (!streamResponse.ok) {
      const err = await streamResponse.text();
      throw new Error(`Mistral API error: ${streamResponse.status} ${err}`);
    }

    const reader = streamResponse.body;
    if (!reader) {
      throw new Error("Pas de stream disponible");
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
        await saveMessageToFirestore(metadata.client_id, "assistant", fullContent, {
          intent,
        });
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
