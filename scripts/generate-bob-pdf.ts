/**
 * Génère le PDF Bob Santé à partir du markdown consolidé.
 * Utilise md-to-pdf (Puppeteer) pour la conversion.
 */

import * as fs from 'fs';
import * as path from 'path';

const MD_PATH = path.join(
  __dirname,
  '../docs/bots-prelude/bdc-bots/bobsante/bob-sante-reference-complet.md'
);
const PDF_PATH = path.join(
  __dirname,
  '../docs/bots-prelude/bdc-bots/bobsante/bob-sante-reference-complet.pdf'
);

const PRINT_CSS = `
  body { font-family: Georgia, serif; font-size: 11pt; line-height: 1.5; }
  h1 { font-size: 20pt; margin-top: 24pt; page-break-after: avoid; }
  h2 { font-size: 16pt; margin-top: 18pt; page-break-after: avoid; }
  h3 { font-size: 13pt; margin-top: 12pt; page-break-after: avoid; }
  table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
  th, td { border: 1px solid #ccc; padding: 6pt 8pt; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  blockquote { margin: 12pt 0; padding: 8pt 16pt; border-left: 4px solid #333; background: #fafafa; }
  hr { margin: 24pt 0; border: none; border-top: 1px solid #ddd; }
  .page-break { page-break-after: always; }
`;

async function generatePdf(): Promise<void> {
  try {
    const { mdToPdf } = await import('md-to-pdf');

    await mdToPdf(
      { path: MD_PATH },
      {
        dest: PDF_PATH,
        css: PRINT_CSS,
        pdf_options: {
          format: 'A4',
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
          printBackground: true,
        } as Record<string, unknown>,
      }
    );

    if (fs.existsSync(PDF_PATH)) {
      console.log(`✅ PDF généré : ${PDF_PATH}`);
    } else {
      throw new Error('Le fichier PDF n\'a pas été créé');
    }
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    console.log('\n→ Alternative : ouvrez bob-sante-reference-complet.html et utilisez Imprimer > Enregistrer en PDF');
    throw error;
  }
}

generatePdf();
