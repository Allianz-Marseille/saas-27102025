#!/usr/bin/env ts-node
/**
 * Script de vérification de la configuration Pinecone
 * Usage: npx ts-node scripts/check-pinecone-config.ts
 */

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_PROJECT_ID = process.env.PINECONE_PROJECT_ID;
const PINECONE_ASSISTANT_NAME = "saas-allianz";

async function main() {
  console.log("🔍 Vérification de la configuration Pinecone\n");
  console.log("=" .repeat(50));

// Vérification PINECONE_API_KEY
console.log("\n1️⃣ PINECONE_API_KEY:");
if (!PINECONE_API_KEY) {
  console.log("   ❌ Non définie");
  console.log("   ⚠️  Ajoutez-la dans vos variables d'environnement");
} else {
  const keyLength = PINECONE_API_KEY.trim().length;
  const keyPrefix = PINECONE_API_KEY.trim().substring(0, 5);
  const keyLastChars = keyLength > 4 ? `...${PINECONE_API_KEY.trim().slice(-4)}` : "****";
  
  console.log("   ✅ Définie");
  console.log(`   📏 Longueur: ${keyLength} caractères`);
  console.log(`   🔑 Préfixe: ${keyPrefix}`);
  console.log(`   🔑 Fin: ${keyLastChars}`);
  
  if (PINECONE_API_KEY.trim().startsWith("pckey_")) {
    console.log("   ✅ Format correct (pckey_... - format recommandé pour API Chat)");
  } else if (PINECONE_API_KEY.trim().startsWith("pcsk_")) {
    console.log("   ⚠️  Format: pcsk_... (ancien format, peut ne pas fonctionner avec l'API Chat)");
    console.log("   💡 Créez une nouvelle clé au format pckey_... via: npx ts-node scripts/create-pinecone-api-key.ts");
  } else {
    console.log("   ❌ Format non reconnu (attendu: pckey_... ou pcsk_...)");
    console.log("   💡 L'API Chat nécessite une clé au format pckey_...");
  }
}

// Vérification PINECONE_PROJECT_ID
console.log("\n2️⃣ PINECONE_PROJECT_ID:");
if (!PINECONE_PROJECT_ID) {
  console.log("   ⚠️  Non définie (utilisera la valeur par défaut)");
  console.log("   💡 Valeur par défaut: prj_kcqNaE60ERclhMMTQYfzrlkKwx29");
} else {
  console.log("   ✅ Définie");
  console.log(`   🆔 Project ID: ${PINECONE_PROJECT_ID}`);
}

// Vérification du nom de l'assistant
console.log("\n3️⃣ Assistant Name:");
console.log(`   ✅ ${PINECONE_ASSISTANT_NAME}`);

// URL de l'API
const PINECONE_CHAT_API_URL = `https://api.pinecone.io/assistant/assistants/${PINECONE_ASSISTANT_NAME}/chat`;
console.log("\n4️⃣ URL de l'API Chat:");
console.log(`   🔗 ${PINECONE_CHAT_API_URL}`);

// Test de connexion
console.log("\n5️⃣ Test de connexion:");
if (PINECONE_API_KEY && (PINECONE_API_KEY.trim().startsWith("pckey_") || PINECONE_API_KEY.trim().startsWith("pcsk_"))) {
  console.log("   ⏳ Test en cours...");
  
  // Tester plusieurs combinaisons
  const testCombinations = [
    {
      name: "Api-Key sans x-project-id",
      headers: {
        "Api-Key": PINECONE_API_KEY.trim(),
        "Content-Type": "application/json",
        "X-Pinecone-Api-Version": "2025-01",
      },
    },
    {
      name: "Api-Key avec x-project-id",
      headers: {
        "Api-Key": PINECONE_API_KEY.trim(),
        "Content-Type": "application/json",
        "X-Pinecone-Api-Version": "2025-01",
        "x-project-id": PINECONE_PROJECT_ID || "prj_kcqNaE60ERclhMMTQYfzrlkKwx29",
      },
    },
  ];

  let successCount = 0;
  let lastError: string | null = null;

  for (const test of testCombinations) {
    try {
      const response = await fetch(PINECONE_CHAT_API_URL, {
        method: "POST",
        headers: test.headers,
        body: JSON.stringify({
          messages: [{ role: "user", content: "test" }],
          stream: false,
        }),
      });

      if (response.ok) {
        console.log(`   ✅ ${test.name}: Connexion réussie!`);
        const data = await response.json();
        console.log("   📦 Réponse:", JSON.stringify(data).substring(0, 100) + "...");
        successCount++;
        break; // Si un test réussit, on s'arrête
      } else {
        const errorText = await response.text();
        lastError = `   ❌ ${test.name}: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`;
        console.log(lastError);
      }
    } catch (error) {
      lastError = `   ❌ ${test.name}: ${error instanceof Error ? error.message : String(error)}`;
      console.log(lastError);
    }
  }

  if (successCount === 0) {
    console.log("\n   💡 Aucun test n'a réussi. Exécutez le diagnostic complet:");
    console.log("      npx ts-node scripts/diagnose-pinecone.ts");
  }
} else {
  console.log("   ⏭️  Impossible de tester sans clé API valide");
}

  console.log("\n" + "=".repeat(50));
  console.log("\n💡 Pour Vercel:");
  console.log("   1. Allez dans Settings → Environment Variables");
  console.log("   2. Vérifiez que PINECONE_API_KEY est définie");
  console.log("   3. Ajoutez PINECONE_PROJECT_ID si nécessaire");
  console.log("   4. Redéployez après modification");
  console.log("\n");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});

