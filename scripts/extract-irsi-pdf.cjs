/**
 * Extrait le texte du PDF Convention IRSI vers docs/knowledge/sinistro/irsi-convention-complete.md
 * Utilise pdf-parse (PDFParse v2) en CommonJS.
 *
 * Usage : node scripts/extract-irsi-pdf.cjs
 * Puis : npm run migrate:sinistro-firestore
 */

const fs = require("fs");
const path = require("path");

const PDF_PATH = path.join(process.cwd(), "docs", "pdf", "conventions", "convention-irsi.pdf");
const OUT_PATH = path.join(process.cwd(), "docs", "knowledge", "sinistro", "irsi-convention-complete.md");

function cleanExtractedText(raw) {
  return raw
    .replace(/\s*--\s*\d+\s+of\s+\d+\s+--\s*/gi, "\n\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

async function main() {
  if (!fs.existsSync(PDF_PATH)) {
    throw new Error("PDF introuvable : " + PDF_PATH);
  }

  console.log("📄 Lecture du PDF Convention IRSI...");
  const buffer = fs.readFileSync(PDF_PATH);
  const { PDFParse } = require("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const text = typeof result === "string" ? result : (result && result.text) || "";
  const cleaned = cleanExtractedText(text);

  const header = `# Convention IRSI — Texte intégral (extrait PDF)

Source : France Assureurs — Convention IRSI (immeuble, dégâts des eaux, incendie).
Document de référence pour les questions détaillées (champ d'application, seuil 5 000 € HT, procédures).
Pour la qualification rapide, voir aussi \`irsi-immeuble.md\`.

---

`;
  const content = header + cleaned;

  fs.writeFileSync(OUT_PATH, content, "utf-8");
  console.log("✅ Fiche créée : " + OUT_PATH + " (" + content.length + " caractères)");
  console.log("\n📌 Prochaine étape : npm run migrate:sinistro-firestore");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
