/**
 * Migration des fiches Bob (docs/knowledge/bob/*.md et bob/ro/*.md) vers Firestore
 * pour la recherche vectorielle (extension Vector Search with Firestore).
 *
 * Collection : bob_knowledge
 * Champs écrits : title, content, updatedAt (l'extension remplit embedding depuis content).
 * DocId : nom du fichier sans .md pour la racine ; préfixe "ro_" pour les fichiers dans ro/.
 *
 * Usage : npx ts-node --project tsconfig.scripts.json scripts/migrate-bob-to-firestore.ts
 */

import * as fs from "fs";
import * as path from "path";
import { adminDb, Timestamp } from "../lib/firebase/admin-config";

const BOB_DIR = path.join(process.cwd(), "docs", "knowledge", "bob");
const BOB_RO_DIR = path.join(BOB_DIR, "ro");
const COLLECTION = "bob_knowledge";

async function migrateBobToFirestore() {
  if (!fs.existsSync(BOB_DIR) || !fs.statSync(BOB_DIR).isDirectory()) {
    throw new Error(`Dossier introuvable : ${BOB_DIR}`);
  }

  const coll = adminDb.collection(COLLECTION);
  let count = 0;

  // Racine docs/knowledge/bob/
  const rootEntries = fs.readdirSync(BOB_DIR, { withFileTypes: true });
  const rootMdFiles = rootEntries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
    .map((e) => e.name)
    .sort();

  for (const filename of rootMdFiles) {
    const filePath = path.join(BOB_DIR, filename);
    const content = fs.readFileSync(filePath, "utf-8");
    const title = filename.replace(/\.md$/i, "");
    const docId = title;

    await coll.doc(docId).set(
      {
        title,
        content,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
    console.log(`  ✅ ${filename} → ${COLLECTION}/${docId}`);
    count++;
  }

  // Sous-dossier docs/knowledge/bob/ro/
  if (fs.existsSync(BOB_RO_DIR) && fs.statSync(BOB_RO_DIR).isDirectory()) {
    const roEntries = fs.readdirSync(BOB_RO_DIR, { withFileTypes: true });
    const roMdFiles = roEntries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
      .map((e) => e.name)
      .sort();

    for (const filename of roMdFiles) {
      const filePath = path.join(BOB_RO_DIR, filename);
      const content = fs.readFileSync(filePath, "utf-8");
      const baseTitle = filename.replace(/\.md$/i, "");
      const title = `ro_${baseTitle}`;
      const docId = title;

      await coll.doc(docId).set(
        {
          title,
          content,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
      console.log(`  ✅ ro/${filename} → ${COLLECTION}/${docId}`);
      count++;
    }
  }

  if (count === 0) {
    console.log("Aucun fichier .md trouvé dans docs/knowledge/bob/ ou bob/ro/");
    return;
  }

  console.log(`\n✨ Migration terminée : ${count} fichier(s) → ${COLLECTION}. L'extension Vector Search remplira le champ embedding à partir de content.`);
}

if (require.main === module) {
  console.log(`📂 Migration Bob vers ${COLLECTION}\n`);
  migrateBobToFirestore()
    .then(() => {
      console.log("\n✅ Script terminé");
      process.exit(0);
    })
    .catch((err) => {
      console.error("\n❌ Erreur:", err);
      process.exit(1);
    });
}

export { migrateBobToFirestore };
