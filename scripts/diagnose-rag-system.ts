/**
 * Script de diagnostic complet du système RAG
 * Usage: npm run diagnose:rag
 * 
 * Vérifie:
 * - Configuration des variables d'environnement
 * - Connexion Qdrant
 * - Connexion OpenAI
 * - Connexion Firebase Storage
 * - Test d'extraction PDF
 * - Test de génération d'embeddings
 * - Test d'indexation dans Qdrant
 */

import * as admin from "firebase-admin";
import { ragConfig, validateRagConfig } from "../lib/config/rag-config";
import { checkQdrantHealth, createCollectionIfNotExists } from "../lib/rag/qdrant-client";
import { checkOpenAIConnection, generateEmbedding } from "../lib/rag/embeddings";
import { extractTextFromPDF } from "../lib/rag/pdf-processor";

// Initialiser Firebase Admin
const serviceAccount = require("../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const storage = admin.storage();

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: Record<string, unknown>;
  duration?: number;
}

const results: DiagnosticResult[] = [];

function addResult(result: DiagnosticResult) {
  results.push(result);
  const icon = result.status === "success" ? "✓" : result.status === "error" ? "✗" : "⚠";
  const duration = result.duration ? ` (${result.duration}ms)` : "";
  console.log(`${icon} ${result.name}: ${result.message}${duration}`);
  if (result.details) {
    console.log(`   Détails:`, result.details);
  }
}

async function diagnoseConfiguration(): Promise<void> {
  console.log("\n=== 1. Vérification de la configuration ===\n");
  const startTime = Date.now();

  const configValidation = validateRagConfig();
  if (!configValidation.valid) {
    addResult({
      name: "Configuration RAG",
      status: "error",
      message: "Configuration invalide",
      details: { errors: configValidation.errors },
      duration: Date.now() - startTime,
    });
    return;
  }

  addResult({
    name: "Configuration RAG",
    status: "success",
    message: "Toutes les variables d'environnement sont configurées",
    details: {
      qdrantUrl: ragConfig.qdrant.url ? "✓" : "✗",
      qdrantApiKey: ragConfig.qdrant.apiKey ? "✓" : "✗",
      openaiApiKey: ragConfig.openai.apiKey ? "✓" : "✗",
      storageBucket: ragConfig.storage.bucket ? "✓" : "✗",
    },
    duration: Date.now() - startTime,
  });
}

async function diagnoseQdrant(): Promise<void> {
  console.log("\n=== 2. Vérification de Qdrant ===\n");
  const startTime = Date.now();

  try {
    const health = await checkQdrantHealth();
    if (health.healthy) {
      addResult({
        name: "Connexion Qdrant",
        status: "success",
        message: "Connexion réussie",
        details: { latency: health.latency },
        duration: Date.now() - startTime,
      });

      // Vérifier/créer la collection
      try {
        await createCollectionIfNotExists();
        addResult({
          name: "Collection Qdrant",
          status: "success",
          message: "Collection prête",
          details: { collectionName: ragConfig.qdrant.collectionName },
        });
      } catch (error) {
        addResult({
          name: "Collection Qdrant",
          status: "error",
          message: "Erreur lors de la création/vérification de la collection",
          details: { error: error instanceof Error ? error.message : "Erreur inconnue" },
        });
      }
    } else {
      addResult({
        name: "Connexion Qdrant",
        status: "error",
        message: "Connexion échouée",
        details: { error: health.error, latency: health.latency },
        duration: Date.now() - startTime,
      });
    }
  } catch (error) {
    addResult({
      name: "Connexion Qdrant",
      status: "error",
      message: "Erreur lors de la vérification",
      details: { error: error instanceof Error ? error.message : "Erreur inconnue" },
      duration: Date.now() - startTime,
    });
  }
}

async function diagnoseOpenAI(): Promise<void> {
  console.log("\n=== 3. Vérification d'OpenAI ===\n");
  const startTime = Date.now();

  try {
    const connected = await checkOpenAIConnection();
    if (connected) {
      addResult({
        name: "Connexion OpenAI",
        status: "success",
        message: "Connexion réussie",
        details: {
          embeddingModel: ragConfig.openai.embeddingModel,
          chatModel: ragConfig.openai.chatModel,
        },
        duration: Date.now() - startTime,
      });

      // Test de génération d'embedding
      try {
        const testText = "Test de génération d'embedding";
        const embeddingStartTime = Date.now();
        const embedding = await generateEmbedding(testText);
        const embeddingTime = Date.now() - embeddingStartTime;
        addResult({
          name: "Génération d'embedding",
          status: "success",
          message: "Embedding généré avec succès",
          details: {
            textLength: testText.length,
            embeddingSize: embedding.length,
            duration: embeddingTime,
          },
        });
      } catch (error) {
        addResult({
          name: "Génération d'embedding",
          status: "error",
          message: "Erreur lors de la génération",
          details: { error: error instanceof Error ? error.message : "Erreur inconnue" },
        });
      }
    } else {
      addResult({
        name: "Connexion OpenAI",
        status: "error",
        message: "Connexion échouée",
        duration: Date.now() - startTime,
      });
    }
  } catch (error) {
    addResult({
      name: "Connexion OpenAI",
      status: "error",
      message: "Erreur lors de la vérification",
      details: { error: error instanceof Error ? error.message : "Erreur inconnue" },
      duration: Date.now() - startTime,
    });
  }
}

async function diagnoseFirebaseStorage(): Promise<void> {
  console.log("\n=== 4. Vérification de Firebase Storage ===\n");
  const startTime = Date.now();

  if (!ragConfig.storage.bucket) {
    addResult({
      name: "Firebase Storage",
      status: "error",
      message: "Bucket non configuré",
      duration: Date.now() - startTime,
    });
    return;
  }

  try {
    const bucket = storage.bucket(ragConfig.storage.bucket);
    const [exists] = await bucket.exists();

    if (exists) {
      addResult({
        name: "Firebase Storage",
        status: "success",
        message: "Bucket accessible",
        details: { bucket: ragConfig.storage.bucket },
        duration: Date.now() - startTime,
      });

      // Vérifier les permissions
      try {
        const testFile = bucket.file(`${ragConfig.storage.folder}/.test`);
        await testFile.save(Buffer.from("test"), {
          metadata: { contentType: "text/plain" },
        });
        await testFile.delete();
        addResult({
          name: "Permissions Storage",
          status: "success",
          message: "Permissions OK (écriture/suppression)",
        });
      } catch (error) {
        addResult({
          name: "Permissions Storage",
          status: "warning",
          message: "Problème de permissions",
          details: { error: error instanceof Error ? error.message : "Erreur inconnue" },
        });
      }
    } else {
      addResult({
        name: "Firebase Storage",
        status: "warning",
        message: "Bucket n'existe pas encore (sera créé automatiquement)",
        details: { bucket: ragConfig.storage.bucket },
        duration: Date.now() - startTime,
      });
    }
  } catch (error) {
    addResult({
      name: "Firebase Storage",
      status: "error",
      message: "Erreur lors de la vérification",
      details: { error: error instanceof Error ? error.message : "Erreur inconnue" },
      duration: Date.now() - startTime,
    });
  }
}

async function diagnosePDFExtraction(): Promise<void> {
  console.log("\n=== 5. Test d'extraction PDF ===\n");
  const startTime = Date.now();

  try {
    // Créer un PDF de test minimal (header PDF)
    const testPDFBuffer = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n200\n%%EOF"
    );

    const extractionStartTime = Date.now();
    const text = await extractTextFromPDF(testPDFBuffer);
    const extractionTime = Date.now() - extractionStartTime;

    if (text && text.trim().length > 0) {
      addResult({
        name: "Extraction PDF",
        status: "success",
        message: "Extraction réussie",
        details: {
          textLength: text.length,
          textPreview: text.substring(0, 50),
          duration: extractionTime,
        },
        duration: Date.now() - startTime,
      });
    } else {
      addResult({
        name: "Extraction PDF",
        status: "warning",
        message: "Extraction réussie mais texte vide",
        details: { duration: extractionTime },
        duration: Date.now() - startTime,
      });
    }
  } catch (error) {
    addResult({
      name: "Extraction PDF",
      status: "error",
      message: "Erreur lors de l'extraction",
      details: { error: error instanceof Error ? error.message : "Erreur inconnue" },
      duration: Date.now() - startTime,
    });
  }
}

async function diagnoseFirestore(): Promise<void> {
  console.log("\n=== 6. Vérification de Firestore ===\n");
  const startTime = Date.now();

  try {
    // Test de lecture
    const testDoc = await db.collection("rag_documents").limit(1).get();
    addResult({
      name: "Firestore",
      status: "success",
      message: "Connexion réussie",
      details: {
        documentsCount: testDoc.size,
      },
      duration: Date.now() - startTime,
    });
  } catch (error) {
    addResult({
      name: "Firestore",
      status: "error",
      message: "Erreur lors de la vérification",
      details: { error: error instanceof Error ? error.message : "Erreur inconnue" },
      duration: Date.now() - startTime,
    });
  }
}

function generateReport(): void {
  console.log("\n=== RAPPORT DE DIAGNOSTIC ===\n");

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const warningCount = results.filter((r) => r.status === "warning").length;

  console.log(`Résultats: ${successCount} succès, ${warningCount} avertissements, ${errorCount} erreurs\n`);

  if (errorCount > 0) {
    console.log("ERREURS CRITIQUES:");
    results
      .filter((r) => r.status === "error")
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.message}`);
        if (r.details) {
          console.log(`    Détails:`, r.details);
        }
      });
    console.log();
  }

  if (warningCount > 0) {
    console.log("AVERTISSEMENTS:");
    results
      .filter((r) => r.status === "warning")
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.message}`);
        if (r.details) {
          console.log(`    Détails:`, r.details);
        }
      });
    console.log();
  }

  if (errorCount === 0 && warningCount === 0) {
    console.log("✓ Tous les tests sont passés avec succès!\n");
  } else if (errorCount === 0) {
    console.log("⚠ Le système fonctionne mais avec des avertissements.\n");
  } else {
    console.log("✗ Des erreurs critiques ont été détectées. Veuillez les corriger.\n");
  }
}

async function main() {
  console.log("🔍 Diagnostic du système RAG\n");
  console.log("=" .repeat(50));

  await diagnoseConfiguration();
  await diagnoseQdrant();
  await diagnoseOpenAI();
  await diagnoseFirebaseStorage();
  await diagnosePDFExtraction();
  await diagnoseFirestore();

  generateReport();

  // Exit avec code d'erreur si des erreurs critiques
  const errorCount = results.filter((r) => r.status === "error").length;
  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Erreur fatale lors du diagnostic:", error);
  process.exit(1);
});

