/**
 * Vérifie si la collection pauline_knowledge est alimentée.
 * Usage : npx ts-node --project tsconfig.scripts.json scripts/check-pauline-firestore.ts
 */

import { adminDb } from "../lib/firebase/admin-config";

async function check() {
  const snapshot = await adminDb.collection("pauline_knowledge").get();
  const count = snapshot.size;
  const expected = 34; // nombre de .md dans docs/knowledge/pauline/
  const titles = snapshot.docs.map((d) => d.data().title || d.id).sort();
  console.log(`📊 pauline_knowledge : ${count} document(s)`);
  if (titles.length > 0) {
    console.log("\nDocuments présents :");
    titles.forEach((t) => console.log("  -", t));
  }
  if (count >= expected) {
    console.log(`\n✅ Migration OK (${count} >= ${expected} fiches attendues)`);
  } else {
    console.log(`\n⚠️  Migration incomplète : ${count}/${expected}. Lancer : npm run migrate:pauline-firestore`);
  }
}

check()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Erreur:", err);
    process.exit(1);
  });
