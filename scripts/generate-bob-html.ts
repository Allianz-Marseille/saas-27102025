/**
 * Génère une version HTML imprimable du référentiel Bob Santé.
 * Ouvrir le fichier HTML dans un navigateur et utiliser "Imprimer > Enregistrer en PDF".
 */

import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';

const MD_PATH = path.join(
  __dirname,
  '../docs/bots-prelude/bdc-bots/bobsante/bob-sante-reference-complet.md'
);
const HTML_PATH = path.join(
  __dirname,
  '../docs/bots-prelude/bdc-bots/bobsante/bob-sante-reference-complet.html'
);

const HTML_TEMPLATE = (content: string) => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bob Santé — Référentiel Complet</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-after: always; }
    }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #222;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
    }
    h1 { font-size: 22pt; margin-top: 28pt; margin-bottom: 12pt; page-break-after: avoid; }
    h2 { font-size: 17pt; margin-top: 22pt; margin-bottom: 10pt; page-break-after: avoid; }
    h3 { font-size: 14pt; margin-top: 16pt; margin-bottom: 8pt; page-break-after: avoid; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12pt 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #999;
      padding: 6pt 10pt;
      text-align: left;
    }
    th { background: #f0f0f0; font-weight: 600; }
    blockquote {
      margin: 12pt 0;
      padding: 10pt 16pt;
      border-left: 4px solid #333;
      background: #f8f8f8;
      font-style: italic;
    }
    hr { margin: 24pt 0; border: none; border-top: 2px solid #ddd; }
    strong { font-weight: 600; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>
${content}
</body>
</html>`;

function generateHtml(): void {
  const markdown = fs.readFileSync(MD_PATH, 'utf-8');

  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const htmlContent = marked.parse(markdown) as string;
  const fullHtml = HTML_TEMPLATE(htmlContent);

  fs.writeFileSync(HTML_PATH, fullHtml);
  console.log(`✅ HTML généré : ${HTML_PATH}`);
  console.log('   → Ouvrez ce fichier dans un navigateur et utilisez Imprimer > Enregistrer en PDF');
}

generateHtml();
