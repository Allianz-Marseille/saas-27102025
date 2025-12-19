/**
 * API Route pour l'export de conversations
 * POST : Exporter une conversation dans différents formats (PDF, Word, TXT)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";
import { loadConversation } from "@/lib/assistant/conversations";
import { exportToText, exportToPDF, exportToWord } from "@/lib/assistant/export";
import { logAction } from "@/lib/assistant/audit";

/**
 * POST /api/assistant/export
 * Exporte une conversation dans le format demandé
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, format = "txt" } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "L'ID de la conversation est requis" },
        { status: 400 }
      );
    }

    // Charger la conversation
    const conversation = await loadConversation(conversationId, auth.userId!);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 }
      );
    }

    // Logger l'action
    await logAction(
      auth.userId!,
      "export_generated",
      { conversationId, exportFormat: format },
      { ip: request.headers.get("x-forwarded-for") || undefined }
    ).catch((err) => console.error("Erreur logging audit:", err));

    // Exporter selon le format
    switch (format.toLowerCase()) {
      case "txt":
        const text = exportToText(conversation);
        return new NextResponse(text, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="${conversation.title.replace(/[^a-z0-9]/gi, "_")}.txt"`,
          },
        });

      case "pdf":
        try {
          const pdfBuffer = await exportToPDF(conversation);
          return new NextResponse(pdfBuffer as any, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${conversation.title.replace(/[^a-z0-9]/gi, "_")}.pdf"`,
            },
          });
        } catch (error) {
          return NextResponse.json(
            {
              error: "L'export PDF n'est pas encore disponible",
              details: error instanceof Error ? error.message : "Erreur inconnue",
            },
            { status: 501 }
          );
        }

      case "word":
      case "docx":
        try {
          const wordBuffer = await exportToWord(conversation);
          return new NextResponse(wordBuffer as any, {
            headers: {
              "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "Content-Disposition": `attachment; filename="${conversation.title.replace(/[^a-z0-9]/gi, "_")}.docx"`,
            },
          });
        } catch (error) {
          return NextResponse.json(
            {
              error: "L'export Word n'est pas encore disponible",
              details: error instanceof Error ? error.message : "Erreur inconnue",
            },
            { status: 501 }
          );
        }

      default:
        return NextResponse.json(
          { error: `Format non supporté: ${format}. Formats supportés: txt, pdf, word` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Erreur POST /api/assistant/export:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'export de la conversation",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

