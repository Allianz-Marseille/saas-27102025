/**
 * Migration des fiches Sinistro (docs/knowledge/sinistro/*.md) vers Firestore
 * pour la recherche vectorielle (extension Vector Search with Firestore).
 *
 * Collection : sinistro_knowledge
 * Champs écrits : title, content, updatedAt (l'extension remplit embedding depuis content).
 *
 * Usage : npx ts-node --project tsconfig.scripts.json scripts/migrate-to-firestore.ts
 */

import * as fs from "fs";
import * as path from "path";
import { adminDb, Timestamp } from "../lib/firebase/admin-config";

const SINISTRO_DIR = path.join(process.cwd(), "docs", "knowledge", "sinistro");
const COLLECTION = "sinistro_knowledge";

async function migrateToFirestore() {
  if (!fs.existsSync(SINISTRO_DIR) || !fs.statSync(SINISTRO_DIR).isDirectory()) {
    throw new Error(`Dossier introuvable : ${SINISTRO_DIR}`);
  }

  const entries = fs.readdirSync(SINISTRO_DIR, { withFileTypes: true });
  const mdFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
    .map((e) => e.name)
    .sort();

  if (mdFiles.length === 0) {
    console.log("Aucun fichier .md trouvé dans docs/knowledge/sinistro/");
    return;
  }

  console.log(`📂 ${mdFiles.length} fichier(s) .md à migrer vers ${COLLECTION}\n`);

  for (const filename of mdFiles) {
    const filePath = path.join(SINISTRO_DIR, filename);
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
