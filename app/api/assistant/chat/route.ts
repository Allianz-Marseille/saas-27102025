import { NextRequest, NextResponse } from "next/server";

const PINECONE_API_URL = "https://prod-1-data.ke.pinecone.io/mcp/assistants/commercial-quadri";
const TIMEOUT_MS = 30000; // 30 secondes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, category } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Le message est requis" },
        { status: 400 }
      );
    }

    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      console.error("PINECONE_API_KEY n'est pas configurée");
      return NextResponse.json(
        { error: "Configuration serveur manquante" },
        { status: 500 }
      );
    }

    // Construire le message avec contexte de catégorie si disponible
    let contextualMessage = message;
    if (category) {
      const categoryLabels: Record<string, string> = {
        auto: "Auto",
        mrh: "MRH",
        pj: "PJ",
        gav: "GAV",
        particulier: "Marché Particulier",
        pro: "Marché Pro",
        sante: "Marché Santé",
      };
      const categoryLabel = categoryLabels[category] || category;
      contextualMessage = `[Contexte: ${categoryLabel}] ${message}`;
    }

    // Appel à l'API Pinecone avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(PINECONE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          message: contextualMessage,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur API Pinecone:", response.status, errorText);
        return NextResponse.json(
          {
            error: `Erreur de l'assistant IA (${response.status})`,
            response: "Désolé, je rencontre un problème technique. Pouvez-vous reformuler votre question ?",
          },
          { status: response.status }
        );
      }

      const data = await response.json();

      // Gérer différents formats de réponse possibles
      let assistantResponse: string;
      if (typeof data === "string") {
        assistantResponse = data;
      } else if (data.response) {
        assistantResponse = data.response;
      } else if (data.message) {
        assistantResponse = data.message;
      } else if (data.text) {
        assistantResponse = data.text;
      } else {
        assistantResponse = JSON.stringify(data);
      }

      return NextResponse.json({
        response: assistantResponse,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          {
            error: "Timeout",
            response: "La requête a pris trop de temps. Pouvez-vous réessayer ?",
          },
          { status: 408 }
        );
      }

      console.error("Erreur lors de l'appel à l'API Pinecone:", fetchError);
      return NextResponse.json(
        {
          error: "Erreur réseau",
          response: "Impossible de contacter l'assistant IA. Vérifiez votre connexion et réessayez.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Erreur dans la route /api/assistant/chat:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        response: "Une erreur inattendue s'est produite. Veuillez réessayer plus tard.",
      },
      { status: 500 }
    );
  }
}

