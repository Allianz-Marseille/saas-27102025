/**
 * Chargeur modulaire de base de connaissances
 * Charge uniquement les packs nécessaires selon le rôle/mode
 */

import fs from "fs";
import path from "path";

/**
 * Charge un fichier de connaissance depuis docs/knowledge/
 */
function loadKnowledgeFile(filename: string): string {
  try {
    const filePath = path.join(process.cwd(), "docs", "knowledge", filename);
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Erreur chargement ${filename}:`, error);
    return "";
  }
}

/**
 * Charge les packs de base (toujours inclus)
 * Utilise les fichiers détaillés de core/ au lieu des fichiers consolidés
 */
export function loadCoreKnowledge(): string {
  return [
    loadKnowledgeFile("core/identite-agence.md"),
    loadKnowledgeFile("core/agences.md"),
    loadKnowledgeFile("core/effectif-agence.md"),
    loadKnowledgeFile("core/reglementation.md"),
    loadKnowledgeFile("core/numeros-assistance.md"),
    loadKnowledgeFile("core/liens-devis.md"),
  ]
    .filter((content) => content.length > 0)
    .join("\n\n---\n\n");
}

/**
 * Charge les packs spécifiques selon le rôle/mode.
 * Les 10 rôles ont été supprimés : seul le core est utilisé.
 */
export function loadRoleKnowledge(_mainButton?: string, _subButton?: string): string {
  return "";
}

/**
 * Charge la base de connaissances complète pour un contexte donné
 */
export function loadKnowledgeForContext(mainButton?: string, subButton?: string): string {
  const core = loadCoreKnowledge();
  const role = loadRoleKnowledge(mainButton, subButton);

  if (role) {
    return `${core}\n\n---\n\n${role}`;
  }

  return core;
}

/**
 * Interface pour le contexte de segmentation
 */
export interface SegmentationContext {
  caseType?: "general" | "client" | null;
  clientType?: "particulier" | "tns" | "entreprise" | null;
  csp?: string | null;
  ageBand?: string | null;
  companyBand?: { effectifBand: string | null; caBand: string | null } | null;
  dirigeantStatut?: "tns" | "assimile_salarie" | null;
}

/**
 * Charge un fichier de connaissance depuis un sous-dossier de segmentation
 */
function loadSegmentationFile(subfolder: string, filename: string): string {
  try {
    const filePath = path.join(process.cwd(), "docs", "knowledge", "segmentation", subfolder, filename);
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Erreur chargement segmentation/${subfolder}/${filename}:`, error);
    return "";
  }
}

/**
 * Charge un fichier de connaissance depuis le dossier sources
 */
function loadSourceFile(filename: string): string {
  try {
    const filePath = path.join(process.cwd(), "docs", "knowledge", "sources", filename);
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Erreur chargement sources/${filename}:`, error);
    return "";
  }
}

/**
 * Charge la base de connaissances selon le contexte de segmentation
 */
export function loadSegmentationKnowledge(context: SegmentationContext): string {
  const core = loadCoreKnowledge();
  const knowledgeParts: string[] = [];

  // Si pas de contexte ou caseType = "general", retourner uniquement le core
  if (!context || context.caseType === "general" || !context.clientType) {
    return core;
  }

  // Charger les connaissances selon le type de client
  if (context.clientType === "particulier" || context.clientType === "tns") {
    // Charger le fichier segment selon CSP
    if (context.csp) {
      const segmentFile = `${context.csp}.md`;
      const segmentContent = loadSegmentationFile("particuliers", segmentFile);
      if (segmentContent) {
        knowledgeParts.push(segmentContent);
      }
    }

    // Charger age-bands.md si ageBand est fourni
    if (context.ageBand) {
      const ageBandsContent = loadSegmentationFile("particuliers", "age-bands.md");
      if (ageBandsContent) {
        knowledgeParts.push(ageBandsContent);
      }
    }
  } else if (context.clientType === "entreprise") {
    // Charger les fichiers entreprise
    const entrepriseSocle = loadSegmentationFile("entreprises", "entreprise-socle.md");
    if (entrepriseSocle) {
      knowledgeParts.push(entrepriseSocle);
    }

    const entrepriseSalaries = loadSegmentationFile("entreprises", "entreprise-salaries.md");
    if (entrepriseSalaries) {
      knowledgeParts.push(entrepriseSalaries);
    }

    // Charger size-bands.md si companyBand est fourni
    if (context.companyBand) {
      const sizeBandsContent = loadSegmentationFile("entreprises", "size-bands.md");
      if (sizeBandsContent) {
        knowledgeParts.push(sizeBandsContent);
      }
    }

    // Charger le fichier dirigeant selon statut
    if (context.dirigeantStatut === "tns") {
      const dirigeantTns = loadSegmentationFile("entreprises", "entreprise-dirigeant-tns.md");
      if (dirigeantTns) {
        knowledgeParts.push(dirigeantTns);
      }
    } else if (context.dirigeantStatut === "assimile_salarie") {
      const dirigeantAssimile = loadSegmentationFile("entreprises", "entreprise-dirigeant-assimile-salarie.md");
      if (dirigeantAssimile) {
        knowledgeParts.push(dirigeantAssimile);
      }
    }
  }

  // Toujours charger references-officielles.md en fin
  const referencesOfficielles = loadSourceFile("references-officielles.md");
  if (referencesOfficielles) {
    knowledgeParts.push(referencesOfficielles);
  }

  // Combiner toutes les connaissances
  if (knowledgeParts.length > 0) {
    return `${core}\n\n---\n\n${knowledgeParts.join("\n\n---\n\n")}`;
  }

  return core;
}

/** Limite de caractères pour la base Bob (éviter dépassement contexte) */
const BOB_KNOWLEDGE_MAX_CHARS = 28_000;

/**
 * Charge la base de connaissances Bob depuis docs/knowledge/bob/.
 * Concatène tous les .md du dossier avec une limite de taille.
 * Retourne une chaîne vide si le dossier n'existe pas ou est vide.
 */
export function loadBobKnowledge(): string {
  try {
    const bobDir = path.join(process.cwd(), "docs", "knowledge", "bob");
    if (!fs.existsSync(bobDir) || !fs.statSync(bobDir).isDirectory()) {
      return "";
    }
    const entries = fs.readdirSync(bobDir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
      .map((e) => e.name)
      .sort();
    if (files.length === 0) return "";

    const parts: string[] = [];
    let total = 0;
    for (const file of files) {
      if (total >= BOB_KNOWLEDGE_MAX_CHARS) break;
      const filePath = path.join(bobDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const remaining = BOB_KNOWLEDGE_MAX_CHARS - total;
      const toAdd = content.length <= remaining ? content : content.slice(0, remaining) + "\n\n[... tronqué]";
      parts.push(toAdd);
      total += toAdd.length;
    }
    return parts.join("\n\n---\n\n");
  } catch (error) {
    console.error("Erreur chargement base Bob:", error);
    return "";
  }
}
