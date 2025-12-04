/**
 * Script de test complet du système RAG
 * Vérifie toutes les configurations et connexions nécessaires
 */

import { config } from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

// Codes couleur pour les logs
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✓ ${message}`, colors.green);
}

function error(message: string) {
  log(`✗ ${message}`, colors.red);
}

function info(message: string) {
  log(`ℹ ${message}`, colors.blue);
}

function warning(message: string) {
  log(`⚠ ${message}`, colors.yellow);
}

async function testConfiguration() {
  log("\n" + "=".repeat(60), colors.cyan);
  log("TEST 1: Configuration des variables d'environnement", colors.cyan);
  log("=".repeat(60) + "\n", colors.cyan);

  const requiredVars = [
    { name: "QDRANT_URL", value: process.env.QDRANT_URL },
    { name: "QDRANT_API_KEY", value: process.env.QDRANT_API_KEY },
    { name: "OPENAI_API_KEY", value: process.env.OPENAI_API_KEY },
    { name: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", value: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET },
    { name: "GOOGLE_CLOUD_PROJECT", value: process.env.GOOGLE_CLOUD_PROJECT },
    { name: "GOOGLE_DOCUMENT_AI_PROCESSOR_ID", value: process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID },
    { name: "GOOGLE_PRIVATE_KEY", value: process.env.GOOGLE_PRIVATE_KEY ? "***" : undefined }, // Ne pas afficher la clé privée
    { name: "GOOGLE_CLIENT_EMAIL", value: process.env.GOOGLE_CLIENT_EMAIL },
  ];

  let allConfigured = true;
  for (const variable of requiredVars) {
    if (variable.value) {
      success(`${variable.name}: Configuré`);
    } else {
      error(`${variable.name}: MANQUANT`);
      allConfigured = false;
    }
  }

  return allConfigured;
}

async function testQdrantConnection() {
  log("\n" + "=".repeat(60), colors.cyan);
  log("TEST 2: Connexion à Qdrant", colors.cyan);
  log("=".repeat(60) + "\n", colors.cyan);

  try {
    const { QdrantClient } = await import("@qdrant/js-client-rest");
    const client = new QdrantClient({
      url: process.env.QDRANT_URL!,
      apiKey: process.env.QDRANT_API_KEY!,
    });

    info("Test de connexion...");
    const startTime = Date.now();
    const collections = await client.getCollections();
    const latency = Date.now() - startTime;
    
    success(`Connexion réussie (${latency}ms)`);
    info(`Collections trouvées: ${collections.collections.length}`);
    
    const ragCollection = collections.collections.find(col => col.name === "rag_documents");
    if (ragCollection) {
      success("Collection 'rag_documents' existe");
      const collectionInfo = await client.getCollection("rag_documents");
      info(`Points dans la collection: ${collectionInfo.points_count}`);
    } else {
      warning("Collection 'rag_documents' n'existe pas encore (sera créée au premier upload)");
    }

    return true;
  } catch (err) {
    error(`Échec de connexion: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    return false;
  }
}

async function testOpenAIConnection() {
  log("\n" + "=".repeat(60), colors.cyan);
  log("TEST 3: Connexion à OpenAI", colors.cyan);
  log("=".repeat(60) + "\n", colors.cyan);

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    info("Test de génération d'embedding...");
    const startTime = Date.now();
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: "Test de connexion",
    });
    const latency = Date.now() - startTime;

    success(`Connexion réussie (${latency}ms)`);
    info(`Dimension du vecteur: ${response.data[0].embedding.length}`);
    return true;
  } catch (err) {
    error(`Échec de connexion: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    return false;
  }
}

async function testFirebaseAdmin() {
  log("\n" + "=".repeat(60), colors.cyan);
  log("TEST 4: Firebase Admin SDK", colors.cyan);
  log("=".repeat(60) + "\n", colors.cyan);

  try {
    const { adminDb, adminStorage } = await import("@/lib/firebase/admin-config");

    info("Test de connexion Firestore...");
    const startTime = Date.now();
    const testDoc = await adminDb.collection("rag_documents").limit(1).get();
    const firestoreLatency = Date.now() - startTime;
    success(`Firestore OK (${firestoreLatency}ms)`);
    info(`Documents rag_documents: ${testDoc.size}`);

    info("Test de connexion Storage...");
    const bucket = adminStorage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const [exists] = await bucket.exists();
    if (exists) {
      success("Storage bucket existe");
    } else {
      warning("Storage bucket n'existe pas encore");
    }

    return true;
  } catch (err) {
    error(`Échec Firebase: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    return false;
  }
}

async function testGoogleDocumentAI() {
  log("\n" + "=".repeat(60), colors.cyan);
  log("TEST 5: Google Document AI", colors.cyan);
  log("=".repeat(60) + "\n", colors.cyan);

  try {
    const { getDocumentAIClient, googleConfig } = await import("@/lib/google-cloud/config");
    
    info("Configuration Document AI:");
    info(`  Project ID: ${googleConfig.projectId}`);
    info(`  Processor ID: ${googleConfig.documentAI.processorId}`);
    info(`  Location: ${googleConfig.documentAI.location}`);

    const client = getDocumentAIClient();
    success("Client Document AI initialisé");

    return true;
  } catch (err) {
    error(`Échec Document AI: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    return false;
  }
}

async function main() {
  log("\n" + "╔" + "═".repeat(58) + "╗", colors.cyan);
  log("║" + " ".repeat(15) + "TEST SYSTÈME RAG COMPLET" + " ".repeat(19) + "║", colors.cyan);
  log("╚" + "═".repeat(58) + "╝\n", colors.cyan);

  const results = {
    config: await testConfiguration(),
    qdrant: false,
    openai: false,
    firebase: false,
    documentAI: false,
  };

  if (results.config) {
    results.qdrant = await testQdrantConnection();
    results.openai = await testOpenAIConnection();
    results.firebase = await testFirebaseAdmin();
    results.documentAI = await testGoogleDocumentAI();
  } else {
    error("\n⚠️  Configuration incomplète. Corrigez les variables manquantes avant de continuer.");
  }

  // Résumé
  log("\n" + "=".repeat(60), colors.cyan);
  log("RÉSUMÉ", colors.cyan);
  log("=".repeat(60) + "\n", colors.cyan);

  const allTests = [
    { name: "Configuration", status: results.config },
    { name: "Qdrant", status: results.qdrant },
    { name: "OpenAI", status: results.openai },
    { name: "Firebase", status: results.firebase },
    { name: "Google Document AI", status: results.documentAI },
  ];

  allTests.forEach(test => {
    if (test.status) {
      success(`${test.name}: OK`);
    } else {
      error(`${test.name}: ÉCHEC`);
    }
  });

  const allPassed = Object.values(results).every(v => v);
  
  log("\n" + "=".repeat(60), colors.cyan);
  if (allPassed) {
    success("\n✅ TOUS LES TESTS SONT PASSÉS\n");
    success("Le système RAG est opérationnel et prêt à être utilisé.\n");
  } else {
    error("\n❌ CERTAINS TESTS ONT ÉCHOUÉ\n");
    warning("Consultez les détails ci-dessus et corrigez les problèmes.\n");
    process.exit(1);
  }
}

main().catch(err => {
  error(`\n❌ Erreur fatale: ${err instanceof Error ? err.message : "Erreur inconnue"}\n`);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});

