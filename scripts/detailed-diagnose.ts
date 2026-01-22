/**
 * Diagnostic détaillé pour comprendre le problème
 */

import { adminDb } from "@/lib/firebase/admin-config";

async function detailedDiagnose() {
  console.log("🔍 Diagnostic détaillé...\n");

  // Récupérer tous les sinistres
  const snapshot = await adminDb.collection("sinistres").get();
  
  const problems: Array<{
    id: string;
    claimNumber: string;
    policyNumber: string;
    clientName: string;
    issue: string;
  }> = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const clientName = (data.clientName || "").trim();
    const policyNumber = data.policyNumber || "";
    
    // Détecter les problèmes
    if (!clientName || clientName === "") {
      problems.push({
        id: doc.id,
        claimNumber: data.claimNumber || "",
        policyNumber,
        clientName: "",
        issue: "Vide",
      });
    } else if (/^\d{2}\/\d{2}\/\d{4}/.test(clientName) || /Edité le/.test(clientName)) {
      problems.push({
        id: doc.id,
        claimNumber: data.claimNumber || "",
        policyNumber,
        clientName,
        issue: "Date au lieu de nom",
      });
    }
  });

  console.log(`Total problèmes: ${problems.length}\n`);
  
  if (problems.length > 0) {
    console.log("Premiers 20 problèmes:\n");
    problems.slice(0, 20).forEach((p, index) => {
      console.log(`${index + 1}. ${p.claimNumber || p.id}`);
      console.log(`   Policy: ${p.policyNumber}`);
      console.log(`   clientName: "${p.clientName || "(vide)"}"`);
      console.log(`   Problème: ${p.issue}`);
      console.log("");
    });
  }
}

detailedDiagnose().catch(console.error);

