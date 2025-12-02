#!/usr/bin/env ts-node

/**
 * Script de test pour les routes API RAG
 * 
 * Usage: 
 *   1. Connectez-vous à l'application dans le navigateur
 *   2. Ouvrez la console du navigateur (F12)
 *   3. Exécutez: await firebase.auth().currentUser?.getIdToken()
 *   4. Copiez le token
 *   5. Lancez: npm run test-rag-api <token> [userId]
 * 
 * Pour tester l'upload, vous devez fournir un fichier PDF ou image de test
 */

import "tsconfig-paths/register";
import { config } from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const TOKEN = process.argv[2];
const USER_ID = process.argv[3];

if (!TOKEN) {
  console.error("❌ Token Firebase requis");
  console.error("\n📝 Comment obtenir un token :");
  console.error("   1. Connectez-vous à l'application dans le navigateur");
  console.error("   2. Ouvrez la console (F12)");
  console.error("   3. Exécutez: await firebase.auth().currentUser?.getIdToken()");
  console.error("   4. Copiez le token");
  console.error("\n💡 Usage: npm run test-rag-api <token> [userId]");
  process.exit(1);
}

interface TestResult {
  name: string;
  success: boolean;
  status?: number;
  error?: string;
  data?: unknown;
}

async function testAPI(
  name: string,
  method: string,
  endpoint: string,
  options: {
    body?: unknown;
    headers?: Record<string, string>;
    requireAdmin?: boolean;
  } = {}
): Promise<TestResult> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    console.log(`\n🧪 Test: ${name}`);
    console.log(`   ${method} ${endpoint}`);

    const response = await fetch(url, fetchOptions);
    const data = await response.json().catch(() => ({ error: "Réponse non-JSON" }));

    if (response.ok) {
      console.log(`   ✅ Succès (${response.status})`);
      if (data && Object.keys(data).length > 0) {
        console.log(`   📦 Données:`, JSON.stringify(data, null, 2).substring(0, 200) + "...");
      }
      return {
        name,
        success: true,
        status: response.status,
        data,
      };
    } else {
      console.log(`   ❌ Erreur (${response.status})`);
      console.log(`   📦 Réponse:`, JSON.stringify(data, null, 2));
      
      if (response.status === 401 && options.requireAdmin) {
        console.log(`   ⚠️  Note: Cette route nécessite les droits admin`);
      }

      return {
        name,
        success: false,
        status: response.status,
        error: data.error || `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    console.log(`   ❌ Exception:`, error instanceof Error ? error.message : String(error));
    return {
      name,
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

async function runTests() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 Tests des routes API RAG");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`\n📍 URL de base: ${API_BASE_URL}`);
  console.log(`👤 User ID: ${USER_ID || "Non spécifié"}\n`);

  const results: TestResult[] = [];

  // Test 1: Liste des documents (GET /api/chat/documents)
  results.push(
    await testAPI(
      "Liste des documents",
      "GET",
      "/api/chat/documents"
    )
  );

  // Test 2: Chat simple (POST /api/chat)
  results.push(
    await testAPI(
      "Chat RAG (question simple)",
      "POST",
      "/api/chat",
      {
        body: {
          query: "Bonjour, pouvez-vous me dire ce que vous savez sur les assurances ?",
          conversationHistory: [],
        },
      }
    )
  );

  // Test 3: Chat avec historique (POST /api/chat)
  results.push(
    await testAPI(
      "Chat RAG (avec historique)",
      "POST",
      "/api/chat",
      {
        body: {
          query: "Pouvez-vous me donner plus de détails ?",
          conversationHistory: [
            {
              id: "msg1",
              role: "user",
              content: "Bonjour",
              timestamp: new Date(),
            },
            {
              id: "msg2",
              role: "assistant",
              content: "Bonjour ! Comment puis-je vous aider ?",
              timestamp: new Date(),
            },
          ],
        },
      }
    )
  );

  // Test 4: Upload (POST /api/chat/upload) - Nécessite admin
  console.log("\n⚠️  Test d'upload nécessite un fichier et les droits admin");
  console.log("   Pour tester manuellement :");
  console.log("   curl -X POST http://localhost:3000/api/chat/upload \\");
  console.log("     -H 'Authorization: Bearer YOUR_TOKEN' \\");
  console.log("     -F 'file=@test.pdf' \\");
  console.log("     -F 'title=Document de test'");

  // Test 5: Suppression (DELETE /api/chat/documents/[id]) - Nécessite admin et un document existant
  console.log("\n⚠️  Test de suppression nécessite un document ID et les droits admin");

  // Résumé
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Résumé des tests");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  results.forEach((result) => {
    const icon = result.success ? "✅" : "❌";
    const status = result.status ? ` (${result.status})` : "";
    console.log(`${icon} ${result.name}${status}`);
    if (result.error) {
      console.log(`   Erreur: ${result.error}`);
    }
  });

  console.log(`\n📈 Résultat: ${successCount}/${totalCount} tests réussis\n`);

  if (successCount === totalCount) {
    console.log("🎉 Tous les tests sont passés !");
  } else {
    console.log("⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.");
  }
}

// Vérifier que le serveur est accessible
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/documents`, {
      method: "GET",
    });
    // On s'attend à une 401 (non authentifié), ce qui signifie que le serveur répond
    return true;
  } catch (error) {
    console.error("\n❌ Impossible de se connecter au serveur");
    console.error(`   Vérifiez que le serveur Next.js est lancé sur ${API_BASE_URL}`);
    console.error(`   Lancez: npm run dev\n`);
    return false;
  }
}

// Exécuter les tests
async function main() {
  const serverAvailable = await checkServer();
  if (!serverAvailable) {
    process.exit(1);
  }

  await runTests();
}

main().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});

