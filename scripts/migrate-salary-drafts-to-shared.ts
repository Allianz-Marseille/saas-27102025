import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

// Initialiser Firebase Admin
const serviceAccountPath = path.join(
  process.cwd(),
  "saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json"
);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * Script de migration des brouillons individuels vers un brouillon partagé
 * 
 * Ce script :
 * 1. Récupère tous les brouillons individuels (salary_drafts/{adminId})
 * 2. Fusionne les items en un seul brouillon partagé
 * 3. Crée le brouillon partagé (salary_drafts/shared)
 * 4. Optionnellement, supprime les anciens brouillons individuels
 * 
 * À exécuter une seule fois lors de la migration vers le système partagé
 */

interface SalaryDraftItem {
  userId: string;
  type: "percentage" | "amount";
  value: number;
  currentSalary: number;
  newSalary: number;
}

interface SalaryDraft {
  id: string;
  year: number;
  items: SalaryDraftItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  lastUpdatedBy?: string;
}

async function migrateDraftsToShared() {
  try {
    console.log("🔄 Début de la migration des brouillons individuels vers le brouillon partagé...\n");

    // Récupérer tous les brouillons individuels
    const draftsRef = db.collection("salary_drafts");
    const snapshot = await draftsRef.get();

    if (snapshot.empty) {
      console.log("✅ Aucun brouillon individuel trouvé. Aucune migration nécessaire.\n");
      return;
    }

    console.log(`📝 ${snapshot.size} brouillon(s) individuel(s) trouvé(s)\n`);

    // Vérifier si le brouillon partagé existe déjà
    const sharedDraftRef = db.collection("salary_drafts").doc("shared");
    const sharedDraftSnap = await sharedDraftRef.get();
    
    if (sharedDraftSnap.exists()) {
      console.log("⚠️  Le brouillon partagé existe déjà.");
      console.log("   Voulez-vous le fusionner avec les brouillons individuels ?");
      console.log("   (Par défaut, les brouillons individuels seront fusionnés dans le brouillon partagé existant)\n");
    }

    // Collecter tous les items de tous les brouillons
    const allItems = new Map<string, SalaryDraftItem & { updatedAt: Timestamp; updatedBy: string }>();
    const drafts: Array<{ id: string; draft: SalaryDraft }> = [];
    let earliestCreatedAt: Timestamp | null = null;
    let firstCreatedBy: string | null = null;
    let latestUpdatedAt: Timestamp | null = null;
    let lastUpdatedBy: string | null = null;

    snapshot.docs.forEach((doc) => {
      // Ignorer le brouillon partagé s'il existe
      if (doc.id === "shared") {
        return;
      }

      const data = doc.data();
      const draft: SalaryDraft = {
        id: doc.id,
        year: data.year,
        items: data.items || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdBy: data.createdBy,
        lastUpdatedBy: data.lastUpdatedBy,
      };

      drafts.push({ id: doc.id, draft });

      // Déterminer le createdAt le plus ancien et le createdBy correspondant
      if (!earliestCreatedAt || draft.createdAt < earliestCreatedAt) {
        earliestCreatedAt = draft.createdAt;
        firstCreatedBy = draft.createdBy;
      }

      // Déterminer le updatedAt le plus récent et le lastUpdatedBy correspondant
      if (!latestUpdatedAt || draft.updatedAt > latestUpdatedAt) {
        latestUpdatedAt = draft.updatedAt;
        lastUpdatedBy = draft.lastUpdatedBy || draft.createdBy;
      }

      // Fusionner les items (en cas de doublon sur userId, garder le plus récent)
      draft.items.forEach((item) => {
        const existingItem = allItems.get(item.userId);
        if (!existingItem || draft.updatedAt > existingItem.updatedAt) {
          allItems.set(item.userId, {
            ...item,
            updatedAt: draft.updatedAt,
            updatedBy: draft.lastUpdatedBy || draft.createdBy,
          });
        }
      });
    });

    if (allItems.size === 0) {
      console.log("✅ Aucun item à migrer.\n");
      return;
    }

    console.log(`📊 Résumé de la fusion :`);
    console.log(`   - ${drafts.length} brouillon(s) individuel(s) analysé(s)`);
    console.log(`   - ${allItems.size} augmentation(s) unique(s) à migrer\n`);

    // Si le brouillon partagé existe, fusionner avec ses items existants
    if (sharedDraftSnap.exists()) {
      const sharedData = sharedDraftSnap.data();
      const sharedItems = sharedData.items || [];
      
      console.log(`   - ${sharedItems.length} augmentation(s) déjà présentes dans le brouillon partagé`);
      
      // Fusionner : les items du brouillon partagé ont priorité
      sharedItems.forEach((item: SalaryDraftItem) => {
        allItems.set(item.userId, {
          ...item,
          updatedAt: sharedData.updatedAt,
          updatedBy: sharedData.lastUpdatedBy || sharedData.createdBy,
        });
      });
      
      // Utiliser les métadonnées du brouillon partagé existant
      if (sharedData.createdAt && (!earliestCreatedAt || sharedData.createdAt < earliestCreatedAt)) {
        earliestCreatedAt = sharedData.createdAt;
        firstCreatedBy = sharedData.createdBy;
      }
      
      if (sharedData.updatedAt && (!latestUpdatedAt || sharedData.updatedAt > latestUpdatedAt)) {
        latestUpdatedAt = sharedData.updatedAt;
        lastUpdatedBy = sharedData.lastUpdatedBy || sharedData.createdBy;
      }
      
      console.log(`   - Après fusion : ${allItems.size} augmentation(s) au total\n`);
    }

    // Déterminer l'année (utiliser l'année la plus récente)
    const years = drafts.map((d) => d.draft.year);
    if (sharedDraftSnap.exists()) {
      years.push(sharedDraftSnap.data().year);
    }
    const targetYear = Math.max(...years);

    // Créer le brouillon partagé
    const sharedDraftData: Omit<SalaryDraft, "id"> = {
      year: targetYear,
      items: Array.from(allItems.values()).map(({ updatedAt, updatedBy, ...item }) => item),
      createdAt: earliestCreatedAt || Timestamp.now(),
      updatedAt: latestUpdatedAt || Timestamp.now(),
      createdBy: firstCreatedBy || "migration",
      lastUpdatedBy: lastUpdatedBy || undefined,
    };

    await sharedDraftRef.set(sharedDraftData);

    console.log("✅ Brouillon partagé créé/mis à jour avec succès !");
    console.log(`   - Année : ${targetYear}`);
    console.log(`   - Nombre d'augmentations : ${allItems.size}`);
    console.log(`   - Créé par : ${firstCreatedBy || "migration"}`);
    console.log(`   - Dernière modification par : ${lastUpdatedBy || "N/A"}\n`);

    // Afficher un résumé des brouillons individuels
    console.log("📋 Résumé des brouillons individuels :");
    drafts.forEach(({ id, draft }) => {
      console.log(`   - ${id} : ${draft.items.length} augmentation(s) pour l'année ${draft.year}`);
    });
    console.log("");

    // Demander confirmation avant suppression (optionnel)
    console.log("💡 Les brouillons individuels peuvent être supprimés manuellement si nécessaire.");
    console.log("   Ils ne sont plus utilisés par l'application.\n");

    console.log("🎉 Migration terminée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    process.exit(1);
  }
}

// Exécuter le script
migrateDraftsToShared()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
