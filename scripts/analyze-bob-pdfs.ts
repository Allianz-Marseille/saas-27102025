/**
 * Analyse les PDFs du dossier pdf_optimises (Bob Santé) :
 * - Extraction du texte page par page (estimation des pages via pdf-parse)
 * - Détection des sections (titres, numérotations)
 * - Génération de mapping.json et TABLE-DES-MATIERES.md
 * - Renommage optionnel des PDFs (--rename ou --rename-dry-run)
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const PDF_DIR = path.join(ROOT, "docs/bots-prelude/bdc-bots/bobsante/pdf_optimises");
const OUT_MAPPING = path.join(PDF_DIR, "mapping.json");
const OUT_TOC = path.join(PDF_DIR, "TABLE-DES-MATIERES.md");

/** Mapping ancien nom → nouveau nom (slug) pour renommage */
const RENAME_MAP: Record<string, string> = {
  "BROCHURE PREVOYANCE TNS - COM18112-V1124-BD.pdf": "brochure-prevoyance-tns.pdf",
  "DEMANDE ADHESION - DIG20627-V0918-BD.pdf": "demande-adhesion-prevoyance-tns.pdf",
  "DIN Allianz Prevoyance Personne Clé - COM21425-V0325-BD.pdf": "din-prevoyance-personne-cle.pdf",
  "DIN Allianz Prevoyance Travailleur Non Salarié - COM21427-V0724-BD.pdf": "din-prevoyance-tns.pdf",
  "DISPOSITIONS GENERALES - COM21123-V0425-BD.pdf": "dispositions-generales-prevoyance.pdf",
  "Demande d_adhésion Allianz Prévoyance Personne Clé - DIG20628-V0225-BD.pdf":
    "demande-adhesion-personne-cle.pdf",
  "Déclaration d_activité professionnelle et sportive - PDF04345-V0618-BD.pdf":
    "declaration-activite-pro-sportive.pdf",
  "GUIDE DU PRODUIT ALLIANZ PREVOYANCE TNS - RES31478-V1118-BD.pdf":
    "guide-produit-prevoyance-tns.pdf",
  "GUIDE DU PRODUIT ALLIANZ PREVOYANCE ALLIANZ PREVOYANCE TNS - RES31478-V1118-BD.pdf":
    "guide-produit-prevoyance-tns.pdf",
  "Notice d_information Allianz Prévoyance Personne Clé - COM17977-V0425-BD.pdf":
    "notice-information-personne-cle.pdf",
  "QUESTIONNAIRE MÉDICAL SIMPLIFIE - 13344426-13344427-DIG19294-V0320.pdf":
    "questionnaire-medical-simplifie.pdf",
  "Questionnaire d_état de santé - prévoyance hors dépendance - DIG19295-V0721-BD.pdf":
    "questionnaire-etat-sante.pdf",
  "bob-sante-reference-complet.pdf": "bob-sante-reference-complet.pdf",
};

interface Section {
  title: string;
  pageStart: number;
  pageEnd: number;
  keywords: string[];
}

interface DocumentMapping {
  filename: string;
  filenameNew: string;
  pages: number;
  sections: Section[];
  description?: string;
  extractError?: string;
}

/** Patterns pour détecter des titres de section */
const SECTION_PATTERNS: Array<{ regex: RegExp; minLength?: number; maxLength?: number }> = [
  { regex: /^#\s+(.+)$/gm, maxLength: 120 },
  { regex: /^##\s+(.+)$/gm, maxLength: 120 },
  { regex: /^(\d+\.\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ][^\n]{10,80})$/gm },
  { regex: /^(Article\s+\d+[^\n]{5,80})$/gim },
  { regex: /^(Chapitre\s+[\dIVXLCDM]+[^\n]{2,60})$/gim },
  { regex: /^([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ][A-Z\s\/\-–—]{15,80})$/gm },
];

function extractTextFromPDFBuffer(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  const { createRequire } = require("module");
  const requireFromScript = createRequire(path.join(__dirname, "analyze-bob-pdfs.ts"));
  const { PDFParse } = requireFromScript("pdf-parse") as {
    PDFParse: new (opts: { data: Buffer }) => {
      getText(): Promise<{ text: string; total?: number }>;
    };
  };
  const parser = new PDFParse({ data: buffer });
  return parser.getText().then((data) => {
    const text = (data.text || "").trim();
    const numPages = Math.max(1, data.total ?? 1);
    return { text, numPages };
  });
}

function detectSections(text: string, numPages: number): Section[] {
  const sections: Array<{ title: string; index: number }> = [];
  const seen = new Set<string>();

  for (const { regex, minLength = 5, maxLength = 200 } of SECTION_PATTERNS) {
    let m: RegExpExecArray | null;
    const re = new RegExp(regex.source, regex.flags);
    while ((m = re.exec(text)) !== null) {
      const title = m[1].trim().replace(/\s+/g, " ");
      if (title.length < (minLength ?? 5) || (maxLength && title.length > maxLength)) continue;
      if (seen.has(title)) continue;
      seen.add(title);
      sections.push({ title, index: m.index });
    }
  }

  sections.sort((a, b) => a.index - b.index);

  const totalChars = text.length;
  const charsPerPage = totalChars > 0 && numPages > 0 ? totalChars / numPages : 1000;

  const result: Section[] = [];
  for (let i = 0; i < sections.length; i++) {
    const start = sections[i].index;
    const end = i < sections.length - 1 ? sections[i + 1].index : totalChars;
    const pageStart = Math.max(1, Math.floor(start / charsPerPage) + 1);
    const pageEnd = Math.min(numPages, Math.max(pageStart, Math.ceil(end / charsPerPage)));

    const title = sections[i].title;
    const keywords = extractKeywords(title);

    result.push({
      title,
      pageStart,
      pageEnd,
      keywords,
    });
  }

  if (result.length === 0 && text.length > 100) {
    result.push({
      title: "Document complet",
      pageStart: 1,
      pageEnd: numPages,
      keywords: ["contenu intégral"],
    });
  }

  return result;
}

function extractKeywords(title: string): string[] {
  const stop = new Set([
    "le", "la", "les", "un", "une", "des", "du", "de", "et", "ou", "en", "au", "aux", "ce", "cette",
    "pour", "par", "sur", "sans", "sous", "avec", "dans", "que", "qui", "quoi", "donc", "mais", "si",
  ]);
  const words = title
    .toLowerCase()
    .replace(/[^\p{L}\d\s\-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !stop.has(w));
  return [...new Set(words)].slice(0, 8);
}

function getDescription(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes("bob-sante-reference")) {
    return "Référentiel consolidé — CPAM, SSI, CARMF, CARPIMKO, CAVEC, CIPAV, CNBF. Trous de couverture et axes de vente.";
  }
  if (lower.includes("brochure") && lower.includes("tns")) return "Brochure commerciale Allianz Prévoyance TNS.";
  if (lower.includes("demande") && lower.includes("adhesion")) return "Formulaire de demande d'adhésion.";
  if (lower.includes("din") && lower.includes("personne")) return "Document d'Information Normalisé — Prévoyance Personne Clé.";
  if (lower.includes("din") && lower.includes("tns")) return "Document d'Information Normalisé — Prévoyance TNS.";
  if (lower.includes("dispositions")) return "Dispositions générales du contrat de prévoyance.";
  if (lower.includes("declaration") && lower.includes("activite")) return "Déclaration d'activité professionnelle et sportive.";
  if (lower.includes("guide") && lower.includes("produit")) return "Guide du produit Allianz Prévoyance TNS.";
  if (lower.includes("notice") && lower.includes("information")) return "Notice d'information — Prévoyance Personne Clé.";
  if (lower.includes("questionnaire") && lower.includes("medical")) return "Questionnaire médical simplifié.";
  if (lower.includes("questionnaire") && lower.includes("etat")) return "Questionnaire d'état de santé (prévoyance hors dépendance).";
  return "Document Allianz Prévoyance.";
}

function analyzeOnePdf(filePath: string, originalName: string): Promise<DocumentMapping> {
  return new Promise((resolve) => {
    const filenameNew = RENAME_MAP[originalName] ?? originalName.replace(/\s+/g, "-").toLowerCase();
    const buffer = fs.readFileSync(filePath);

    extractTextFromPDFBuffer(buffer)
      .then(({ text, numPages }) => {
        const sections = detectSections(text, numPages);
        resolve({
          filename: originalName,
          filenameNew,
          pages: numPages,
          sections,
          description: getDescription(originalName),
        });
      })
      .catch((err) => {
        resolve({
          filename: originalName,
          filenameNew: RENAME_MAP[originalName] ?? originalName,
          pages: 0,
          sections: [],
          description: getDescription(originalName),
          extractError: err instanceof Error ? err.message : String(err),
        });
      });
  });
}

function generateTocMarkdown(mappings: DocumentMapping[]): string {
  const lines: string[] = [
    "# Table des matières — Documents Bob Santé",
    "",
    "> Index pour l'agent IA : utiliser ce document pour orienter la recherche dans les PDFs suivants.",
    "",
    "## Documents indexés",
    "",
  ];

  mappings.forEach((doc, index) => {
    const num = index + 1;
    lines.push(`### ${num}. ${doc.filenameNew}`);
    lines.push("");
    lines.push(doc.description || "Document Allianz Prévoyance.");
    if (doc.extractError) {
      lines.push("");
      lines.push(`*Extraction partielle ou échec : ${doc.extractError} (OCR côté Mistral possible).*`);
    }
    if (doc.sections.length > 0) {
      lines.push("");
      lines.push("| Section | Pages | Thèmes |");
      lines.push("|---------|-------|--------|");
      for (const s of doc.sections) {
        const pageRange = s.pageEnd > s.pageStart ? `${s.pageStart}-${s.pageEnd}` : `${s.pageStart}`;
        const themes = s.keywords.slice(0, 5).join(", ");
        const titleEsc = s.title.replace(/\|/g, "\\|").slice(0, 60);
        lines.push(`| ${titleEsc} | ${pageRange} | ${themes} |`);
      }
    }
    lines.push("");
  });

  return lines.join("\n");
}

function renamePdfs(dryRun: boolean): void {
  const entries = Object.entries(RENAME_MAP).filter(([oldName, newName]) => oldName !== newName);
  for (const [oldName, newName] of entries) {
    const oldPath = path.join(PDF_DIR, oldName);
    const newPath = path.join(PDF_DIR, newName);
    if (!fs.existsSync(oldPath)) {
      console.warn(`Fichier absent, ignoré : ${oldName}`);
      continue;
    }
    if (fs.existsSync(newPath) && newPath !== oldPath) {
      console.warn(`Cible déjà existante, ignoré : ${newName}`);
      continue;
    }
    if (dryRun) {
      console.log(`[DRY-RUN] ${oldName} → ${newName}`);
    } else {
      fs.renameSync(oldPath, newPath);
      console.log(`Renommé : ${oldName} → ${newName}`);
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const doRename = args.includes("--rename");
  const renameDryRun = args.includes("--rename-dry-run");

  if (!fs.existsSync(PDF_DIR)) {
    console.error(`Dossier introuvable : ${PDF_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(PDF_DIR).filter((f) => f.toLowerCase().endsWith(".pdf"));
  if (files.length === 0) {
    console.error("Aucun PDF trouvé dans le dossier.");
    process.exit(1);
  }

  console.log(`${files.length} PDF(s) à analyser...`);

  const mappings: DocumentMapping[] = [];
  for (const file of files) {
    const filePath = path.join(PDF_DIR, file);
    try {
      const mapping = await analyzeOnePdf(filePath, file);
      mappings.push(mapping);
      if (mapping.extractError) {
        console.warn(`⚠ ${file}: ${mapping.extractError}`);
      } else {
        console.log(`✓ ${file} → ${mapping.sections.length} section(s), ${mapping.pages} page(s)`);
      }
    } catch (e) {
      console.error(`Erreur ${file}:`, e);
      mappings.push({
        filename: file,
        filenameNew: RENAME_MAP[file] ?? file,
        pages: 0,
        sections: [],
        extractError: e instanceof Error ? e.message : String(e),
      });
    }
  }

  fs.writeFileSync(OUT_MAPPING, JSON.stringify({ documents: mappings }, null, 2), "utf-8");
  console.log(`Écrit : ${OUT_MAPPING}`);

  const toc = generateTocMarkdown(mappings);
  fs.writeFileSync(OUT_TOC, toc, "utf-8");
  console.log(`Écrit : ${OUT_TOC}`);

  if (renameDryRun) {
    console.log("\n--- Renommage (dry-run) ---");
    renamePdfs(true);
  } else if (doRename) {
    console.log("\n--- Renommage des PDFs ---");
    renamePdfs(false);
  } else {
    console.log("\nPour renommer les PDFs : --rename (effectif) ou --rename-dry-run (simulation).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
