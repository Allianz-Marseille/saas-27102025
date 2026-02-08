/**
 * Migration des fiches Pauline (docs/knowledge/pauline/*.md) vers Firestore
 * pour la recherche vectorielle (extension Vector Search with Firestore).
 *
 * Collection : pauline_knowledge
 * Champs écrits : title, content, updatedAt (l'extension remplit embedding depuis content).
 *
 * Usage : npx ts-node --project tsconfig.scripts.json scripts/migrate-pauline-to-firestore.ts
 */

import * as fs from "fs";
import * as path from "path";
import { adminDb, Timestamp } from "../lib/firebase/admin-config";

const PAULINE_DIR = path.join(process.cwd(), "docs", "knowledge", "pauline");
const COLLECTION = "pauline_knowledge";

async function migrateToFirestore() {
  if (!fs.existsSync(PAULINE_DIR) || !fs.statSync(PAULINE_DIR).isDirectory()) {
    throw new Error(`Dossier introuvable : ${PAULINE_DIR}`);
  }

  const entries = fs.readdirSync(PAULINE_DIR, { withFileTypes: true });
  const mdFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
    .map((e) => e.name)
    .sort();

  if (mdFiles.length === 0) {
    console.log("Aucun fichier .md trouvé dans docs/knowledge/pauline/");
    return;
  }

  console.log(`📂 ${mdFiles.length} fichier(s) .md à migrer vers ${COLLECTION}\n`);

  for (const filename of mdFiles) {
    const filePath = path.join(PAULINE_DIR, filename);
    const content = fs.readFileSync(filePath, "utf-8");
    const title = filename.replace(/\.md$/i, "");
    const docId = title;

    const payload = {
      title,
      content,
      updatedAt: Timestamp.now(),
    };

    await adminDb.collection(COLLECTION).doc(docId).set(payload, { merge: true });
    console.log(`  ✅ ${filename} → ${COLLECTION}/${docId}`);
  }

  console.log(`\n✨ Migration terminée. L'extension Vector Search remplira le champ embedding à partir de content.`);
}

if (require.main === module) {
  migrateToFirestore()
    .then(() => {
      console.log("\n✅ Script terminé");
      process.exit(0);
    })
    .catch((err) => {
      console.error("\n❌ Erreur:", err);
      process.exit(1);
    });
}

export { migrateToFirestore };
