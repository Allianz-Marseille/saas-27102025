/**
 * Extrait le texte de tous les PDF des dossiers docs/pdf/auto/ et docs/pdf/mrh/
 * vers docs/knowledge/pauline/.
 * Utilise pdf-parse (PDFParse v2) en CommonJS.
 * Pauline = spécialiste produits particuliers (auto, MRH/habitation, souscription, vadémécums).
 *
 * Usage : node scripts/extract-pauline-pdfs.cjs
 * Puis : npm run migrate:pauline-firestore
 */

const fs = require("fs");
const path = require("path");

const PDF_DIRS = [
  { dir: path.join(process.cwd(), "docs", "pdf", "auto"), label: "auto" },
  { dir: path.join(process.cwd(), "docs", "pdf", "mrh"), label: "mrh" },
];
const OUT_DIR = path.join(process.cwd(), "docs", "knowledge", "pauline");

function slugFromFilename(filename) {
  const base = filename.replace(/\.pdf$/i, "");
  return base
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 80);
}

function cleanExtractedText(raw) {
  return raw
    .replace(/\s*--\s*\d+\s+of\s+\d+\s+--\s*/gi, "\n\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

async function extractPdf(pdfPath, outPath, pdfName, pdfSubfolder) {
  const buffer = fs.readFileSync(pdfPath);
  const { PDFParse } = require("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const text = typeof result === "string" ? result : (result && result.text) || "";
  const cleaned = cleanExtractedText(text);
  const basename = path.basename(pdfPath);

  const docTitle = pdfName.replace(/^[\d-]+-/, "").replace(/_/g, " ");
  const header = `# ${docTitle}

Document de référence pour les règles de souscription — ${pdfSubfolder} (${basename}).

---

`;
  const content = header + cleaned;
  fs.writeFileSync(outPath, content, "utf-8");
  return content.length;
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  let totalProcessed = 0;

  for (const { dir: pdfDir, label } of PDF_DIRS) {
    if (!fs.existsSync(pdfDir) || !fs.statSync(pdfDir).isDirectory()) {
      console.log("⚠️  Dossier ignoré (introuvable) : docs/pdf/" + label + "/");
      continue;
    }

    const entries = fs.readdirSync(pdfDir, { withFileTypes: true });
    const pdfFiles = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".pdf"))
      .map((e) => e.name)
      .sort();

    if (pdfFiles.length === 0) {
      console.log("📂 docs/pdf/" + label + "/ — Aucun PDF");
      continue;
    }

    console.log("📂 docs/pdf/" + label + "/ — " + pdfFiles.length + " PDF(s)\n");

    for (const filename of pdfFiles) {
      const pdfPath = path.join(pdfDir, filename);
      const slug = slugFromFilename(label + "-" + filename);
      const outPath = path.join(OUT_DIR, slug + ".md");
      const pdfName = filename.replace(/\.pdf$/i, "");

      try {
        process.stdout.write("  " + filename + " … ");
        const len = await extractPdf(pdfPath, outPath, pdfName, label);
        console.log("✅ " + slug + ".md (" + len + " car.)");
        totalProcessed++;
      } catch (err) {
        console.log("❌ " + (err.message || err));
      }
    }

    console.log("");
  }

  if (totalProcessed > 0) {
    console.log("📌 Prochaine étape : npm run migrate:pauline-firestore");
  } else {
    console.log("Aucun PDF extrait.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
