/**
 * Script de test de la recherche RAG
 * Vérifie que les documents sont indexés et que la recherche fonctionne
 */

import { config } from "dotenv";
import { resolve } from "path";
import { searchRelevantContexts } from "@/lib/rag/chat-service";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  console.log("🔍 Test de recherche RAG\n");

  try {
    const testQuery = "codes firme agents différenciés pro";
    console.log(`📝 Requête de test: "${testQuery}"\n`);

    // Rechercher les contextes pertinents
    const results = await searchRelevantContexts(testQuery, 5);

    if (results.length === 0) {
      console.log("❌ Aucun résultat trouvé");
      console.log("\nCauses possibles:");
      console.log("1. Aucun document indexé dans Qdrant");
      console.log("2. Les embeddings ne correspondent pas à la requête");
      console.log("3. Erreur de connexion à Qdrant");
      console.log("\nVérifiez les logs ci-dessus pour plus de détails");
      return;
    }

    console.log(`✅ ${results.length} résultat(s) trouvé(s)\n`);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      console.log(`--- Résultat ${i + 1} ---`);
      console.log(`Score: ${result.score}`);
      console.log(`Document ID: ${result.documentId}`);
      console.log(`Chunk ID: ${result.id}`);
      console.log(`Texte (${result.text.length} caractères):`);
      console.log(result.text.substring(0, 200) + "...\n");
    }

    console.log("✅ La recherche RAG fonctionne correctement");
  } catch (error) {
    console.error("\n❌ Erreur lors du test:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

main();

