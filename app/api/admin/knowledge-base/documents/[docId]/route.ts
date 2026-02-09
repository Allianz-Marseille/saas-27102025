/**
 * PATCH /api/admin/knowledge-base/documents/[docId]
 * Met à jour les métadonnées d'un document (title, themes, notes).
 * DELETE : supprime un document.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { getKnowledgeBaseById } from "@/lib/knowledge/registry";
import { adminDb } from "@/lib/firebase/admin-config";
import { Timestamp } from "firebase-admin/firestore";

const TITLE_MAX = 200;
const THEMES_MAX_COUNT = 20;
const THEME_MAX_LENGTH = 50;
const NOTES_MAX = 1000;

function validatePatchBody(body: unknown): {
  title?: string;
  themes?: string[];
  notes?: string;
  error?: string;
} {
  if (typeof body !== "object" || body === null) {
    return { error: "Body JSON invalide" };
  }

  const result: { title?: string; themes?: string[]; notes?: string } = {};

  if ("title" in body) {
    const t = body.title;
    if (typeof t !== "string") return { error: "title doit être une chaîne" };
    const trimmed = t.trim();
    if (!trimmed) return { error: "title ne peut pas être vide" };
    if (trimmed.length > TITLE_MAX) return { error: `title max ${TITLE_MAX} caractères` };
    result.title = trimmed;
  }

  if ("themes" in body) {
    const th = body.themes;
    if (!Array.isArray(th)) return { error: "themes doit être un tableau" };
    if (th.length > THEMES_MAX_COUNT) return { error: `themes max ${THEMES_MAX_COUNT} éléments` };
    const themes: string[] = [];
    for (const item of th) {
      const s = typeof item === "string" ? item.trim() : String(item).trim();
      if (s.length > THEME_MAX_LENGTH) return { error: `chaque thème max ${THEME_MAX_LENGTH} caractères` };
      if (s) themes.push(s);
    }
    result.themes = themes;
  }

  if ("notes" in body) {
    const n = body.notes;
    if (n !== undefined && n !== null) {
      const s = typeof n === "string" ? n : String(n);
      if (s.length > NOTES_MAX) return { error: `notes max ${NOTES_MAX} caractères` };
      result.notes = s;
    }
  }

  return result;
}

export async function PATCH(
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

    const body = await request.json().catch(() => null);
    const validated = validatePatchBody(body);
    if ("error" in validated && validated.error) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { title, themes, notes } = validated;
    if (!title && themes === undefined && notes === undefined) {
      return NextResponse.json(
        { error: "Au moins un champ à modifier : title, themes ou notes" },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection(config.firestoreCollection).doc(docId);
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
    if (title !== undefined) updateData.title = title;
    if (themes !== undefined) updateData.themes = themes;
    if (notes !== undefined) updateData.notes = notes;

    await docRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur PATCH /api/admin/knowledge-base/documents/[docId]:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour", details: message },
      { status: 500 }
    );
  }
}

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
