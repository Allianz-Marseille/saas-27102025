/**
 * Gestion des templates de prompts pour l'assistant IA
 * Ce fichier contient les types, constantes et fonctions utilitaires utilisables côté client
 */

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  variables?: string[]; // Variables personnalisables (ex: ["nomClient", "typeContrat"])
  category?: string; // Catégorie du template (ex: "email", "analyse", "devis")
  isSystem?: boolean; // Template système (non modifiable par les utilisateurs)
  createdBy?: string; // userId du créateur (si template utilisateur)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Templates de base pour l'agence
 */
export const DEFAULT_TEMPLATES: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Email de relance client",
    description: "Rédiger un email professionnel de relance pour un client",
    prompt: `Rédige un email de relance professionnel pour le client {{nomClient}} concernant {{sujet}}.
L'email doit être courtois, professionnel et inciter le client à répondre.`,
    variables: ["nomClient", "sujet"],
    category: "email",
    isSystem: true,
  },
  {
    name: "Analyse de contrat d'assurance",
    description: "Analyser un contrat d'assurance et extraire les points clés",
    prompt: `Analyse le contrat d'assurance fourni et extrait les points clés suivants :
- Type de contrat
- Garanties incluses
- Franchises
- Exclusions
- Durée et conditions de résiliation
- Montants et primes

Présente les informations de manière claire et structurée.`,
    variables: [],
    category: "analyse",
    isSystem: true,
  },
  {
    name: "Génération de devis personnalisé",
    description: "Générer un devis personnalisé basé sur les besoins du client",
    prompt: `Génère un devis personnalisé pour {{nomClient}} avec les caractéristiques suivantes :
- Type d'assurance : {{typeAssurance}}
- Besoins spécifiques : {{besoins}}
- Budget approximatif : {{budget}}

Le devis doit être détaillé, professionnel et inclure les garanties recommandées.`,
    variables: ["nomClient", "typeAssurance", "besoins", "budget"],
    category: "devis",
    isSystem: true,
  },
  {
    name: "Résumé de conversation téléphonique",
    description: "Résumer une conversation téléphonique avec un client",
    prompt: `Résume la conversation téléphonique avec {{nomClient}} en incluant :
- Points principaux discutés
- Demandes du client
- Actions à entreprendre
- Prochaines étapes

Le résumé doit être clair et actionnable.`,
    variables: ["nomClient"],
    category: "resume",
    isSystem: true,
  },
  {
    name: "Comparaison d'offres d'assurance",
    description: "Comparer deux offres d'assurance",
    prompt: `Compare les deux offres d'assurance suivantes :
- Offre 1 : {{offre1}}
- Offre 2 : {{offre2}}

Présente une comparaison détaillée incluant :
- Garanties
- Prix
- Franchises
- Avantages et inconvénients
- Recommandation`,
    variables: ["offre1", "offre2"],
    category: "comparaison",
    isSystem: true,
  },
];

/**
 * Remplacer les variables dans un template par leurs valeurs
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

/**
 * Extraire les variables d'un template
 */
export function extractTemplateVariables(template: string): string[] {
  const regex = /{{(\w+)}}/g;
  const variables: string[] = [];
  let match;
  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  return variables;
}


