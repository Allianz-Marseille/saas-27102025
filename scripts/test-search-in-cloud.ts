/**
 * Test de recherche dans Qdrant Cloud
 * Simule ce que fait le chatbot pour voir si la recherche fonctionne
 */

import { config } from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";

async function main() {
  console.log("🔍 Test de recherche RAG dans Qdrant Cloud\n");

  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!url || !apiKey || !openaiKey) {
    console.error("❌ Variables d'environnement manquantes");
    return;
  }

  try {
    // 1. Connexion Qdrant
    console.log("🔌 Connexion à Qdrant Cloud...");
    const qdrant = new QdrantClient({ url, apiKey });
    
    const collectionInfo = await qdrant.getCollection("rag_documents");
    console.log(`✅ Collection trouvée: ${collectionInfo.points_count} points\n`);

    // 2. Générer embedding de la requête
    console.log("🧠 Génération de l'embedding pour la question...");
    const openai = new OpenAI({ apiKey: openaiKey });
    
    const query = "codes firme agents différenciés pro";
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;
    console.log(`✅ Embedding généré (${queryEmbedding.length} dimensions)\n`);

    // 3. Rechercher dans Qdrant
    console.log("🔍 Recherche dans Qdrant...");
    const searchResults = await qdrant.search("rag_documents", {
      vector: queryEmbedding,
      limit: 3,
      with_payload: true,
    });

    console.log(`✅ ${searchResults.length} résultat(s) trouvé(s)\n`);

    if (searchResults.length === 0) {
      console.log("⚠️  PROBLÈME: Aucun résultat trouvé !");
      console.log("   La recherche ne retourne rien.");
      console.log("   Vérifiez que les documents sont bien indexés.");
    } else {
      console.log("📄 Résultats de la recherche:\n");
      searchResults.forEach((result, index) => {
        console.log(`--- Résultat ${index + 1} (score: ${result.score.toFixed(4)}) ---`);
        console.log(`Document ID: ${result.payload?.documentId}`);
        console.log(`Filename: ${result.payload?.filename}`);
        console.log(`Texte: ${(result.payload?.text as string)?.substring(0, 150)}...`);
        console.log();
      });

      console.log("✅ La recherche RAG fonctionne correctement !");
      console.log("   Le problème doit être ailleurs (config Vercel, cache, etc.)");
    }

  } catch (error) {
    console.error("\n❌ Erreur:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
    }
  }
}

main();

