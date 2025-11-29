/**
 * Script pour générer/mettre à jour la collection leaderboard
 * 
 * Ce script agrège les données des actes par utilisateur et par mois
 * pour créer des entrées dans la collection leaderboard.
 * 
 * Usage:
 * npx tsx scripts/generate-leaderboard.ts [YYYY-MM]
 * 
 * Si aucun mois n'est fourni, utilise le mois en cours.
 * 
 * Ce script devrait être exécuté:
 * 1. Une fois manuellement pour initialiser les données historiques
 * 2. Régulièrement via un cron job (recommandé: daily)
 * 3. Après des imports/corrections de masse d'actes
 */

import admin from "firebase-admin";
import dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

// Initialiser Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

interface Act {
  userId: string;
  kind: string;
  moisKey: string;
  commissionPotentielle: number;
  primeAnnuelle?: number;
  montantVersement?: number;
  contratType: string;
}

interface UserData {
  id: string;
  email: string;
  role: string;
}

interface LeaderboardData {
  userId: string;
  email: string;
  firstName: string;
  monthKey: string;
  commissions: number;
  process: number;
  ca: number;
  actsCount: number;
  lastUpdated: FirebaseFirestore.Timestamp;
  [key: string]: any; // Index signature pour compatibilité avec UpdateData
}

/**
 * Calcule les KPI d'un utilisateur pour un mois donné
 */
function calculateUserKPI(acts: Act[]): {
  commissions: number;
  process: number;
  ca: number;
  actsCount: number;
} {
  let commissions = 0;
  let process = 0;
  let ca = 0;

  acts.forEach((act) => {
    const isProcess =
      act.kind === "M+3" ||
      act.kind === "PRETERME_AUTO" ||
      act.kind === "PRETERME_IRD";

    if (isProcess) {
      process++;
    } else {
      commissions += act.commissionPotentielle || 0;
    }

    // CA = primeAnnuelle pour la plupart, montantVersement pour VIE_PU
    if (act.contratType === "VIE_PU") {
      ca += act.montantVersement || 0;
    } else {
      ca += act.primeAnnuelle || 0;
    }
  });

  return {
    commissions: Math.round(commissions * 100) / 100,
    process,
    ca: Math.round(ca * 100) / 100,
    actsCount: acts.length,
  };
}

/**
 * Extrait le prénom depuis l'email
 */
function extractFirstName(email: string): string {
  const emailParts = email.split("@")[0].split(".");
  const rawFirstName = emailParts[0] || "Commercial";
  return (
    rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase()
  );
}

/**
 * Génère le leaderboard pour un mois donné
 */
async function generateLeaderboard(monthKey: string) {
  console.log(`\n📊 Génération du leaderboard pour ${monthKey}...`);

  try {
    // 1. Récupérer tous les utilisateurs actifs
    const usersSnapshot = await db.collection("users").get();
    const users = usersSnapshot.docs
      .map((doc) => doc.data() as UserData)
      .filter((user) => user.role === "CDC_COMMERCIAL");

    console.log(`   ✓ ${users.length} commerciaux trouvés`);

    // 2. Récupérer tous les actes du mois
    const actsSnapshot = await db
      .collection("acts")
      .where("moisKey", "==", monthKey)
      .get();

    console.log(`   ✓ ${actsSnapshot.size} actes trouvés`);

    // 3. Grouper les actes par utilisateur
    const actsByUser = new Map<string, Act[]>();
    actsSnapshot.docs.forEach((doc) => {
      const act = doc.data() as Act;
      if (!actsByUser.has(act.userId)) {
        actsByUser.set(act.userId, []);
      }
      actsByUser.get(act.userId)!.push(act);
    });

    // 4. Calculer les KPI et créer/mettre à jour les documents leaderboard
    const batch = db.batch();
    let updatedCount = 0;

    for (const user of users) {
      const userActs = actsByUser.get(user.id) || [];
      const kpi = calculateUserKPI(userActs);
      const firstName = extractFirstName(user.email);

      const leaderboardData: LeaderboardData = {
        userId: user.id,
        email: user.email,
        firstName,
        monthKey,
        commissions: kpi.commissions,
        process: kpi.process,
        ca: kpi.ca,
        actsCount: kpi.actsCount,
        lastUpdated: admin.firestore.Timestamp.now(),
      };

      // Vérifier si une entrée existe déjà
      const existingQuery = await db
        .collection("leaderboard")
        .where("userId", "==", user.id)
        .where("monthKey", "==", monthKey)
        .get();

      if (existingQuery.empty) {
        // Créer une nouvelle entrée
        const newDocRef = db.collection("leaderboard").doc();
        batch.set(newDocRef, leaderboardData);
      } else {
        // Mettre à jour l'entrée existante
        const existingDocRef = existingQuery.docs[0].ref;
        batch.update(existingDocRef, leaderboardData);
      }

      updatedCount++;

      // Log détaillé pour chaque utilisateur
      if (kpi.actsCount > 0) {
        console.log(
          `   - ${firstName}: ${kpi.actsCount} actes, ${kpi.commissions}€, ${kpi.process} process, ${kpi.ca}€ CA`
        );
      }
    }

    // 5. Commit le batch
    await batch.commit();

    console.log(`\n✅ Leaderboard mis à jour: ${updatedCount} entrées`);
  } catch (error) {
    console.error("❌ Erreur lors de la génération du leaderboard:", error);
    throw error;
  }
}

/**
 * Main
 */
async function main() {
  try {
    // Récupérer le mois depuis les arguments ou utiliser le mois en cours
    const args = process.argv.slice(2);
    const monthKey = args[0] || new Date().toISOString().slice(0, 7);

    // Valider le format du mois
    if (!/^\d{4}-\d{2}$/.test(monthKey)) {
      throw new Error(
        "Format de mois invalide. Utilisez YYYY-MM (ex: 2025-01)"
      );
    }

    console.log("🚀 Script de génération du leaderboard");
    console.log("==========================================");

    await generateLeaderboard(monthKey);

    console.log("\n✨ Script terminé avec succès !");
    console.log(
      "\nℹ️  Pour mettre à jour plusieurs mois, exécutez le script plusieurs fois:"
    );
    console.log("   npx tsx scripts/generate-leaderboard.ts 2025-01");
    console.log("   npx tsx scripts/generate-leaderboard.ts 2025-02");
    console.log("   etc.");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erreur fatale:", error);
    process.exit(1);
  }
}

main();

