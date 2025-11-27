import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

// Initialiser Firebase Admin
if (getApps().length === 0) {
  const serviceAccount = JSON.parse(
    readFileSync(
      resolve(__dirname, "../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json"),
      "utf8"
    )
  );

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

interface Act {
  id: string;
  userId: string;
  kind: "AN" | "M+3" | "PRETERME_AUTO" | "PRETERME_IRD";
  clientNom: string;
  numeroContrat?: string;
  contratType?: string;
  compagnie: string;
  dateEffet: any;
  dateSaisie: any;
  primeAnnuelle?: number;
  montantVersement?: number;
  commissionPotentielle: number;
  moisKey: string;
  note?: string;
}

interface User {
  id: string;
  email: string;
  role: string;
}

// Fonction pour générer des logs à partir des actes
async function generateLogsFromActs() {
  console.log("🚀 Génération des logs depuis le 1er novembre 2025...\n");

  try {
    // Date de début : 1er novembre 2025
    const startDate = new Date("2025-11-01T00:00:00");
    const startTimestamp = Timestamp.fromDate(startDate);

    // Récupérer tous les actes depuis le 1er novembre
    const actsSnapshot = await db
      .collection("acts")
      .where("dateSaisie", ">=", startTimestamp)
      .orderBy("dateSaisie", "asc")
      .get();

    console.log(`📊 ${actsSnapshot.size} actes trouvés depuis le 1er novembre\n`);

    if (actsSnapshot.empty) {
      console.log("⚠️  Aucun acte trouvé. Vérifiez que des actes existent dans la base.");
      return;
    }

    // Récupérer tous les utilisateurs pour mapper userId -> email
    const usersSnapshot = await db.collection("users").get();
    const usersMap = new Map<string, User>();
    
    usersSnapshot.forEach((doc) => {
      usersMap.set(doc.id, {
        id: doc.id,
        ...doc.data(),
      } as User);
    });

    console.log(`👥 ${usersMap.size} utilisateurs trouvés\n`);

    let logsCreated = 0;
    const batch = db.batch();

    // Générer des logs pour chaque acte
    for (const actDoc of actsSnapshot.docs) {
      const act = { id: actDoc.id, ...actDoc.data() } as Act;
      const user = usersMap.get(act.userId);

      if (!user) {
        console.log(`⚠️  Utilisateur non trouvé pour l'acte ${act.id}`);
        continue;
      }

      const isProcess =
        act.kind === "M+3" ||
        act.kind === "PRETERME_AUTO" ||
        act.kind === "PRETERME_IRD";

      // Créer un log pour la création de l'acte
      const logRef = db.collection("logs").doc();
      
      let description = "";
      if (isProcess) {
        description = `Création d'un process ${act.kind} pour ${act.clientNom}`;
      } else {
        description = `Création d'un acte ${act.kind} ${act.contratType || ""} pour ${act.clientNom}`;
      }

      batch.set(logRef, {
        timestamp: act.dateSaisie,
        level: "success",
        action: "act_created",
        userId: act.userId,
        userEmail: user.email,
        description,
        metadata: {
          actId: act.id,
          clientNom: act.clientNom,
          kind: act.kind,
          contratType: act.contratType || null,
          compagnie: act.compagnie,
          commissionPotentielle: act.commissionPotentielle,
          numeroContrat: act.numeroContrat || null,
        },
      });

      logsCreated++;

      // Afficher la progression tous les 10 actes
      if (logsCreated % 10 === 0) {
        console.log(`✅ ${logsCreated} logs créés...`);
      }
    }

    // Ajouter des logs de connexion pour chaque utilisateur (1 par jour depuis le 1er novembre)
    const now = new Date();
    const currentDate = new Date("2025-11-01T09:00:00"); // Début à 9h
    
    console.log("\n👤 Génération des logs de connexion...\n");

    while (currentDate <= now) {
      // Pour chaque jour, créer une connexion pour chaque utilisateur (CDC uniquement)
      for (const [userId, user] of usersMap.entries()) {
        if (user.role === "CDC_COMMERCIAL") {
          const loginLogRef = db.collection("logs").doc();
          
          // Heure aléatoire entre 8h et 10h
          const loginHour = 8 + Math.random() * 2;
          const loginDate = new Date(currentDate);
          loginDate.setHours(loginHour);

          batch.set(loginLogRef, {
            timestamp: Timestamp.fromDate(loginDate),
            level: "info",
            action: "user_login",
            userId,
            userEmail: user.email,
            description: `Connexion de ${user.email}`,
          });

          logsCreated++;
        }
      }

      // Passer au jour suivant
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Commit tous les logs
    console.log(`\n💾 Enregistrement de ${logsCreated} logs...`);
    await batch.commit();

    console.log(`\n✅ ${logsCreated} logs créés avec succès !`);
    console.log(`📅 Période couverte : 1er novembre 2025 → ${now.toLocaleDateString("fr-FR")}`);
    console.log(`\n🎉 Génération terminée !`);

  } catch (error) {
    console.error("❌ Erreur lors de la génération des logs:", error);
    throw error;
  }
}

// Exécution du script
generateLogsFromActs()
  .then(() => {
    console.log("\n✨ Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erreur fatale:", error);
    process.exit(1);
  });

