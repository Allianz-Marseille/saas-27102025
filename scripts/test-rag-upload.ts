/**
 * Script de test pour valider le système RAG complet
 * Usage: npm run test:rag
 */

import * as fs from "fs";
import * as path from "path";
import { ragConfig } from "../lib/config/rag-config";
import { extractTextFromPDF, extractTextFromImage } from "../lib/rag/pdf-processor";
import { generateEmbeddingsBatch, checkOpenAIConnection } from "../lib/rag/embeddings";
import { checkQdrantConnection, getQdrantClient } from "../lib/rag/qdrant-client";

interface TestResult {
  test: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: any;
  duration?: number;
}

const results: TestResult[] = [];

function addResult(result: TestResult) {
  results.push(result);
  const icon = result.status === "success" ? "✅" : result.status === "error" ? "❌" : "⚠️";
  const duration = result.duration ? ` (${result.duration}ms)` : "";
  console.log(`${icon} ${result.test}${duration}: ${result.message}`);
  if (result.details) {
    console.log(`   Détails:`, result.details);
  }
}

async function testEnvironmentVariables() {
  console.log("\n🔍 Test 1/6: Variables d'environnement\n");
  
  const requiredVars = [
    { name: "QDRANT_URL", value: ragConfig.qdrant.url },
    { name: "QDRANT_API_KEY", value: ragConfig.qdrant.apiKey },
    { name: "OPENAI_API_KEY", value: ragConfig.openai.apiKey },
    { name: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", value: ragConfig.storage.bucket },
  ];

  for (const { name, value } of requiredVars) {
    if (!value || value.trim() === "") {
      addResult({
        test: name,
        status: "error",
        message: "Variable manquante ou vide",
      });
    } else {
      const maskedValue = value.length > 20 ? `${value.substring(0, 20)}...` : "***";
      addResult({
        test: name,
        status: "success",
        message: "Configurée",
        details: maskedValue,
      });
    }
  }
}

async function testQdrantConnection() {
  console.log("\n🔍 Test 2/6: Connexion Qdrant\n");
  
  const startTime = Date.now();
  try {
    const connected = await checkQdrantConnection();
    const duration = Date.now() - startTime;
    
    if (connected) {
      addResult({
        test: "Connexion Qdrant",
        status: "success",
        message: "Connexion établie",
        duration,
      });
      
      // Tester la liste des collections
      try {
        const client = getQdrantClient();
        const collections = await client.getCollections();
        addResult({
          test: "Collections Qdrant",
          status: "success",
          message: `${collections.collections.length} collection(s) trouvée(s)`,
          details: collections.collections.map((c: any) => c.name),
        });
      } catch (error) {
        addResult({
          test: "Collections Qdrant",
          status: "warning",
          message: "Impossible de lister les collections",
          details: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    } else {
      addResult({
        test: "Connexion Qdrant",
        status: "error",
        message: "Impossible de se connecter",
        duration,
      });
    }
  } catch (error) {
    addResult({
      test: "Connexion Qdrant",
      status: "error",
      message: "Erreur lors de la connexion",
      details: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

async function testOpenAIConnection() {
  console.log("\n🔍 Test 3/6: Connexion OpenAI\n");
  
  const startTime = Date.now();
  try {
    const connected = await checkOpenAIConnection();
    const duration = Date.now() - startTime;
    
    if (connected) {
      addResult({
        test: "Connexion OpenAI",
        status: "success",
        message: "Connexion établie",
        duration,
      });
    } else {
      addResult({
        test: "Connexion OpenAI",
        status: "error",
        message: "Impossible de se connecter",
        duration,
      });
    }
  } catch (error) {
    addResult({
      test: "Connexion OpenAI",
      status: "error",
      message: "Erreur lors de la connexion",
      details: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

async function testPDFExtraction() {
  console.log("\n🔍 Test 4/6: Extraction PDF\n");
  
  // Créer un mini PDF de test
  const testPdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
0000000302 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
395
%%EOF`;

  const testBuffer = Buffer.from(testPdfContent, 'utf-8');
  
  const startTime = Date.now();
  try {
    const text = await extractTextFromPDF(testBuffer);
    const duration = Date.now() - startTime;
    
    addResult({
      test: "Extraction PDF",
      status: "success",
      message: `Texte extrait (${text.length} caractères)`,
      duration,
      details: text.substring(0, 100),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    addResult({
      test: "Extraction PDF",
      status: "error",
      message: "Échec de l'extraction",
      duration,
      details: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

async function testEmbeddingGeneration() {
  console.log("\n🔍 Test 5/6: Génération d'embeddings\n");
  
  const testTexts = [
    "Ceci est un test d'embedding pour le système RAG",
    "Un autre texte pour tester la génération d'embeddings"
  ];
  
  const startTime = Date.now();
  try {
    const embeddings = await generateEmbeddingsBatch(testTexts);
    const duration = Date.now() - startTime;
    
    if (embeddings.length === testTexts.length && embeddings[0].length > 0) {
      addResult({
        test: "Génération embeddings",
        status: "success",
        message: `${embeddings.length} embeddings générés`,
        duration,
        details: `Dimension: ${embeddings[0].length}`,
      });
    } else {
      addResult({
        test: "Génération embeddings",
        status: "error",
        message: "Embeddings invalides",
        duration,
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    addResult({
      test: "Génération embeddings",
      status: "error",
      message: "Échec de la génération",
      duration,
      details: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

async function testQdrantIndexing() {
  console.log("\n🔍 Test 6/6: Indexation Qdrant\n");
  
  const startTime = Date.now();
  try {
    const client = getQdrantClient();
    
    // Tester si la collection existe
    const collections = await client.getCollections();
    const hasCollection = collections.collections.some((c: any) => c.name === ragConfig.qdrant.collectionName);
    
    const duration = Date.now() - startTime;
    
    if (hasCollection) {
      addResult({
        test: "Collection Qdrant",
        status: "success",
        message: `Collection "${ragConfig.qdrant.collectionName}" existe`,
        duration,
      });
    } else {
      addResult({
        test: "Collection Qdrant",
        status: "warning",
        message: `Collection "${ragConfig.qdrant.collectionName}" n'existe pas encore`,
        details: "Elle sera créée automatiquement lors du premier upload",
        duration,
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    addResult({
      test: "Indexation Qdrant",
      status: "error",
      message: "Erreur lors du test",
      duration,
      details: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("🧪 TEST COMPLET DU SYSTÈME RAG");
  console.log("=".repeat(60));

  await testEnvironmentVariables();
  await testQdrantConnection();
  await testOpenAIConnection();
  await testPDFExtraction();
  await testEmbeddingGeneration();
  await testQdrantIndexing();

  console.log("\n" + "=".repeat(60));
  console.log("📊 RÉSUMÉ DES TESTS");
  console.log("=".repeat(60) + "\n");

  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;
  const warningCount = results.filter(r => r.status === "warning").length;

  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`⚠️  Avertissements: ${warningCount}`);
  console.log(`📝 Total: ${results.length}`);

  if (errorCount === 0) {
    console.log("\n🎉 Tous les tests sont passés ! Le système RAG est opérationnel.");
    process.exit(0);
  } else {
    console.log("\n❌ Des erreurs ont été détectées. Veuillez corriger la configuration.");
    console.log("\nTests en échec:");
    results
      .filter(r => r.status === "error")
      .forEach(r => {
        console.log(`  - ${r.test}: ${r.message}`);
        if (r.details) console.log(`    ${r.details}`);
      });
    process.exit(1);
  }
}

runTests();

