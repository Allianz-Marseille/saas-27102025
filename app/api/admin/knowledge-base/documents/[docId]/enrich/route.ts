/**
 * POST /api/admin/knowledge-base/documents/[docId]/enrich
 * Enrichit un document : titre IA, résumé, re-embedding structuré.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { getKnowledgeBaseById } from "@/lib/knowledge/registry";
import { adminDb } from "@/lib/firebase/admin-config";
import { Timestamp } from "firebase-admin/firestore";
import OpenAI from "openai";
import { generateEmbedding } from "@/lib/knowledge/embedding";

const ENRICH_MODEL = "gpt-4o-mini";

function getOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY non configurée" },
        { status: 500 }
      );
    }

    const { docId } = await params;

    const { searchParams } = new URL(request.url);
    const knowledgeBaseId = searchParams.get("knowledgeBaseId");

    if (!knowledgeBaseId) {
      return NextResponse.json(
        { error: "Paramètre knowledgeBaseId requis (query)" },
        { status: 400 }
      );
    }

    const config = getKnowledgeBaseById(knowledgeBaseId);
    if (!config) {
      return NextResponse.json(
        { error: `Base de connaissance inconnue : ${knowledgeBaseId}` },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection(config.firestoreCollection).doc(docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }

    const data = docSnap.data();
    const content = data?.content ?? "";
    const currentTitle = data?.title ?? docId;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Document sans contenu textuel" },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();

    const contentPreview = content.slice(0, 12_000);

    const completion = await openai.chat.completions.create({
      model: ENRICH_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant qui analyse des extraits de documents. Réponds uniquement en JSON avec les clés 'title' et 'summary'. Pas de texte avant ou après le JSON.",
        },
        {
          role: "user",
          content: `À partir du texte suivant (extrait PDF), fournis :
1. title : un titre court et descriptif en français (max 80 caractères)
2. summary : un résumé en 3 à 5 phrases en français

Texte :
${contentPreview}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const rawResponse = completion.choices?.[0]?.message?.content;
    if (!rawResponse) {
      throw new Error("Réponse OpenAI vide");
    }

    let parsed: { title?: string; summary?: string };
    try {
      parsed = JSON.parse(rawResponse) as { title?: string; summary?: string };
    } catch {
      throw new Error("Réponse OpenAI invalide (JSON attendu)");
    }

    const title = String(parsed.title ?? currentTitle).trim().slice(0, 80) || currentTitle;
    const summary = String(parsed.summary ?? "").trim();

    const enrichedText = `TITRE: ${title} | RESUME: ${summary} | CONTENU: ${content}`;
    const embedding = await generateEmbedding(enrichedText, openai);

    await docRef.update({
      title,
      summary,
      embedding,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true, title, summary });
  } catch (error) {
    console.error("Erreur POST /api/admin/knowledge-base/documents/[docId]/enrich:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "Erreur lors de l'enrichissement", details: message },
      { status: 500 }
    );
  }
}
