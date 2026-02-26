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
import { qualifySinister, type IrsaCaseCode, type SinisterInput } from "@/lib/sinistro";
import { GoogleGenAI } from "@google/genai";
import type { BotSessionMetadata } from "@/types/bot";

const GEMINI_MODEL = "gemini-2.5-flash";
const SINISTRO_IRSA_CASES = [10, 13, 15, 17, 20, 21, 40] as const;

type SinistroConversationInsights = {
  resolvedConvention?: string;
  resolvedSinisterType?: string;
  resolvedIrsaCase?: number;
};

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
 * Sauvegarde des insights de conversation au niveau session (traces métier Sinistro).
 */
async function saveConversationInsights(
  sessionId: string,
  insights: SinistroConversationInsights
): Promise<void> {
  if (!insights.resolvedConvention && !insights.resolvedSinisterType && !insights.resolvedIrsaCase) {
    return;
  }
  try {
    const db = getAdminDbOrNull();
    if (!db) return;
    await db.collection("conversations").doc(sessionId).set(
      {
        ...insights,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Firebase fail — insights conversation non persistés:", error);
  }
}

function normalizeForMatch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseAmountInEuros(text: string): number | undefined {
  const match = text.match(/(\d[\d\s.,]{1,18})\s*(?:€|euros?)/i);
  if (!match) return undefined;
  const sanitized = match[1]
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const amount = Number.parseFloat(sanitized);
  return Number.isFinite(amount) ? amount : undefined;
}

function hasExplicitHtMention(text: string): boolean {
  return /\bht\b|hors\s+taxes?/i.test(text);
}

function extractIrsaCaseFromText(text: string): IrsaCaseCode | undefined {
  const match = text.match(/\b(?:cas(?:\s+irsa)?\s*)?(10|13|15|17|20|21|40)\b/i);
  if (!match?.[1]) return undefined;
  const value = Number.parseInt(match[1], 10);
  if (SINISTRO_IRSA_CASES.includes(value as (typeof SINISTRO_IRSA_CASES)[number])) {
    return value as IrsaCaseCode;
  }
  return undefined;
}

function inferSinisterInputFromMessage(message: string): SinisterInput | null {
  const normalized = normalizeForMatch(message);
  const irsaCase = extractIrsaCaseFromText(message);
  const amountEstimate = parseAmountInEuros(message);

  if (
    normalized.includes("auto") &&
    (normalized.includes("materiel") ||
      normalized.includes("constat") ||
      normalized.includes("irsa") ||
      normalized.includes("collision"))
  ) {
    return {
      type: "auto_materiel",
      irsaCase,
    };
  }

  if (normalized.includes("auto") && normalized.includes("corporel")) {
    return { type: "auto_corporel" };
  }

  if (normalized.includes("degats des eaux") || normalized.includes("degat des eaux")) {
    return {
      type: "degats_eaux",
      amountEstimate,
    };
  }

  if (normalized.includes("incendie")) {
    return {
      type: "incendie_immeuble",
      amountEstimate,
    };
  }

  if (normalized.includes("construction")) {
    return { type: "construction" };
  }

  if (normalized.includes("pertes indirectes") || normalized.includes("vol")) {
    return { type: "pertes_indirectes_vol" };
  }

  if (irsaCase) {
    return {
      type: "auto_materiel",
      irsaCase,
    };
  }

  return null;
}

function canRunDeterministicSinistroQualification(
  input: SinisterInput,
  message: string
): boolean {
  if (input.type === "auto_materiel") {
    return typeof input.irsaCase === "number";
  }
  if (input.type === "degats_eaux" || input.type === "incendie_immeuble") {
    return (
      typeof input.amountEstimate === "number" &&
      hasExplicitHtMention(message)
    );
  }
  return false;
}

function buildSinistroRuntimeInstruction(
  message: string
): { extraInstruction: string; insights?: SinistroConversationInsights } {
  const sections: string[] = [
    "## GARDE-FOUS RUNTIME SINISTRO",
    "- Format obligatoire en 5 blocs: Qualification, Cadre conventionnel, Justification, Direction de gestion, Etat du recours.",
    "- En habitation, demander confirmation HT si le montant n'est pas explicitement HT avant de conclure IRSI/CIDE-COP.",
    "- En constat image, lister d'abord les cases A/B (1-17), demander confirmation, puis seulement donner le cas IRSA final.",
    "- Toujours distinguer Convention (entre assureurs) et Droit commun (droits du client).",
  ];

  const input = inferSinisterInputFromMessage(message);
  if (!input || !canRunDeterministicSinistroQualification(input, message)) {
    return { extraInstruction: sections.join("\n") };
  }

  const result = qualifySinister(input);
  sections.push(
    "",
    "## RESULTAT MOTEUR DETERMINISTE SINISTRO (prioritaire)",
    `- Convention suggeree: ${result.convention}`,
    `- Type de sinistre: ${result.sinisterType}`,
    result.irsaCase ? `- Cas IRSA: ${result.irsaCase}` : "- Cas IRSA: non applicable",
    result.irsaCaseLabel ? `- Libelle IRSA: ${result.irsaCaseLabel}` : "- Libelle IRSA: non applicable",
    result.assureurGestionnaire?.summary
      ? `- Gestion: ${result.assureurGestionnaire.summary}`
      : "- Gestion: a preciser selon le contexte",
    result.recourse?.summary
      ? `- Recours: ${result.recourse.summary}`
      : "- Recours: a determiner selon convention",
    `- Rappel droit commun: ${result.droitCommunRappel}`
  );

  return {
    extraInstruction: sections.join("\n"),
    insights: {
      resolvedConvention: result.convention,
      resolvedSinisterType: result.sinisterType,
      resolvedIrsaCase: result.irsaCase,
    },
  };
}

function buildBobRuntimeInstruction(message: string): string {
  const normalized = normalizeForMatch(message);
  const asksMailTemplate =
    normalized.includes("preparer un mail") ||
    normalized.includes("prepare un mail") ||
    normalized.includes("mail client") ||
    normalized.includes("template mail");
  const mentionsFamilyContext =
    normalized.includes("conjoint") ||
    normalized.includes("enfant") ||
    normalized.includes("famille") ||
    normalized.includes("marie") ||
    normalized.includes("pacse");

  const sections: string[] = [
    "## GARDE-FOUS RUNTIME BOB SANTE",
    "- Distinguer strictement le besoin de maintien de revenu personnel et le besoin de frais professionnels.",
    "- Produire des gaps separes: maintien de revenu (ITT), invalidite, frais professionnels.",
    "- Ne pas demander le choix d'horizon dans le workflow: appliquer par defaut ITT 3 ans + relais invalidite, et frais professionnels 1 an.",
    "- Respecter la separation des moteurs: SSI pour artisans/commercants/gerants; CPAM J4-J90 puis RO pour liberaux.",
    "- Pour les liberaux, rappeler la rupture CPAM au J91 dans l'analyse de maintien de revenu.",
    "- Afficher l'alerte explicite: RUPTURE DE REVENUS CRITIQUE AU 91eme JOUR pour tous les profils liberaux.",
    "- Pour les kinesitherapeutes (CARPIMKO), souligner l'arret total des IJ CARPIMKO apres le 365eme jour: 100% de GAP ITT en annee 2.",
    "- Ne jamais fusionner revenu et frais professionnels dans une seule ligne de besoin ou de gap.",
    "- Pour les frais professionnels: limiter l'analyse a 12 mois en securisation court terme. Au-dela de 12 mois, afficher Gap_Frais_Pros = 0 dans la projection.",
    "- Produire une timeline Mermaid en flowchart LR (gauche vers droite) avec styles: carence #fff3cd, 1ere couche #d4edda, relais/gap #cce5ff.",
    "- Respecter strictement la syntaxe Mermaid pour eviter les erreurs: `flowchart LR`, identifiants A/B/C, labels entre guillemets doubles, retours via <br/>, fleches `-->`, styles `style X fill:#hex`.",
    "- Structurer le rendu final dans cet ordre: 1 Validation client, 2 Diagnostic de vulnerabilite (visuel), 3 Timelines, 4 Ordonnance de protection, 5 Effort fiscal Madelin.",
    "- Ouvrir l'audit par le titre: AUDIT DE PROTECTION : [NOM DU CLIENT], puis un resume de 3 points cles.",
    "- Utiliser des tableaux Markdown pour tous les chiffres et mettre en gras tous les montants financiers.",
    "- Dans les tableaux de timeline (J1-J3, J4-J90, J91+), ajouter une colonne Impact Visuel avec Emoji-Bar (10 caracteres).",
    "- Ajouter une visualisation textuelle des gaps au format Emoji-Bar (10 caracteres): 🟩 pour la part couverte (SSI/CPAM/RO) et 🟥 pour le gap (manque a gagner).",
    "- Appliquer ce format Emoji-Bar pour: maintien de revenu, frais professionnels et protection familiale (capital deces/rentes).",
    "- Afficher le pourcentage de gap en gras juste apres la barre (ex: 🟩🟩🟩🟩🟥🟥🟥🟥🟥🟥 **60% de perte de revenus**).",
    "- Ne jamais placer les Emoji-Bar dans des blocs de code afin de conserver le rendu couleur au copier-coller Outlook/Word.",
    "- Ne jamais enfermer le texte narratif dans des blocs de code; seuls les diagrammes Mermaid peuvent utiliser ```mermaid```.",
    "- Supprimer toute mention M+3 dans l'audit technique; ton expert d'audit immediat.",
    "- Ajouter une ligne de conclusion source: Source des donnees : Referentiel [Nom du Regime] 2026.",
    "- Ajouter une signature de fin: Diagnostic realise par Bob, votre expert Allianz Marseille, base sur les baremes [Nom du RO] 2026.",
  ];

  if (mentionsFamilyContext) {
    sections.push(
      "",
      "## VOLET FAMILIAL (declenchement contextuel)",
      "- Si conjoint/enfants detectes, activer l'alerte protection familiale et le tableau Gap Famille (Capital Deces, Rente Education, Rente Conjoint).",
      "- Utiliser en priorite le fichier 17-protection-familiale-succession-2026.md pour chiffrer les besoins."
    );
  }

  sections.push(
    "",
    "## VOLET MATRIMONIAL (obligatoire si donnee disponible)",
    "- Si la situation matrimoniale est connue (celibataire, marie, pacse, divorce, veuf), souligner automatiquement les besoins eventuels en Capital Deces, Rente Education et Rente Conjoint.",
    "- Ne pas ajouter de question specifique sur les options: produire directement la recommandation selon les donnees deja collectees."
  );

  if (asksMailTemplate) {
    sections.push(
      "",
      "## TEMPLATE MAIL (sur demande explicite)",
      "- Produire un mail pret a copier-coller avec: Objet, formule d'appel, synthese audit, points de vigilance, prochaine etape, signature commerciale.",
      "- Garder un ton professionnel et actionnable, sans code block."
    );
  }

  return sections.join("\n");
}

function inferInsightsFromAssistantContent(content: string): SinistroConversationInsights {
  const normalized = normalizeForMatch(content);
  const irsaCase = extractIrsaCaseFromText(content);

  let resolvedConvention: string | undefined;
  if (normalized.includes("irsa") || normalized.includes("ida")) resolvedConvention = "IRSA_IDA";
  else if (normalized.includes("irsi")) resolvedConvention = "IRSI";
  else if (normalized.includes("cide-cop")) resolvedConvention = "CIDE_COP";
  else if (normalized.includes("irca")) resolvedConvention = "IRCA";
  else if (normalized.includes("paos")) resolvedConvention = "PAOS";
  else if (normalized.includes("cid-piv")) resolvedConvention = "CID_PIV";
  else if (normalized.includes("crac")) resolvedConvention = "CRAC";

  let resolvedSinisterType: string | undefined;
  if (normalized.includes("auto materiel")) resolvedSinisterType = "auto_materiel";
  else if (normalized.includes("auto corporel")) resolvedSinisterType = "auto_corporel";
  else if (normalized.includes("degats des eaux") || normalized.includes("degat des eaux")) {
    resolvedSinisterType = "degats_eaux";
  } else if (normalized.includes("incendie")) resolvedSinisterType = "incendie_immeuble";
  else if (normalized.includes("construction")) resolvedSinisterType = "construction";
  else if (normalized.includes("pertes indirectes") || normalized.includes("vol")) {
    resolvedSinisterType = "pertes_indirectes_vol";
  }

  return {
    resolvedConvention,
    resolvedSinisterType,
    resolvedIrsaCase: irsaCase,
  };
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
    let sinistroInsights: SinistroConversationInsights | undefined;

    const metadataContext = buildMetadataContext(metadata);
    if (metadataContext) {
      systemInstruction += `\n\n${metadataContext}`;
    }

    if (botId.toLowerCase() === "sinistro") {
      const runtimeInstruction = buildSinistroRuntimeInstruction(message);
      systemInstruction += `\n\n${runtimeInstruction.extraInstruction}`;
      sinistroInsights = runtimeInstruction.insights;
    }
    if (botId.toLowerCase() === "bob") {
      systemInstruction += `\n\n${buildBobRuntimeInstruction(message)}`;
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
      if (botId.toLowerCase() === "sinistro") {
        const inferredFromAssistant = inferInsightsFromAssistantContent(fullContent);
        await saveConversationInsights(sessionId, {
          resolvedConvention:
            sinistroInsights?.resolvedConvention ?? inferredFromAssistant.resolvedConvention,
          resolvedSinisterType:
            sinistroInsights?.resolvedSinisterType ?? inferredFromAssistant.resolvedSinisterType,
          resolvedIrsaCase:
            sinistroInsights?.resolvedIrsaCase ?? inferredFromAssistant.resolvedIrsaCase,
        });
      }
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
