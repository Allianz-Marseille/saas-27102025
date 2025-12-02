import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, conversationHistory, userId } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query est requis" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId est requis" },
        { status: 400 }
      );
    }

    // Vérifier la clé API OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY manquante dans les variables d'environnement");
      return NextResponse.json(
        { 
          error: "Configuration OpenAI manquante",
          details: "OPENAI_API_KEY n'est pas configurée. Veuillez l'ajouter dans les variables d'environnement Vercel."
        },
        { status: 500 }
      );
    }

    // Import dynamique d'OpenAI pour éviter les erreurs de build
    let OpenAI;
    try {
      OpenAI = (await import("openai")).default;
    } catch (importError) {
      console.error("Erreur import OpenAI:", importError);
      return NextResponse.json(
        { 
          error: "Erreur d'import du module OpenAI",
          details: importError instanceof Error ? importError.message : "Erreur inconnue"
        },
        { status: 500 }
      );
    }

    // Initialiser OpenAI
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Construire les messages pour OpenAI
    const messages: any[] = [
      {
        role: "system",
        content: `Tu es l'assistant virtuel d'Allianz Marseille. Tu aides les commerciaux et administrateurs de l'agence avec leurs questions.

Sois professionnel, courtois et précis dans tes réponses. Si tu ne connais pas une information spécifique à l'agence, dis-le clairement.

Note : La base de connaissances RAG sera bientôt activée pour te donner accès aux documents de l'agence.`,
      },
    ];

    // Ajouter l'historique de conversation (limité aux 10 derniers messages)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }

    // Ajouter la question actuelle
    messages.push({
      role: "user",
      content: query,
    });

    // Appel à OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseMessage = completion.choices[0]?.message?.content || 
      "Désolé, je n'ai pas pu générer de réponse.";

    return NextResponse.json({
      message: responseMessage,
      sources: [],
      searchResults: [],
      metadata: {
        model: "gpt-4o",
        hasContext: false,
        fallbackMode: true,
      },
    });
  } catch (error) {
    console.error("Erreur API chat:", error);
    
    // Log détaillé pour le debugging
    if (error instanceof Error) {
      console.error("Message d'erreur:", error.message);
      console.error("Stack:", error.stack);
    }
    
    // Message d'erreur plus informatif
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Erreur inconnue";
    
    // Vérifier si c'est une erreur OpenAI
    if (errorMessage.includes("API key") || errorMessage.includes("401")) {
      return NextResponse.json(
        {
          error: "Configuration OpenAI invalide. Vérifiez votre clé API.",
          details: "OPENAI_API_KEY manquante ou invalide",
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Erreur lors du traitement de la requête",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

