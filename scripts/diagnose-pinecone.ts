#!/usr/bin/env ts-node
/**
 * Script de diagnostic complet pour Pinecone API Chat
 * Teste toutes les combinaisons d'authentification possibles pour identifier le problème exact
 * 
 * Usage: npx ts-node scripts/diagnose-pinecone.ts
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

interface TestResult {
  name: string;
  success: boolean;
  status?: number;
  statusText?: string;
  error?: string;
  responseTime?: number;
  responsePreview?: string;
  headers?: Record<string, string>;
}

const results: TestResult[] = [];

/**
 * Teste une combinaison spécifique d'authentification
 */
async function testAuthCombination(
  name: string,
  headers: Record<string, string>
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(PINECONE_CHAT_API_URL, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "test" }],
        stream: false,
      }),
    });

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();
    let responsePreview = responseText.substring(0, 200);
    
    // Essayer de parser le JSON si possible
    try {
      const json = JSON.parse(responseText);
      responsePreview = JSON.stringify(json).substring(0, 200);
    } catch {
      // Ce n'est pas du JSON, on garde le texte brut
    }

    return {
      name,
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime,
      responsePreview,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      name,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Exécute tous les tests de diagnostic
 */
async function runDiagnostics() {
  console.log("🔍 Diagnostic complet de la configuration Pinecone API Chat\n");
  console.log("=".repeat(70));
  
  // Vérification de la configuration
  console.log("\n📋 Configuration actuelle:\n");
  
  if (!PINECONE_API_KEY) {
    console.log("❌ PINECONE_API_KEY n'est pas définie");
    console.log("⚠️  Ajoutez-la dans .env.local ou comme variable d'environnement\n");
    return;
  }

  const keyLength = PINECONE_API_KEY.trim().length;
  const keyPrefix = PINECONE_API_KEY.trim().substring(0, 6);
  const keyLastChars = keyLength > 6 ? `...${PINECONE_API_KEY.trim().slice(-4)}` : "****";
  
  console.log(`✅ PINECONE_API_KEY: Définie (${keyLength} caractères)`);
  console.log(`   Préfixe: ${keyPrefix}`);
  console.log(`   Fin: ${keyLastChars}`);
  
  if (PINECONE_API_KEY.trim().startsWith("pckey_")) {
    console.log("   ✅ Format: pckey_... (format recommandé pour API Chat)");
  } else if (PINECONE_API_KEY.trim().startsWith("pcsk_")) {
    console.log("   ⚠️  Format: pcsk_... (ancien format, peut ne pas fonctionner)");
  } else {
    console.log("   ❌ Format: Inconnu (attendu: pckey_... ou pcsk_...)");
  }

  console.log(`✅ PINECONE_PROJECT_ID: ${PINECONE_PROJECT_ID || "Non défini"}`);
  console.log(`✅ Assistant Name: ${PINECONE_ASSISTANT_NAME}`);
  console.log(`✅ URL API: ${PINECONE_CHAT_API_URL}\n`);

  console.log("🧪 Tests de connexion en cours...\n");
  console.log("=".repeat(70));

  // Test 1: Api-Key sans x-project-id
  console.log("\n[1/6] Test: Api-Key sans x-project-id");
  results.push(
    await testAuthCombination("Api-Key (sans x-project-id)", {
      "Api-Key": PINECONE_API_KEY.trim(),
      "X-Pinecone-Api-Version": "2025-01",
    })
  );

  // Test 2: Api-Key avec x-project-id
  console.log("\n[2/6] Test: Api-Key avec x-project-id");
  results.push(
    await testAuthCombination("Api-Key (avec x-project-id)", {
      "Api-Key": PINECONE_API_KEY.trim(),
      "X-Pinecone-Api-Version": "2025-01",
      "x-project-id": PINECONE_PROJECT_ID.trim(),
    })
  );

  // Test 3: Api-Key avec x-project-id, version 2025-04
  console.log("\n[3/6] Test: Api-Key avec x-project-id (version 2025-04)");
  results.push(
    await testAuthCombination("Api-Key (avec x-project-id, v2025-04)", {
      "Api-Key": PINECONE_API_KEY.trim(),
      "X-Pinecone-Api-Version": "2025-04",
      "x-project-id": PINECONE_PROJECT_ID.trim(),
    })
  );

  // Test 4: Authorization Bearer sans x-project-id
  console.log("\n[4/6] Test: Authorization Bearer sans x-project-id");
  results.push(
    await testAuthCombination("Authorization Bearer (sans x-project-id)", {
      "Authorization": `Bearer ${PINECONE_API_KEY.trim()}`,
      "X-Pinecone-Api-Version": "2025-01",
    })
  );

  // Test 5: Authorization Bearer avec x-project-id
  console.log("\n[5/6] Test: Authorization Bearer avec x-project-id");
  results.push(
    await testAuthCombination("Authorization Bearer (avec x-project-id)", {
      "Authorization": `Bearer ${PINECONE_API_KEY.trim()}`,
      "X-Pinecone-Api-Version": "2025-01",
      "x-project-id": PINECONE_PROJECT_ID.trim(),
    })
  );

  // Test 6: Api-Key sans version header
  console.log("\n[6/6] Test: Api-Key sans version header");
  results.push(
    await testAuthCombination("Api-Key (sans version header)", {
      "Api-Key": PINECONE_API_KEY.trim(),
    })
  );

  // Afficher les résultats
  console.log("\n" + "=".repeat(70));
  console.log("\n📊 Résultats des tests:\n");

  const successfulTests = results.filter((r) => r.success);
  const failedTests = results.filter((r) => !r.success);

  if (successfulTests.length > 0) {
    console.log("✅ Tests réussis:\n");
    successfulTests.forEach((result) => {
      console.log(`   ✅ ${result.name}`);
      console.log(`      Status: ${result.status} ${result.statusText}`);
      console.log(`      Temps: ${result.responseTime}ms`);
      if (result.responsePreview) {
        console.log(`      Réponse: ${result.responsePreview}`);
      }
      console.log("");
    });
  }

  if (failedTests.length > 0) {
    console.log("❌ Tests échoués:\n");
    failedTests.forEach((result) => {
      console.log(`   ❌ ${result.name}`);
      if (result.status) {
        console.log(`      Status: ${result.status} ${result.statusText}`);
      }
      if (result.error) {
        console.log(`      Erreur: ${result.error}`);
      }
      if (result.responsePreview) {
        console.log(`      Réponse: ${result.responsePreview}`);
      }
      console.log("");
    });
  }

  // Analyse et recommandations
  console.log("=".repeat(70));
  console.log("\n💡 Analyse et recommandations:\n");

  if (successfulTests.length > 0) {
    const best = successfulTests[0];
    console.log(`✅ Solution trouvée: Utilisez "${best.name}"`);
    console.log(`\n📝 Configuration recommandée dans le code:\n`);
    console.log(`   Headers: ${JSON.stringify({
      ...(best.name.includes("Bearer") ? { "Authorization": `Bearer \${PINECONE_API_KEY}` } : { "Api-Key": "${PINECONE_API_KEY}" }),
      "Content-Type": "application/json",
      "X-Pinecone-Api-Version": best.name.includes("2025-04") ? "2025-04" : "2025-01",
      ...(best.name.includes("x-project-id") ? { "x-project-id": "${PINECONE_PROJECT_ID}" } : {}),
    }, null, 2)}\n`);
  } else {
    console.log("❌ Aucun test n'a réussi. Problèmes identifiés:\n");

    // Analyser les erreurs communes
    const has401 = failedTests.some((r) => r.status === 401);
    const has403 = failedTests.some((r) => r.status === 403);
    const has404 = failedTests.some((r) => r.status === 404);
    const hasJWTError = failedTests.some((r) => 
      r.responsePreview?.toLowerCase().includes("jwt") || 
      r.error?.toLowerCase().includes("jwt")
    );
    const hasProjectIdError = failedTests.some((r) =>
      r.responsePreview?.toLowerCase().includes("project-id") ||
      r.responsePreview?.toLowerCase().includes("x-project-id")
    );
    const hasInvalidKey = failedTests.some((r) =>
      r.responsePreview?.toLowerCase().includes("invalid") ||
      r.responsePreview?.toLowerCase().includes("unauthorized")
    );

    if (hasJWTError && PINECONE_API_KEY.trim().startsWith("pcsk_")) {
      console.log("   🔴 Problème: Format de clé incorrect");
      console.log("      Votre clé est au format pcsk_... (ancien format)");
      console.log("      L'API Chat nécessite une clé au format pckey_...");
      console.log("      Solution: Créez une nouvelle clé API via l'Admin API\n");
    }

    if (hasProjectIdError) {
      console.log("   🔴 Problème: En-tête x-project-id requis");
      console.log("      L'API nécessite l'en-tête x-project-id");
      console.log("      Solution: Assurez-vous que PINECONE_PROJECT_ID est défini\n");
    }

    if (hasInvalidKey || has401 || has403) {
      console.log("   🔴 Problème: Clé API invalide ou non autorisée");
      console.log("      Causes possibles:");
      console.log("      - La clé API est incorrecte ou tronquée");
      console.log("      - La clé API n'a pas les permissions nécessaires");
      console.log("      - La clé API est associée au mauvais projet");
      console.log("      Solution: Vérifiez la clé dans Pinecone Console et créez-en une nouvelle si nécessaire\n");
    }

    if (has404) {
      console.log("   🔴 Problème: Assistant ou endpoint non trouvé");
      console.log("      Causes possibles:");
      console.log("      - Le nom de l'assistant est incorrect");
      console.log("      - L'assistant n'existe pas dans votre projet");
      console.log("      Solution: Vérifiez le nom de l'assistant dans Pinecone Console\n");
    }

    if (PINECONE_API_KEY.trim().startsWith("pckey_")) {
      console.log("   ℹ️  Format de clé: ✅ pckey_... (correct)");
    } else {
      console.log("   ℹ️  Format de clé: ⚠️  " + keyPrefix + "... (à vérifier)");
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("\n📚 Prochaines étapes:\n");
  
  if (successfulTests.length === 0) {
    console.log("1. Exécutez: npx ts-node scripts/create-pinecone-api-key.ts");
    console.log("   Pour créer une nouvelle clé API au bon format\n");
    
    console.log("2. Vérifiez la documentation:");
    console.log("   - docs/GUIDE_CREATION_CLE_API_PINECONE.md\n");
  } else {
    console.log("✅ Utilisez la configuration qui a réussi dans votre code\n");
  }
  
  console.log("3. Testez avec: npx ts-node scripts/test-pinecone-complete.ts\n");
}

// Exécuter le diagnostic
runDiagnostics().catch((error) => {
  console.error("❌ Erreur lors du diagnostic:", error);
  process.exit(1);
});

