/**
 * Script de test de connexion Qdrant
 * Charge les variables d'environnement AVANT d'importer les modules
 */

import { config } from "dotenv";
import { resolve } from "path";

// IMPORTANT: Charger les variables AVANT tout import
config({ path: resolve(process.cwd(), ".env.local") });

// Maintenant on peut importer
import { QdrantClient } from "@qdrant/js-client-rest";

async function main() {
  console.log("🔍 Test de connexion Qdrant\n");

  // Vérifier les variables
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  console.log("📋 Configuration:");
  console.log(`  QDRANT_URL: ${url ? "✅ Configurée" : "❌ Manquante"}`);
  console.log(`  QDRANT_API_KEY: ${apiKey ? "✅ Configurée" : "❌ Manquante"}`);
  console.log();

  if (!url || !apiKey) {
    console.error("❌ Variables d'environnement manquantes");
    process.exit(1);
  }

  try {
    // Créer le client
    console.log("🔌 Connexion à Qdrant...");
    const client = new QdrantClient({
      url,
      apiKey,
    });

    // Tester la connexion
    const collections = await client.getCollections();
    console.log(`✅ Connexion réussie !`);
    console.log(`📚 Collections trouvées: ${collections.collections.length}`);
    
    if (collections.collections.length > 0) {
      console.log("\n📋 Détails des collections:");
      for (const col of collections.collections) {
        console.log(`  - ${col.name}`);
      }
    } else {
      console.log("\n⚠️  Aucune collection trouvée. La collection sera créée lors du premier upload.");
    }

    // Vérifier si la collection rag_documents existe
    const collectionName = "rag_documents";
    try {
      const collectionInfo = await client.getCollection(collectionName);
      console.log(`\n✅ Collection '${collectionName}' trouvée:`);
      console.log(`  - Points: ${collectionInfo.points_count || 0}`);
      console.log(`  - Status: ${collectionInfo.status}`);
    } catch (error) {
      console.log(`\n⚠️  Collection '${collectionName}' n'existe pas encore`);
      console.log("   Elle sera créée automatiquement lors du premier upload de document");
    }

    console.log("\n🎉 Le système RAG est prêt à fonctionner !");
  } catch (error) {
    console.error("\n❌ Erreur de connexion:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
    }
    process.exit(1);
  }
}

main();

