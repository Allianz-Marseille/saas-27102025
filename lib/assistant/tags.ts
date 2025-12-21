/**
 * Système de tags hiérarchisé pour les templates de l'assistant IA
 * Permet de filtrer et rechercher les templates par domaine métier
 */

/**
 * Hiérarchie complète des tags organisés par catégories
 */
export const TEMPLATE_TAGS = {
  // Catégories principales
  commercial: ["vente", "prospection", "argumentaire", "objection", "relance", "appel", "email"],
  gestion: ["renouvellement", "modification", "conformité", "administration", "courrier", "rendez-vous", "changement"],
  sinistre: ["déclaration", "expertise", "indemnisation", "litige", "suivi", "rapport", "procédure", "assistance"],
  
  // Types de produits
  produits: ["auto", "habitation", "santé", "prévoyance", "épargne", "iard", "retraite"],
  
  // Conventions et réglementation
  conventions: ["irsa", "irca", "irsi", "badinter", "cat-nat", "dintilhac", "convention"],
  
  // Processus métier
  process: ["leads", "m+3", "préterme", "qualification", "relance_satisfaction"],
  
  // Canaux de communication
  canaux: ["email", "téléphone", "courrier", "whatsapp", "communication"],
  
  // Actions
  actions: ["analyse", "devis", "comparaison", "calcul", "explication", "conseil", "documentation"],
  
  // Support et assistance
  support: ["client", "question", "assistance", "urgence", "numéro"],
  
  // Interne
  interne: ["formation", "note", "procédure", "pédagogie"],
} as const;

/**
 * Liste plate de tous les tags disponibles
 */
export const ALL_TAGS: readonly string[] = [
  // Commercial
  "commercial", "vente", "prospection", "argumentaire", "objection", "relance", "appel", "email",
  // Gestion
  "gestion", "renouvellement", "modification", "conformité", "administration", "courrier", "rendez-vous", "changement",
  // Sinistre
  "sinistre", "déclaration", "expertise", "indemnisation", "litige", "suivi", "rapport", "procédure", "assistance",
  // Produits
  "auto", "habitation", "santé", "prévoyance", "épargne", "iard", "retraite",
  // Conventions
  "irsa", "irca", "irsi", "badinter", "cat-nat", "dintilhac", "convention",
  // Processus
  "leads", "m+3", "préterme", "qualification", "relance_satisfaction",
  // Canaux
  "téléphone", "whatsapp", "communication",
  // Actions
  "analyse", "devis", "comparaison", "calcul", "explication", "conseil", "documentation",
  // Support
  "support", "client", "question", "urgence", "numéro",
  // Interne
  "interne", "formation", "note", "pédagogie",
] as const;

/**
 * Obtenir tous les tags d'une catégorie
 */
export function getTagsByCategory(category: keyof typeof TEMPLATE_TAGS): readonly string[] {
  return TEMPLATE_TAGS[category] || [];
}

/**
 * Vérifier si un tag existe
 */
export function isValidTag(tag: string): boolean {
  return ALL_TAGS.includes(tag);
}

/**
 * Obtenir les tags suggérés selon un mot-clé
 */
export function suggestTags(keyword: string): readonly string[] {
  const keywordLower = keyword.toLowerCase();
  return ALL_TAGS.filter(tag => 
    tag.toLowerCase().includes(keywordLower) || 
    keywordLower.includes(tag.toLowerCase())
  );
}

