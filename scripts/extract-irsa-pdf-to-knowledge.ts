/**
 * Extrait le texte du PDF Convention IRSA (docs/pdf/conventions/irsa.pdf)
 * et crée une fiche markdown dans docs/knowledge/sinistro/ pour enrichir Sinistro.
 * Utilise pdf-parse directement pour éviter import.meta (incompatible tsconfig scripts).
 *
 * Usage : npm run extract:irsa-pdf
 * Puis : npm run migrate:sinistro-firestore
 */

import * as fs from "fs";
import * as path from "path";

const PDF_PATH = path.join(process.cwd(), "docs", "pdf", "conventions", "irsa.pdf");
const OUT_PATH = path.join(process.cwd(), "docs", "knowledge", "sinistro", "irsa-convention-complete.md");

function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\s*--\s*\d+\s+of\s+\d+\s+--\s*/gi, "\n\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

async function main() {
  if (!fs.existsSync(PDF_PATH)) {
    throw new Error(`PDF introuvable : ${PDF_PATH}`);
  }

  console.log("📄 Lecture du PDF IRSA...");
  const buffer = fs.readFileSync(PDF_PATH);
  const m = require("pdf-parse") as Record<string, unknown>;
  const pdfParse =
    (typeof m === "function" ? m : null) ??
    (typeof m?.default === "function" ? m.default : null) ??
    (typeof (m as { parse?: (buf: Buffer) => Promise<{ text: string }> }).parse === "function" ? (m as { parse: (buf: Buffer) => Promise<{ text: string }> }).parse : null) ??
    (typeof m === "object" && m !== null ? Object.values(m).find((v) => typeof v === "function") as ((buf: Buffer) => Promise<{ text: string }>) | undefined : null);
  if (typeof pdfParse !== "function") {
    throw new Error("pdf-parse : export non reconnu. Clés: " + (m && typeof m === "object" ? Object.keys(m).join(", ") : "n/a"));
  }
  const result = await pdfParse(buffer);
  const text = typeof result === "string" ? result : (result?.text ?? "");
  const cleaned = cleanExtractedText(text);

  const header = `# Convention IRSA — Texte intégral (extrait PDF)

Source : France Assureurs — Convention d'Indemnisation et de Recours des Sociétés d'assurance Automobile (Edition Juin 2014).
Document de référence pour les questions détaillées (champ d'application, délais, renonciations à recours, barème, annexes).
Pour les seuils et la qualification rapide, voir aussi \`irsa-auto.md\`.

---

`;
  const content = header + cleaned;

  fs.writeFileSync(OUT_PATH, content, "utf-8");
  console.log(`✅ Fiche créée : ${OUT_PATH} (${content.length} caractères)`);
  console.log("\n📌 Prochaine étape : npm run migrate:sinistro-firestore");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
