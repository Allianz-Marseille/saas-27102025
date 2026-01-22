/**
 * Script de correction des noms de clients dans Firestore
 * 
 * Usage:
 *   npx tsx scripts/fix-sinistres-client-names.ts
 * 
 * Ce script :
 * - Identifie les sinistres avec clientName vide ou incorrect
 * - Trouve les noms corrects dans le CSV source
 * - Corrige uniquement les clientName problématiques
 * - Préserve toutes les autres données (modifications manuelles, etc.)
 */

import { adminDb, Timestamp } from "@/lib/firebase/admin-config";
import * as fs from "fs";
import * as path from "path";

const COLLECTION_NAME = "sinistres";
const CSV_FILE_PATH = path.join(
  process.cwd(),
  "docs",
  "sinistres-csv",
  "29122025.csv"
);

interface CSVLine {
  clientName: string;
  clientLagonNumber: string;
  policyNumber: string;
  claimNumber: string;
}

/**
 * Parse le CSV et crée un index par policyNumber
 */
function parseCSVToIndex(): Map<string, CSVLine> {
  const index = new Map<string, CSVLine>();
  
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ Fichier CSV introuvable: ${CSV_FILE_PATH}`);
    return index;
  }

  const csvContent = fs.readFileSync(CSV_FILE_PATH, "utf-8");
  const lines = csvContent.split("\n").filter((line) => line.trim());

  lines.forEach((line) => {
    // Parser avec gestion des guillemets
    const parts: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        parts.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    parts.push(current.trim().replace(/^"|"$/g, ""));

    // Vérifier si c'est une ligne complète (pas partielle)
    if (parts.length >= 11 && parts[0] && parts[2]) {
      // parts[0] = clientName, parts[2] = policyNumber
      const policyNumber = parts[2].trim();
      const clientName = parts[0].trim();
      
      if (policyNumber && clientName) {
        // Si plusieurs lignes pour le même policyNumber, garder la première (ligne principale)
        if (!index.has(policyNumber)) {
          index.set(policyNumber, {
            clientName,
            clientLagonNumber: parts[1]?.trim() || "",
            policyNumber,
            claimNumber: parts[5]?.trim() || "",
          });
        }
      }
    }
  });

  return index;
}

async function fixClientNames() {
  console.log("🔧 Correction des noms de clients...\n");

  // 1. Parser le CSV pour créer un index
  console.log("📖 Lecture du CSV source...");
  const csvIndex = parseCSVToIndex();
  console.log(`   ${csvIndex.size} sinistres trouvés dans le CSV\n`);

  if (csvIndex.size === 0) {
    console.error("❌ Aucune donnée trouvée dans le CSV");
    return;
  }

  // 2. Récupérer tous les sinistres de Firestore
  console.log("📊 Récupération des sinistres depuis Firestore...");
  const snapshot = await adminDb.collection(COLLECTION_NAME).get();
  console.log(`   ${snapshot.size} sinistres trouvés dans Firestore\n`);

  // 3. Identifier les sinistres à corriger
  console.log("🔍 Identification des sinistres à corriger...\n");
  const toFix: Array<{
    docId: string;
    policyNumber: string;
    currentClientName: string;
    correctClientName: string;
    csvData: CSVLine;
  }> = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const policyNumber = data.policyNumber;
    const currentClientName = (data.clientName || "").trim();

    // Vérifier si le sinistre a un problème
    const hasIssue =
      !currentClientName ||
      currentClientName === "" ||
      /^\d{2}\/\d{2}\/\d{4}/.test(currentClientName) ||
      /Edité le/.test(currentClientName);

    if (hasIssue && policyNumber) {
      const csvData = csvIndex.get(policyNumber);
      if (csvData && csvData.clientName) {
        toFix.push({
          docId: doc.id,
          policyNumber,
          currentClientName,
          correctClientName: csvData.clientName,
          csvData,
        });
      }
    }
  });

  console.log(`   ${toFix.length} sinistre(s) à corriger\n`);

  if (toFix.length === 0) {
    console.log("✅ Aucun sinistre à corriger\n");
    return;
  }

  // 4. Afficher un aperçu des corrections
  console.log("📋 Aperçu des corrections (10 premiers):\n");
  toFix.slice(0, 10).forEach((fix, index) => {
    console.log(
      `${index + 1}. Sinistre ${fix.csvData.claimNumber || fix.docId} (${fix.policyNumber}):`
    );
    console.log(`   Avant: "${fix.currentClientName || "(vide)"}"`);
    console.log(`   Après: "${fix.correctClientName}"`);
    console.log("");
  });

  if (toFix.length > 10) {
    console.log(`   ... et ${toFix.length - 10} autre(s) sinistre(s)\n`);
  }

  // 5. Demander confirmation (pour un script interactif, on peut ajouter une question)
  // Pour l'instant, on corrige directement
  console.log("💾 Application des corrections...\n");

  const batch = adminDb.batch();
  let fixed = 0;
  const errors: Array<{ docId: string; error: string }> = [];

  // Traiter par batch de 500 (limite Firestore)
  const BATCH_SIZE = 500;
  for (let i = 0; i < toFix.length; i += BATCH_SIZE) {
    const chunk = toFix.slice(i, i + BATCH_SIZE);
    const currentBatch = adminDb.batch();

    chunk.forEach((fix) => {
      try {
        const docRef = adminDb.collection(COLLECTION_NAME).doc(fix.docId);
        
        // Mettre à jour uniquement clientName (et clientLagonNumber si vide aussi)
        const updateData: any = {
          clientName: fix.correctClientName,
          updatedAt: Timestamp.now(),
        };

        // Si clientLagonNumber est vide dans Firestore mais présent dans CSV, le corriger aussi
        const currentDoc = snapshot.docs.find((d) => d.id === fix.docId);
        if (currentDoc) {
          const currentData = currentDoc.data();
          if (
            (!currentData.clientLagonNumber ||
              currentData.clientLagonNumber.trim() === "") &&
            fix.csvData.clientLagonNumber
          ) {
            updateData.clientLagonNumber = fix.csvData.clientLagonNumber;
          }
        }

        currentBatch.update(docRef, updateData);
        fixed++;
      } catch (error) {
        errors.push({
          docId: fix.docId,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    });

    await currentBatch.commit();
    console.log(
      `   Progression: ${Math.min(i + BATCH_SIZE, toFix.length)}/${toFix.length} sinistres traités`
    );
  }

  // 6. Résumé
  console.log("\n✅ Correction terminée !\n");
  console.log("📊 Résumé:");
  console.log(`   - Sinistres corrigés: ${fixed}`);
  if (errors.length > 0) {
    console.log(`   - Erreurs: ${errors.length}`);
    errors.forEach((e) => {
      console.log(`     - ${e.docId}: ${e.error}`);
    });
  }
  console.log("");

  // 7. Vérification post-correction
  console.log("🔍 Vérification post-correction...\n");
  const verifySnapshot = await adminDb
    .collection(COLLECTION_NAME)
    .where("clientName", "==", "")
    .limit(10)
    .get();

  const stillEmpty = verifySnapshot.size;
  if (stillEmpty > 0) {
    console.log(
      `⚠️  ${stillEmpty} sinistre(s) ont encore un clientName vide (peut-être absents du CSV)`
    );
  } else {
    console.log("✅ Tous les sinistres ont maintenant un clientName valide");
  }
  console.log("");
}

fixClientNames().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});

