/**
 * Context Loader — Architecture Multi-Agents Allianz
 *
 * Charge dynamiquement le contexte (workflow + connaissances + référentiel global)
 * pour chaque bot depuis le registre et les fichiers Markdown locaux.
 */

import fs from "fs";
import path from "path";

const ASSETS_BASE = path.join(process.cwd(), "docs", "assets-gemini");
const REGISTRY_PATH = path.join(ASSETS_BASE, "registry-bots.md");
const GLOBAL_REFERENTIEL = "01-referentiel-social-plafonds-2026.md";

export interface BotRegistryEntry {
  botId: string;
  nom: string;
  dossierSource: string;
  workflowPrincipal: string;
  specialite: string;
}

/**
 * Parse le registre des bots pour extraire les entrées (botId, dossier, workflow).
 */
function parseRegistry(registryContent: string): BotRegistryEntry[] {
  const entries: BotRegistryEntry[] = [];
  const lines = registryContent.split("\n");

  for (const line of lines) {
    if (!line.trim().startsWith("|") || line.includes("---") || line.includes("botId")) {
      continue;
    }
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length < 5) continue;

    const botId = cells[0].replace(/\*\*/g, "").trim();
    const nom = cells[1]?.trim() ?? botId;
    const dossierSource = (cells[2] ?? "").replace(/`/g, "").trim();
    const workflowPrincipal = (cells[3] ?? "").replace(/`/g, "").trim();
    const specialite = cells[4]?.trim() ?? "";

    if (botId && dossierSource && workflowPrincipal) {
      entries.push({
        botId,
        nom,
        dossierSource,
        workflowPrincipal,
        specialite,
      });
    }
  }
  return entries;
}

/**
 * Charge un fichier Markdown s'il existe.
 */
function readFileIfExists(filePath: string): string {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    }
  } catch {
    // Fichier manquant ou erreur lecture
  }
  return "";
}

/**
 * Charge le référentiel global (racine assets-gemini ou dossier du bot).
 */
function loadGlobalReferentiel(botFolderPath: string): string {
  const rootPath = path.join(ASSETS_BASE, GLOBAL_REFERENTIEL);
  const rootContent = readFileIfExists(rootPath);
  if (rootContent) return rootContent;

  const botPath = path.join(botFolderPath, GLOBAL_REFERENTIEL);
  return readFileIfExists(botPath);
}

/**
 * Retourne tous les fichiers .md d'un dossier, triés par nom (sauf le workflow principal).
 */
function listKnowledgeFiles(folderPath: string, excludeWorkflow: string): string[] {
  try {
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
      return [];
    }
    const files = fs.readdirSync(folderPath);
    return files
      .filter((f) => f.endsWith(".md") && f !== excludeWorkflow && f !== path.basename(GLOBAL_REFERENTIEL))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Récupère l'entrée du registre pour un botId.
 */
export function getBotRegistryEntry(botId: string): BotRegistryEntry | null {
  const registryContent = readFileIfExists(REGISTRY_PATH);
  if (!registryContent) return null;

  const entries = parseRegistry(registryContent);
  return entries.find((e) => e.botId.toLowerCase() === botId.toLowerCase()) ?? null;
}

/**
 * Charge le contexte complet d'un bot et retourne une systemInstruction concaténée.
 * Utilisée par la route API chat pour initialiser Gemini.
 */
export function getBotContext(botId: string): string {
  const entry = getBotRegistryEntry(botId);
  if (!entry) {
    throw new Error(`Bot inconnu dans le registre: ${botId}`);
  }

  const botFolderPath = path.join(ASSETS_BASE, entry.dossierSource.replace(/\/$/, ""));
  const parts: string[] = [];

  // 1. Workflow principal (obligatoire)
  const workflowPath = path.join(botFolderPath, entry.workflowPrincipal);
  const workflowContent = readFileIfExists(workflowPath);
  if (!workflowContent) {
    throw new Error(
      `Workflow introuvable pour ${botId}: ${entry.workflowPrincipal}. Vérifiez que le dossier ${entry.dossierSource} existe.`
    );
  }
  parts.push(`## WORKFLOW ET MÉTHODOLOGIE (${entry.nom})\n\n${workflowContent}`);

  // 2. Fichiers de connaissances (régimes, solutions, etc.)
  const knowledgeFiles = listKnowledgeFiles(botFolderPath, entry.workflowPrincipal);
  if (knowledgeFiles.length > 0) {
    parts.push("\n## BASE DE CONNAISSANCES\n\n");
    for (const file of knowledgeFiles) {
      const content = readFileIfExists(path.join(botFolderPath, file));
      if (content) {
        parts.push(`### ${file}\n\n${content}\n\n`);
      }
    }
  }

  // 3. Référentiel global (PASS, PMSS, IJ CPAM)
  const referentielContent = loadGlobalReferentiel(botFolderPath);
  if (referentielContent) {
    parts.push(`\n## RÉFÉRENTIEL GLOBAL (Inclus pour tous les bots)\n\n${referentielContent}`);
  }

  const systemInstruction = parts.join("\n---\n");
  if (!systemInstruction.trim()) {
    throw new Error(`Aucun contexte chargé pour le bot: ${botId}`);
  }

  return systemInstruction;
}
