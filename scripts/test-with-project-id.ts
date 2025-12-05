#!/usr/bin/env ts-node
/**
 * Script pour tester avec différents Project IDs
 */

const PINECONE_API_KEY = "pcsk_2aUNkR_MgpHuwWGDAwdQBhVywNnkUV9LYT1qB5Bi8My4nzztCUYYgJgBjf82Tz3jTzLLVM";
const PINECONE_ASSISTANT_NAME = "saas-allianz";

// Tester avec les deux Project IDs possibles
const projectIds = [
  "prj_kcqNaE60ERclhMMTQYfzrlkKwx29", // Ancien ID utilisé dans le code
  "a8aa872d-526b-4746-8859-f...", // ID visible dans l'interface (vous devrez le compléter)
];

const url = `https://api.pinecone.io/assistant/assistants/${PINECONE_ASSISTANT_NAME}/chat`;

async function testProjectId(projectId: string) {
  console.log(`\nTest avec Project ID: ${projectId}`);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Api-Key": PINECONE_API_KEY,
        "Content-Type": "application/json",
        "X-Pinecone-Api-Version": "2025-01",
        "x-project-id": projectId,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "test" }],
        stream: false,
      }),
    });

    const responseText = await response.text();
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Réponse: ${responseText.substring(0, 200)}`);
    
    if (response.ok) {
      console.log(`   ✅ SUCCÈS avec ce Project ID!`);
      return true;
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return false;
}

async function main() {
  console.log("🧪 Test de différents Project IDs\n");
  console.log(`Assistant: ${PINECONE_ASSISTANT_NAME}`);
  console.log(`URL: ${url}`);
  
  for (const projectId of projectIds) {
    if (projectId.includes("...")) {
      console.log(`\n⚠️  Project ID tronqué, complétez-le avant de tester`);
      continue;
    }
    const success = await testProjectId(projectId);
    if (success) {
      console.log(`\n✅ Utilisez ce Project ID: ${projectId}`);
      break;
    }
  }
}

main();

