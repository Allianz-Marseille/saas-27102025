/**
 * API Route pour le chatbot RAG (Retrieval-Augmented Generation)
 * POST : Chat avec récupération de contexte depuis la base de connaissances
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { retrieveContext, buildRAGPrompt } from "@/lib/assistant/rag";
import { searchSimilarChunks } from "@/lib/assistant/vector-search";
import { generateEmbedding } from "@/lib/assistant/embeddings";
import { checkRateLimit, determineRequestType } from "@/lib/assistant/rate-limiting";
import { openaiWithRetry } from "@/lib/assistant/retry";
import { logUsage } from "@/lib/assistant/monitoring";
import { checkBudgetLimit } from "@/lib/assistant/budget-alerts";
import { trackMultipleSourceUsage } from "@/lib/assistant/usage-tracking";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/assistant/rag
 * Chat avec RAG : récupère le contexte pertinent puis génère une réponse
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification ET le rôle administrateur
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json(
        { 
          error: auth.error || "Accès administrateur requis",
          details: "Le mode RAG est réservé aux administrateurs uniquement"
        }, 
        { status: 403 }
      );
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
    const { 
      message, 
      images, 
      files, 
      history = [],
      useRAG = true, 
      model = "gpt-4o", 
      stream = false, 
      showDebug = false,
      searchMode = "vector",
      category,
      dateFrom,
      dateTo,
      keywords,
    } = body;
    const useStream = stream;

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

    let context = "";
    let sources: string[] = [];
    let sourcesWithScores: { title: string; score: number; documentId: string }[] = [];

    // Récupérer le contexte RAG si activé (seulement si message texte présent)
    if (useRAG && message) {
      try {
        // Construire les filtres de recherche
        const filters: any = {
          searchMode: searchMode || "vector",
        };
        
        if (category) filters.category = category;
        if (dateFrom) filters.dateFrom = new Date(dateFrom);
        if (dateTo) filters.dateTo = new Date(dateTo);
        if (keywords) filters.keywords = keywords;

        const ragContext = await retrieveContext(message, {
          topK: 5,
          minScore: 0.7,
        }, filters);
        context = ragContext.chunks
          .map((chunk) => chunk.content)
          .join("\n\n---\n\n");
        sources = ragContext.sources;
        
        // Récupérer les scores de similarité pour chaque chunk
        const queryEmbedding = await generateEmbedding(message);
        const searchResults = await searchSimilarChunks(
          queryEmbedding,
          { topK: 5, minScore: 0.7 },
          filters
        );
        sourcesWithScores = searchResults.map((result) => ({
          title: result.chunk.metadata.documentTitle || result.chunk.metadata.source || "Document",
          score: result.score,
          documentId: result.chunk.metadata.documentId,
        }));

        // Tracker l'utilisation des sources (en arrière-plan)
        if (auth.userId && sourcesWithScores.length > 0) {
          trackMultipleSourceUsage(
            sourcesWithScores.map((s) => ({
              documentId: s.documentId,
              score: s.score,
            })),
            auth.userId,
            message
          ).catch(console.error);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du contexte RAG:", error);
        // Continuer sans contexte RAG si la récupération échoue
      }
    }

    // Construire le prompt avec le contexte
    const systemPrompt = `Tu es un assistant IA spécialisé dans l'assurance pour l'agence Allianz.
Tu dois répondre aux questions en utilisant le contexte fourni ci-dessous.
Si le contexte ne contient pas d'information pertinente, tu peux utiliser tes connaissances générales.
Toujours citer les sources utilisées quand c'est possible.`;

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

    // Construire le contenu du message utilisateur
    const promptWithContext = buildRAGPrompt(messageText || "", context, systemPrompt);
    
    let userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
    
    // Ajouter le texte avec contexte RAG
    userContent.push({
      type: "text",
      text: promptWithContext,
    });

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
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

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

    // Ajouter le message utilisateur actuel avec le contexte RAG
    messages.push({
      role: "user",
      content: userContent.length > 1 ? userContent : promptWithContext,
    });

    // Si streaming demandé, utiliser Server-Sent Events
    if (useStream) {
      const encoder = new TextEncoder();
      const startTime = Date.now();
      let tokensInput = 0;
      let tokensOutput = 0;

      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Envoyer les métadonnées d'abord (sources, etc.)
            if (sourcesWithScores && sourcesWithScores.length > 0) {
              const metadata = `data: ${JSON.stringify({ 
                type: "metadata",
                sources: sources.length > 0 ? sources : undefined,
                sourcesWithScores,
                usedRAG: useRAG && context.length > 0,
                context: showDebug && context.length > 0 ? context : undefined,
                rateLimit: {
                  remaining: rateLimitResult.remaining - 1, // -1 car on a déjà incrémenté
                  limit: rateLimitResult.limit,
                  resetAt: rateLimitResult.resetAt,
                },
              })}\n\n`;
              controller.enqueue(encoder.encode(metadata));
            } else {
              // Envoyer les métadonnées même sans sources (pour le rate limit)
              const metadata = `data: ${JSON.stringify({ 
                type: "metadata",
                usedRAG: useRAG && context.length > 0,
                rateLimit: {
                  remaining: rateLimitResult.remaining - 1, // -1 car on a déjà incrémenté
                  limit: rateLimitResult.limit,
                  resetAt: rateLimitResult.resetAt,
                },
              })}\n\n`;
              controller.enqueue(encoder.encode(metadata));
            }

            // Utiliser gpt-4o si des images sont présentes (support vision)
            const modelToUse = images && images.length > 0 ? "gpt-4o" : model;
            
            // Estimer les tokens d'entrée
            const messageText = JSON.stringify(messages);
            tokensInput = Math.ceil(messageText.length / 4);
            
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

            for await (const chunk of openaiStream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                tokensOutput += Math.ceil(content.length / 4);
                const data = `data: ${JSON.stringify({ type: "content", content })}\n\n`;
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

            // Logger l'utilisation
            const duration = Date.now() - startTime;
            logUsage({
              userId: auth.userId!,
              endpoint: "/api/assistant/rag",
              tokensInput,
              tokensOutput,
              model: modelToUse,
              hasImages: hasImages,
              hasFiles: hasFiles,
              requestType,
              duration,
              success: true,
            }).catch((err) => console.error("Erreur logging usage:", err));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
            const errorData = `data: ${JSON.stringify({ 
              type: "error",
              error: errorMessage
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();

            // Logger l'erreur
            const duration = Date.now() - startTime;
            logUsage({
              userId: auth.userId!,
              endpoint: "/api/assistant/rag",
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
      sources: sources.length > 0 ? sources : undefined,
      sourcesWithScores: sourcesWithScores.length > 0 ? sourcesWithScores : undefined,
      usedRAG: useRAG && context.length > 0,
      context: context.length > 0 ? context : undefined, // Pour le mode debug
      rateLimit: {
        remaining: rateLimitResult.remaining - 1, // -1 car on a déjà incrémenté
        limit: rateLimitResult.limit,
        resetAt: rateLimitResult.resetAt,
      },
    });
  } catch (error) {
    console.error("Erreur POST /api/assistant/rag:", error);

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

