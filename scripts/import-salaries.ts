/**
 * Script d'import initial des salaires
 * 
 * Utilisation:
 * 1. Créer un fichier JSON avec la structure suivante:
 *    [
 *      { "email": "user@example.com", "monthlySalary": 3000 },
 *      ...
 *    ]
 * 2. Placer le fichier dans scripts/data/salaries.json
 * 3. Exécuter: npx ts-node --project tsconfig.scripts.json scripts/import-salaries.ts
 */

import * as admin from "firebase-admin";
import { readFileSync } from "fs";
import { join } from "path";

interface SalaryImportData {
  email: string;
  monthlySalary: number;
}

async function importSalaries() {
  try {
    // Initialiser Firebase Admin
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(
        readFileSync("./saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json", "utf8")
      );
    } catch {
      console.error("❌ Fichier de credentials Firebase Admin introuvable");
      process.exit(1);
    }

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    const db = admin.firestore();
    const auth = admin.auth();

    console.log("📊 Import des salaires");
    console.log("=".repeat(50));

    // Lire le fichier de données
    let salariesData: SalaryImportData[];
    try {
      const fileContent = readFileSync(
        join(__dirname, "data", "salaries.json"),
        "utf8"
      );
      salariesData = JSON.parse(fileContent);
    } catch (error) {
      console.error("❌ Fichier scripts/data/salaries.json introuvable ou invalide");
      console.log("\n💡 Créez un fichier JSON avec la structure:");
      console.log('[{"email": "user@example.com", "monthlySalary": 3000}]');
      process.exit(1);
    }

    console.log(`\n📁 ${salariesData.length} salarié(s) à importer\n`);

    let success = 0;
    let failed = 0;
    const currentYear = new Date().getFullYear();

    for (const salaryData of salariesData) {
      try {
        // Trouver l'utilisateur par email
        const userRecord = await auth.getUserByEmail(salaryData.email);
        const userId = userRecord.uid;

        // Mettre à jour le salaire dans le document user
        await db.collection("users").doc(userId).update({
          currentMonthlySalary: salaryData.monthlySalary,
        });

        // Créer une entrée d'historique "initial"
        await db.collection("salary_history").add({
          userId: userId,
          year: currentYear,
          monthlySalary: salaryData.monthlySalary,
          previousMonthlySalary: null,
          changeType: "initial",
          changeAmount: 0,
          changePercentage: 0,
          validatedAt: admin.firestore.Timestamp.now(),
          validatedBy: "system",
          createdAt: admin.firestore.Timestamp.now(),
        });

        console.log(`✅ ${salaryData.email}: ${salaryData.monthlySalary}€/mois`);
        success++;
      } catch (error: any) {
        console.error(`❌ ${salaryData.email}: ${error.message}`);
        failed++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Résumé:");
    console.log(`   ✅ Importés: ${success}`);
    console.log(`   ❌ Échecs: ${failed}`);
    console.log("=".repeat(50) + "\n");

    console.log("🎉 Import terminé !");
  } catch (error) {
    console.error("❌ Erreur lors de l'import:", error);
    process.exit(1);
  }
}

// Exécuter le script
importSalaries();
