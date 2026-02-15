/**
 * Script de test pour valider l'upload Storage Firebase
 * Teste l'accès au bucket et l'upload de fichiers
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import * as fs from "fs";
import * as path from "path";

// Initialiser Firebase Admin
let app;
try {
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

const storage = getStorage();

function getStorageBucket() {
  let bucketName =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET;

  if (!bucketName) {
    try {
      const jsonPath = path.join(
        process.cwd(),
        "saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json"
      );
      const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      bucketName = `${serviceAccount.project_id}.firebasestorage.app`;
    } catch {
      const projectId =
        process.env.FIREBASE_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (projectId) {
        bucketName = `${projectId}.firebasestorage.app`;
      }
    }
  }

  if (!bucketName) {
    throw new Error(
      "Impossible de déterminer le nom du bucket Storage. Vérifiez votre configuration."
    );
  }

  return storage.bucket(bucketName);
}

async function testBucketAccess() {
  console.log("\n🧪 Test 1 : Vérification de l'accès au bucket Storage\n");

  try {
    const bucket = getStorageBucket();
    console.log(`Bucket configuré : ${bucket.name}`);

    const [exists] = await bucket.exists();
    if (exists) {
      console.log("✅ Le bucket existe");
    } else {
      console.log("⚠️ Le bucket n'existe pas");
      console.error("💡 Activez Firebase Storage dans Firebase Console");
      return false;
    }

    const [files] = await bucket.getFiles({ maxResults: 1 });
    console.log(`✅ Permissions OK - ${files.length} fichier(s) trouvé(s)`);
    return true;
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.error("❌ Test 1 échoué:", err.message || error);
    return false;
  }
}

async function testFileUpload() {
  console.log("\n🧪 Test 2 : Upload d'un fichier test dans Storage\n");

  try {
    const bucket = getStorageBucket();
    const testFileName = `test-uploads/test-${Date.now()}.txt`;
    const testContent = Buffer.from("Test content for storage upload");

    const file = bucket.file(testFileName);
    await file.save(testContent, {
      metadata: { contentType: "text/plain" },
    });
    console.log("✅ Fichier uploadé avec succès");

    const [exists] = await file.exists();
    if (!exists) {
      throw new Error("Le fichier n'existe pas après l'upload");
    }
    console.log("✅ Fichier vérifié dans Storage");

    await file.delete();
    console.log("✅ Fichier test supprimé");
    return true;
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.error("❌ Test 2 échoué:", err.message || error);
    return false;
  }
}

function testEnvironmentVariables() {
  console.log("\n🧪 Test 3 : Vérification des variables d'environnement\n");

  const isLocal = !process.env.VERCEL && !process.env.FIREBASE_PROJECT_ID;

  if (isLocal) {
    console.log("ℹ️  Mode local - utilisation du fichier JSON pour Firebase Admin");
  }

  const requiredVars = isLocal
    ? []
    : ["FIREBASE_PROJECT_ID", "FIREBASE_PRIVATE_KEY", "FIREBASE_CLIENT_EMAIL"];

  let allOk = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName} : ${varName.includes("KEY") ? "***masqué***" : value}`);
    } else {
      console.log(`  ❌ ${varName} : MANQUANTE`);
      allOk = false;
    }
  }
  return allOk;
}

async function main() {
  console.log("🚀 Démarrage des tests Storage Firebase\n");
  console.log("=".repeat(60));

  const envOk = testEnvironmentVariables();
  const isLocal = !process.env.VERCEL && !process.env.FIREBASE_PROJECT_ID;

  if (!envOk && !isLocal) {
    console.error("\n❌ Variables d'environnement manquantes");
    process.exit(1);
  }

  const test1 = await testBucketAccess();
  const test2 = await testFileUpload();

  console.log("\n" + "=".repeat(60));
  console.log("📊 RÉSUMÉ DES TESTS\n");
  console.log(`${test1 ? "✅" : "❌"} Accès au bucket Storage`);
  console.log(`${test2 ? "✅" : "❌"} Upload fichier Storage`);

  const allPassed = test1 && test2;
  console.log("\n" + "=".repeat(60));
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});
