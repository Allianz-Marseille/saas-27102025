#!/usr/bin/env ts-node
/**
 * Script pour vérifier si l'assistant existe dans Pinecone
 * 
 * Usage: npx ts-node scripts/verify-assistant.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_PROJECT_ID = process.env.PINECONE_PROJECT_ID || "prj_kcqNaE60ERclhMMTQYfzrlkKwx29";
const PINECONE_ASSISTANT_NAME = process.env.PINECONE_ASSISTANT_NAME || "saas-allianz";

async function verifyAssistant() {
  console.log("🔍 Vérification de l'assistant Pinecone\n");
  console.log("=".repeat(70));

  if (!PINECONE_API_KEY) {
    console.log("❌ PINECONE_API_KEY n'est pas définie");
    return;
  }

  console.log(`Assistant: ${PINECONE_ASSISTANT_NAME}`);
  console.log(`Project ID: ${PINECONE_PROJECT_ID}`);
  console.log(`Clé API: ${PINECONE_API_KEY.substring(0, 10)}...\n`);

  const url = `https://api.pinecone.io/assistant/assistants/${PINECONE_ASSISTANT_NAME}/chat`;

  console.log(`URL testée: ${url}\n`);

  // Tester plusieurs formats
  const tests: Array<{ name: string; headers: Record<string, string> }> = [
    {
      name: "Api-Key avec x-project-id",
      headers: {
        "Api-Key": PINECONE_API_KEY.trim(),
        "Content-Type": "application/json",
        "X-Pinecone-Api-Version": "2025-01",
        "x-project-id": PINECONE_PROJECT_ID.trim(),
      },
    },
    {
      name: "Api-Key sans x-project-id",
      headers: {
        "Api-Key": PINECONE_API_KEY.trim(),
        "Content-Type": "application/json",
        "X-Pinecone-Api-Version": "2025-01",
      },
    },
  ];

  for (const test of tests) {
    console.log(`Test: ${test.name}`);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: test.headers,
        body: JSON.stringify({
          messages: [{ role: "user", content: "test" }],
          stream: false,
        }),
      });

      const responseText = await response.text();
      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.status === 404) {
        console.log(`   ❌ 404 Not Found - L'assistant "${PINECONE_ASSISTANT_NAME}" n'existe peut-être pas`);
        console.log(`   💡 Vérifiez dans Pinecone Console → Assistant → Assistants`);
        console.log(`   💡 Le nom de l'assistant est peut-être différent (vérifiez la casse, les tirets)`);
      } else if (response.status === 401) {
        console.log(`   ❌ 401 Unauthorized - Problème d'authentification`);
        console.log(`   Réponse: ${responseText.substring(0, 200)}`);
      } else if (response.ok) {
        console.log(`   ✅ Succès!`);
        const data = JSON.parse(responseText);
        console.log(`   Réponse: ${JSON.stringify(data).substring(0, 100)}`);
      } else {
        console.log(`   Réponse: ${responseText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
    }
    console.log("");
  }

  console.log("=".repeat(70));
  console.log("\n💡 Actions:");
  console.log("1. Vérifiez dans Pinecone Console → Assistant → Assistants");
  console.log("2. Vérifiez le nom exact de l'assistant (respectez la casse)");
  console.log("3. Vérifiez que l'assistant est actif");
  console.log("4. Si l'assistant n'existe pas, créez-le dans Pinecone Console\n");
}

verifyAssistant().catch(console.error);

