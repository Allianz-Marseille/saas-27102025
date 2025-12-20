/**
 * API Route pour comparer deux documents RAG
 * POST : Compare deux documents et identifie les différences
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { adminDb } from "@/lib/firebase/admin-config";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/assistant/rag/documents/compare
 * Compare deux documents et retourne les différences
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification ET le rôle administrateur
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json(
        {
          error: auth.error || "Accès administrateur requis",
          details: "La comparaison de documents RAG est réservée aux administrateurs uniquement",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { documentId1, documentId2 } = body;

    if (!documentId1 || !documentId2) {
      return NextResponse.json(
        { error: "Les deux IDs de documents sont requis" },
        { status: 400 }
      );
    }

    // Récupérer les deux documents
    const doc1Ref = adminDb.collection("rag_documents").doc(documentId1);
    const doc2Ref = adminDb.collection("rag_documents").doc(documentId2);

    const [doc1Snapshot, doc2Snapshot] = await Promise.all([
      doc1Ref.get(),
      doc2Ref.get(),
    ]);

    if (!doc1Snapshot.exists) {
      return NextResponse.json(
        { error: `Document 1 (${documentId1}) non trouvé` },
        { status: 404 }
      );
    }

    if (!doc2Snapshot.exists) {
      return NextResponse.json(
        { error: `Document 2 (${documentId2}) non trouvé` },
        { status: 404 }
      );
    }

    const doc1 = doc1Snapshot.data();
    const doc2 = doc2Snapshot.data();

    // Récupérer les résumés ou les chunks
    const doc1Summary = doc1.summary;
    const doc2Summary = doc2.summary;

    // Si pas de résumé, récupérer les premiers chunks
    let doc1Text = doc1Summary || "";
    let doc2Text = doc2Summary || "";

    if (!doc1Text) {
      const chunks1 = await adminDb
        .collection("rag_chunks")
        .where("metadata.documentId", "==", documentId1)
        .orderBy("metadata.chunkIndex", "asc")
        .limit(10)
        .get();
      doc1Text = chunks1.docs
        .map((chunk) => (chunk.data() as any).content)
        .join("\n\n")
        .substring(0, 2000);
    }

    if (!doc2Text) {
      const chunks2 = await adminDb
        .collection("rag_chunks")
        .where("metadata.documentId", "==", documentId2)
        .orderBy("metadata.chunkIndex", "asc")
        .limit(10)
        .get();
      doc2Text = chunks2.docs
        .map((chunk) => (chunk.data() as any).content)
        .join("\n\n")
        .substring(0, 2000);
    }

    // Utiliser OpenAI pour comparer
    const prompt = `Compare ces deux documents d'assurance et identifie les différences principales.

Document 1 - ${doc1.title}:
${doc1Text}

Document 2 - ${doc2.title}:
${doc2Text}

Identifie et liste les différences sur :
- Les garanties proposées
- Les conditions d'application
- Les exclusions
- Les montants ou pourcentages
- Les procédures
- Tout autre point important

Format de réponse (JSON) :
{
  "differences": [
    {
      "category": "garanties|conditions|exclusions|montants|procedures|autres",
      "description": "Description de la différence",
      "document1": "Ce que dit le document 1",
      "document2": "Ce que dit le document 2",
      "impact": "low|medium|high"
    }
  ],
  "summary": "Résumé général des différences"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Aucune réponse de l'API OpenAI");
    }

    const comparison = JSON.parse(content);

    return NextResponse.json({
      success: true,
      document1: {
        id: documentId1,
        title: doc1.title,
      },
      document2: {
        id: documentId2,
        title: doc2.title,
      },
      comparison,
    });
  } catch (error) {
    console.error("Erreur POST /api/assistant/rag/documents/compare:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la comparaison des documents",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

