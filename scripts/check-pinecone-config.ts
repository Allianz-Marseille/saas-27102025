#!/usr/bin/env ts-node
/**
 * Script de vérification de la configuration Pinecone
 * Usage: npx ts-node scripts/check-pinecone-config.ts
 */

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_PROJECT_ID = process.env.PINECONE_PROJECT_ID;
const PINECONE_ASSISTANT_NAME = "saas-allianz";

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
  
  if (!PINECONE_API_KEY.trim().startsWith("pcsk_")) {
    console.log("   ⚠️  ATTENTION: La clé devrait commencer par 'pcsk_'");
  } else {
    console.log("   ✅ Format correct (commence par 'pcsk_')");
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

// Test de connexion (optionnel)
if (PINECONE_API_KEY && PINECONE_API_KEY.trim().startsWith("pcsk_")) {
  console.log("\n5️⃣ Test de connexion:");
  console.log("   ⏳ Test en cours...");
  
  fetch(PINECONE_CHAT_API_URL, {
    method: "POST",
    headers: {
      "Api-Key": PINECONE_API_KEY.trim(),
      "Content-Type": "application/json",
      "X-Pinecone-Api-Version": "2025-01",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "test" }],
      stream: false,
    }),
  })
    .then(async (response) => {
      if (response.ok) {
        console.log("   ✅ Connexion réussie!");
        const data = await response.json();
        console.log("   📦 Réponse:", JSON.stringify(data).substring(0, 100) + "...");
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Erreur ${response.status}: ${response.statusText}`);
        console.log("   📄 Détails:", errorText.substring(0, 200));
      }
    })
    .catch((error) => {
      console.log("   ❌ Erreur réseau:", error.message);
    });
} else {
  console.log("\n5️⃣ Test de connexion:");
  console.log("   ⏭️  Impossible de tester sans clé API valide");
}

console.log("\n" + "=".repeat(50));
console.log("\n💡 Pour Vercel:");
console.log("   1. Allez dans Settings → Environment Variables");
console.log("   2. Vérifiez que PINECONE_API_KEY est définie");
console.log("   3. Ajoutez PINECONE_PROJECT_ID si nécessaire");
console.log("   4. Redéployez après modification");
console.log("\n");

