import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Initialiser Firebase Admin
function initializeFirebaseAdmin() {
  if (admin.apps.length === 0) {
    const serviceAccount = require("../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json");
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin;
}

/**
 * Script d'import initial des salaires
 * 
 * À personnaliser selon vos données existantes.
 * Ce script est un exemple qui définit des salaires par défaut.
 */
async function importInitialSalaries() {
  const adminInstance = initializeFirebaseAdmin();
  const db = adminInstance.firestore();

  console.log("🚀 Début de l'import des salaires initiaux...\n");

  try {
    // Récupérer tous les utilisateurs actifs non-admin
    const usersSnapshot = await db
      .collection("users")
      .where("active", "==", true)
      .where("role", "!=", "ADMINISTRATEUR")
      .get();

    console.log(`📊 ${usersSnapshot.size} utilisateur(s) trouvé(s)\n`);

    if (usersSnapshot.empty) {
      console.log("⚠️  Aucun utilisateur à traiter");
      return;
    }

    // Salaires par défaut selon le rôle (à personnaliser)
    const defaultSalaries: Record<string, number> = {
      CDC_COMMERCIAL: 2500,
      COMMERCIAL_SANTE_INDIVIDUEL: 2300,
      COMMERCIAL_SANTE_COLLECTIVE: 2300,
      GESTIONNAIRE_SINISTRE: 2200,
    };

    let updated = 0;
    let skipped = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const role = userData.role;

      // Vérifier si l'utilisateur a déjà un salaire défini
      if (userData.currentMonthlySalary && userData.currentMonthlySalary > 0) {
        console.log(`⏭️  ${userData.email} : salaire déjà défini (${userData.currentMonthlySalary}€)`);
        skipped++;
        continue;
      }

      // Obtenir le salaire par défaut selon le rôle
      const defaultSalary = defaultSalaries[role] || 2000;

      // Mettre à jour le document user
      await db.collection("users").doc(userId).update({
        currentMonthlySalary: defaultSalary,
      });

      // Créer une entrée d'historique "initial"
      await db.collection("salary_history").add({
        userId,
        year: new Date().getFullYear(),
        monthlySalary: defaultSalary,
        previousMonthlySalary: 0,
        changeType: "initial",
        validatedAt: Timestamp.now(),
        validatedBy: "system",
        createdAt: Timestamp.now(),
      });

      console.log(`✅ ${userData.email} : salaire initialisé à ${defaultSalary}€/mois`);
      updated++;
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Résumé de l'import :");
    console.log(`   ✅ Salaires initialisés : ${updated}`);
    console.log(`   ⏭️  Déjà définis : ${skipped}`);
    console.log("=".repeat(60));
    console.log("\n✨ Import terminé avec succès !");

  } catch (error) {
    console.error("❌ Erreur lors de l'import:", error);
    process.exit(1);
  }
}

// Exécuter le script
importInitialSalaries()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
  });

