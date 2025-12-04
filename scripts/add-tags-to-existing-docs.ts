/**
 * Script pour ajouter des tags aux documents existants
 * Utile pour migrer les documents existants vers le nouveau système de tags
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

async function main() {
  console.log("🏷️  Ajout de tags aux documents existants\n");

  try {
    // Récupérer tous les documents
    const documentsSnapshot = await db.collection("rag_documents").get();
    
    console.log(`📄 ${documentsSnapshot.size} document(s) trouvé(s)\n`);

    if (documentsSnapshot.empty) {
      console.log("Aucun document à traiter");
      return;
    }

    let updated = 0;
    let skipped = 0;

    for (const doc of documentsSnapshot.docs) {
      const data = doc.data();
      const filename = data.filename as string;

      // Si le document a déjà des tags, on le saute
      if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
        console.log(`⏭️  ${filename} - a déjà des tags: [${data.tags.join(", ")}]`);
        skipped++;
        continue;
      }

      // Déterminer des tags par défaut basés sur le nom du fichier
      const tags: string[] = [];
      const filenameLower = filename.toLowerCase();

      if (filenameLower.includes("auto") || filenameLower.includes("dg-auto")) {
        tags.push("auto");
      }
      if (filenameLower.includes("mrh") || filenameLower.includes("habitation")) {
        tags.push("mrh");
      }
      if (filenameLower.includes("sante") || filenameLower.includes("santé") || filenameLower.includes("agt")) {
        tags.push("sante");
      }
      if (filenameLower.includes("prevoyance") || filenameLower.includes("prévoyance")) {
        tags.push("prevoyance");
      }
      if (filenameLower.includes("entreprise") || filenameLower.includes("pro")) {
        tags.push("entreprise");
      }
      if (filenameLower.includes("sinistre") || filenameLower.includes("reglementaire") || filenameLower.includes("vtm")) {
        tags.push("sinistre");
      }

      // Si aucun tag détecté, on met un tag par défaut
      if (tags.length === 0) {
        tags.push("auto"); // Tag par défaut
      }

      // Mettre à jour le document
      await doc.ref.update({ tags });
      console.log(`✓ ${filename} - tags ajoutés: [${tags.join(", ")}]`);
      updated++;
    }

    console.log(`\n✅ Terminé:`);
    console.log(`   - ${updated} document(s) mis à jour`);
    console.log(`   - ${skipped} document(s) ignoré(s) (avaient déjà des tags)`);
  } catch (error) {
    console.error("\n❌ Erreur:", error);
    process.exit(1);
  }
}

main();

