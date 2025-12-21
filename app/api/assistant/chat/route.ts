/**
 * API Route pour le chatbot
 * POST : Chat avec OpenAI
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";
import OpenAI from "openai";
import { checkRateLimit, determineRequestType } from "@/lib/assistant/rate-limiting";
import { checkBudgetLimit } from "@/lib/assistant/budget-alerts";
import { openaiWithRetry } from "@/lib/assistant/retry";
import { logUsage } from "@/lib/assistant/monitoring";
import { logAction } from "@/lib/assistant/audit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/assistant/chat
 * Génère une réponse OpenAI
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
    const { message, images, files, history = [], model = "gpt-4o" } = body;

    // Le message peut être vide si seulement des images ou fichiers sont envoyés
    if (!message && (!images || images.length === 0) && (!files || files.length === 0)) {
      return NextResponse.json(
        { error: "Message, image ou fichier manquant" },
        { status: 400 }
      );
    }

    // Vérifier le rate limiting
    const hasImages = images && Array.isArray(images) && images.length > 0;
    const hasFiles = files && Array.isArray(files) && files.length > 0;
    const requestType = determineRequestType(hasImages, hasFiles);
    
    const rateLimitResult = await checkRateLimit(auth.userId!, requestType);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Limite de requêtes atteinte",
          details: `Vous avez atteint la limite de ${rateLimitResult.limit} requêtes ${requestType} par jour. Réessayez après ${rateLimitResult.resetAt.toLocaleString("fr-FR")}.`,
          rateLimit: {
            remaining: rateLimitResult.remaining,
            limit: rateLimitResult.limit,
            resetAt: rateLimitResult.resetAt,
          },
        },
        { status: 429 }
      );
    }

    // Vérifier le budget
    const budgetCheck = await checkBudgetLimit();
    if (!budgetCheck.allowed) {
      return NextResponse.json(
        {
          error: "Budget mensuel dépassé",
          details: budgetCheck.reason,
        },
        { status: 429 }
      );
    }

    // Construire le prompt système
    const systemPrompt = `Tu es un assistant IA spécialisé dans l'assurance pour l'agence Allianz.
Tu dois répondre aux questions de manière professionnelle et précise.
Si tu ne connais pas la réponse, dis-le clairement.`;

    // Construire le contenu du message utilisateur
    let userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
    
    // Construire le texte du message (incluant le texte des fichiers)
    let messageText = message || "";
    
    // Ajouter le contenu des fichiers si présents
    if (files && Array.isArray(files) && files.length > 0) {
      const fileContents: string[] = [];
      for (const file of files) {
        if (file.content && typeof file.content === "string") {
          fileContents.push(`\n\n--- Contenu du fichier "${file.name}" ---\n${file.content}`);
        } else if (file.error) {
          fileContents.push(`\n\n--- Erreur avec le fichier "${file.name}" : ${file.error} ---`);
        }
      }
      if (fileContents.length > 0) {
        messageText += fileContents.join("\n");
      }
    }
    
    // Ajouter le texte si présent
    if (messageText.trim()) {
      userContent.push({
        type: "text",
        text: messageText,
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

    // Construire le tableau de messages avec l'historique
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // Ajouter l'historique de conversation si présent
    if (Array.isArray(history) && history.length > 0) {
      // Convertir l'historique au format OpenAI (limiter à 20 messages pour éviter la surcharge)
      const recentHistory = history.slice(-20);
      for (const msg of recentHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role,
            content: msg.content || "",
          });
        }
      }
    }

    // Ajouter le message utilisateur actuel
    messages.push({
      role: "user",
      content: userContent.length > 0 ? userContent : message,
    });

    // Récupérer le paramètre stream depuis le body
    const { stream: useStream = false } = body;

    // Si streaming demandé, utiliser Server-Sent Events
    if (useStream) {
      const encoder = new TextEncoder();
      const startTime = Date.now();
      let tokensInput = 0;
      let tokensOutput = 0;
      let hasError = false;
      let errorMessage: string | undefined;

      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Utiliser gpt-4o si des images sont présentes (support vision)
            const modelToUse = images && images.length > 0 ? "gpt-4o" : model;
            
            const openaiStream = await openaiWithRetry(
              () =>
                openai.chat.completions.create({
                  model: modelToUse,
                  messages,
                  temperature: 0.7,
                  max_tokens: 2000,
                  stream: true,
                }),
              { maxRetries: 3, initialDelay: 1000 }
            );

            // Estimer les tokens d'entrée (approximation)
            const messageText = JSON.stringify(messages);
            tokensInput = Math.ceil(messageText.length / 4); // Approximation: ~4 chars par token

            for await (const chunk of openaiStream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                tokensOutput += Math.ceil(content.length / 4); // Approximation
                const data = `data: ${JSON.stringify({ content })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
              
              // Capturer les tokens si disponibles
              if (chunk.usage) {
                tokensInput = chunk.usage.prompt_tokens || tokensInput;
                tokensOutput = chunk.usage.completion_tokens || tokensOutput;
              }
            }

            // Signal de fin
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();

            // Logger l'utilisation (en arrière-plan, ne pas bloquer)
            const duration = Date.now() - startTime;
            logUsage({
              userId: auth.userId!,
              endpoint: "/api/assistant/chat",
              tokensInput,
              tokensOutput,
              model: modelToUse,
              hasImages: hasImages,
              hasFiles: hasFiles,
              requestType,
              duration,
              success: true,
            }).catch((err) => console.error("Erreur logging usage:", err));

            // Logger l'action d'audit
            logAction(
              auth.userId!,
              "message_sent",
              { fileType: hasFiles ? "file" : hasImages ? "image" : undefined },
              { ip: request.headers.get("x-forwarded-for") || undefined }
            ).catch((err) => console.error("Erreur logging audit:", err));
          } catch (error) {
            hasError = true;
            errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
            const errorData = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();

            // Logger l'erreur
            const duration = Date.now() - startTime;
            logUsage({
              userId: auth.userId!,
              endpoint: "/api/assistant/chat",
              tokensInput: 0,
              tokensOutput: 0,
              model: images && images.length > 0 ? "gpt-4o" : model,
              hasImages: hasImages,
              hasFiles: hasFiles,
              requestType,
              duration,
              success: false,
              error: errorMessage,
            }).catch((err) => console.error("Erreur logging usage:", err));
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
    const startTime = Date.now();

    let completion;
    try {
      // Utiliser gpt-4o si des images sont présentes (support vision)
      const modelToUse = images && images.length > 0 ? "gpt-4o" : model;
      
      completion = await openaiWithRetry(
        () =>
          openai.chat.completions.create(
            {
              model: modelToUse,
              messages,
              temperature: 0.7,
              max_tokens: 2000,
            },
            {
              signal: controller.signal,
            }
          ),
        { maxRetries: 3, initialDelay: 1000 }
      );
      clearTimeout(timeoutId);
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === "AbortError") {
        const duration = Date.now() - startTime;
        // Logger le timeout
        logUsage({
          userId: auth.userId!,
          endpoint: "/api/assistant/chat",
          tokensInput: 0,
          tokensOutput: 0,
          model: images && images.length > 0 ? "gpt-4o" : model,
          hasImages: hasImages,
          hasFiles: hasFiles,
          requestType,
          duration,
          success: false,
          error: "Timeout après 60 secondes",
        }).catch((err) => console.error("Erreur logging usage:", err));

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
    const duration = Date.now() - startTime;

    // Logger l'utilisation
    const usage = completion.usage;
    logUsage({
      userId: auth.userId!,
      endpoint: "/api/assistant/chat",
      tokensInput: usage?.prompt_tokens || 0,
      tokensOutput: usage?.completion_tokens || 0,
      model: images && images.length > 0 ? "gpt-4o" : model,
      hasImages: hasImages,
      hasFiles: hasFiles,
      requestType,
      duration,
      success: true,
    }).catch((err) => console.error("Erreur logging usage:", err));

    return NextResponse.json({
      success: true,
      response,
      rateLimit: {
        remaining: rateLimitResult.remaining - 1, // -1 car on a déjà incrémenté
        limit: rateLimitResult.limit,
        resetAt: rateLimitResult.resetAt,
      },
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

