import { NextRequest, NextResponse } from "next/server";

const PINECONE_API_URL = "https://prod-1-data.ke.pinecone.io/mcp/assistants/saas-allianz";
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
 * L'API utilise streamable HTTP transport (SSE) avec des outils MCP
 */
interface PineconeResponse {
  // Format MCP avec outils
  tool?: string;
  content?: string | Array<{ type: string; text: string }>;
  isError?: boolean;
  // Format streamable HTTP transport (SSE)
  event?: string;
  data?: unknown;
  // Format JSON-RPC (si utilisé)
  jsonrpc?: string;
  id?: number;
  result?: string | { message?: string; response?: string; text?: string; content?: string };
  error?: { code: number; message: string; data?: unknown };
  // Formats directs (fallback)
  response?: string;
  message?: string;
  text?: string;
  answer?: string;
}

/**
 * Extrait la réponse de l'assistant depuis différents formats de réponse
 * L'API Pinecone MCP utilise streamable HTTP transport avec des outils
 */
function extractAssistantResponse(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object" && data !== null) {
    const response = data as PineconeResponse;
    
    // Format MCP avec outil "context" : extraire le contenu
    if (response.content) {
      // Le contenu peut être une string ou un array d'objets avec type/text
      if (typeof response.content === "string") {
        return response.content;
      }
      if (Array.isArray(response.content)) {
        // Format MCP standard : array de { type: string, text: string }
        const texts = response.content
          .filter((item: unknown) => typeof item === "object" && item !== null && "text" in item)
          .map((item: { text?: string }) => item.text || "")
          .filter((text: string) => text.length > 0);
        if (texts.length > 0) {
          return texts.join("\n");
        }
      }
    }
    
    // Format JSON-RPC 2.0 (fallback si utilisé)
    if (response.jsonrpc === "2.0") {
      if (response.error) {
        console.error("Erreur JSON-RPC:", response.error);
        return `Erreur: ${response.error.message || "Erreur inconnue"}`;
      }
      if (response.result) {
        if (typeof response.result === "string") {
          return response.result;
        }
        if (typeof response.result === "object") {
          const resultObj = response.result as Record<string, unknown>;
          const possibleFields = ["message", "response", "text", "content", "answer"];
          for (const field of possibleFields) {
            const value = resultObj[field];
            if (value && typeof value === "string") {
              return value;
            }
          }
        }
      }
    }
    
    // Formats directs (fallback) : essayer différents champs possibles
    const possibleFields: (keyof PineconeResponse)[] = ["response", "message", "text", "content", "answer"];
    for (const field of possibleFields) {
      const value = response[field];
      if (value && typeof value === "string") {
        return value;
      }
    }

    // Si l'objet contient un champ "result" (format non JSON-RPC)
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
 * L'API Pinecone MCP utilise JSON-RPC 2.0 avec des champs obligatoires :
 * - jsonrpc: "2.0" (obligatoire)
 * - id: string | number (obligatoire)
 * - method: string (obligatoire)
 */
function generateRequestBodies(
  message: string,
  category?: string,
  theme?: string
): Array<{ body: Record<string, unknown>; name: string }> {
  const contextualMessage = buildContextualMessage(message, category, theme);
  const cleanMessage = message.trim();
  const hasContext = !!(category || theme);
  
  const formats: Array<{ body: Record<string, unknown>; name: string }> = [];
  
  // FORMATS DIRECTS EN PRIORITÉ (sans JSON-RPC)
  // L'API Pinecone MCP pourrait accepter des formats REST simples
  
  // Format 1 : Message simple avec contexte (priorité)
  if (hasContext) {
    formats.push({
      name: "direct_message_with_context",
      body: {
        message: contextualMessage,
      },
    });
  }
  
  // Format 2 : Message simple
  formats.push({
    name: "direct_message",
    body: {
      message: cleanMessage,
    },
  });
  
  // Format 3 : Query
  formats.push({
    name: "direct_query",
    body: {
      query: cleanMessage,
    },
  });
  
  // Format 4 : Input
  formats.push({
    name: "direct_input",
    body: {
      input: cleanMessage,
    },
  });
  
  // Format 5 : Prompt
  formats.push({
    name: "direct_prompt",
    body: {
      prompt: cleanMessage,
    },
  });
  
  // Format 6 : Text
  formats.push({
    name: "direct_text",
    body: {
      text: cleanMessage,
    },
  });
  
  // Format 7 : Avec conversation history
  formats.push({
    name: "direct_with_conversation",
    body: {
      message: cleanMessage,
      conversation: [],
    },
  });
  
  // FORMATS JSON-RPC 2.0 en fallback (si les formats directs ne fonctionnent pas)
  // Tester d'autres méthodes possibles
  
  const jsonrpcMethods = [
    "assistant/query",
    "assistant/chat",
    "assistant/message",
    "query",
    "chat",
    "message",
    "send",
    "send_message",
    "invoke",
    "call",
  ];
  
  for (const method of jsonrpcMethods) {
    // Format avec message
    formats.push({
      name: `jsonrpc_${method.replace(/\//g, "_")}_message`,
      body: {
        jsonrpc: "2.0",
        id: 1,
        method: method,
        params: {
          message: cleanMessage,
        },
      },
    });
    
    // Format avec query
    formats.push({
      name: `jsonrpc_${method.replace(/\//g, "_")}_query`,
      body: {
        jsonrpc: "2.0",
        id: 1,
        method: method,
        params: {
          query: cleanMessage,
        },
      },
    });
    
    // Format avec input
    formats.push({
      name: `jsonrpc_${method.replace(/\//g, "_")}_input`,
      body: {
        jsonrpc: "2.0",
        id: 1,
        method: method,
        params: {
          input: cleanMessage,
        },
      },
    });
  }
  
  return formats;
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
      
      if (specificError && !specificError.includes("Required") && !specificError.includes("invalid_type")) {
        // Afficher uniquement les erreurs compréhensibles pour l'utilisateur
        userMessage = `La requête n'est pas valide : ${specificError}. Veuillez reformuler votre question.`;
      } else {
        // Pour les erreurs de validation technique, message générique
        userMessage = "La requête est invalide. Le système teste différents formats automatiquement. Veuillez réessayer.";
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
      let lastError: { status: number; errorText: string; errorJson: unknown; formatName: string; responseTime: number } | null = null;
      let successfulResponse: Response | null = null;
      let successfulBodyName = "";
      const formatAttempts: Array<{ name: string; status: number; responseTime: number; error?: string }> = [];

      for (const { body, name } of requestBodies) {
        try {
          const startTime = Date.now();
          
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
              Accept: "application/json, text/event-stream",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          const responseTime = Date.now() - startTime;
          
          // Avertissement si le temps de réponse dépasse 10s
          if (responseTime > 10000) {
            console.warn(`⚠️ Format ${name} a pris ${responseTime}ms (> 10s)`, {
              format: name,
              responseTime,
              status: response.status,
            });
          }

          // Si la requête réussit, on s'arrête
          if (response.ok) {
            successfulResponse = response;
            successfulBodyName = name;
            
            formatAttempts.push({
              name,
              status: response.status,
              responseTime,
            });
            
            if (isDevelopment) {
              console.log(`✅ Format ${name} accepté par l'API (${responseTime}ms)`);
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
            
            // Vérifier si c'est une erreur JSON-RPC "Method not found" (-32601)
            // Dans ce cas, on continue avec les autres méthodes JSON-RPC ou formats
            const isJsonRpcMethodNotFound = 
              typeof errorJson === "object" && 
              errorJson !== null && 
              "error" in errorJson &&
              typeof (errorJson as { error?: unknown }).error === "object" &&
              (errorJson as { error?: { code?: number } }).error?.code === -32601;

            lastError = {
              status: response.status,
              errorText: errorContent,
              errorJson,
              formatName: name,
              responseTime,
            };

            formatAttempts.push({
              name,
              status: response.status,
              responseTime,
              error: errorContent.substring(0, 200),
            });

            if (isDevelopment) {
              console.log(`❌ Format ${name} rejeté (${response.status}, ${responseTime}ms):`, {
                error: errorContent.substring(0, 500),
                errorJson,
                isMethodNotFound: isJsonRpcMethodNotFound,
                requestBody: JSON.stringify(body),
                messageLength: message.trim().length,
              });
            }

            // Pour les erreurs "Method not found" JSON-RPC, continuer à essayer d'autres méthodes
            // Pour les autres erreurs 4xx, continuer aussi avec le format suivant
            continue;
          }

          // Pour les autres erreurs (401, 403, 500, etc.), on s'arrête
          const errorContent = await response.text().catch(() => response.statusText);
          lastError = {
            status: response.status,
            errorText: errorContent,
            errorJson: null,
            formatName: name,
            responseTime,
          };
          
          formatAttempts.push({
            name,
            status: response.status,
            responseTime,
            error: errorContent.substring(0, 200),
          });
          
          break;

        } catch (fetchError: unknown) {
          // Erreur réseau ou timeout
          const isTimeout = fetchError instanceof Error && fetchError.name === "AbortError";
          
          if (isTimeout) {
            console.error(`⏱️ Format ${name} - Timeout après ${TIMEOUT_MS}ms`);
            formatAttempts.push({
              name,
              status: 0,
              responseTime: TIMEOUT_MS,
              error: "Timeout",
            });
          } else {
            // Erreur réseau, on continue avec le format suivant
            if (isDevelopment) {
              console.log(`❌ Format ${name} - Erreur réseau:`, fetchError);
            }
            formatAttempts.push({
              name,
              status: 0,
              responseTime: 0,
              error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            });
          }
          
          // Si c'est un timeout, on arrête car tous les autres formats échoueront aussi
          if (isTimeout) {
            break;
          }
          
          continue;
        }
      }

      clearTimeout(timeoutId);

      // Si aucun format n'a fonctionné
      if (!successfulResponse && lastError) {
        // Log structuré complet en production pour faciliter l'analyse dans Vercel
        const errorLog = {
          timestamp: new Date().toISOString(),
          error: "Tous les formats de requête ont échoué",
          configuration: {
            pineconeApiUrl: PINECONE_API_URL,
            timeout: TIMEOUT_MS,
            apiKeyPresent: !!apiKey,
            apiKeyLength: apiKey.trim().length,
            apiKeyPrefix: apiKeyPrefix,
            apiKeyLastChars: apiKeyLastChars,
          },
          lastError: {
            status: lastError.status,
            formatName: lastError.formatName,
            responseTime: lastError.responseTime,
            errorText: lastError.errorText, // Complet, sans limite
            errorJson: lastError.errorJson, // Complet
          },
          formatsTested: formatAttempts.map(attempt => ({
            name: attempt.name,
            status: attempt.status,
            responseTime: attempt.responseTime,
            error: attempt.error,
          })),
          requestInfo: {
            messageLength: message.trim().length,
            hasCategory: !!category,
            hasTheme: !!theme,
            category: category || null,
            theme: theme || null,
          },
        };
        
        console.error(JSON.stringify(errorLog, null, 2));

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
      const isStreaming = contentType.includes("text/event-stream");
      
      try {
        // Si c'est un stream (text/event-stream), le parser
        if (isStreaming) {
          const rawText = await response.text();
          
          if (isDevelopment) {
            console.log("Réponse stream reçue:", {
              contentType,
              length: rawText.length,
              preview: rawText.substring(0, 500),
            });
          }
          
          // Parser le format Server-Sent Events (SSE) pour MCP
          // Format: "event: message\ndata: {...}\n\n" ou "event: tool_response\ndata: {...}"
          const lines = rawText.split("\n");
          const messages: string[] = [];
          let currentEvent: string | null = null;
          let currentData: string[] = [];
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.startsWith("event: ")) {
              // Nouvel événement, traiter les données précédentes si disponibles
              if (currentData.length > 0 && currentEvent) {
                const dataStr = currentData.join("\n");
                try {
                  const parsed = JSON.parse(dataStr);
                  // Extraire le contenu selon le type d'événement MCP
                  if (currentEvent === "message" || currentEvent === "tool_response") {
                    const extracted = extractAssistantResponse(parsed);
                    if (extracted && extracted !== "Désolé, je n'ai pas pu traiter votre demande.") {
                      messages.push(extracted);
                    }
                  }
                } catch {
                  // Si ce n'est pas du JSON, utiliser le texte brut
                  if (dataStr.trim()) {
                    messages.push(dataStr);
                  }
                }
              }
              currentEvent = line.substring(7).trim(); // Enlever "event: "
              currentData = [];
            } else if (line.startsWith("data: ")) {
              // Accumuler les données (peuvent être sur plusieurs lignes)
              currentData.push(line.substring(6)); // Enlever "data: "
            } else if (line.trim() === "" && currentData.length > 0) {
              // Ligne vide = fin d'un message SSE, traiter
              const dataStr = currentData.join("\n");
              try {
                const parsed = JSON.parse(dataStr);
                const extracted = extractAssistantResponse(parsed);
                if (extracted && extracted !== "Désolé, je n'ai pas pu traiter votre demande.") {
                  messages.push(extracted);
                }
              } catch {
                if (dataStr.trim()) {
                  messages.push(dataStr);
                }
              }
              currentData = [];
            }
          }
          
          // Traiter les dernières données si disponibles
          if (currentData.length > 0) {
            const dataStr = currentData.join("\n");
            try {
              const parsed = JSON.parse(dataStr);
              const extracted = extractAssistantResponse(parsed);
              if (extracted && extracted !== "Désolé, je n'ai pas pu traiter votre demande.") {
                messages.push(extracted);
              }
            } catch {
              if (dataStr.trim()) {
                messages.push(dataStr);
              }
            }
          }
          
          // Combiner tous les messages reçus ou utiliser le texte brut
          data = messages.length > 0 ? messages.join("\n") : rawText;
        } else {
          // Format JSON normal
          const rawText = await response.text();
          
          if (isDevelopment) {
            console.log("Réponse JSON de l'API:", {
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
        console.error("⏱️ Timeout atteint lors de l'appel à l'API Pinecone", {
          timestamp: new Date().toISOString(),
          timeout: TIMEOUT_MS,
          pineconeApiUrl: PINECONE_API_URL,
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

