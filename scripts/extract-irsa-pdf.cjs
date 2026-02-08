/**
 * Extrait le texte du PDF Convention IRSA vers docs/knowledge/sinistro/irsa-convention-complete.md
 * Utilise pdf-parse en CommonJS (évite ts-node / import.meta).
 *
 * Usage : node scripts/extract-irsa-pdf.cjs
 * Puis : npm run migrate:sinistro-firestore
 */

const fs = require("fs");
const path = require("path");

const PDF_PATH = path.join(process.cwd(), "docs", "pdf", "conventions", "irsa.pdf");
const OUT_PATH = path.join(process.cwd(), "docs", "knowledge", "sinistro", "irsa-convention-complete.md");

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

  console.log("📄 Lecture du PDF IRSA...");
  const buffer = fs.readFileSync(PDF_PATH);
  const { PDFParse } = require("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const text = typeof result === "string" ? result : (result && result.text) || "";
  const cleaned = cleanExtractedText(text);

  const header = `# Convention IRSA — Texte intégral (extrait PDF)

Source : France Assureurs — Convention d'Indemnisation et de Recours des Sociétés d'assurance Automobile (Edition Juin 2014).
Document de référence pour les questions détaillées (champ d'application, délais, renonciations à recours, barème, annexes).
Pour les seuils et la qualification rapide, voir aussi \`irsa-auto.md\`.

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
