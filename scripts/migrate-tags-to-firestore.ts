/**
 * Script de migration des tags prédéfinis vers Firestore
 * À exécuter une seule fois pour initialiser la collection rag_tags
 */

import { config } from "dotenv";
import { resolve } from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

// Initialiser Firebase Admin
const serviceAccount = require("../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json");

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);

// Tags prédéfinis avec emojis et couleurs
const predefinedTags = [
  { name: "auto", emoji: "🚗", color: "blue" },
  { name: "mrh", emoji: "🏠", color: "violet" },
  { name: "sante", emoji: "❤️", color: "green" },
  { name: "prevoyance", emoji: "🛡️", color: "amber" },
  { name: "entreprise", emoji: "🏢", color: "indigo" },
  { name: "sinistre", emoji: "⚠️", color: "red" },
];

async function main() {
  console.log("🏷️  Migration des tags vers Firestore\n");

  try {
    let created = 0;
    let skipped = 0;
    let updated = 0;

    for (const tag of predefinedTags) {
      console.log(`\n📌 Traitement du tag: ${tag.emoji} ${tag.name}`);

      // Vérifier si le tag existe déjà
      const existingTagSnapshot = await db
        .collection("rag_tags")
        .where("name", "==", tag.name)
        .get();

      if (!existingTagSnapshot.empty) {
        console.log(`   ⏭️  Tag existe déjà, mise à jour...`);
        
        // Mettre à jour avec les nouvelles propriétés (emoji, color)
        const existingTag = existingTagSnapshot.docs[0];
        await existingTag.ref.update({
          emoji: tag.emoji,
          color: tag.color,
          updatedAt: new Date(),
        });
        
        updated++;
        continue;
      }

      // Calculer usageCount : compter les documents qui utilisent ce tag
      const documentsSnapshot = await db
        .collection("rag_documents")
        .where("tags", "array-contains", tag.name)
        .get();

      const usageCount = documentsSnapshot.size;
      console.log(`   📊 ${usageCount} document(s) utilisent ce tag`);

      // Créer le tag dans Firestore
      const now = new Date();
      const tagData = {
        name: tag.name,
        emoji: tag.emoji,
        color: tag.color,
        usageCount,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection("rag_tags").add(tagData);
      console.log(`   ✅ Tag créé avec succès`);
      created++;
    }

    console.log(`\n✅ Migration terminée:`);
    console.log(`   - ${created} tag(s) créé(s)`);
    console.log(`   - ${updated} tag(s) mis à jour`);
    console.log(`   - ${skipped} tag(s) ignoré(s)`);
    console.log(`\nℹ️  Total: ${created + updated + skipped}/${predefinedTags.length} tags traités`);
  } catch (error) {
    console.error("\n❌ Erreur lors de la migration:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

main();

