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
 */
export function loadCoreKnowledge(): string {
  return [
    loadKnowledgeFile("00-agence.md"),
    loadKnowledgeFile("90-compliance.md"),
  ]
    .filter((content) => content.length > 0)
    .join("\n\n---\n\n");
}

/**
 * Charge les packs spécifiques selon le rôle/mode
 */
export function loadRoleKnowledge(mainButton?: string, subButton?: string): string {
  const packs: string[] = [];

  // Déterminer quels packs charger selon le rôle
  switch (mainButton) {
    case "commercial":
      packs.push(loadKnowledgeFile("10-commercial.md"));
      break;

    case "sinistre":
      packs.push(loadKnowledgeFile("20-sinistres.md"));
      break;

    case "sante":
      packs.push(loadKnowledgeFile("30-sante.md"));
      break;

    case "prevoyance":
      // Pour l'instant, réutiliser le pack santé (à créer si besoin)
      packs.push(loadKnowledgeFile("30-sante.md"));
      break;

    case "secretariat":
      // Pack secrétariat (à créer si besoin, pour l'instant vide)
      break;

    case "community-manager":
      // Pack community (à créer si besoin, pour l'instant vide)
      break;

    case "avocat":
      // Pack juridique (à créer si besoin, pour l'instant vide)
      break;

    case "expert-comptable":
      // Pack comptable (à créer si besoin, pour l'instant vide)
      break;

    case "fiscaliste":
      // Pack fiscalité (à créer si besoin, pour l'instant vide)
      break;

    default:
      // Chat libre : uniquement le core
      break;
  }

  return packs.filter((content) => content.length > 0).join("\n\n---\n\n");
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
