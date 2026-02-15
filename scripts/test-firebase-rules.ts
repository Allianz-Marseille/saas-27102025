/**
 * Script de test des règles Firebase
 * Vérifie que la connexion Firestore et Storage fonctionne
 *
 * Usage: npm run test:rules
 */

import { adminDb, getStorageBucket } from "../lib/firebase/admin-config";

async function testFirestoreConnection() {
  console.log("🧪 Test de connexion Firestore...\n");

  try {
    const sinistres = await adminDb.collection("sinistres").limit(1).get();
    console.log(`✅ Connexion Firestore : OK (${sinistres.size} document(s) dans sinistres)`);
  } catch (error) {
    console.error("❌ Connexion Firestore :", error);
  }
}

async function testStorageConnection() {
  console.log("\n🧪 Test de connexion Storage...\n");

  try {
    const bucket = getStorageBucket();
    const [files] = await bucket.getFiles({ maxResults: 1 });
    console.log(`✅ Connexion Storage : OK (bucket ${bucket.name})`);
  } catch (error) {
    console.error("❌ Connexion Storage :", error);
  }
}

async function main() {
  console.log("=".repeat(50));
  console.log("Test des Règles Firebase");
  console.log("=".repeat(50));
  console.log("");

  try {
    await testFirestoreConnection();
    await testStorageConnection();

    console.log("\n" + "=".repeat(50));
    console.log("✅ Tests terminés");
    console.log("=".repeat(50));
    console.log("\n⚠️  Note:");
    console.log("   - Ces tests utilisent Admin SDK (bypass les règles)");
    console.log("   - Pour tester les vraies règles, utilisez un client Firebase normal");
  } catch (error) {
    console.error("\n❌ Erreur lors des tests:", error);
    process.exit(1);
  }
}

main();
