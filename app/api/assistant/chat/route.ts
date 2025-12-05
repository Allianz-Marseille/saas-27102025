import { NextRequest, NextResponse } from "next/server";

const PINECONE_API_URL = "https://prod-1-data.ke.pinecone.io/mcp/assistants/commercial-quadri";
const TIMEOUT_MS = 30000; // 30 secondes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, category, theme } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Le message est requis" },
        { status: 400 }
      );
    }

    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      console.error("PINECONE_API_KEY n'est pas configurée");
      console.error("Variables d'environnement disponibles:", {
        hasPineconeKey: !!process.env.PINECONE_API_KEY,
        nodeEnv: process.env.NODE_ENV,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('PINE') || key.includes('API')),
      });
      // Retourner un message d'erreur user-friendly avec status 200 pour que le frontend puisse l'afficher
      return NextResponse.json(
        {
          error: "Configuration serveur manquante",
          response: "L'assistant IA n'est pas configuré correctement. Veuillez contacter l'administrateur pour configurer la clé API Pinecone (variable d'environnement PINECONE_API_KEY).",
        },
        { status: 200 }
      );
    }
    
    console.log("PINECONE_API_KEY trouvée, longueur:", apiKey.length);

    // Construire le message avec contexte de catégorie et/ou thème si disponible
    let contextualMessage = message;
    const contextParts: string[] = [];

    if (theme) {
      const themeLabels: Record<string, string> = {
        retail: "Offres Retail (Particuliers)",
        pro: "Offres Pro / Agri / Entreprise",
        specialized: "Offres Agents Différenciés & Spécialistes",
      };
      const themeLabel = themeLabels[theme] || theme;
      contextParts.push(`Thème: ${themeLabel}`);
    }

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
      contextParts.push(`Catégorie: ${categoryLabel}`);
    }

    if (contextParts.length > 0) {
      contextualMessage = `[${contextParts.join(", ")}] ${message}`;
    }

    // Appel à l'API Pinecone avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      console.log("Appel API Pinecone avec message:", contextualMessage);
      
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
        console.error("Erreur API Pinecone:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: PINECONE_API_URL,
        });
        
        // Retourner une réponse avec le message d'erreur mais en 200 pour que le frontend puisse l'afficher
        return NextResponse.json(
          {
            error: `Erreur de l'assistant IA (${response.status})`,
            response: `Désolé, je rencontre un problème technique (${response.status}). ${errorText || "Veuillez réessayer plus tard."}`,
          },
          { status: 200 } // On retourne 200 pour que le frontend puisse afficher l'erreur
        );
      }

      let data;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      console.log("Réponse API Pinecone:", data);

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
      } else if (data.content) {
        assistantResponse = data.content;
      } else if (data.answer) {
        assistantResponse = data.answer;
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

