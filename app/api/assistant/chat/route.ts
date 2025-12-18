/**
 * API Route pour le chatbot standard (sans RAG)
 * POST : Chat avec OpenAI sans contexte enrichi
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/assistant/chat
 * Chat standard : génère une réponse OpenAI sans contexte RAG
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Vérifier la clé API OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY manquante dans les variables d'environnement");
      return NextResponse.json(
        {
          error: "Configuration API manquante",
          details:
            "La clé API OpenAI n'est pas configurée. Vérifiez que OPENAI_API_KEY est définie dans .env.local",
        },
        { status: 500 }
      );
    }

    // Récupérer les paramètres depuis le body
    const body = await request.json();
    const { message, images, model = "gpt-4o" } = body;

    // Le message peut être vide si seulement des images sont envoyées
    if (!message && (!images || images.length === 0)) {
      return NextResponse.json(
        { error: "Message ou image manquant" },
        { status: 400 }
      );
    }

    // Construire le prompt système
    const systemPrompt = `Tu es un assistant IA spécialisé dans l'assurance pour l'agence Allianz.
Tu dois répondre aux questions de manière professionnelle et précise.
Si tu ne connais pas la réponse, dis-le clairement.`;

    // Construire le contenu du message utilisateur
    let userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
    
    // Ajouter le texte si présent
    if (message && message.trim()) {
      userContent.push({
        type: "text",
        text: message,
      });
    }

    // Ajouter les images si présentes
    if (images && Array.isArray(images) && images.length > 0) {
      for (const imageBase64 of images) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: imageBase64,
          },
        });
      }
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userContent.length > 0 ? userContent : message,
      },
    ];

    // Récupérer le paramètre stream depuis le body
    const { stream: useStream = false } = body;

    // Si streaming demandé, utiliser Server-Sent Events
    if (useStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Utiliser gpt-4o si des images sont présentes (support vision)
            const modelToUse = images && images.length > 0 ? "gpt-4o" : model;
            
            const openaiStream = await openai.chat.completions.create({
              model: modelToUse,
              messages,
              temperature: 0.7,
              max_tokens: 2000,
              stream: true,
            });

            for await (const chunk of openaiStream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                const data = `data: ${JSON.stringify({ content })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            }

            // Signal de fin
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            const errorData = `data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Mode non-streaming (comportement par défaut) avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 secondes

    let completion;
    try {
      // Utiliser gpt-4o si des images sont présentes (support vision)
      const modelToUse = images && images.length > 0 ? "gpt-4o" : model;
      
      completion = await openai.chat.completions.create(
        {
          model: modelToUse,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === "AbortError") {
        return NextResponse.json(
          {
            error: "La requête a pris trop de temps. Réessayez.",
            details: "Timeout après 60 secondes",
          },
          { status: 408 }
        );
      }
      throw error;
    }

    const response = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("Erreur POST /api/assistant/chat:", error);

    // Gestion des erreurs spécifiques OpenAI
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          {
            error: "Trop de requêtes. Réessayez dans quelques instants.",
            details: "Rate limit atteint",
          },
          { status: 429 }
        );
      } else if (error.status === 401) {
        return NextResponse.json(
          {
            error: "Erreur de configuration API. Contactez l'administrateur.",
          },
          { status: 401 }
        );
      } else if (error.status === 400) {
        // Vérifier si c'est une erreur de contexte trop long
        const errorMessage = error.message?.toLowerCase() || "";
        if (errorMessage.includes("context_length") || errorMessage.includes("token")) {
          return NextResponse.json(
            {
              error: "Conversation trop longue. Veuillez créer une nouvelle conversation.",
              details: "Limite de tokens dépassée",
            },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la génération de la réponse",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

