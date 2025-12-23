/**
 * Script de test des règles Firebase
 * Vérifie que les règles Firestore et Storage sont correctement configurées
 * 
 * Usage: npm run test:rules
 */

import { adminDb, getStorageBucket } from "../lib/firebase/admin-config";

async function testFirestoreRules() {
  console.log("🧪 Test des règles Firestore...\n");

  // Test 1 : Lecture rag_documents (devrait fonctionner avec Admin SDK)
  try {
    const docs = await adminDb.collection("rag_documents").limit(1).get();
    console.log(`✅ Lecture rag_documents : OK (${docs.size} document(s) trouvé(s))`);
  } catch (error) {
    console.error("❌ Lecture rag_documents :", error);
  }

  // Test 2 : Création rag_documents (devrait fonctionner avec Admin SDK)
  try {
    const testDoc = adminDb.collection("rag_documents").doc("test-" + Date.now());
    await testDoc.set({
      title: "Test",
      type: "test",
      status: "indexed",
      isActive: true,
      uploadedBy: "test-user",
      chunkCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await testDoc.delete();
    console.log("✅ Création rag_documents : OK");
  } catch (error) {
    console.error("❌ Création rag_documents :", error);
  }

  // Test 3 : Lecture rag_chunks
  try {
    const chunks = await adminDb.collection("rag_chunks").limit(1).get();
    console.log(`✅ Lecture rag_chunks : OK (${chunks.size} chunk(s) trouvé(s))`);
  } catch (error) {
    console.error("❌ Lecture rag_chunks :", error);
  }

  // Test 4 : Lecture rag_source_usage
  try {
    const usage = await adminDb.collection("rag_source_usage").limit(1).get();
    console.log(`✅ Lecture rag_source_usage : OK (${usage.size} entrée(s) trouvée(s))`);
  } catch (error) {
    console.error("❌ Lecture rag_source_usage :", error);
  }

  // Test 5 : Lecture assistant_conversations
  try {
    const convs = await adminDb.collection("assistant_conversations").limit(1).get();
    console.log(`✅ Lecture assistant_conversations : OK (${convs.size} conversation(s) trouvée(s))`);
  } catch (error) {
    console.error("❌ Lecture assistant_conversations :", error);
  }
}

async function testStorageRules() {
  console.log("\n🧪 Test des règles Storage...\n");

  // Test : Upload dans knowledge-base/pdf/ (devrait fonctionner avec Admin SDK)
  try {
    const bucket = getStorageBucket();
    const fileName = `knowledge-base/pdf/test-${Date.now()}.pdf`;
    const file = bucket.file(fileName);
    
    await file.save(Buffer.from("test content"), {
      metadata: { contentType: "application/pdf" },
    });
    console.log("✅ Upload Storage : OK");
    
    // Nettoyer
    await file.delete();
    console.log("✅ Suppression fichier test : OK");
  } catch (error) {
    console.error("❌ Upload Storage :", error);
  }

  // Test : Lecture depuis Storage
  try {
    const bucket = getStorageBucket();
    const files = await bucket.getFiles({ prefix: "knowledge-base/pdf/", maxResults: 1 });
    console.log(`✅ Lecture Storage : OK (${files[0].length} fichier(s) trouvé(s))`);
  } catch (error) {
    console.error("❌ Lecture Storage :", error);
  }
}

async function checkIndexes() {
  console.log("\n📊 Vérification des index Firestore...\n");
  console.log("⚠️  Note: Les index doivent être vérifiés manuellement dans Firebase Console");
  console.log("   Firestore Database → Indexes");
  console.log("\nIndex attendus pour RAG:");
  console.log("  - rag_chunks: metadata.documentId (ASC) + metadata.chunkIndex (ASC)");
  console.log("  - rag_documents: isActive (ASC) + createdAt (DESC)");
  console.log("  - rag_documents: category (ASC) + createdAt (DESC)");
  console.log("  - rag_documents: status (ASC) + createdAt (DESC)");
}

async function main() {
  console.log("=".repeat(50));
  console.log("Test des Règles Firebase");
  console.log("=".repeat(50));
  console.log("");

  try {
    await testFirestoreRules();
    await testStorageRules();
    await checkIndexes();

    console.log("\n" + "=".repeat(50));
    console.log("✅ Tests terminés");
    console.log("=".repeat(50));
    console.log("\n⚠️  Important:");
    console.log("   - Ces tests utilisent Admin SDK (bypass les règles)");
    console.log("   - Pour tester les vraies règles, utilisez un client Firebase normal");
    console.log("   - Voir docs/verification-regles-firebase.md pour plus de détails");
  } catch (error) {
    console.error("\n❌ Erreur lors des tests:", error);
    process.exit(1);
  }
}

main();

