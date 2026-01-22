/**
 * Script de diagnostic des données sinistres dans Firestore
 * 
 * Usage:
 *   npx tsx scripts/diagnose-sinistres-data.ts
 * 
 * Ce script :
 * - Affiche un échantillon de sinistres avec leurs données
 * - Détecte les problèmes de mapping (clientName incorrect)
 * - Propose des corrections
 */

import { adminDb } from "@/lib/firebase/admin-config";
import * as fs from "fs";
import * as path from "path";

const COLLECTION_NAME = "sinistres";
const CSV_FILE_PATH = path.join(
  process.cwd(),
  "docs",
  "sinistres-csv",
  "29122025.csv"
);

interface SinistreDoc {
  id: string;
  clientName: string;
  clientLagonNumber: string;
  policyNumber: string;
  claimNumber: string;
  damagedCoverage: string;
  updatedAt: any;
  [key: string]: any;
}

async function diagnose() {
  console.log("🔍 Diagnostic des données sinistres...\n");

  // 1. Lire quelques documents depuis Firestore
  console.log("📊 Échantillon de données Firestore (10 premiers sinistres):\n");
  const snapshot = await adminDb.collection(COLLECTION_NAME).limit(10).get();
  
  if (snapshot.empty) {
    console.log("❌ Aucun sinistre trouvé dans Firestore");
    return;
  }

  const sinistres: SinistreDoc[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    sinistres.push({
      id: doc.id,
      clientName: data.clientName || "",
      clientLagonNumber: data.clientLagonNumber || "",
      policyNumber: data.policyNumber || "",
      claimNumber: data.claimNumber || "",
      damagedCoverage: data.damagedCoverage || "",
      updatedAt: data.updatedAt,
      ...data,
    });
  });

  // Afficher les données
  sinistres.forEach((s, index) => {
    console.log(`${index + 1}. Sinistre ${s.claimNumber || s.id}:`);
    console.log(`   - clientName: "${s.clientName}"`);
    console.log(`   - policyNumber: "${s.policyNumber}"`);
    console.log(`   - clientLagonNumber: "${s.clientLagonNumber}"`);
    console.log(`   - updatedAt: ${s.updatedAt ? (s.updatedAt.toDate ? s.updatedAt.toDate().toLocaleDateString('fr-FR') : String(s.updatedAt)) : 'N/A'}`);
    console.log("");
  });

  // 2. Détecter les problèmes
  console.log("🔍 Détection des problèmes:\n");
  const problems: Array<{ id: string; issue: string; data: any }> = [];
  
  sinistres.forEach((s) => {
    // Vérifier si clientName semble être une date
    if (/^\d{2}\/\d{2}\/\d{4}/.test(s.clientName) || /Edité le/.test(s.clientName)) {
      problems.push({
        id: s.id,
        issue: `clientName contient une date: "${s.clientName}"`,
        data: s,
      });
    }
    
    // Vérifier si clientName est vide
    if (!s.clientName || s.clientName.trim() === "") {
      problems.push({
        id: s.id,
        issue: "clientName est vide",
        data: s,
      });
    }
  });

  if (problems.length > 0) {
    console.log(`⚠️  ${problems.length} problème(s) détecté(s):\n`);
    problems.forEach((p, index) => {
      console.log(`${index + 1}. Sinistre ${p.data.claimNumber || p.id}:`);
      console.log(`   - ${p.issue}`);
      console.log(`   - policyNumber: "${p.data.policyNumber}"`);
      console.log("");
    });
  } else {
    console.log("✅ Aucun problème détecté dans l'échantillon\n");
  }

  // 3. Comparer avec le CSV source
  if (fs.existsSync(CSV_FILE_PATH)) {
    console.log("📄 Comparaison avec le CSV source:\n");
    const csvContent = fs.readFileSync(CSV_FILE_PATH, "utf-8");
    const csvLines = csvContent.split("\n").filter((line) => line.trim());
    
    // Parser quelques lignes du CSV
    console.log("Premières lignes du CSV:");
    csvLines.slice(0, 5).forEach((line, index) => {
      const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
      if (parts.length >= 11) {
        console.log(`${index + 1}. CSV ligne ${index + 1}:`);
        console.log(`   - Nom client (col 0): "${parts[0]}"`);
        console.log(`   - Numéro Lagon (col 1): "${parts[1]}"`);
        console.log(`   - Numéro police (col 2): "${parts[2]}"`);
        console.log(`   - Numéro sinistre (col 5): "${parts[5]}"`);
        console.log("");
      }
    });

    // Essayer de trouver les sinistres problématiques dans le CSV
    if (problems.length > 0) {
      console.log("🔍 Recherche des correspondances dans le CSV:\n");
      problems.forEach((p) => {
        const policyNumber = p.data.policyNumber;
        if (policyNumber) {
          const matchingLine = csvLines.find((line) => {
            const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
            return parts[2] === policyNumber;
          });
          
          if (matchingLine) {
            const parts = matchingLine.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
            console.log(`Sinistre ${p.id} (policyNumber: ${policyNumber}):`);
            console.log(`   - Dans CSV: clientName = "${parts[0]}"`);
            console.log(`   - Dans Firestore: clientName = "${p.data.clientName}"`);
            console.log("");
          } else {
            console.log(`Sinistre ${p.id} (policyNumber: ${policyNumber}): NON TROUVÉ dans CSV\n`);
          }
        }
      });
    }
  } else {
    console.log("⚠️  Fichier CSV source non trouvé\n");
  }

  // 4. Statistiques globales
  console.log("📊 Statistiques globales:\n");
  const allSnapshot = await adminDb.collection(COLLECTION_NAME).get();
  let totalWithIssues = 0;
  let totalEmpty = 0;
  let totalDateLike = 0;

  allSnapshot.forEach((doc) => {
    const data = doc.data();
    const clientName = data.clientName || "";
    
    if (!clientName || clientName.trim() === "") {
      totalEmpty++;
    } else if (/^\d{2}\/\d{2}\/\d{4}/.test(clientName) || /Edité le/.test(clientName)) {
      totalDateLike++;
    }
  });

  totalWithIssues = totalEmpty + totalDateLike;

  console.log(`Total sinistres: ${allSnapshot.size}`);
  console.log(`Sinistres avec clientName vide: ${totalEmpty}`);
  console.log(`Sinistres avec clientName = date: ${totalDateLike}`);
  console.log(`Total avec problèmes: ${totalWithIssues}`);
  console.log(`Taux d'erreur: ${((totalWithIssues / allSnapshot.size) * 100).toFixed(2)}%\n`);

  // 5. Recommandations
  console.log("💡 Recommandations:\n");
  if (totalWithIssues > 0) {
    console.log("1. Les données semblent avoir un problème de mapping");
    console.log("2. Options de correction:");
    console.log("   a) Réimporter le CSV (script: import-sinistres-initial.ts)");
    console.log("   b) Créer un script de correction basé sur le CSV source");
    console.log("   c) Corriger manuellement les sinistres problématiques\n");
  } else {
    console.log("✅ Les données semblent correctes\n");
  }
}

diagnose().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});

