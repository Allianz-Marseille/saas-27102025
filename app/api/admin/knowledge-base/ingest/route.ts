/**
 * POST /api/admin/knowledge-base/ingest
 * Ingestion suspendue — migration vers Gemini en cours.
 * (Anciennement : extraction + embedding + Firestore.)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";

const MIGRATION_MESSAGE = "Ingestion suspendue — migration vers Gemini en cours.";

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    return NextResponse.json(
      { error: MIGRATION_MESSAGE },
      { status: 503 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Erreur POST /api/admin/knowledge-base/ingest:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ingestion", details: message },
      { status: 500 }
    );
  }
}
