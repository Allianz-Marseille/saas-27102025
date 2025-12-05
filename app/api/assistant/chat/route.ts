import { NextRequest, NextResponse } from "next/server";

// API Chat standard de Pinecone Assistant (PAS l'endpoint MCP)
const PINECONE_PROJECT_ID = process.env.PINECONE_PROJECT_ID || "prj_kcqNaE60ERclhMMTQYfzrlkKwx29";
const PINECONE_ASSISTANT_NAME = "saas-allianz";
// URL API Chat : https://api.pinecone.io/assistant/assistants/{assistant_name}/chat
const PINECONE_CHAT_API_URL = `https://api.pinecone.io/assistant/assistants/${PINECONE_ASSISTANT_NAME}/chat`;
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
 * Interface pour les réponses de l'API Chat standard de Pinecone Assistant
 */
interface PineconeChatResponse {
  message?: {
    content?: string;
    role?: string;
  };
  error?: {
    message?: string;
    code?: string;
  };
}

/**
 * Extrait la réponse de l'assistant depuis la réponse de l'API Chat
 */
function extractAssistantResponse(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object" && data !== null) {
    const response = data as PineconeChatResponse;
    
    // Format standard de l'API Chat: { message: { content: "..." } }
    if (response.message?.content) {
      return response.message.content;
    }
    
    // En cas d'erreur
    if (response.error?.message) {
      console.error("Erreur API Pinecone:", response.error);
      return `Erreur: ${response.error.message}`;
    }

    // Fallback : essayer de trouver du contenu ailleurs
    const dataObj = data as Record<string, unknown>;
    if (dataObj.content && typeof dataObj.content === "string") {
      return dataObj.content;
    }
  }

  return "Désolé, je n'ai pas pu traiter votre demande.";
}

/**
 * Construit le body de requête pour l'API Chat standard de Pinecone Assistant
 * Format: { messages: [{ role: "user", content: "..." }], stream: false }
 */
function buildChatRequest(
  message: string,
  category?: string,
  theme?: string
): { messages: Array<{ role: string; content: string }>; stream: boolean } {
  const contextualMessage = buildContextualMessage(message, category, theme);
  
  return {
    messages: [
      {
        role: "user",
        content: contextualMessage,
      },
    ],
    stream: false,
  };
}

/**
 * Gère les erreurs de l'API et retourne un message user-friendly
 */
function handleApiError(status: number, errorText: string): NextResponse {
  let userMessage: string;

  switch (status) {
    case 400:
      // Essayer d'extraire un message d'erreur plus spécifique
      let specificError = "";
      try {
        const parsed = JSON.parse(errorText);
        // Gérer les erreurs JSON-RPC avec validation Zod
        if (parsed.jsonrpc === "2.0" && parsed.error) {
          const error = parsed.error;
          if (error.data && Array.isArray(error.data)) {
            // Erreur Zod dans error.data
            const zodErrors = error.data as Array<{
              code?: string;
              path?: (string | number)[];
              message?: string;
            }>;
            const firstError = zodErrors[0];
            if (firstError?.message && firstError?.path) {
              specificError = `Erreur de validation: ${firstError.path.join(".")} - ${firstError.message}`;
            } else {
              specificError = error.message || "Format de requête invalide";
            }
          } else {
            specificError = error.message || "Erreur de requête";
          }
        } else {
          specificError = parsed.message || parsed.error?.message || "";
        }
      } catch {
        // Ce n'est pas du JSON, on garde le message générique
      }
      
      // Vérifier si c'est une erreur "Method not found"
      if (specificError && specificError.includes("Method not found")) {
        userMessage = "L'assistant IA rencontre un problème de configuration. Veuillez contacter l'administrateur ou réessayer plus tard.";
      } else if (specificError && !specificError.includes("Required") && !specificError.includes("invalid_type")) {
        // Afficher uniquement les erreurs compréhensibles pour l'utilisateur
        userMessage = `La requête n'est pas valide : ${specificError}. Veuillez reformuler votre question.`;
      } else {
        // Pour les erreurs de validation technique, message générique
        userMessage = "L'assistant IA rencontre une difficulté technique. Le système teste différents formats automatiquement. Veuillez réessayer dans quelques instants.";
      }
      break;
    case 401:
    case 403:
      // Essayer d'extraire plus de détails sur l'erreur d'authentification
      let authError = "";
      try {
        const parsed = JSON.parse(errorText);
        authError = parsed.message || parsed.error?.message || "";
      } catch {
        authError = errorText.substring(0, 200);
      }
      
      if (authError) {
        userMessage = `Problème d'authentification : ${authError}. Vérifiez la configuration de la clé API.`;
      } else {
        userMessage = "Problème d'authentification avec l'assistant IA. Vérifiez que la clé API Pinecone est correcte et que le nom de l'assistant est valide.";
      }
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

    // Validation du format de la clé API (doit commencer par pcsk_)
    const apiKeyPrefix = apiKey.trim().substring(0, 5);
    const apiKeyLastChars = apiKey.trim().length > 4 ? `...${apiKey.trim().slice(-4)}` : "****";
    
    if (!apiKey.trim().startsWith("pcsk_")) {
      console.error("PINECONE_API_KEY n'a pas le format attendu (doit commencer par pcsk_)", {
        keyPrefix: apiKeyPrefix,
        keyLength: apiKey.trim().length,
        keyLastChars: apiKeyLastChars,
      });
    }

    // Construction du message contextuel
    // Note: Le contexte (category/theme) est inclus dans les formats de requête testés
    // via la fonction generateRequestBodies qui construit différents formats incluant le contexte.
    // On ne l'applique pas directement ici car l'API Pinecone pourrait ne pas accepter
    // le format avec crochets dans tous les cas, donc on teste plusieurs variantes.
    const contextualMessage = message.trim();
    
    // Log conditionnel pour debug (uniquement en développement)
    const isDevelopment = process.env.NODE_ENV === "development";
    const hasContext = !!(category || theme);
    
    if (isDevelopment) {
      const contextualMessageForLog = buildContextualMessage(
        message.trim(),
        category,
        theme
      );
      console.log("Message original:", message.trim());
      console.log("Message contextuel (pour log):", contextualMessageForLog);
      console.log("Contexte présent:", { category, theme, hasContext });
    }

    // Appel à l'API Chat standard de Pinecone Assistant
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      // Construire la requête au format standard de l'API Chat
      const requestBody = buildChatRequest(message.trim(), category, theme);
      
      if (isDevelopment) {
        console.log("Appel API Chat Pinecone:", {
          url: PINECONE_CHAT_API_URL,
          body: requestBody,
        });
      }

      const startTime = Date.now();
      
      // Tester les deux formats d'authentification possibles
      // Format 1: Api-Key (format standard selon la doc)
      // Format 2: Authorization Bearer (format alternatif possible)
      
      let response: Response;
      let authMethod = "Api-Key";
      
      try {
        response = await fetch(PINECONE_CHAT_API_URL, {
          method: "POST",
          headers: {
            "Api-Key": apiKey,
            "Content-Type": "application/json",
            "X-Pinecone-Api-Version": "2025-01",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        
        // Si erreur 401/403, essayer avec Authorization Bearer
        if (response.status === 401 || response.status === 403) {
          if (isDevelopment) {
            console.log("Tentative avec Authorization Bearer au lieu de Api-Key");
          }
          authMethod = "Authorization Bearer";
          response = await fetch(PINECONE_CHAT_API_URL, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "X-Pinecone-Api-Version": "2025-01",
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });
        }
      } catch (fetchErr) {
        // En cas d'erreur réseau, essayer avec Authorization Bearer
        if (isDevelopment) {
          console.log("Erreur avec Api-Key, tentative avec Authorization Bearer");
        }
        authMethod = "Authorization Bearer";
        response = await fetch(PINECONE_CHAT_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "X-Pinecone-Api-Version": "2025-01",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      }

      const responseTime = Date.now() - startTime;
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: unknown = null;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          // Ce n'est pas du JSON
        }

        console.error("Erreur API Pinecone Chat:", {
          status: response.status,
          statusText: response.statusText,
          responseTime,
          authMethod,
          url: PINECONE_CHAT_API_URL,
          projectId: PINECONE_PROJECT_ID,
          assistantName: PINECONE_ASSISTANT_NAME,
          apiKeyPrefix: apiKey.trim().substring(0, 5),
          apiKeyLength: apiKey.trim().length,
          apiKeyLastChars: apiKey.trim().length > 4 ? `...${apiKey.trim().slice(-4)}` : "****",
          error: errorText,
          errorData,
          // Vérifier si l'URL ou l'assistant name est dans l'erreur
          suggestion: "Vérifier: 1) Clé API complète dans Vercel, 2) Nom assistant correct, 3) Clé API valide pour ce projet",
        });

        return handleApiError(response.status, errorText);
      }

      // Parser la réponse JSON
      const data: unknown = await response.json();
      
      if (isDevelopment) {
        console.log("Réponse API Chat reçue:", {
          responseTime,
          preview: JSON.stringify(data).substring(0, 500),
        });
      }

      // Extraction de la réponse
      const assistantResponse = extractAssistantResponse(data);

      return NextResponse.json({
        response: assistantResponse,
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);

      // Gestion du timeout
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("⏱️ Timeout atteint lors de l'appel à l'API Pinecone Chat", {
          timestamp: new Date().toISOString(),
          timeout: TIMEOUT_MS,
          pineconeApiUrl: PINECONE_CHAT_API_URL,
          suggestion: `Le timeout de ${TIMEOUT_MS}ms a été atteint. Considérez augmenter TIMEOUT_MS si nécessaire.`,
        });
        
        return NextResponse.json(
          {
            error: "Timeout",
            response: `La requête a pris trop de temps (limite: ${TIMEOUT_MS / 1000}s). Veuillez réessayer avec une question plus courte.`,
          },
          { status: 200 }
        );
      }

      // Gestion des erreurs réseau
      const errorName = fetchError instanceof Error ? fetchError.name : "Unknown";
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      
      console.error("Erreur réseau lors de l'appel à l'API Pinecone Chat:", {
        name: errorName,
        message: errorMessage,
        url: PINECONE_CHAT_API_URL,
      });

      return NextResponse.json(
        {
          error: "Erreur réseau",
          response: "Impossible de contacter l'assistant IA. Vérifiez votre connexion internet et réessayez.",
        },
        { status: 200 }
      );
    }
  } catch (error: unknown) {
    const errorName = error instanceof Error ? error.name : "Unknown";
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack?.substring(0, 200) : undefined;
    
    console.error("Erreur inattendue dans /api/assistant/chat:", {
      name: errorName,
      message: errorMessage,
      stack: errorStack,
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

