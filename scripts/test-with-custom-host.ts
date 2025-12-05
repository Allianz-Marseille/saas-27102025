#!/usr/bin/env ts-node
/**
 * Script pour tester avec le host spécifique de l'assistant
 */

const PINECONE_API_KEY = "pcsk_2aUNkR_MgpHuwWGDAwdQBhVywNnkUV9LYT1qB5Bi8My4nzztCUYYgJgBjf82Tz3jTzLLVM";
const PINECONE_ASSISTANT_NAME = "saas-allianz";
const PINECONE_PROJECT_ID = "prj_kcqNaE60ERclhMMTQYfzrlkKwx29";

// URLs à tester
const urls = [
  // URL standard
  `https://api.pinecone.io/assistant/assistants/${PINECONE_ASSISTANT_NAME}/chat`,
  // URL avec host spécifique de l'assistant
  `https://prod-1-data.ke.pinecone.io/assistant/assistants/${PINECONE_ASSISTANT_NAME}/chat`,
  // URL MCP (endpoint différent)
  `https://prod-1-data.ke.pinecone.io/mcp/assistants/${PINECONE_ASSISTANT_NAME}`,
];

async function testUrl(url: string, useProjectId: boolean) {
  console.log(`\n📡 Test: ${url}`);
  console.log(`   Avec x-project-id: ${useProjectId}`);
  
  const headers: Record<string, string> = {
    "Api-Key": PINECONE_API_KEY,
    "Content-Type": "application/json",
    "X-Pinecone-Api-Version": "2025-01",
  };
  
  if (useProjectId) {
    headers["x-project-id"] = PINECONE_PROJECT_ID;
  }
  
  try {
    // Pour l'endpoint MCP, le format pourrait être différent
    let body: string;
    if (url.includes("/mcp/")) {
      body = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "chat",
          arguments: {
            messages: [{ role: "user", content: "test" }],
          },
        },
      });
    } else {
      body = JSON.stringify({
        messages: [{ role: "user", content: "test" }],
        stream: false,
      });
    }
    
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    const responseText = await response.text();
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Réponse: ${responseText.substring(0, 300)}`);
    
    if (response.ok) {
      console.log(`   ✅ SUCCÈS avec cette URL!`);
      return { success: true, url, headers: useProjectId };
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return { success: false, url: null, headers: false };
}

async function main() {
  console.log("🧪 Test avec différents hosts/endpoints\n");
  console.log(`Assistant: ${PINECONE_ASSISTANT_NAME}`);
  console.log(`Clé API: ${PINECONE_API_KEY.substring(0, 15)}...`);
  
  for (const url of urls) {
    // Tester avec et sans x-project-id
    await testUrl(url, true);
    await testUrl(url, false);
  }
  
  console.log("\n" + "=".repeat(70));
  console.log("\n💡 Si aucun test ne réussit, le problème vient du format de la clé API");
  console.log("   Les clés pcsk_... ne fonctionnent peut-être pas avec l'API Chat");
  console.log("   Il faut créer une clé pckey_... via l'Admin API\n");
}

main().catch(console.error);

