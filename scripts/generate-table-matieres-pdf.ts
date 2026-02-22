/**
 * Génère le PDF de la table des matières Bob Santé.
 */

import * as fs from "fs";
import * as path from "path";

const MD_PATH = path.join(
  __dirname,
  "../docs/bots-prelude/bdc-bots/bobsante/pdf_optimises/TABLE-DES-MATIERES.md"
);
const PDF_PATH = path.join(
  __dirname,
  "../docs/bots-prelude/bdc-bots/bobsante/pdf_optimises/table-des-matieres.pdf"
);

const PRINT_CSS = `
  body { font-family: Georgia, serif; font-size: 10pt; line-height: 1.4; }
  h1 { font-size: 18pt; margin-top: 20pt; page-break-after: avoid; }
  h2 { font-size: 14pt; margin-top: 14pt; page-break-after: avoid; }
  h3 { font-size: 12pt; margin-top: 10pt; page-break-after: avoid; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 9pt; }
  th, td { border: 1px solid #ccc; padding: 4pt 6pt; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  blockquote { margin: 8pt 0; padding: 6pt 12pt; border-left: 4px solid #333; background: #fafafa; }
  hr { margin: 16pt 0; border: none; border-top: 1px solid #ddd; }
  .page-break { page-break-after: always; }
`;

async function generatePdf(): Promise<void> {
  try {
    const { mdToPdf } = await import("md-to-pdf");

    await mdToPdf(
      { path: MD_PATH },
      {
        dest: PDF_PATH,
        css: PRINT_CSS,
        pdf_options: {
          format: "A4",
          margin: { top: "15mm", right: "15mm", bottom: "15mm", left: "15mm" },
          printBackground: true,
        } as Record<string, unknown>,
      }
    );

    if (fs.existsSync(PDF_PATH)) {
      console.log(`✅ PDF généré : ${PDF_PATH}`);
    } else {
      throw new Error("Le fichier PDF n'a pas été créé");
    }
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    throw error;
  }
}

generatePdf();
