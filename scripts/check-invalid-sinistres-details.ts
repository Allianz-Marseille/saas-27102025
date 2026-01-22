/**
 * Vérifier les détails des sinistres invalides avant suppression
 */

import { adminDb } from "@/lib/firebase/admin-config";

async function checkDetails() {
  console.log("🔍 Vérification des sinistres invalides...\n");

  const snapshot = await adminDb.collection("sinistres").get();
  
  const invalid: Array<any> = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const policyNumber = (data.policyNumber || "").trim();
    
    if (!policyNumber || policyNumber === "") {
      invalid.push({
        id: doc.id,
        ...data,
      });
    }
  });

  console.log(`Total sinistres invalides: ${invalid.length}\n`);

  if (invalid.length > 0) {
    console.log("Détails des 10 premiers:\n");
    invalid.slice(0, 10).forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item.id}`);
      console.log(`   - claimNumber: ${item.claimNumber || "N/A"}`);
      console.log(`   - clientName: "${item.clientName || "(vide)"}"`);
      console.log(`   - policyNumber: "${item.policyNumber || "(vide)"}"`);
      console.log(`   - createdAt: ${item.createdAt ? (item.createdAt.toDate ? item.createdAt.toDate().toLocaleDateString('fr-FR') : String(item.createdAt)) : "N/A"}`);
      console.log(`   - updatedAt: ${item.updatedAt ? (item.updatedAt.toDate ? item.updatedAt.toDate().toLocaleDateString('fr-FR') : String(item.updatedAt)) : "N/A"}`);
      console.log(`   - route: ${item.route || "N/A"}`);
      console.log(`   - statut: ${item.statut || "N/A"}`);
      console.log(`   - assignedTo: ${item.assignedTo || "N/A"}`);
      console.log("");
    });
  }

  // Statistiques
  const withData = invalid.filter((item) => 
    item.claimNumber || item.clientName || item.route || item.statut
  ).length;

  console.log(`\n📊 Statistiques:`);
  console.log(`   - Total invalides: ${invalid.length}`);
  console.log(`   - Avec des données (claimNumber, route, etc.): ${withData}`);
  console.log(`   - Complètement vides: ${invalid.length - withData}`);
  console.log("");
}

checkDetails().catch(console.error);

