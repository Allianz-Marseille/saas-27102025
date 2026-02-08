/**
 * POST /api/admin/knowledge-base/ingest
 * Ingère un PDF dans une base de connaissance RAG (extraction + embedding OpenAI + Firestore).
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { getKnowledgeBaseById } from "@/lib/knowledge/registry";
import { extractTextFromPdfBuffer, slugFromFilename } from "@/lib/knowledge/extract-pdf";
import { adminDb } from "@/lib/firebase/admin-config";
import { Timestamp } from "firebase-admin/firestore";
import OpenAI from "openai";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_INPUT_MAX_CHARS = 8_000;

function getOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

async function generateEmbedding(text: string, openai: OpenAI): Promise<number[]> {
  const input = text.slice(0, EMBEDDING_INPUT_MAX_CHARS);
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  });
  const embedding = response.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Réponse embedding OpenAI invalide");
  }
  return embedding;
}

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const knowledgeBaseId = formData.get("knowledgeBaseId") as string | null;
    const docIdParam = formData.get("docId") as string | null;

    if (!file || !knowledgeBaseId) {
      return NextResponse.json(
        { error: "Paramètres manquants : file et knowledgeBaseId requis" },
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

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} Mo)` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Le fichier est vide" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".pdf")) {
      return NextResponse.json({ error: "Seuls les fichiers PDF sont acceptés" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const content = await extractTextFromPdfBuffer(buffer);

    const docId = docIdParam?.trim() || slugFromFilename(file.name);
    if (!docId) {
      return NextResponse.json({ error: "Impossible de générer un identifiant pour le document" }, { status: 400 });
    }

    const title = file.name.replace(/\.pdf$/i, "");

    const openai = getOpenAIClient();
    const embedding = await generateEmbedding(content, openai);

    const payload = {
      title,
      content,
      updatedAt: Timestamp.now(),
      embedding,
    };

    await adminDb.collection(config.firestoreCollection).doc(docId).set(payload, { merge: true });

    const isUpdate = !!docIdParam?.trim();

    return NextResponse.json({
      success: true,
      docId,
      title,
      charsExtracted: content.length,
      updated: isUpdate,
    });
  } catch (error) {
    console.error("Erreur POST /api/admin/knowledge-base/ingest:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "Erreur lors de l'ingestion", details: message },
      { status: 500 }
    );
  }
}
