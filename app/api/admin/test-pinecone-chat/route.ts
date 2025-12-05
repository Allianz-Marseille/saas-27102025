import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";

const PINECONE_ASSISTANT_NAME = "saas-allianz";
const PINECONE_CHAT_API_URL = `https://api.pinecone.io/assistant/assistants/${PINECONE_ASSISTANT_NAME}/chat`;
const TIMEOUT_MS = 30000;

/**
 * Route de test pour vérifier la connexion à l'API Pinecone Chat
 * Accessible uniquement aux administrateurs
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

    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: "PINECONE_API_KEY n'est pas configurée" },
        { status: 500 }
      );
    }

    const projectId = process.env.PINECONE_PROJECT_ID || "prj_kcqNaE60ERclhMMTQYfzrlkKwx29";
    if (!projectId || projectId.trim().length === 0) {
      return NextResponse.json(
        { error: "PINECONE_PROJECT_ID n'est pas configuré" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const testMessage = body.message || "Bonjour, qui êtes-vous ?";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const requestBody = {
      messages: [
        {
          role: "user",
          content: testMessage,
        },
      ],
      stream: false,
    };

    // Tester les deux formats d'authentification
    const results = [];
    
    // Test 1 : Api-Key avec x-project-id
    try {
      const startTime = Date.now();
      const response1 = await fetch(PINECONE_CHAT_API_URL, {
        method: "POST",
        headers: {
          "Api-Key": apiKey.trim(),
          "Content-Type": "application/json",
          "X-Pinecone-Api-Version": "2025-01",
          "x-project-id": projectId.trim(), // En-tête requis pour JWT access
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      const responseTime1 = Date.now() - startTime;
      
      const responseText1 = await response1.text();
      let responseData1: unknown = null;
      try {
        responseData1 = JSON.parse(responseText1);
      } catch {
        responseData1 = responseText1;
      }

      results.push({
        method: "Api-Key",
        status: response1.status,
        statusText: response1.statusText,
        responseTime: responseTime1,
        success: response1.ok,
        response: responseData1,
        headers: Object.fromEntries(response1.headers.entries()),
      });
    } catch (error) {
      results.push({
        method: "Api-Key",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 2 : Authorization Bearer avec x-project-id
    try {
      const startTime = Date.now();
      const response2 = await fetch(PINECONE_CHAT_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
          "X-Pinecone-Api-Version": "2025-01",
          "x-project-id": projectId.trim(), // En-tête requis pour JWT access
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      const responseTime2 = Date.now() - startTime;
      
      const responseText2 = await response2.text();
      let responseData2: unknown = null;
      try {
        responseData2 = JSON.parse(responseText2);
      } catch {
        responseData2 = responseText2;
      }

      results.push({
        method: "Authorization Bearer",
        status: response2.status,
        statusText: response2.statusText,
        responseTime: responseTime2,
        success: response2.ok,
        response: responseData2,
        headers: Object.fromEntries(response2.headers.entries()),
      });
    } catch (error) {
      results.push({
        method: "Authorization Bearer",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    clearTimeout(timeoutId);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      configuration: {
        url: PINECONE_CHAT_API_URL,
        assistantName: PINECONE_ASSISTANT_NAME,
        projectId: projectId.trim(),
        apiKeyPrefix: apiKey.trim().substring(0, 5),
        apiKeyLength: apiKey.trim().length,
        apiKeyLastChars: apiKey.trim().length > 4 ? `...${apiKey.trim().slice(-4)}` : "****",
        testMessage,
      },
      results,
    });
  } catch (error) {
    console.error("Erreur dans POST /api/admin/test-pinecone-chat:", error);
    
    return NextResponse.json(
      {
        error: "Erreur lors du test",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

