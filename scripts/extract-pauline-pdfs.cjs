/**
 * Extrait le texte de tous les PDF du dossier docs/pdf/auto/ vers docs/knowledge/pauline/.
 * Utilise pdf-parse (PDFParse v2) en CommonJS.
 * Pauline = spécialiste produits particuliers (auto, souscription, vadémécums).
 *
 * Usage : node scripts/extract-pauline-pdfs.cjs
 * Puis : npm run migrate:pauline-firestore
 */

const fs = require("fs");
const path = require("path");

const PDF_DIR = path.join(process.cwd(), "docs", "pdf", "auto");
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

async function extractPdf(pdfPath, outPath, pdfName) {
  const buffer = fs.readFileSync(pdfPath);
  const { PDFParse } = require("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const text = typeof result === "string" ? result : (result && result.text) || "";
  const cleaned = cleanExtractedText(text);

  const header = `# ${pdfName} — Texte intégral (extrait PDF)

Source : \`docs/pdf/auto/${path.basename(pdfPath)}\` — document de référence pour les règles de souscription et la documentation produits particuliers (auto).

---

`;
  const content = header + cleaned;
  fs.writeFileSync(outPath, content, "utf-8");
  return content.length;
}

async function main() {
  if (!fs.existsSync(PDF_DIR) || !fs.statSync(PDF_DIR).isDirectory()) {
    throw new Error("Dossier introuvable : " + PDF_DIR);
  }
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const entries = fs.readdirSync(PDF_DIR, { withFileTypes: true });
  const pdfFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".pdf"))
    .map((e) => e.name)
    .sort();

  if (pdfFiles.length === 0) {
    console.log("Aucun PDF trouvé dans docs/pdf/auto/");
    return;
  }

  console.log("📂 " + pdfFiles.length + " PDF(s) à extraire vers docs/knowledge/pauline/\n");

  for (const filename of pdfFiles) {
    const pdfPath = path.join(PDF_DIR, filename);
    const slug = slugFromFilename(filename);
    const outPath = path.join(OUT_DIR, slug + ".md");
    const pdfName = filename.replace(/\.pdf$/i, "");

    try {
      process.stdout.write("  " + filename + " … ");
      const len = await extractPdf(pdfPath, outPath, pdfName);
      console.log("✅ " + slug + ".md (" + len + " car.)");
    } catch (err) {
      console.log("❌ " + (err.message || err));
    }
  }

  console.log("\n📌 Prochaine étape : npm run migrate:pauline-firestore");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
