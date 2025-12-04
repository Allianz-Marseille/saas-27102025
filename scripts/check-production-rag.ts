/**
 * Script de vérification de la configuration RAG en production
 * Vérifie si les variables d'environnement et la connexion Qdrant fonctionnent
 */

import { config } from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  console.log("🔍 Vérification de la configuration RAG\n");

  // 1. Vérifier les variables d'environnement
  console.log("📋 Variables d'environnement:");
  console.log(`  QDRANT_URL: ${process.env.QDRANT_URL ? "✅ Configurée" : "❌ Manquante"}`);
  console.log(`  QDRANT_API_KEY: ${process.env.QDRANT_API_KEY ? "✅ Configurée" : "❌ Manquante"}`);
  console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "✅ Configurée" : "❌ Manquante"}`);

  if (process.env.QDRANT_URL) {
    console.log(`\n🔗 URL Qdrant: ${process.env.QDRANT_URL}`);
  }

  console.log("\n");

  // 2. Vérifier la connexion Qdrant
  if (process.env.QDRANT_URL && process.env.QDRANT_API_KEY) {
    try {
      const { QdrantClient } = await import("@qdrant/js-client-rest");
      const client = new QdrantClient({
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
      });

      console.log("🔌 Test de connexion Qdrant...");
      const collections = await client.getCollections();
      console.log(`✅ Connexion réussie ! ${collections.collections.length} collection(s) trouvée(s)\n`);

      // 3. Vérifier la collection rag_documents
      const ragCollection = collections.collections.find(
        (c) => c.name === "rag_documents"
      );

      if (ragCollection) {
        const collectionInfo = await client.getCollection("rag_documents");
        console.log("📚 Collection 'rag_documents':");
        console.log(`  - Points: ${collectionInfo.points_count || 0}`);
        console.log(`  - Status: ${collectionInfo.status}`);

        if (collectionInfo.points_count === 0) {
          console.log("\n⚠️  PROBLÈME: La collection est vide !");
          console.log("   Les documents ne sont pas indexés dans Qdrant.");
          console.log("   Solution: Re-uploadez vos documents depuis l'interface admin.");
        } else {
          console.log("\n✅ Des documents sont indexés dans Qdrant");
        }
      } else {
        console.log("⚠️  Collection 'rag_documents' n'existe pas");
        console.log("   Elle sera créée lors du premier upload");
      }
    } catch (error) {
      console.error("\n❌ Erreur de connexion Qdrant:", error);
      if (error instanceof Error) {
        console.error("   Message:", error.message);
      }
    }
  } else {
    console.log("❌ Variables Qdrant manquantes, impossible de tester la connexion");
  }

  // 4. Vérifier Firestore
  console.log("\n");
  console.log("💡 Pour vérifier les documents dans Firestore:");
  console.log("   npx tsx scripts/check-firestore-documents.ts");
}

main();

