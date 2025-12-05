import { NextRequest, NextResponse } from "next/server";

const PINECONE_API_URL = "https://prod-1-data.ke.pinecone.io/mcp/assistants/commercial-quadri";
const TIMEOUT_MS = 30000; // 30 secondes

/**
 * Construit le message contextuel avec catégorie et thème
 */
function buildContextualMessage(
  message: string,
  category?: string,
  theme?: string
): string {
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
    return `[${contextParts.join(", ")}] ${message}`;
  }

  return message;
}

/**
 * Extrait la réponse de l'assistant depuis différents formats de réponse
 */
function extractAssistantResponse(data: any): string {
  if (typeof data === "string") {
    return data;
  }

  // Essayer différents champs possibles
  const possibleFields = ["response", "message", "text", "content", "answer"];
  for (const field of possibleFields) {
    if (data[field] && typeof data[field] === "string") {
      return data[field];
    }
  }

  // Si c'est un objet avec une structure complexe, essayer de le formater
  if (typeof data === "object" && data !== null) {
    // Si l'objet contient un champ "result" ou similaire
    if (data.result) {
      return typeof data.result === "string" ? data.result : JSON.stringify(data.result);
    }
    // Sinon, retourner une représentation JSON
    return JSON.stringify(data);
  }

  return "Désolé, je n'ai pas pu traiter votre demande.";
}

/**
 * Gère les erreurs de l'API et retourne un message user-friendly
 */
function handleApiError(status: number, errorText: string): NextResponse {
  let userMessage: string;

  switch (status) {
    case 400:
      userMessage = "La requête est invalide. Veuillez réessayer avec une autre question.";
      break;
    case 401:
    case 403:
      userMessage = "Problème d'authentification avec l'assistant IA. Veuillez contacter l'administrateur.";
      break;
    case 404:
      userMessage = "L'assistant IA n'est pas disponible. Veuillez réessayer plus tard.";
      break;
    case 406:
      userMessage = "L'assistant IA n'accepte pas ce format de requête. Veuillez réessayer.";
      break;
    case 429:
      userMessage = "Trop de requêtes. Veuillez patienter quelques instants avant de réessayer.";
      break;
    case 500:
    case 502:
    case 503:
      userMessage = "L'assistant IA rencontre des difficultés techniques. Veuillez réessayer dans quelques instants.";
      break;
    default:
      userMessage = `Problème technique (${status}). Veuillez réessayer plus tard.`;
  }

  return NextResponse.json(
    {
      error: `Erreur ${status}`,
      response: userMessage,
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Validation du body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          error: "Format invalide",
          response: "Le format de la requête est invalide. Veuillez réessayer.",
        },
        { status: 200 }
      );
    }

    const { message, category, theme } = body;

    // Validation du message
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Message requis",
          response: "Veuillez saisir une question.",
        },
        { status: 200 }
      );
    }

    // Vérification de la clé API
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      console.error("PINECONE_API_KEY n'est pas configurée");
      return NextResponse.json(
        {
          error: "Configuration manquante",
          response: "L'assistant IA n'est pas configuré. Veuillez contacter l'administrateur pour configurer la clé API Pinecone.",
        },
        { status: 200 }
      );
    }

    // Construction du message contextuel
    const contextualMessage = buildContextualMessage(
      message.trim(),
      category,
      theme
    );

    // Appel à l'API Pinecone avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(PINECONE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          message: contextualMessage,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Gestion des erreurs HTTP
      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
        } catch {
          errorText = response.statusText || "Erreur inconnue";
        }

        console.error("Erreur API Pinecone:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 200), // Limiter la longueur du log
        });

        return handleApiError(response.status, errorText);
      }

      // Traitement de la réponse
      let data;
      const contentType = response.headers.get("content-type") || "";

      try {
        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            data = text;
          }
        }
      } catch (parseError) {
        console.error("Erreur lors du parsing de la réponse:", parseError);
        return NextResponse.json(
          {
            error: "Erreur de format",
            response: "La réponse de l'assistant IA est dans un format inattendu. Veuillez réessayer.",
          },
          { status: 200 }
        );
      }

      // Extraction de la réponse
      const assistantResponse = extractAssistantResponse(data);

      return NextResponse.json({
        response: assistantResponse,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      // Gestion du timeout
      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          {
            error: "Timeout",
            response: "La requête a pris trop de temps. Veuillez réessayer avec une question plus courte.",
          },
          { status: 200 }
        );
      }

      // Gestion des erreurs réseau
      console.error("Erreur réseau lors de l'appel à l'API Pinecone:", {
        name: fetchError.name,
        message: fetchError.message,
      });

      return NextResponse.json(
        {
          error: "Erreur réseau",
          response: "Impossible de contacter l'assistant IA. Vérifiez votre connexion internet et réessayez.",
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("Erreur inattendue dans /api/assistant/chat:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack?.substring(0, 200),
    });

    return NextResponse.json(
      {
        error: "Erreur serveur",
        response: "Une erreur inattendue s'est produite. Veuillez réessayer plus tard ou contacter le support si le problème persiste.",
      },
      { status: 200 }
    );
  }
}

