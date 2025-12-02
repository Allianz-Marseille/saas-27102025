/**
 * Script de test pour vérifier les connexions RAG (Qdrant + OpenAI)
 * 
 * Usage: npx ts-node --project tsconfig.scripts.json -r tsconfig-paths/register scripts/test-rag-connection.ts
 */

// Enregistrer tsconfig-paths AVANT tous les imports
import "tsconfig-paths/register";

import { config } from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement depuis .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { validateRagConfig } from "@/lib/config/rag-config";
import { checkQdrantConnection, createCollectionIfNotExists } from "@/lib/rag/qdrant-client";
import { generateEmbedding } from "@/lib/rag/embeddings";

async function testRagConnections() {
  console.log("🔍 Test des connexions RAG...\n");

  // 1. Validation de la configuration
  console.log("1️⃣ Validation de la configuration...");
  const configValidation = validateRagConfig();
  
  if (!configValidation.valid) {
    console.error("❌ Erreurs de configuration:");
    configValidation.errors.forEach((error) => {
      console.error(`   - ${error}`);
    });
    console.error("\n💡 Assurez-vous d'avoir créé un fichier .env.local avec:");
    console.error("   - QDRANT_URL");
    console.error("   - QDRANT_API_KEY");
    console.error("   - OPENAI_API_KEY");
    process.exit(1);
  }
  console.log("✅ Configuration valide\n");

  // 2. Test de connexion Qdrant
  console.log("2️⃣ Test de connexion à Qdrant...");
  try {
    const qdrantConnected = await checkQdrantConnection();
    if (qdrantConnected) {
      console.log("✅ Connexion à Qdrant réussie\n");
    } else {
      console.error("❌ Impossible de se connecter à Qdrant\n");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Erreur lors de la connexion à Qdrant:");
    console.error(`   ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  // 3. Création de la collection Qdrant
  console.log("3️⃣ Vérification/création de la collection Qdrant...");
  try {
    await createCollectionIfNotExists();
    console.log("✅ Collection Qdrant prête\n");
  } catch (error) {
    console.error("❌ Erreur lors de la création de la collection:");
    console.error(`   ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  // 4. Test de génération d'embedding OpenAI
  console.log("4️⃣ Test de génération d'embedding OpenAI...");
  try {
    const testText = "Ceci est un texte de test pour vérifier la génération d'embeddings.";
    const embedding = await generateEmbedding(testText);
    
    if (embedding && Array.isArray(embedding) && embedding.length > 0) {
      console.log(`✅ Embedding généré avec succès (dimension: ${embedding.length})\n`);
    } else {
      console.error("❌ L'embedding généré est invalide\n");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Erreur lors de la génération d'embedding:");
    console.error(`   ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  // 5. Résumé
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Tous les tests sont passés avec succès !");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("🎉 Le système RAG est prêt à être utilisé.\n");
}

// Exécuter les tests
testRagConnections().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});

