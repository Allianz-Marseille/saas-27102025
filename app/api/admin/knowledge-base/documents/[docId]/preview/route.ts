/**
 * GET /api/admin/knowledge-base/documents/[docId]/preview
 * Génère une URL signée pour prévisualiser le PDF (valide 1h).
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { getKnowledgeBaseById } from "@/lib/knowledge/registry";
import { adminDb, getStorageBucket } from "@/lib/firebase/admin-config";

const SIGNED_URL_EXPIRY_MS = 60 * 60 * 1000; // 1h

export async function GET(
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

    const docRef = adminDb.collection(config.firestoreCollection).doc(docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }

    const storagePath = docSnap.data()?.storagePath;
    if (!storagePath || typeof storagePath !== "string") {
      return NextResponse.json(
        { error: "Aperçu non disponible (document importé avant archivage)" },
        { status: 404 }
      );
    }

    const bucket = getStorageBucket();
    const file = bucket.file(storagePath);

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + SIGNED_URL_EXPIRY_MS,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Erreur GET /api/admin/knowledge-base/documents/[docId]/preview:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'aperçu", details: message },
      { status: 500 }
    );
  }
}
