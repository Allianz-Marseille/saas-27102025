import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";

const PINECONE_API_URL = "https://prod-1-data.ke.pinecone.io/mcp/assistants/saas-allianz";
const TIMEOUT_MS = 30000;

/**
 * Endpoint de diagnostic pour vérifier la configuration et la santé de Pinecone
 * Accessible uniquement aux administrateurs
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est administrateur
    const authResult = await verifyAdmin(request);
    
    if (!authResult.valid) {
      return NextResponse.json(
        { 
          error: "Accès refusé",
          message: authResult.error || "Accès administrateur requis"
        },
        { status: 403 }
      );
    }

    // Vérifier la présence de la clé API
    const apiKey = process.env.PINECONE_API_KEY;
    const apiKeyPresent = !!(apiKey && apiKey.trim().length > 0);
    const apiKeyLength = apiKey?.trim().length || 0;
    const apiKeyPrefix = apiKey && apiKey.length > 5 ? apiKey.substring(0, 5) : "N/A";
    const apiKeyLastChars = apiKey && apiKey.length > 4 ? `...${apiKey.slice(-4)}` : "****";
    const apiKeyValidFormat = apiKey ? apiKey.trim().startsWith("pcsk_") : false;

    // Configuration
    const config = {
      pineconeApiUrl: PINECONE_API_URL,
      timeout: TIMEOUT_MS,
      apiKeyPresent,
      apiKeyLength,
      apiKeyPrefix,
      apiKeyLastChars,
      apiKeyValidFormat,
      environment: process.env.NODE_ENV || "unknown",
    };

    // Si la clé n'est pas présente, retourner seulement la config
    if (!apiKeyPresent) {
      return NextResponse.json({
        status: "error",
        message: "PINECONE_API_KEY n'est pas configurée",
        config,
        healthCheck: null,
      });
    }

    // Si la clé n'a pas le bon format, retourner un avertissement
    if (!apiKeyValidFormat) {
      return NextResponse.json({
        status: "warning",
        message: "PINECONE_API_KEY n'a pas le format attendu (doit commencer par pcsk_)",
        config,
        healthCheck: null,
      });
    }

    // Tester une requête ping simple vers Pinecone
    let healthCheck: {
      success: boolean;
      status?: number;
      responseTime?: number;
      acceptedFormat?: string;
      error?: string;
      responsePreview?: string;
    } | null = null;

    const testBodies = [
      { name: "message_only", body: { message: "ping" } },
      { name: "query_only", body: { query: "ping" } },
      { name: "input_only", body: { input: "ping" } },
    ];

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      // Tester le premier format (message_only)
      const response = await fetch(PINECONE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(testBodies[0].body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      let responseData: unknown;
      try {
        const rawText = await response.text();
        try {
          responseData = JSON.parse(rawText);
        } catch {
          responseData = rawText;
        }
      } catch {
        responseData = null;
      }

      healthCheck = {
        success: response.ok,
        status: response.status,
        responseTime,
        acceptedFormat: response.ok ? testBodies[0].name : undefined,
        error: response.ok ? undefined : String(responseData || response.statusText),
        responsePreview: response.ok 
          ? (typeof responseData === "string" 
              ? responseData.substring(0, 200) 
              : JSON.stringify(responseData).substring(0, 200))
          : undefined,
      };

      // Si le premier format échoue, essayer les autres
      if (!response.ok && response.status === 400) {
        for (let i = 1; i < testBodies.length; i++) {
          const testBody = testBodies[i];
          const testStartTime = Date.now();
          
          try {
            const testController = new AbortController();
            const testTimeoutId = setTimeout(() => testController.abort(), TIMEOUT_MS);
            
            const testResponse = await fetch(PINECONE_API_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json, text/event-stream",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify(testBody.body),
              signal: testController.signal,
            });

            clearTimeout(testTimeoutId);
            const testResponseTime = Date.now() - testStartTime;

            if (testResponse.ok) {
              let testResponseData: unknown;
              try {
                const rawText = await testResponse.text();
                try {
                  testResponseData = JSON.parse(rawText);
                } catch {
                  testResponseData = rawText;
                }
              } catch {
                testResponseData = null;
              }

              healthCheck = {
                success: true,
                status: testResponse.status,
                responseTime: testResponseTime,
                acceptedFormat: testBody.name,
                responsePreview: typeof testResponseData === "string" 
                  ? testResponseData.substring(0, 200) 
                  : JSON.stringify(testResponseData).substring(0, 200),
              };
              break;
            }
          } catch {
            // Continuer avec le format suivant
            continue;
          }
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const isTimeout = error instanceof Error && error.name === "AbortError";
      
      healthCheck = {
        success: false,
        responseTime,
        error: isTimeout 
          ? `Timeout après ${TIMEOUT_MS}ms`
          : (error instanceof Error ? error.message : String(error)),
      };
    }

    // Résultat final
    const status = healthCheck?.success ? "healthy" : "unhealthy";

    return NextResponse.json({
      status,
      message: healthCheck?.success 
        ? `Pinecone est accessible (format accepté: ${healthCheck.acceptedFormat})`
        : `Pinecone n'est pas accessible: ${healthCheck?.error || "Erreur inconnue"}`,
      config,
      healthCheck,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur dans /api/admin/pinecone-health:", error);
    
    return NextResponse.json(
      {
        status: "error",
        message: "Erreur lors de la vérification",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Permet de tester manuellement avec des paramètres personnalisés
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est administrateur
    const authResult = await verifyAdmin(request);
    
    if (!authResult.valid) {
      return NextResponse.json(
        { 
          error: "Accès refusé",
          message: authResult.error || "Accès administrateur requis"
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { message, category, theme, format } = body;

    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: "PINECONE_API_KEY n'est pas configurée" },
        { status: 500 }
      );
    }

    // Construire le body selon le format demandé
    let requestBody: Record<string, unknown>;
    const cleanMessage = (message || "test").trim();

    switch (format) {
      case "query":
        requestBody = { query: cleanMessage };
        break;
      case "input":
        requestBody = { input: cleanMessage };
        break;
      case "prompt":
        requestBody = { prompt: cleanMessage };
        break;
      case "text":
        requestBody = { text: cleanMessage };
        break;
      case "message_with_params":
        requestBody = {
          message: cleanMessage,
          ...(category && { category }),
          ...(theme && { theme }),
        };
        break;
      default:
        requestBody = { message: cleanMessage };
    }

    const startTime = Date.now();
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
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      let responseData: unknown;
      try {
        const rawText = await response.text();
        try {
          responseData = JSON.parse(rawText);
        } catch {
          responseData = rawText;
        }
      } catch {
        responseData = null;
      }

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        responseTime,
        format: format || "message",
        requestBody,
        response: responseData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      const isTimeout = error instanceof Error && error.name === "AbortError";

      return NextResponse.json(
        {
          success: false,
          status: 0,
          responseTime,
          format: format || "message",
          requestBody,
          error: isTimeout 
            ? `Timeout après ${TIMEOUT_MS}ms`
            : (error instanceof Error ? error.message : String(error)),
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Erreur dans POST /api/admin/pinecone-health:", error);
    
    return NextResponse.json(
      {
        error: "Erreur lors du test",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

