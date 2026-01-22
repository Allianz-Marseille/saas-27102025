/**
 * Script de test pour valider l'upload Storage Firebase
 * Teste chaque étape du processus d'upload indépendamment
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as fs from "fs";
import * as path from "path";

// Initialiser Firebase Admin
let app;
try {
  // Essayer d'abord avec les variables d'environnement
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL
  ) {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log("✅ Firebase Admin initialisé avec variables d'environnement");
  } else {
    // Sinon, utiliser le fichier JSON local
    const jsonPath = path.join(
      process.cwd(),
      "saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json"
    );
    const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    app = initializeApp({
      credential: cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialisé avec fichier JSON local");
  }
} catch (error) {
  console.error("❌ Erreur lors de l'initialisation Firebase Admin:", error);
  process.exit(1);
}

const db = getFirestore();
const storage = getStorage();

/**
 * Obtient le bucket Storage configuré
 */
function getStorageBucket() {
  let bucketName =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET;

  // Si pas de bucket dans les variables d'environnement, essayer de le récupérer du fichier JSON
  if (!bucketName) {
    try {
      const jsonPath = path.join(
        process.cwd(),
        "saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json"
      );
      const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      const projectId = serviceAccount.project_id;
      
      // Essayer d'abord le nouveau format Firebase Storage
      bucketName = `${projectId}.firebasestorage.app`;
    } catch (error) {
      // Fallback sur les variables d'environnement
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (projectId) {
        bucketName = `${projectId}.firebasestorage.app`;
      }
    }
  }

  if (!bucketName) {
    throw new Error("Impossible de déterminer le nom du bucket Storage. Vérifiez votre configuration.");
  }

  return storage.bucket(bucketName);
}

/**
 * Test 1 : Vérifier l'accès au bucket Storage
 */
async function testBucketAccess() {
  console.log("\n🧪 Test 1 : Vérification de l'accès au bucket Storage\n");

  try {
    const bucket = getStorageBucket();
    console.log(`Bucket configuré : ${bucket.name}`);

    // Vérifier si le bucket existe
    const [exists] = await bucket.exists();
    if (exists) {
      console.log("✅ Le bucket existe");
    } else {
      console.log("⚠️ Le bucket n'existe pas");
      console.error("💡 Solution : Activez Firebase Storage dans Firebase Console");
      console.error("   Firebase Console → Storage → Commencer");
      console.error("   Le bucket sera créé automatiquement lors de l'activation");
      
      // Essayer aussi avec l'ancien format au cas où
      const projectId = bucket.name.replace(/\.(appspot|firebasestorage)\.app$/, "");
      const alternativeBucket = storage.bucket(`${projectId}.appspot.com`);
      const [altExists] = await alternativeBucket.exists();
      if (altExists) {
        console.log(`\n⚠️  Bucket alternatif trouvé : ${alternativeBucket.name}`);
        console.log("   Utilisez ce bucket ou migrez vers le nouveau format");
      }
      
      return false;
    }

    // Tester les permissions en listant les fichiers
    try {
      const [files] = await bucket.getFiles({ maxResults: 1 });
      console.log(`✅ Permissions OK - ${files.length} fichier(s) trouvé(s)`);
    } catch (error: any) {
      console.error("❌ Erreur lors de la vérification des permissions:", error.message);
      console.error("Code d'erreur:", error.code);
      if (error.code === 403) {
        console.error("💡 Solution : Vérifiez que le service account a le rôle 'Storage Admin' dans Google Cloud Console");
      } else if (error.code === 404) {
        console.error("💡 Solution : Le bucket n'existe pas. Activez Firebase Storage dans Firebase Console");
      }
      throw error;
    }

    return true;
  } catch (error: any) {
    console.error("❌ Test 1 échoué:", error.message || error);
    if (error.code === 404) {
      console.error("\n💡 Le bucket Storage n'existe pas. Actions à faire :");
      console.error("   1. Aller dans Firebase Console → Storage");
      console.error("   2. Cliquer sur 'Commencer' pour activer Storage");
      console.error("   3. Le bucket sera créé automatiquement");
    }
    return false;
  }
}

/**
 * Test 2 : Upload d'un fichier test dans Storage
 */
async function testFileUpload() {
  console.log("\n🧪 Test 2 : Upload d'un fichier test dans Storage\n");

  try {
    const bucket = getStorageBucket();
    const testFileName = `knowledge-base/pdf/test-${Date.now()}.pdf`;
    const testContent = Buffer.from("Test content for storage upload");

    console.log(`Chemin du fichier test : ${testFileName}`);

    const file = bucket.file(testFileName);

    // Upload
    await file.save(testContent, {
      metadata: {
        contentType: "application/pdf",
        metadata: {
          originalName: "test.pdf",
          uploadedBy: "test-script",
        },
      },
    });

    console.log("✅ Fichier uploadé avec succès");

    // Vérifier que le fichier existe
    const [exists] = await file.exists();
    if (exists) {
      console.log("✅ Fichier vérifié dans Storage");
    } else {
      throw new Error("Le fichier n'existe pas après l'upload");
    }

    // Nettoyer
    await file.delete();
    console.log("✅ Fichier test supprimé");

    return true;
  } catch (error: any) {
    console.error("❌ Test 2 échoué:", error);
    console.error("Code d'erreur:", error.code);
    console.error("Message:", error.message);
    if (error.code === 403) {
      console.error("💡 Solution : Vérifiez que le service account a le rôle 'Storage Admin'");
    } else if (error.code === 404) {
      console.error("💡 Solution : Vérifiez que le bucket existe dans Firebase Console");
    }
    return false;
  }
}

/**
 * Test 3 : Création d'un document Firestore
 */
async function testFirestoreDocument() {
  console.log("\n🧪 Test 3 : Création d'un document Firestore\n");

  try {
    const testDocId = `test-${Date.now()}`;
    const docRef = db.collection("rag_documents").doc(testDocId);

    await docRef.set({
      id: testDocId,
      title: "Test Document",
      type: "document",
      source: "test.pdf",
      storagePath: `knowledge-base/pdf/test-${testDocId}.pdf`,
      status: "uploaded",
      isActive: true,
      uploadedBy: "test-script",
      chunkCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Document Firestore créé");

    // Vérifier que le document existe
    const doc = await docRef.get();
    if (doc.exists) {
      console.log("✅ Document vérifié dans Firestore");
    } else {
      throw new Error("Le document n'existe pas après la création");
    }

    // Nettoyer
    await docRef.delete();
    console.log("✅ Document test supprimé");

    return true;
  } catch (error: any) {
    console.error("❌ Test 3 échoué:", error);
    console.error("Code d'erreur:", error.code);
    console.error("Message:", error.message);
    if (error.code === 7) {
      console.error("💡 Solution : Vérifiez que le service account a les permissions Firestore");
    }
    return false;
  }
}

/**
 * Test 4 : Création d'un chunk Firestore
 */
async function testChunkCreation() {
  console.log("\n🧪 Test 4 : Création d'un chunk Firestore\n");

  try {
    const chunkRef = db.collection("rag_chunks").doc();
    const testDocumentId = `test-doc-${Date.now()}`;

    await chunkRef.set({
      id: chunkRef.id,
      content: "Test chunk content",
      embedding: [0.1, 0.2, 0.3], // Embedding factice pour le test
      tokenCount: 10,
      embeddingModel: "text-embedding-3-small",
      metadata: {
        documentId: testDocumentId,
        documentTitle: "Test Document",
        documentType: "document",
        chunkIndex: 0,
        createdAt: new Date(),
        source: "test.pdf",
        tags: [],
      },
    });

    console.log("✅ Chunk Firestore créé");

    // Vérifier que le chunk existe
    const chunk = await chunkRef.get();
    if (chunk.exists) {
      console.log("✅ Chunk vérifié dans Firestore");
    } else {
      throw new Error("Le chunk n'existe pas après la création");
    }

    // Nettoyer
    await chunkRef.delete();
    console.log("✅ Chunk test supprimé");

    return true;
  } catch (error: any) {
    console.error("❌ Test 4 échoué:", error);
    console.error("Code d'erreur:", error.code);
    console.error("Message:", error.message);
    return false;
  }
}

/**
 * Test 5 : Vérification des variables d'environnement
 */
function testEnvironmentVariables() {
  console.log("\n🧪 Test 5 : Vérification des variables d'environnement\n");

  // En local, on peut utiliser le fichier JSON, donc les variables ne sont pas strictement requises
  const isLocal = !process.env.VERCEL && !process.env.FIREBASE_PROJECT_ID;
  
  if (isLocal) {
    console.log("ℹ️  Mode local détecté - utilisation du fichier JSON pour Firebase Admin");
    console.log("   Les variables d'environnement sont optionnelles en local\n");
  }

  const requiredVars = isLocal ? [] : [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
  ];

  const optionalVars = [
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  ];

  let allOk = true;

  if (requiredVars.length > 0) {
    console.log("Variables requises (production) :");
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (value) {
        console.log(`  ✅ ${varName} : ${varName.includes("KEY") ? "***masqué***" : value}`);
      } else {
        console.log(`  ❌ ${varName} : MANQUANTE`);
        allOk = false;
      }
    }
  }

  console.log("\nVariables optionnelles :");
  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName} : ${value}`);
    } else {
      console.log(`  ⚠️ ${varName} : non définie (utilisera la valeur par défaut)`);
    }
  }

  // Obtenir le bucket name depuis le fichier JSON si en local
  let bucketName: string;
  if (isLocal) {
    try {
      const jsonPath = path.join(
        process.cwd(),
        "saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json"
      );
      const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      const projectId = serviceAccount.project_id;
      bucketName =
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        process.env.FIREBASE_STORAGE_BUCKET ||
        `${projectId}.firebasestorage.app`;
      console.log(`\n📦 Bucket Storage qui sera utilisé : ${bucketName}`);
      console.log(`   (détecté depuis le fichier JSON - project_id: ${projectId})`);
      console.log(`   ℹ️  Format: firebasestorage.app (nouveau format Firebase)`);
    } catch (error) {
      bucketName =
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        process.env.FIREBASE_STORAGE_BUCKET ||
        `${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`;
      console.log(`\n📦 Bucket Storage qui sera utilisé : ${bucketName || "non déterminé"}`);
    }
  } else {
    bucketName =
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      process.env.FIREBASE_STORAGE_BUCKET ||
      `${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`;
    console.log(`\n📦 Bucket Storage qui sera utilisé : ${bucketName || "non déterminé"}`);
  }

  return allOk;
}

/**
 * Fonction principale
 */
async function main() {
  console.log("🚀 Démarrage des tests Storage Firebase\n");
  console.log("=" .repeat(60));

  const results: { test: string; passed: boolean }[] = [];

  // Test 5 : Variables d'environnement (doit être fait en premier)
  const envOk = testEnvironmentVariables();
  results.push({ test: "Variables d'environnement", passed: envOk });

  // En local, on peut continuer même si les variables ne sont pas définies
  const isLocal = !process.env.VERCEL && !process.env.FIREBASE_PROJECT_ID;
  if (!envOk && !isLocal) {
    console.error("\n❌ Certaines variables d'environnement sont manquantes");
    console.error("💡 Vérifiez votre configuration avant de continuer");
    process.exit(1);
  } else if (!envOk && isLocal) {
    console.log("\n⚠️  Variables d'environnement manquantes, mais mode local détecté");
    console.log("   Le script continuera en utilisant le fichier JSON\n");
  }

  // Test 1 : Accès au bucket
  const test1 = await testBucketAccess();
  results.push({ test: "Accès au bucket Storage", passed: test1 });

  // Test 2 : Upload fichier
  const test2 = await testFileUpload();
  results.push({ test: "Upload fichier Storage", passed: test2 });

  // Test 3 : Création document Firestore
  const test3 = await testFirestoreDocument();
  results.push({ test: "Création document Firestore", passed: test3 });

  // Test 4 : Création chunk Firestore
  const test4 = await testChunkCreation();
  results.push({ test: "Création chunk Firestore", passed: test4 });

  // Résumé
  console.log("\n" + "=".repeat(60));
  console.log("📊 RÉSUMÉ DES TESTS\n");

  let allPassed = true;
  for (const result of results) {
    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.test}`);
    if (!result.passed) {
      allPassed = false;
    }
  }

  console.log("\n" + "=".repeat(60));
  if (allPassed) {
    console.log("✅ Tous les tests sont passés avec succès !");
    process.exit(0);
  } else {
    console.log("❌ Certains tests ont échoué");
    console.log("💡 Consultez les messages d'erreur ci-dessus pour plus de détails");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});

