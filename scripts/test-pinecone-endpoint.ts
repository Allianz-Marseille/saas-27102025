#!/usr/bin/env ts-node

/**
 * Script de test pour valider l'endpoint Pinecone MCP
 * 
 * Ce script teste différents formats de requête pour identifier
 * celui accepté par l'API Pinecone et génère des commandes cURL
 * prêtes à utiliser.
 */

import dotenv from "dotenv";
import { performance } from "perf_hooks";

dotenv.config({ path: ".env.local" });

const PINECONE_API_URL = "https://prod-1-data.ke.pinecone.io/mcp/assistants/saas-allianz";
const TIMEOUT_MS = 30000;

interface TestResult {
  format: string;
  body: Record<string, unknown>;
  status: number;
  responseTime: number;
  success: boolean;
  response?: unknown;
  error?: string;
  curlCommand: string;
}

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
 * Génère différents formats de body de requête à tester
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

  if (hasContext) {
    formats.push({
      name: "message_with_context",
      body: {
        message: contextualMessage,
      },
    });
  }

  formats.push(
    // Format JSON-RPC 2.0 (si l'API utilise ce protocole)
    {
      name: "jsonrpc_invoke",
      body: {
        jsonrpc: "2.0",
        method: "invoke",
        params: {
          message: cleanMessage,
        },
        id: 1,
      },
    },
    {
      name: "jsonrpc_query",
      body: {
        jsonrpc: "2.0",
        method: "query",
        params: {
          query: cleanMessage,
        },
        id: 1,
      },
    },
    {
      name: "jsonrpc_invoke_with_context",
      body: {
        jsonrpc: "2.0",
        method: "invoke",
        params: {
          message: contextualMessage,
        },
        id: 1,
      },
    },
    {
      name: "message_only",
      body: {
        message: cleanMessage,
      },
    },
    {
      name: "message_with_params",
      body: {
        message: cleanMessage,
        ...(category && { category }),
        ...(theme && { theme }),
      },
    },
    {
      name: "query_only",
      body: {
        query: cleanMessage,
      },
    },
    {
      name: "query_with_params",
      body: {
        query: cleanMessage,
        ...(category && { category }),
        ...(theme && { theme }),
      },
    },
    {
      name: "input_only",
      body: {
        input: cleanMessage,
      },
    },
    {
      name: "prompt_only",
      body: {
        prompt: cleanMessage,
      },
    },
    {
      name: "text_only",
      body: {
        text: cleanMessage,
      },
    },
    {
      name: "message_with_conversation",
      body: {
        message: cleanMessage,
        conversation: [],
      },
    }
  );

  if (!hasContext) {
    formats.push({
      name: "message_with_context",
      body: {
        message: contextualMessage,
      },
    });
  }

  return formats;
}

/**
 * Génère une commande cURL pour un format donné
 */
function generateCurlCommand(
  body: Record<string, unknown>,
  apiKey: string
): string {
  const bodyJson = JSON.stringify(body);
  return `curl -X POST "${PINECONE_API_URL}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '${bodyJson}'`;
}

/**
 * Teste un format de requête
 */
async function testFormat(
  formatName: string,
  body: Record<string, unknown>,
  apiKey: string
): Promise<TestResult> {
  const startTime = performance.now();
  const curlCommand = generateCurlCommand(body, apiKey);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

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

    clearTimeout(timeoutId);
    const responseTime = Math.round(performance.now() - startTime);

      let responseData: unknown;
      let errorText = "";
      const contentType = response.headers.get("content-type") || "";

      try {
        const rawText = await response.text();
        errorText = rawText; // Toujours capturer le texte brut pour les erreurs
        
        if (contentType.includes("application/json") || rawText.trim().startsWith("{")) {
          try {
            responseData = JSON.parse(rawText);
          } catch {
            responseData = rawText;
          }
        } else {
          responseData = rawText;
        }
      } catch {
        responseData = null;
      }

      return {
        format: formatName,
        body,
        status: response.status,
        responseTime,
        success: response.ok,
        response: response.ok ? responseData : undefined,
        error: response.ok ? undefined : errorText || String(responseData || response.statusText),
        curlCommand,
      };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    const isTimeout = error instanceof Error && error.name === "AbortError";

    return {
      format: formatName,
      body,
      status: 0,
      responseTime,
      success: false,
      error: isTimeout ? `Timeout après ${TIMEOUT_MS}ms` : (error instanceof Error ? error.message : String(error)),
      curlCommand,
    };
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log("🔍 Test de l'endpoint Pinecone MCP\n");
  console.log("=" .repeat(60));

  // Vérifier la clé API
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    console.error("❌ PINECONE_API_KEY n'est pas définie dans .env.local");
    process.exit(1);
  }

  const apiKeyPrefix = apiKey.trim().substring(0, 5);
  const apiKeyLastChars = apiKey.trim().length > 4 ? `...${apiKey.trim().slice(-4)}` : "****";

  console.log(`✅ Clé API trouvée (${apiKey.trim().length} caractères, préfixe: ${apiKeyPrefix}, fin: ${apiKeyLastChars})`);
  console.log(`📍 URL: ${PINECONE_API_URL}`);
  console.log(`⏱️  Timeout: ${TIMEOUT_MS}ms\n`);

  // Test avec message simple
  console.log("📋 Test 1: Message simple");
  console.log("-".repeat(60));
  const testMessage = "ping";
  const requestBodies = generateRequestBodies(testMessage);

  const results: TestResult[] = [];

  for (const { body, name } of requestBodies) {
    console.log(`\n🔄 Test du format: ${name}`);
    const result = await testFormat(name, body, apiKey);
    results.push(result);

    if (result.success) {
      console.log(`   ✅ SUCCÈS (${result.status}) - ${result.responseTime}ms`);
      if (result.response) {
        console.log(`   📄 Réponse:`, JSON.stringify(result.response, null, 2).substring(0, 200));
      }
    } else {
      console.log(`   ❌ ÉCHEC (${result.status || "N/A"}) - ${result.responseTime}ms`);
      if (result.error) {
        console.log(`   📄 Erreur complète:`);
        // Afficher l'erreur complète, pas seulement les 200 premiers caractères
        const errorStr = typeof result.error === "string" ? result.error : JSON.stringify(result.error);
        console.log(`   ${errorStr}`);
        // Si c'est du JSON, essayer de le formater
        try {
          const parsedError = JSON.parse(errorStr);
          console.log(`   📋 Erreur parsée:`, JSON.stringify(parsedError, null, 2));
        } catch {
          // Ce n'est pas du JSON, c'est déjà affiché
        }
      }
    }
  }

  // Résumé
  console.log("\n" + "=".repeat(60));
  console.log("📊 RÉSUMÉ");
  console.log("=".repeat(60));

  const successfulFormats = results.filter((r) => r.success);
  const failedFormats = results.filter((r) => !r.success);

  if (successfulFormats.length > 0) {
    console.log(`\n✅ Formats acceptés (${successfulFormats.length}):`);
    successfulFormats.forEach((result) => {
      console.log(`   - ${result.format} (${result.status}, ${result.responseTime}ms)`);
    });

    const bestFormat = successfulFormats[0];
    console.log(`\n🎯 Format recommandé: ${bestFormat.format}`);
    console.log(`\n📋 Commande cURL pour ce format:`);
    console.log(bestFormat.curlCommand);
  } else {
    console.log(`\n❌ Aucun format accepté`);
    console.log(`\n📋 Analyse des erreurs 400:`);
    
    // Grouper par type d'erreur
    const errorMessages = new Map<string, Array<{ format: string; body: Record<string, unknown> }>>();
    
    failedFormats.forEach((result) => {
      const errorKey = result.error ? result.error.substring(0, 100) : "Erreur inconnue";
      if (!errorMessages.has(errorKey)) {
        errorMessages.set(errorKey, []);
      }
      errorMessages.get(errorKey)!.push({ format: result.format, body: result.body });
    });

    console.log(`\n   📊 ${errorMessages.size} type(s) d'erreur différent(s) trouvé(s):\n`);
    
    errorMessages.forEach((formats, errorMsg) => {
      console.log(`   🔴 Erreur: ${errorMsg}`);
      console.log(`      Formats affectés: ${formats.map(f => f.format).join(", ")}`);
      console.log(`      Exemple de body testé:`);
      console.log(`      ${JSON.stringify(formats[0].body, null, 6)}`);
      console.log("");
    });

    console.log(`\n📋 Détails complets par format:`);
    failedFormats.forEach((result) => {
      console.log(`\n   ┌─ Format: ${result.format}`);
      console.log(`   ├─ Status: ${result.status || "N/A"}`);
      console.log(`   ├─ Body: ${JSON.stringify(result.body)}`);
      console.log(`   ├─ Erreur complète:`);
      const errorStr = result.error ? result.error : "Aucune erreur retournée";
      // Afficher l'erreur complète, formatée si c'est du JSON
      try {
        const parsedError = JSON.parse(errorStr);
        console.log(`   │  ${JSON.stringify(parsedError, null, 2).split('\n').join('\n   │  ')}`);
      } catch {
        // Afficher ligne par ligne si c'est du texte
        errorStr.split('\n').forEach((line: string) => {
          console.log(`   │  ${line}`);
        });
      }
      console.log(`   └─ Commande cURL:`);
      console.log(`      ${result.curlCommand.split('\\').join('')}`);
    });
    
    console.log(`\n💡 Suggestion:`);
    console.log(`   L'API Pinecone MCP semble rejeter tous les formats testés.`);
    console.log(`   Vérifiez:`);
    console.log(`   1. Que la clé API est valide et active`);
    console.log(`   2. Que l'URL de l'endpoint est correcte`);
    console.log(`   3. La documentation de l'API Pinecone MCP pour le format exact attendu`);
    console.log(`   4. Les messages d'erreur ci-dessus peuvent contenir des indices sur le format requis`);
  }

  // Test avec contexte
  console.log("\n" + "=".repeat(60));
  console.log("📋 Test 2: Message avec contexte");
  console.log("-".repeat(60));

  const contextualBodies = generateRequestBodies(
    "Quelle est l'offre auto la plus adaptée ?",
    "auto",
    "retail"
  );

  console.log(`\n🔄 Test avec contexte (category: auto, theme: retail)`);
  
  for (const { body, name } of contextualBodies.slice(0, 3)) {
    // Tester seulement les 3 premiers formats avec contexte
    const result = await testFormat(name, body, apiKey);
    
    if (result.success) {
      console.log(`   ✅ ${name} - SUCCÈS (${result.status}) - ${result.responseTime}ms`);
      break; // S'arrêter au premier succès
    } else {
      console.log(`   ❌ ${name} - ÉCHEC (${result.status || "N/A"})`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Tests terminés");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});

