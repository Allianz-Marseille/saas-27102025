/**
 * Script d'import des offres commerciales Allianz dans Firestore
 * 
 * Usage:
 *   npx tsx scripts/import-offres-commerciales.ts
 * 
 * Ce script :
 * - Lit les fichiers JSON contenant les offres (particuliers et professionnels)
 * - Valide les données
 * - Les importe dans Firestore collection 'offres_commerciales'
 * - Gère les doublons (remplacement)
 */

import { adminDb, Timestamp } from "@/lib/firebase/admin-config";
import * as fs from "fs";
import * as path from "path";

interface OffreJSON {
  segment: string;
  sous_segment: string;
  offre: string;
  code: string;
  conditions: string;
  categorie_client: string;
  periode: string;
}

const COLLECTION_NAME = "offres_commerciales";

/**
 * Valide une offre JSON
 */
function validateOffre(offre: OffreJSON, index: number): string | null {
  if (!offre.segment || offre.segment.trim() === "") {
    return `Offre ${index}: segment manquant`;
  }
  if (!offre.sous_segment || offre.sous_segment.trim() === "") {
    return `Offre ${index}: sous_segment manquant`;
  }
  if (!offre.offre || offre.offre.trim() === "") {
    return `Offre ${index}: offre manquante`;
  }
  if (!offre.categorie_client || offre.categorie_client.trim() === "") {
    return `Offre ${index}: categorie_client manquante`;
  }
  if (!offre.periode || offre.periode.trim() === "") {
    return `Offre ${index}: periode manquante`;
  }

  const validCategories = ["particulier", "professionnel", "entreprise", "TNS", "agriculteur", "viticulteur"];
  if (!validCategories.includes(offre.categorie_client)) {
    return `Offre ${index}: categorie_client invalide (${offre.categorie_client})`;
  }

  return null;
}

/**
 * Génère une clé unique pour identifier les doublons
 */
function generateOffreKey(offre: OffreJSON): string {
  return `${offre.segment}|||${offre.sous_segment}|||${offre.offre}|||${offre.categorie_client}`.toLowerCase();
}

/**
 * Importe les offres dans Firestore
 */
async function importOffres() {
  console.log("🚀 Début de l'import des offres commerciales\n");

  // 1. Charger les fichiers JSON
  const particuliersPath = path.join(__dirname, "data", "offres-particuliers.json");
  const professionnelsPath = path.join(__dirname, "data", "offres-professionnels.json");

  if (!fs.existsSync(particuliersPath)) {
    console.error(`❌ Fichier non trouvé: ${particuliersPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(professionnelsPath)) {
    console.error(`❌ Fichier non trouvé: ${professionnelsPath}`);
    process.exit(1);
  }

  const particuliersData: OffreJSON[] = JSON.parse(fs.readFileSync(particuliersPath, "utf8"));
  const professionnelsData: OffreJSON[] = JSON.parse(fs.readFileSync(professionnelsPath, "utf8"));

  console.log(`📄 Fichiers chargés:`);
  console.log(`   - Particuliers: ${particuliersData.length} offres`);
  console.log(`   - Professionnels: ${professionnelsData.length} offres\n`);

  const allOffres = [...particuliersData, ...professionnelsData];

  // 2. Valider les données
  console.log("🔍 Validation des données...");
  const errors: string[] = [];

  allOffres.forEach((offre, index) => {
    const error = validateOffre(offre, index + 1);
    if (error) {
      errors.push(error);
    }
  });

  if (errors.length > 0) {
    console.error("\n❌ Erreurs de validation:");
    errors.forEach((err) => console.error(`   - ${err}`));
    process.exit(1);
  }

  console.log(`✅ Validation réussie (${allOffres.length} offres)\n`);

  // 3. Détecter les doublons
  console.log("🔍 Détection des doublons...");
  const offresByKey = new Map<string, OffreJSON[]>();

  allOffres.forEach((offre) => {
    const key = generateOffreKey(offre);
    if (!offresByKey.has(key)) {
      offresByKey.set(key, []);
    }
    offresByKey.get(key)!.push(offre);
  });

  const duplicates = Array.from(offresByKey.entries()).filter(([_, offres]) => offres.length > 1);

  if (duplicates.length > 0) {
    console.log(`⚠️  ${duplicates.length} doublons détectés (la première occurrence sera conservée):`);
    duplicates.forEach(([key, offres]) => {
      console.log(`   - ${offres[0].segment} / ${offres[0].sous_segment} (${offres.length} fois)`);
    });
    console.log();
  } else {
    console.log("✅ Aucun doublon détecté\n");
  }

  // 4. Préparer les offres uniques
  const uniqueOffres = Array.from(offresByKey.values()).map((offres) => offres[0]);

  // 5. Supprimer les offres existantes
  console.log("🗑️  Suppression des offres existantes...");
  const existingSnapshot = await adminDb.collection(COLLECTION_NAME).get();
  console.log(`   Trouvé ${existingSnapshot.size} offres existantes`);

  if (existingSnapshot.size > 0) {
    const batch = adminDb.batch();
    existingSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log("✅ Offres existantes supprimées\n");
  } else {
    console.log("✅ Aucune offre existante\n");
  }

  // 6. Importer les nouvelles offres
  console.log("📥 Import des offres dans Firestore...");

  const now = Timestamp.now();
  let imported = 0;
  let failed = 0;

  // Import par batch (500 max par batch)
  const BATCH_SIZE = 500;
  for (let i = 0; i < uniqueOffres.length; i += BATCH_SIZE) {
    const batch = adminDb.batch();
    const chunk = uniqueOffres.slice(i, i + BATCH_SIZE);

    chunk.forEach((offre) => {
      try {
        const docRef = adminDb.collection(COLLECTION_NAME).doc();
        batch.set(docRef, {
          segment: offre.segment,
          sous_segment: offre.sous_segment,
          offre: offre.offre,
          code: offre.code || "",
          conditions: offre.conditions || "",
          categorie_client: offre.categorie_client,
          periode: offre.periode,
          createdAt: now,
          updatedAt: now,
        });
        imported++;
      } catch (error) {
        console.error(`   ❌ Erreur lors de l'import de: ${offre.segment} / ${offre.sous_segment}`);
        console.error(`      ${error}`);
        failed++;
      }
    });

    await batch.commit();
    console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} offres importées`);
  }

  console.log();
  console.log("✅ Import terminé!\n");

  // 7. Statistiques finales
  console.log("📊 Résumé:");
  console.log(`   - Offres lues: ${allOffres.length}`);
  console.log(`   - Doublons détectés: ${allOffres.length - uniqueOffres.length}`);
  console.log(`   - Offres importées: ${imported}`);
  console.log(`   - Erreurs: ${failed}`);
  console.log();

  // 8. Afficher les segments et catégories
  const segments = new Set(uniqueOffres.map((o) => o.segment));
  const categories = new Set(uniqueOffres.map((o) => o.categorie_client));

  console.log("📌 Segments uniques:");
  Array.from(segments)
    .sort()
    .forEach((s) => {
      const count = uniqueOffres.filter((o) => o.segment === s).length;
      console.log(`   - ${s}: ${count} offres`);
    });

  console.log();
  console.log("📌 Catégories de clients:");
  Array.from(categories)
    .sort()
    .forEach((c) => {
      const count = uniqueOffres.filter((o) => o.categorie_client === c).length;
      console.log(`   - ${c}: ${count} offres`);
    });

  console.log();
  console.log("🎉 Script terminé avec succès!");
}

// Exécution
importOffres()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur fatale:", error);
    process.exit(1);
  });

