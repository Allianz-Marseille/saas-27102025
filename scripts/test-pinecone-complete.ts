#!/usr/bin/env ts-node
/**
 * Script de test complet pour Pinecone API Chat
 * Teste TOUTES les combinaisons possibles d'authentification
 * 
 * Usage: npx ts-node scripts/test-pinecone-complete.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Charger les variables d'environnement
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const PINECONE_ASSISTANT_NAME = process.env.PINECONE_ASSISTANT_NAME || "saas-allianz";
const PINECONE_CHAT_API_URL = `https://api.pinecone.io/assistant/assistants/${PINECONE_ASSISTANT_NAME}/chat`;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_PROJECT_ID = process.env.PINECONE_PROJECT_ID || "prj_kcqNaE60ERclhMMTQYfzrlkKwx29";

interface TestCase {
  name: string;
  headers: Record<string, string>;
  expectedFormat?: string;
}

const testCases: TestCase[] = [
  // Api-Key sans x-project-id
  {
    name: "Api-Key (sans x-project-id, v2025-01)",
    headers: {
      "Api-Key": "",
      "X-Pinecone-Api-Version": "2025-01",
    },
    expectedFormat: "pckey_ ou pcsk_",
  },
  {
    name: "Api-Key (sans x-project-id, v2025-04)",
    headers: {
      "Api-Key": "",
      "X-Pinecone-Api-Version": "2025-04",
    },
    expectedFormat: "pckey_ ou pcsk_",
  },
  {
    name: "Api-Key (sans x-project-id, sans version)",
    headers: {
      "Api-Key": "",
    },
    expectedFormat: "pckey_ ou pcsk_",
  },
  
  // Api-Key avec x-project-id
  {
    name: "Api-Key (avec x-project-id, v2025-01)",
    headers: {
      "Api-Key": "",
      "X-Pinecone-Api-Version": "2025-01",
      "x-project-id": PINECONE_PROJECT_ID,
    },
    expectedFormat: "pckey_ (recommandé)",
  },
  {
    name: "Api-Key (avec x-project-id, v2025-04)",
    headers: {
      "Api-Key": "",
      "X-Pinecone-Api-Version": "2025-04",
      "x-project-id": PINECONE_PROJECT_ID,
    },
    expectedFormat: "pckey_ (recommandé)",
  },
  
  // Authorization Bearer sans x-project-id
  {
    name: "Authorization Bearer (sans x-project-id, v2025-01)",
    headers: {
      "Authorization": "",
      "X-Pinecone-Api-Version": "2025-01",
    },
    expectedFormat: "JWT Token",
  },
  {
    name: "Authorization Bearer (sans x-project-id, v2025-04)",
    headers: {
      "Authorization": "",
      "X-Pinecone-Api-Version": "2025-04",
    },
    expectedFormat: "JWT Token",
  },
  
  // Authorization Bearer avec x-project-id
  {
    name: "Authorization Bearer (avec x-project-id, v2025-01)",
    headers: {
      "Authorization": "",
      "X-Pinecone-Api-Version": "2025-01",
      "x-project-id": PINECONE_PROJECT_ID,
    },
    expectedFormat: "JWT Token",
  },
  {
    name: "Authorization Bearer (avec x-project-id, v2025-04)",
    headers: {
      "Authorization": "",
      "X-Pinecone-Api-Version": "2025-04",
      "x-project-id": PINECONE_PROJECT_ID,
    },
    expectedFormat: "JWT Token",
  },
];

interface TestResult {
  testCase: TestCase;
  success: boolean;
  status?: number;
  statusText?: string;
  error?: string;
  responseTime?: number;
  responsePreview?: string;
}

async function runTest(testCase: TestCase): Promise<TestResult> {
  if (!PINECONE_API_KEY) {
    return {
      testCase,
      success: false,
      error: "PINECONE_API_KEY non définie",
    };
  }

  // Construire les headers avec la clé API
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(testCase.headers)) {
    if (key === "Api-Key" && value === "") {
      headers["Api-Key"] = PINECONE_API_KEY.trim();
    } else if (key === "Authorization" && value === "") {
      headers["Authorization"] = `Bearer ${PINECONE_API_KEY.trim()}`;
    } else {
      headers[key] = value;
    }
  }

  headers["Content-Type"] = "application/json";

  const startTime = Date.now();
  
  try {
    const response = await fetch(PINECONE_CHAT_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messages: [{ role: "user", content: "test" }],
        stream: false,
      }),
    });

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();
    let responsePreview = responseText.substring(0, 200);
    
    try {
      const json = JSON.parse(responseText);
      responsePreview = JSON.stringify(json).substring(0, 200);
    } catch {
      // Pas du JSON
    }

    return {
      testCase,
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime,
      responsePreview,
    };
  } catch (error) {
    return {
      testCase,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - startTime,
    };
  }
}

async function main() {
  console.log("🧪 Test complet de toutes les combinaisons Pinecone API Chat\n");
  console.log("=".repeat(70));

  if (!PINECONE_API_KEY) {
    console.log("❌ PINECONE_API_KEY n'est pas définie");
    console.log("   Définissez-la dans .env.local ou comme variable d'environnement\n");
    process.exit(1);
  }

  const keyPrefix = PINECONE_API_KEY.trim().substring(0, 6);
  console.log(`\n📋 Configuration:`);
  console.log(`   Clé API: ${keyPrefix}... (${PINECONE_API_KEY.trim().length} caractères)`);
  console.log(`   Project ID: ${PINECONE_PROJECT_ID}`);
  console.log(`   Assistant: ${PINECONE_ASSISTANT_NAME}`);
  console.log(`   URL: ${PINECONE_CHAT_API_URL}\n`);

  console.log(`🧪 Exécution de ${testCases.length} tests...\n`);
  console.log("=".repeat(70));

  const results: TestResult[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    process.stdout.write(`[${i + 1}/${testCases.length}] ${testCase.name}... `);
    
    const result = await runTest(testCase);
    results.push(result);

    if (result.success) {
      console.log(`✅ SUCCÈS (${result.status} ${result.statusText}, ${result.responseTime}ms)`);
    } else {
      console.log(`❌ ÉCHEC (${result.status || "N/A"} - ${result.error || result.statusText || "Erreur inconnue"})`);
    }
  }

  // Résumé
  console.log("\n" + "=".repeat(70));
  console.log("\n📊 Résumé des résultats:\n");

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Tests réussis: ${successful.length}/${results.length}`);
  console.log(`❌ Tests échoués: ${failed.length}/${results.length}\n`);

  if (successful.length > 0) {
    console.log("✅ Combinaisons qui fonctionnent:\n");
    successful.forEach((result) => {
      console.log(`   ✅ ${result.testCase.name}`);
      console.log(`      Status: ${result.status} ${result.statusText}`);
      console.log(`      Temps: ${result.responseTime}ms`);
      if (result.responsePreview) {
        console.log(`      Réponse: ${result.responsePreview}`);
      }
      console.log("");
    });

    // Recommandation
    const best = successful[0];
    console.log("💡 Recommandation:\n");
    console.log(`   Utilisez: "${best.testCase.name}"\n`);
    console.log("   Configuration dans le code:\n");
    const headers = { ...best.testCase.headers };
    if (headers["Api-Key"] === "") {
      headers["Api-Key"] = "${PINECONE_API_KEY}";
    }
    if (headers["Authorization"] === "") {
      headers["Authorization"] = "Bearer ${PINECONE_API_KEY}";
    }
    console.log(`   Headers: ${JSON.stringify(headers, null, 2)}\n`);
  } else {
    console.log("❌ Aucun test n'a réussi.\n");
    console.log("💡 Analyse des erreurs:\n");

    // Analyser les erreurs
    const statusCounts: Record<number, number> = {};
    failed.forEach((r) => {
      if (r.status) {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      }
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} erreur(s)`);
    });

    console.log("\n💡 Actions recommandées:\n");
    console.log("   1. Exécutez le diagnostic: npx ts-node scripts/diagnose-pinecone.ts");
    console.log("   2. Créez une nouvelle clé API: npx ts-node scripts/create-pinecone-api-key.ts");
    console.log("   3. Vérifiez la documentation: docs/GUIDE_CREATION_CLE_API_PINECONE.md\n");
  }

  console.log("=".repeat(70));
}

main().catch((error) => {
  console.error("\n❌ Erreur:", error);
  process.exit(1);
});

