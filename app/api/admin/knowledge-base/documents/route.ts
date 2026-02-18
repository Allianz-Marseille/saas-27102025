/**
 * GET /api/admin/knowledge-base/documents
 * Liste les documents d'une base de connaissance.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { getKnowledgeBaseById } from "@/lib/knowledge/registry";
import { adminDb } from "@/lib/firebase/admin-config";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const knowledgeBaseId = searchParams.get("knowledgeBaseId");

    if (!knowledgeBaseId) {
      return NextResponse.json(
        { error: "Paramètre knowledgeBaseId requis" },
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

    const snapshot = await adminDb.collection(config.firestoreCollection).get();

    const documents = snapshot.docs.map((doc) => {
      const data = doc.data();
      const content = data?.content ?? "";
      return {
        id: doc.id,
        title: data?.title ?? doc.id,
        themes: Array.isArray(data?.themes) ? data.themes : [],
        notes: data?.notes ?? "",
        summary: data?.summary ?? "",
        storagePath: data?.storagePath ?? undefined,
        updatedAt: data?.updatedAt?.toMillis?.() ?? null,
        enrichedAt: data?.enrichedAt?.toMillis?.() ?? null,
        contentLength: typeof content === "string" ? content.length : 0,
        sourceFileName: data?.sourceFileName ?? undefined,
      };
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Erreur GET /api/admin/knowledge-base/documents:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "Erreur lors de la récupération des documents", details: message },
      { status: 500 }
    );
  }
}
