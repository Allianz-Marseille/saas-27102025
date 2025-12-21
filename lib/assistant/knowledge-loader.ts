/**
 * Utilitaire pour charger et injecter les connaissances métier depuis les fichiers Markdown
 * 
 * Ce module permet de charger dynamiquement des fichiers de connaissances
 * selon le contexte de la question pour enrichir le prompt de l'assistant.
 * 
 * Note : Pour l'instant, cette fonctionnalité est préparée pour une évolution future.
 * Le system prompt enrichi couvre déjà l'essentiel des connaissances métier.
 */

import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Chemin de base vers les fichiers de connaissances
 */
const KNOWLEDGE_BASE_PATH = join(process.cwd(), "docs", "knowledge");

/**
 * Mapping des mots-clés vers les fichiers de connaissances
 * Permet de détecter automatiquement quels fichiers charger selon le sujet
 */
const KEYWORD_TO_FILE_MAP: Record<string, string[]> = {
  // Produits
  santé: ["produits/assurance-sante.md"],
  santé_collective: ["produits/assurance-sante.md"],
  mutuelle: ["produits/assurance-sante.md"],
  iard: ["produits/assurance-iard.md"],
  auto: ["produits/assurance-iard.md"],
  habitation: ["produits/assurance-iard.md"],
  professionnelle: ["produits/assurance-iard.md"],
  décennale: ["produits/assurance-iard.md"],
  prévoyance: ["produits/prevoyance.md"],
  tns: ["produits/prevoyance.md"],
  décès: ["produits/prevoyance.md"],
  invalidité: ["produits/prevoyance.md"],
  épargne: ["produits/epargne.md"],
  retraite: ["produits/epargne.md"],
  per: ["produits/epargne.md"],
  perp: ["produits/epargne.md"],

  // Process
  lead: ["process/leads.md"],
  leads: ["process/leads.md"],
  m+3: ["process/m-plus-3.md"],
  "m plus 3": ["process/m-plus-3.md"],
  préterme: ["process/preterme-auto.md", "process/preterme-ird.md"],
  préterme_auto: ["process/preterme-auto.md"],
  préterme_ird: ["process/preterme-ird.md"],
  renouvellement: ["process/preterme-auto.md", "process/preterme-ird.md"],
};

/**
 * Charge le contenu d'un fichier de connaissances Markdown
 * 
 * @param filePath Chemin relatif au dossier knowledge/ (ex: "produits/assurance-sante.md")
 * @returns Le contenu du fichier, ou null si le fichier n'existe pas
 */
export async function loadKnowledgeFile(filePath: string): Promise<string | null> {
  try {
    const fullPath = join(KNOWLEDGE_BASE_PATH, filePath);
    const content = await readFile(fullPath, "utf-8");
    
    // Retirer le titre du fichier (première ligne # Titre) pour éviter la duplication
    const lines = content.split("\n");
    if (lines[0].startsWith("#")) {
      return lines.slice(1).join("\n").trim();
    }
    
    return content.trim();
  } catch (error) {
    console.warn(`Impossible de charger le fichier de connaissances ${filePath}:`, error);
    return null;
  }
}

/**
 * Charge plusieurs fichiers de connaissances en parallèle
 * 
 * @param filePaths Tableau de chemins relatifs
 * @returns Tableau des contenus chargés (les fichiers non trouvés sont exclus)
 */
export async function loadKnowledgeFiles(filePaths: string[]): Promise<string[]> {
  const contents = await Promise.all(
    filePaths.map((path) => loadKnowledgeFile(path))
  );
  
  return contents.filter((content): content is string => content !== null);
}

/**
 * Détecte les fichiers de connaissances pertinents selon le contenu du message
 * 
 * @param message Le message de l'utilisateur
 * @returns Tableau de chemins de fichiers à charger
 */
export function selectRelevantContext(message: string): string[] {
  const messageLower = message.toLowerCase();
  const relevantFiles = new Set<string>();

  // Parcourir le mapping des mots-clés
  for (const [keyword, files] of Object.entries(KEYWORD_TO_FILE_MAP)) {
    if (messageLower.includes(keyword)) {
      files.forEach((file) => relevantFiles.add(file));
    }
  }

  // Toujours inclure les connaissances core (identité et réglementation)
  // Ces fichiers sont déjà dans le system prompt, mais peuvent être chargés aussi pour injection dynamique
  // relevantFiles.add("core/identite-agence.md");
  // relevantFiles.add("core/reglementation.md");

  return Array.from(relevantFiles);
}

/**
 * Charge les connaissances pertinentes selon le message et les formate pour injection
 * 
 * @param message Le message de l'utilisateur
 * @param maxFiles Nombre maximum de fichiers à charger (par défaut 2 pour éviter la surcharge)
 * @returns Le contenu formaté des connaissances, ou null si aucune connaissance pertinente
 */
export async function loadRelevantKnowledge(
  message: string,
  maxFiles: number = 2
): Promise<string | null> {
  const relevantFiles = selectRelevantContext(message);
  
  if (relevantFiles.length === 0) {
    return null;
  }

  // Limiter le nombre de fichiers pour éviter de dépasser les limites de tokens
  const filesToLoad = relevantFiles.slice(0, maxFiles);
  const contents = await loadKnowledgeFiles(filesToLoad);

  if (contents.length === 0) {
    return null;
  }

  // Formater pour injection dans le prompt
  return `\n\n--- Connaissances métier pertinentes ---\n\n${contents.join("\n\n---\n\n")}`;
}

/**
 * Injection optionnelle : Ajoute les connaissances pertinentes au système de messages
 * 
 * Cette fonction peut être utilisée pour injecter dynamiquement des connaissances
 * dans le prompt, au-delà du system prompt de base.
 * 
 * Note : À utiliser avec parcimonie pour éviter de dépasser les limites de tokens.
 * 
 * @param messages Le tableau de messages OpenAI
 * @param userMessage Le message de l'utilisateur
 * @returns Le tableau de messages enrichi (ou inchangé si pas de connaissances pertinentes)
 */
export async function enrichMessagesWithKnowledge(
  messages: Array<{ role: string; content: string | any }>,
  userMessage: string
): Promise<Array<{ role: string; content: string | any }>> {
  // Pour l'instant, cette fonction est prête mais pas activée par défaut
  // car le system prompt enrichi couvre déjà l'essentiel.
  // 
  // Pour l'activer, décommenter le code ci-dessous :

  // const relevantKnowledge = await loadRelevantKnowledge(userMessage, 1);
  // if (relevantKnowledge) {
  //   // Insérer les connaissances après le system prompt
  //   const enrichedMessages = [...messages];
  //   if (enrichedMessages.length > 0 && enrichedMessages[0].role === "system") {
  //     enrichedMessages.splice(1, 0, {
  //       role: "system",
  //       content: relevantKnowledge,
  //     });
  //   }
  //   return enrichedMessages;
  // }

  return messages;
}

