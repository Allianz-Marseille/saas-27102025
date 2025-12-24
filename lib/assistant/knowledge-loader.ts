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
 * Charge les packs spécifiques selon le rôle
 */
export function loadRoleKnowledge(mainButton?: string): string {
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

    default:
      // Chat libre : uniquement le core
      break;
  }

  return packs.filter((content) => content.length > 0).join("\n\n---\n\n");
}

/**
 * Charge la base de connaissances complète pour un contexte donné
 */
export function loadKnowledgeForContext(mainButton?: string): string {
  const core = loadCoreKnowledge();
  const role = loadRoleKnowledge(mainButton);

  if (role) {
    return `${core}\n\n---\n\n${role}`;
  }

  return core;
}
