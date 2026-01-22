/**
 * API Route pour la gestion des templates de prompts
 * GET : Liste des templates (système + utilisateur)
 * POST : Créer un template utilisateur (admin uniquement pour templates système)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";
import { loadTemplates, saveUserTemplate, deleteUserTemplate } from "@/lib/assistant/templates-server";
import { logAction } from "@/lib/assistant/audit";

/**
 * GET /api/assistant/templates
 * Récupère tous les templates (système + utilisateur)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const templates = await loadTemplates(auth.userId!);

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error("Erreur GET /api/assistant/templates:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des templates",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assistant/templates
 * Crée un template utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, prompt, variables, category } = body;

    if (!name || !prompt) {
      return NextResponse.json(
        { error: "Le nom et le prompt sont requis" },
        { status: 400 }
      );
    }

    const templateId = await saveUserTemplate(auth.userId!, {
      name,
      description: description || "",
      prompt,
      variables: variables || [],
      category: category || "autre",
    });

    // Logger l'action
    await logAction(
      auth.userId!,
      "template_created",
      { templateId },
      { ip: request.headers.get("x-forwarded-for") || undefined }
    ).catch((err) => console.error("Erreur logging audit:", err));

    return NextResponse.json({
      success: true,
      templateId,
    });
  } catch (error) {
    console.error("Erreur POST /api/assistant/templates:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la sauvegarde du template",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assistant/templates
 * Supprime un template utilisateur
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("id");

    if (!templateId) {
      return NextResponse.json(
        { error: "L'ID du template est requis" },
        { status: 400 }
      );
    }

    await deleteUserTemplate(templateId, auth.userId!);

    // Logger l'action
    await logAction(
      auth.userId!,
      "template_deleted",
      { templateId },
      { ip: request.headers.get("x-forwarded-for") || undefined }
    ).catch((err) => console.error("Erreur logging audit:", err));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Erreur DELETE /api/assistant/templates:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la suppression du template",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

