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
 * Interface pour les réponses possibles de l'API Pinecone MCP
 */
interface PineconeResponse {
  response?: string;
  message?: string;
  text?: string;
  content?: string;
  answer?: string;
  result?: string | unknown;
}

/**
 * Extrait la réponse de l'assistant depuis différents formats de réponse
 */
function extractAssistantResponse(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object" && data !== null) {
    const response = data as PineconeResponse;
    
    // Essayer différents champs possibles
    const possibleFields: (keyof PineconeResponse)[] = ["response", "message", "text", "content", "answer"];
    for (const field of possibleFields) {
      const value = response[field];
      if (value && typeof value === "string") {
        return value;
      }
    }

    // Si l'objet contient un champ "result"
    if (response.result) {
      return typeof response.result === "string" 
        ? response.result 
        : JSON.stringify(response.result);
    }

    // Sinon, retourner une représentation JSON
    return JSON.stringify(data);
  }

  return "Désolé, je n'ai pas pu traiter votre demande.";
}

/**
 * Génère différents formats de body de requête à tester
 */
function generateRequestBodies(
  message: string,
  category?: string,
  theme?: string
): Array<{ body: Record<string, unknown>; name: string }> {
  const contextualMessage = buildContextualMessage(message, category, theme);
  const cleanMessage = message.trim();
  
  return [
    // Format 1 : Message simple (priorité pour éviter Parse error)
    {
      name: "message_only",
      body: {
        message: cleanMessage,
      },
    },
    // Format 2 : Message avec paramètres séparés
    {
      name: "message_with_params",
      body: {
        message: cleanMessage,
        ...(category && { category }),
        ...(theme && { theme }),
      },
    },
    // Format 3 : Query simple
    {
      name: "query_only",
      body: {
        query: cleanMessage,
      },
    },
    // Format 4 : Query avec paramètres
    {
      name: "query_with_params",
      body: {
        query: cleanMessage,
        ...(category && { category }),
        ...(theme && { theme }),
      },
    },
    // Format 5 : Input simple
    {
      name: "input_only",
      body: {
        input: cleanMessage,
      },
    },
    // Format 6 : Prompt simple
    {
      name: "prompt_only",
      body: {
        prompt: cleanMessage,
      },
    },
    // Format 7 : Text simple
    {
      name: "text_only",
      body: {
        text: cleanMessage,
      },
    },
    // Format 8 : Message avec contexte (testé en dernier car peut causer Parse error)
    {
      name: "message_with_context",
      body: {
        message: contextualMessage,
      },
    },
    // Format 9 : Format avec conversation (si l'API le supporte)
    {
      name: "message_with_conversation",
      body: {
        message: cleanMessage,
        conversation: [],
      },
    },
  ];
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
        specificError = parsed.message || parsed.error?.message || "";
      } catch {
        // Ce n'est pas du JSON, on garde le message générique
      }
      
      if (specificError) {
        userMessage = `La requête n'est pas valide : ${specificError}. Veuillez reformuler votre question.`;
      } else {
        userMessage = "La requête est invalide. Veuillez réessayer avec une autre question ou contacter le support si le problème persiste.";
      }
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
    // Note: On envoie le message tel quel, sans formatage contextuel
    // car l'API Pinecone pourrait ne pas accepter le format avec crochets
    const contextualMessage = message.trim();
    
    // Log conditionnel pour debug (uniquement en développement)
    const isDevelopment = process.env.NODE_ENV === "development";
    
    if (isDevelopment) {
      const contextualMessageForLog = buildContextualMessage(
        message.trim(),
        category,
        theme
      );
      console.log("Message original:", message.trim());
      console.log("Message contextuel (pour log):", contextualMessageForLog);
    }

    // Appel à l'API Pinecone avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      // Générer les différents formats de requête à tester
      const requestBodies = generateRequestBodies(
        message.trim(),
        category,
        theme
      );

      // Essayer chaque format jusqu'à trouver celui qui fonctionne
      let lastError: { status: number; errorText: string; errorJson: unknown } | null = null;
      let successfulResponse: Response | null = null;
      let successfulBodyName = "";

      for (const { body, name } of requestBodies) {
        try {
          // Log conditionnel (uniquement en développement)
          if (isDevelopment) {
            console.log(`Tentative avec format: ${name}`, {
              url: PINECONE_API_URL,
              body,
            });
          }

          const response = await fetch(PINECONE_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          // Si la requête réussit, on s'arrête
          if (response.ok) {
            successfulResponse = response;
            successfulBodyName = name;
            
            if (isDevelopment) {
              console.log(`✅ Format ${name} accepté par l'API`);
            }
            break;
          }

          // Si c'est une erreur 4xx (client error), on essaie le format suivant
          if (response.status >= 400 && response.status < 500) {
            const errorContent = await response.text();
            let errorJson: unknown = null;
            
            try {
              errorJson = JSON.parse(errorContent);
            } catch {
              // Ce n'est pas du JSON
            }

            lastError = {
              status: response.status,
              errorText: errorContent,
              errorJson,
            };

            if (isDevelopment) {
              console.log(`❌ Format ${name} rejeté (${response.status}):`, {
                error: errorContent.substring(0, 500),
                errorJson,
                requestBody: JSON.stringify(body),
                messageLength: message.trim().length,
              });
            }

            // Continuer avec le format suivant pour toutes les erreurs 4xx
            continue;
          }

          // Pour les autres erreurs (401, 403, 500, etc.), on s'arrête
          lastError = {
            status: response.status,
            errorText: await response.text().catch(() => response.statusText),
            errorJson: null,
          };
          break;

        } catch (fetchError: unknown) {
          // Erreur réseau, on continue avec le format suivant
          if (isDevelopment) {
            console.log(`❌ Format ${name} - Erreur réseau:`, fetchError);
          }
          continue;
        }
      }

      clearTimeout(timeoutId);

      // Si aucun format n'a fonctionné
      if (!successfulResponse && lastError) {
        console.error("Tous les formats de requête ont échoué. Dernière erreur:", {
          status: lastError.status,
          errorText: lastError.errorText.substring(0, 500),
          errorJson: lastError.errorJson,
          formatsTested: requestBodies.map(b => b.name),
        });

        // Si c'était une erreur 400, donner plus de détails
        if (lastError.status === 400) {
          const errorMessage = 
            (typeof lastError.errorJson === "object" && lastError.errorJson !== null && "message" in lastError.errorJson)
              ? String(lastError.errorJson.message)
              : lastError.errorText;

          return NextResponse.json(
            {
              error: `Erreur ${lastError.status}`,
              response: errorMessage
                ? `La requête n'est pas valide : ${errorMessage}. Veuillez reformuler votre question.`
                : "La requête n'est pas valide. Veuillez reformuler votre question ou contacter le support.",
            },
            { status: 200 }
          );
        }

        return handleApiError(lastError.status, lastError.errorText);
      }

      // Si aucun format n'a fonctionné et pas d'erreur (cas improbable)
      if (!successfulResponse) {
        return NextResponse.json(
          {
            error: "Erreur inconnue",
            response: "Impossible de contacter l'assistant IA. Veuillez réessayer.",
          },
          { status: 200 }
        );
      }

      // Traitement de la réponse réussie
      const response = successfulResponse;
      
      if (isDevelopment && successfulBodyName) {
        console.log(`✅ Réponse réussie avec le format: ${successfulBodyName}`);
      }

      // Traitement de la réponse de l'API
      let data: unknown;
      const contentType = response.headers.get("content-type") || "";
      
      try {
        // Lire le contenu brut d'abord pour le logging
        const rawText = await response.text();
        
        if (isDevelopment) {
          console.log("Réponse brute de l'API:", {
            contentType,
            length: rawText.length,
            preview: rawText.substring(0, 500),
          });
        }
        
        if (contentType.includes("application/json")) {
          try {
            data = JSON.parse(rawText);
          } catch (jsonError) {
            // Si le parsing JSON échoue, essayer de logger l'erreur
            console.error("Erreur parsing JSON:", {
              error: jsonError,
              rawText: rawText.substring(0, 1000),
            });
            // Essayer de traiter comme texte
            data = rawText;
          }
        } else {
          // Essayer de parser comme JSON même si le content-type n'est pas JSON
          try {
            data = JSON.parse(rawText);
          } catch {
            // Si ça ne marche pas, utiliser le texte brut
            data = rawText;
          }
        }
      } catch (parseError) {
        console.error("Erreur lors du parsing de la réponse:", {
          error: parseError,
          contentType,
        });
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
      
      if (isDevelopment) {
        console.log("Réponse extraite:", {
          length: assistantResponse.length,
          preview: assistantResponse.substring(0, 200),
        });
      }

      return NextResponse.json({
        response: assistantResponse,
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);

      // Gestion du timeout
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          {
            error: "Timeout",
            response: "La requête a pris trop de temps. Veuillez réessayer avec une question plus courte.",
          },
          { status: 200 }
        );
      }

      // Gestion des erreurs réseau
      const errorName = fetchError instanceof Error ? fetchError.name : "Unknown";
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      
      console.error("Erreur réseau lors de l'appel à l'API Pinecone:", {
        name: errorName,
        message: errorMessage,
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

