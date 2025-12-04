/**
 * Script de diagnostic pour Qdrant
 * Vérifie la connexion, les collections et tente une opération de test
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "dotenv";
import { resolve } from "path";
import { v4 as uuidv4 } from "uuid";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = "rag_documents";

async function main() {
  console.log("🔍 Diagnostic Qdrant\n");
  console.log("Configuration:");
  console.log(`  URL: ${QDRANT_URL ? "✓ Configuré" : "✗ Manquant"}`);
  console.log(`  API Key: ${QDRANT_API_KEY ? "✓ Configuré" : "✗ Manquant"}`);
  console.log(`  Collection: ${COLLECTION_NAME}\n`);

  if (!QDRANT_URL || !QDRANT_API_KEY) {
    console.error("❌ Configuration Qdrant manquante");
    process.exit(1);
  }

  const client = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
  });

  try {
    // 1. Test de connexion
    console.log("1️⃣ Test de connexion...");
    const startTime = Date.now();
    const collections = await client.getCollections();
    const latency = Date.now() - startTime;
    console.log(`   ✓ Connexion réussie (${latency}ms)`);
    console.log(`   Collections existantes: ${collections.collections.length}`);
    collections.collections.forEach((col) => {
      console.log(`     - ${col.name}`);
    });

    // 2. Vérifier la collection rag_documents
    console.log(`\n2️⃣ Vérification de la collection "${COLLECTION_NAME}"...`);
    const collectionExists = collections.collections.some(
      (col) => col.name === COLLECTION_NAME
    );

    if (collectionExists) {
      console.log(`   ✓ Collection existe`);

      // Obtenir les détails de la collection
      const collectionInfo = await client.getCollection(COLLECTION_NAME);
      console.log(`   Configuration:`);
      console.log(`     - Dimension des vecteurs: ${collectionInfo.config?.params?.vectors}`);
      console.log(`     - Distance: ${JSON.stringify(collectionInfo.config?.params?.vectors)}`);
      console.log(`     - Points count: ${collectionInfo.points_count}`);

      // 3. Test d'un point vectoriel simple
      console.log(`\n3️⃣ Test d'insertion d'un point...`);
      const testPointId = uuidv4(); // UUID valide pour Qdrant
      const testPoint = {
        id: testPointId,
        vector: Array(1536).fill(0.1), // Vecteur de dimension 1536
        payload: {
          documentId: "test_document",
          chunkIndex: 0,
          text: "Ceci est un test",
          filename: "test.pdf",
          fileType: "pdf",
          metadata: {},
        },
      };

      try {
        await client.upsert(COLLECTION_NAME, {
          wait: true,
          points: [testPoint],
        });
        console.log(`   ✓ Insertion réussie`);

        // Nettoyage
        await client.delete(COLLECTION_NAME, {
          wait: true,
          points: [testPointId],
        });
        console.log(`   ✓ Suppression du point de test réussie`);
      } catch (insertError) {
        console.error(`   ✗ Erreur d'insertion:`, insertError);
        if (insertError instanceof Error) {
          console.error(`     Message: ${insertError.message}`);
        }
      }
    } else {
      console.log(`   ⚠️  Collection n'existe pas`);
      console.log(`\n3️⃣ Création de la collection...`);

      try {
        await client.createCollection(COLLECTION_NAME, {
          vectors: {
            size: 1536,
            distance: "Cosine",
          },
        });
        console.log(`   ✓ Collection créée avec succès`);
      } catch (createError) {
        console.error(`   ✗ Erreur de création:`, createError);
        if (createError instanceof Error) {
          console.error(`     Message: ${createError.message}`);
        }
      }
    }

    console.log("\n✅ Diagnostic terminé");
  } catch (error) {
    console.error("\n❌ Erreur lors du diagnostic:");
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();

