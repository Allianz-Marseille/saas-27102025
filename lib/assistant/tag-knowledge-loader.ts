import { getTagById, type Tag } from "./tags-definitions";

/**
 * Mapping des tags vers les fichiers de connaissance
 * Utilisé pour charger automatiquement les bonnes connaissances selon le tag sélectionné
 */
export const TAG_TO_KNOWLEDGE_MAP: Record<string, string[]> = {
  // Tags principaux
  sinistres: [
    "process/sinistres.md",
    "produits/assurance-iard.md",
  ],
  commercial: [
    "process/leads.md",
  ],
  sante: [
    "produits/assurance-sante.md",
  ],
  prevoyance: [
    "produits/prevoyance.md",
  ],
  auto: [
    "produits/assurance-vtm-allianz.md",
    "produits/assurance-iard.md",
  ],
  habitation: [
    "produits/assurance-iard.md",
  ],
  professionnels: [
    "produits/assurance-iard.md",
  ],
  entreprises: [
    "produits/assurance-iard.md",
  ],
  "sante-collective": [
    "produits/assurance-sante.md",
  ],

  // Tags optionnels
  reglementation: [
    "core/reglementation.md",
  ],
  juridique: [
    "core/reglementation.md",
  ],
  "bonus-malus": [
    "produits/assurance-vtm-allianz.md",
  ],
  "process-agence": [
    "process/leads.md",
  ],
  verification: [
    "core/reglementation.md",
  ],
  "risque-juridique": [
    "core/reglementation.md",
  ],
};

/**
 * Récupère les fichiers de connaissance à charger selon un tag
 */
export function getKnowledgeFilesForTag(tagId: string): string[] {
  const tag = getTagById(tagId);
  if (!tag) {
    return [];
  }

  // Priorité aux fichiers définis dans le tag
  if (tag.knowledgeFiles && tag.knowledgeFiles.length > 0) {
    return tag.knowledgeFiles;
  }

  // Sinon, utiliser le mapping
  return TAG_TO_KNOWLEDGE_MAP[tagId] || [];
}

/**
 * Récupère tous les fichiers de connaissance pour le tag principal
 */
export function getKnowledgeFilesForTags(mainTag: string): string[] {
  return getKnowledgeFilesForTag(mainTag);
}

