/**
 * DELETE /api/admin/knowledge-base/documents/[docId]
 * Supprime un document d'une base de connaissance.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { getKnowledgeBaseById } from "@/lib/knowledge/registry";
import { adminDb } from "@/lib/firebase/admin-config";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
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

    await adminDb.collection(config.firestoreCollection).doc(docId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/admin/knowledge-base/documents/[docId]:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "Erreur lors de la suppression", details: message },
      { status: 500 }
    );
  }
}
