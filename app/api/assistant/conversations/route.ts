/**
 * API Route pour la gestion des conversations sauvegardées
 * GET : Liste des conversations de l'utilisateur
 * POST : Créer une nouvelle conversation
 * PATCH : Mettre à jour une conversation
 * DELETE : Supprimer une conversation
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";
import {
  saveConversation,
  autoSaveConversation,
  loadConversations,
  loadConversation,
  updateConversation,
  deleteConversation,
  loadSharedConversation,
  loadSharedConversations,
  toggleFavorite,
  ConversationMessage,
} from "@/lib/assistant/conversations";
import { logAction } from "@/lib/assistant/audit";

/**
 * GET /api/assistant/conversations
 * Récupère toutes les conversations de l'utilisateur ou une conversation spécifique
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("id");
    const token = searchParams.get("token");
    const includeShared = searchParams.get("includeShared") === "true";

    // Si un token est fourni, charger une conversation partagée
    if (token) {
      const conversation = await loadSharedConversation(token);
      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation partagée non trouvée ou token invalide" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        conversation,
      });
    }

    // Si un ID est fourni, charger une conversation spécifique
    if (conversationId) {
      const conversation = await loadConversation(conversationId, auth.userId!);
      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation non trouvée" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        conversation,
      });
    }

    // Charger toutes les conversations de l'utilisateur
    const conversations = await loadConversations(auth.userId!);
    
    // Si demandé, inclure les conversations partagées
    let allConversations = conversations;
    if (includeShared) {
      const shared = await loadSharedConversations(auth.userId!);
      allConversations = [...conversations, ...shared];
    }

    return NextResponse.json({
      success: true,
      conversations: allConversations,
    });
  } catch (error) {
    console.error("Erreur GET /api/assistant/conversations:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des conversations",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assistant/conversations
 * Crée une nouvelle conversation
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { messages, title, tags, autoSaved, conversationId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Les messages sont requis" },
        { status: 400 }
      );
    }

    // Convertir les messages en format ConversationMessage
    const conversationMessages: ConversationMessage[] = messages.map((msg: any) => ({
      id: msg.id || `${Date.now()}-${Math.random()}`,
      role: msg.role,
      content: msg.content,
      images: msg.images,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      sources: msg.sources,
      sourcesWithScores: msg.sourcesWithScores,
    }));

    // Si autoSaved et conversationId fourni, utiliser autoSaveConversation
    const savedConversationId = autoSaved && conversationId
      ? await autoSaveConversation(auth.userId!, conversationMessages, conversationId)
      : await saveConversation(auth.userId!, conversationMessages, title, tags, autoSaved);

    // Logger l'action
    await logAction(
      auth.userId!,
      "conversation_created",
      { conversationId: savedConversationId },
      { ip: request.headers.get("x-forwarded-for") || undefined }
    ).catch((err) => console.error("Erreur logging audit:", err));

    return NextResponse.json({
      success: true,
      conversationId: savedConversationId,
    });
  } catch (error) {
    console.error("Erreur POST /api/assistant/conversations:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la sauvegarde de la conversation",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/assistant/conversations
 * Met à jour une conversation
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, title, messages, tags, isFavorite } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "L'ID de la conversation est requis" },
        { status: 400 }
      );
    }

    // Si isFavorite est fourni, utiliser toggleFavorite
    if (isFavorite !== undefined) {
      const newIsFavorite = await toggleFavorite(conversationId, auth.userId!);
      return NextResponse.json({
        success: true,
        isFavorite: newIsFavorite,
      });
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (tags !== undefined) updates.tags = tags;
    if (messages !== undefined) {
      updates.messages = messages.map((msg: any) => ({
        id: msg.id || `${Date.now()}-${Math.random()}`,
        role: msg.role,
        content: msg.content,
        images: msg.images,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        sources: msg.sources,
        sourcesWithScores: msg.sourcesWithScores,
      }));
    }

    await updateConversation(conversationId, auth.userId!, updates);

    // Logger l'action
    await logAction(
      auth.userId!,
      "conversation_updated",
      { conversationId },
      { ip: request.headers.get("x-forwarded-for") || undefined }
    ).catch((err) => console.error("Erreur logging audit:", err));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Erreur PATCH /api/assistant/conversations:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour de la conversation",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assistant/conversations
 * Supprime une conversation
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("id");

    if (!conversationId) {
      return NextResponse.json(
        { error: "L'ID de la conversation est requis" },
        { status: 400 }
      );
    }

    await deleteConversation(conversationId, auth.userId!);

    // Logger l'action
    await logAction(
      auth.userId!,
      "conversation_deleted",
      { conversationId },
      { ip: request.headers.get("x-forwarded-for") || undefined }
    ).catch((err) => console.error("Erreur logging audit:", err));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Erreur DELETE /api/assistant/conversations:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la suppression de la conversation",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

