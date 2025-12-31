/**
 * Script d'import initial des sinistres depuis le fichier Excel
 * Point 0 : Import de tous les sinistres sans déduplication
 * 
 * Usage: npm run import:sinistres-initial
 */

import * as fs from "fs";
import * as path from "path";
import { adminDb, Timestamp } from "../lib/firebase/admin-config";
import { parseSinistresExcel, convertParsedLineToSinistre } from "../lib/utils/excel-parser";

const EXCEL_FILE_PATH = path.join(
  __dirname,
  "../docs/sinistre/LISTE SINISTRES202512311032.xlsx"
);

async function importSinistresInitial() {
  try {
    console.log("🚀 Démarrage de l'import initial des sinistres...");
    console.log(`📁 Fichier: ${EXCEL_FILE_PATH}`);

    // Vérifier que le fichier existe
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      throw new Error(`Le fichier Excel n'existe pas: ${EXCEL_FILE_PATH}`);
    }

    // Lire le fichier Excel
    const fileBuffer = fs.readFileSync(EXCEL_FILE_PATH);
    console.log(`✅ Fichier lu (${fileBuffer.length} bytes)`);

    // Parser le fichier Excel
    console.log("📊 Parsing du fichier Excel...");
    const { lines, errors: parseErrors } = await parseSinistresExcel(fileBuffer);

    if (parseErrors.length > 0) {
      console.warn(`⚠️  ${parseErrors.length} erreurs de parsing détectées:`);
      parseErrors.forEach((error) => {
        console.warn(`  Ligne ${error.line}: ${error.error}`);
      });
    }

    if (lines.length === 0) {
      throw new Error("Aucune ligne valide trouvée dans le fichier Excel");
    }

    console.log(`✅ ${lines.length} lignes parsées avec succès`);

    // Convertir les lignes en sinistres
    const excelVersion = path.basename(EXCEL_FILE_PATH);
    const sinistres = lines.map((line) =>
      convertParsedLineToSinistre(line, excelVersion)
    );

    console.log(`📦 ${sinistres.length} sinistres à importer`);

    // Importer en batch dans Firestore
    const BATCH_SIZE = 500;
    let imported = 0;
    const importErrors: Array<{ line: number; error: string }> = [];

    for (let i = 0; i < sinistres.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = sinistres.slice(i, i + BATCH_SIZE);

      chunk.forEach((sinistre, index) => {
        try {
          const docRef = adminDb.collection("sinistres").doc();
          batch.set(docRef, {
            ...sinistre,
            incidentDate: Timestamp.fromDate(sinistre.incidentDate),
            importDate: Timestamp.fromDate(sinistre.importDate),
            createdAt: Timestamp.fromDate(sinistre.createdAt),
            updatedAt: Timestamp.fromDate(sinistre.updatedAt),
          });
          imported++;
        } catch (error) {
          const lineIndex = i + index + 1;
          importErrors.push({
            line: lineIndex,
            error: error instanceof Error ? error.message : "Erreur inconnue",
          });
        }
      });

      await batch.commit();
      console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} importé (${Math.min(i + BATCH_SIZE, sinistres.length)}/${sinistres.length})`);
    }

    // Enregistrer les métadonnées du dernier import
    const lastImportRef = adminDb.collection("sinistres_metadata").doc("lastImport");
    await lastImportRef.set({
      importDate: Timestamp.now(),
      excelVersion,
      newSinistres: imported,
      totalLines: lines.length,
      updatedSinistres: 0,
      existingSinistres: 0,
    });

    // Afficher le rapport final
    console.log("\n" + "=".repeat(60));
    console.log("📊 RAPPORT D'IMPORT");
    console.log("=".repeat(60));
    console.log(`✅ Sinistres importés: ${imported}`);
    console.log(`⚠️  Erreurs de parsing: ${parseErrors.length}`);
    console.log(`❌ Erreurs d'import: ${importErrors.length}`);
    console.log(`📁 Fichier source: ${excelVersion}`);
    console.log("=".repeat(60));

    if (importErrors.length > 0) {
      console.log("\n❌ Erreurs d'import:");
      importErrors.forEach((error) => {
        console.log(`  Ligne ${error.line}: ${error.error}`);
      });
    }

    console.log("\n✅ Import initial terminé avec succès!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erreur lors de l'import initial:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

// Exécuter le script
importSinistresInitial();

