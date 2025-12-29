import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Initialiser Firebase Admin
const serviceAccount = require("../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * Script de nettoyage de l'historique des salaires
 * 
 * Ce script supprime les entrées de l'historique des rémunérations
 * qui ont plus de 3 ans.
 * 
 * À exécuter périodiquement (par exemple via un cron job)
 */

async function cleanOldSalaryHistory() {
  try {
    console.log("🧹 Début du nettoyage de l'historique des salaires...\n");

    // Calculer la date limite (3 ans en arrière)
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const limitTimestamp = Timestamp.fromDate(threeYearsAgo);

    console.log(`📅 Date limite: ${threeYearsAgo.toLocaleDateString("fr-FR")}`);
    console.log(`   Les entrées créées avant cette date seront supprimées.\n`);

    // Récupérer les entrées à supprimer
    const historyRef = db.collection("salary_history");
    const oldEntriesQuery = historyRef.where("createdAt", "<", limitTimestamp);
    const snapshot = await oldEntriesQuery.get();

    if (snapshot.empty) {
      console.log("✅ Aucune entrée à supprimer. L'historique est à jour.\n");
      return;
    }

    console.log(`📝 ${snapshot.size} entrée(s) à supprimer...\n`);

    // Supprimer par batch (max 500 opérations par batch)
    const batchSize = 500;
    let deletedCount = 0;
    let batch = db.batch();
    let operationCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log(
        `   🗑️  Suppression: ${doc.id} (créé le ${data.createdAt.toDate().toLocaleDateString("fr-FR")})`
      );

      batch.delete(doc.ref);
      operationCount++;
      deletedCount++;

      // Si on atteint la limite du batch, on commit et on crée un nouveau batch
      if (operationCount >= batchSize) {
        await batch.commit();
        console.log(`   ✅ Batch de ${operationCount} suppressions committé`);
        batch = db.batch();
        operationCount = 0;
      }
    }

    // Commit le dernier batch s'il reste des opérations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`   ✅ Dernier batch de ${operationCount} suppressions committé`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Résumé du nettoyage:");
    console.log(`   🗑️  Entrées supprimées: ${deletedCount}`);
    console.log(`   📅 Date limite: ${threeYearsAgo.toLocaleDateString("fr-FR")}`);
    console.log("=".repeat(50) + "\n");

    console.log("🎉 Nettoyage terminé avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
    process.exit(1);
  }
}

// Exécuter le script
cleanOldSalaryHistory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

