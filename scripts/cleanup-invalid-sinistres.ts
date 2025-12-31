/**
 * Script de nettoyage des sinistres invalides
 * 
 * Usage:
 *   npx tsx scripts/cleanup-invalid-sinistres.ts [--dry-run]
 * 
 * Ce script :
 * - Identifie les sinistres sans policyNumber (invalides)
 * - Identifie les sinistres avec clientName = date (erreur de saisie)
 * - Propose de les supprimer ou de les corriger
 */

import { adminDb } from "@/lib/firebase/admin-config";

const DRY_RUN = process.argv.includes("--dry-run");

async function cleanup() {
  console.log("🧹 Nettoyage des sinistres invalides...\n");
  if (DRY_RUN) {
    console.log("⚠️  MODE DRY-RUN (aucune modification ne sera effectuée)\n");
  }

  // Récupérer tous les sinistres
  const snapshot = await adminDb.collection("sinistres").get();
  
  const toDelete: Array<{ id: string; reason: string; data: any }> = [];
  const toFix: Array<{ id: string; current: string; data: any }> = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const policyNumber = (data.policyNumber || "").trim();
    const clientName = (data.clientName || "").trim();

    // Sinistres sans policyNumber = invalides, à supprimer
    if (!policyNumber || policyNumber === "") {
      toDelete.push({
        id: doc.id,
        reason: "Pas de policyNumber",
        data,
      });
    }
    // Sinistres avec clientName = date (mais avec policyNumber valide)
    else if (/Edité le/.test(clientName) || /^\d{2}\/\d{2}\/\d{4}/.test(clientName)) {
      toFix.push({
        id: doc.id,
        current: clientName,
        data,
      });
    }
  });

  console.log(`📊 Analyse:\n`);
  console.log(`   - Sinistres invalides (sans policyNumber): ${toDelete.length}`);
  console.log(`   - Sinistres à corriger (clientName = date): ${toFix.length}`);
  console.log("");

  // Afficher les détails
  if (toDelete.length > 0) {
    console.log("🗑️  Sinistres invalides à supprimer (10 premiers):\n");
    toDelete.slice(0, 10).forEach((item, index) => {
      console.log(
        `${index + 1}. ${item.id} - ${item.data.claimNumber || "N/A"}`
      );
      console.log(`   Raison: ${item.reason}`);
      console.log("");
    });
    if (toDelete.length > 10) {
      console.log(`   ... et ${toDelete.length - 10} autre(s)\n`);
    }
  }

  if (toFix.length > 0) {
    console.log("🔧 Sinistres à corriger:\n");
    toFix.forEach((item, index) => {
      console.log(
        `${index + 1}. ${item.data.claimNumber || item.id} (${item.data.policyNumber})`
      );
      console.log(`   clientName actuel: "${item.current}"`);
      console.log(`   → À corriger manuellement (pas de correspondance dans CSV)\n`);
    });
  }

  // Supprimer les sinistres invalides
  if (toDelete.length > 0) {
    if (DRY_RUN) {
      console.log(`\n⚠️  DRY-RUN: ${toDelete.length} sinistres seraient supprimés\n`);
    } else {
      console.log(`\n🗑️  Suppression de ${toDelete.length} sinistres invalides...\n`);
      
      const batch = adminDb.batch();
      let deleted = 0;
      const BATCH_SIZE = 500;

      for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
        const chunk = toDelete.slice(i, i + BATCH_SIZE);
        const currentBatch = adminDb.batch();

        chunk.forEach((item) => {
          const docRef = adminDb.collection("sinistres").doc(item.id);
          currentBatch.delete(docRef);
          deleted++;
        });

        await currentBatch.commit();
        console.log(
          `   Progression: ${Math.min(i + BATCH_SIZE, toDelete.length)}/${toDelete.length}`
        );
      }

      console.log(`\n✅ ${deleted} sinistres supprimés\n`);
    }
  }

  // Pour les sinistres à corriger, on ne peut pas les corriger automatiquement
  // car ils n'ont pas de correspondance dans le CSV
  if (toFix.length > 0) {
    console.log("\n⚠️  Sinistres à corriger manuellement:\n");
    console.log("   Ces sinistres ont un clientName incorrect mais un policyNumber valide.");
    console.log("   Ils ne sont pas dans le CSV source, donc ils doivent être corrigés manuellement.");
    console.log("   Vous pouvez les corriger depuis l'interface admin.\n");
  }

  // Résumé final
  console.log("📊 Résumé:\n");
  console.log(`   - Sinistres invalides: ${toDelete.length}`);
  console.log(`   - Sinistres à corriger manuellement: ${toFix.length}`);
  if (!DRY_RUN && toDelete.length > 0) {
    console.log(`   - Sinistres supprimés: ${toDelete.length}`);
  }
  console.log("");
}

cleanup().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});

