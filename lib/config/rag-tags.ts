/**
 * Configuration des tags pour les documents RAG
 */

export interface DocumentTag {
  id: string;
  label: string;
  color: string; // Couleur Tailwind pour les badges
  icon?: string; // Emoji optionnel
}

export const PREDEFINED_TAGS: DocumentTag[] = [
  {
    id: "auto",
    label: "Auto",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    icon: "🚗",
  },
  {
    id: "mrh",
    label: "MRH",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    icon: "🏠",
  },
  {
    id: "sante",
    label: "Santé",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    icon: "❤️",
  },
  {
    id: "prevoyance",
    label: "Prévoyance",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: "🛡️",
  },
  {
    id: "entreprise",
    label: "Entreprise",
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    icon: "🏢",
  },
  {
    id: "sinistre",
    label: "Sinistre",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    icon: "⚠️",
  },
];

// Couleur par défaut pour les tags custom
export const CUSTOM_TAG_COLOR = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700";

/**
 * Récupère la configuration d'un tag (prédéfini ou custom)
 */
export function getTagConfig(tagId: string): DocumentTag {
  const predefined = PREDEFINED_TAGS.find((t) => t.id === tagId);
  if (predefined) {
    return predefined;
  }

  // Tag custom
  return {
    id: tagId,
    label: tagId.charAt(0).toUpperCase() + tagId.slice(1),
    color: CUSTOM_TAG_COLOR,
  };
}

/**
 * Valide un tag (nom valide, accepte les emojis)
 */
export function validateTag(tag: string): { valid: boolean; error?: string } {
  if (!tag || tag.trim().length === 0) {
    return { valid: false, error: "Le tag ne peut pas être vide" };
  }

  if (tag.length > 50) {
    return { valid: false, error: "Le tag est trop long (max 50 caractères)" };
  }

  // Interdit certains caractères problématiques mais accepte les emojis
  const invalidCharsPattern = /[<>{}[\]\\\/|"'`]/;
  if (invalidCharsPattern.test(tag)) {
    return {
      valid: false,
      error: "Le tag contient des caractères interdits (<>{}[]\\|\"'`)",
    };
  }

  return { valid: true };
}

/**
 * Normalise un tag (lowercase, trim)
 */
export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

/**
 * Récupère tous les tags (prédéfinis + liste custom)
 */
export function getAllTagConfigs(customTags: string[] = []): DocumentTag[] {
  const customConfigs = customTags.map((tag) => getTagConfig(tag));
  return [...PREDEFINED_TAGS, ...customConfigs];
}

