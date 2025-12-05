/**
 * Amorces (prompts) pour l'assistant IA organisées par thème
 * Ces prompts guident l'utilisateur vers les questions pertinentes
 * sur les offres commerciales Allianz
 */

export interface PromptSuggestion {
  id: string;
  text: string;
  category?: string;
  theme: "retail" | "pro" | "specialized";
}

export interface ThemeConfig {
  id: "retail" | "pro" | "specialized";
  label: string;
  description: string;
  prompts: PromptSuggestion[];
}

/**
 * Thème 1: Offres Retail (Particuliers)
 */
const RETAIL_PROMPTS: PromptSuggestion[] = [
  {
    id: "retail-1",
    text: "Quelles sont les offres du moment pour les particuliers ?",
    category: "particulier",
    theme: "retail",
  },
  {
    id: "retail-2",
    text: "Quels sont les dispositifs annuels disponibles pour le marché particulier ?",
    category: "particulier",
    theme: "retail",
  },
  {
    id: "retail-3",
    text: "Quels sont les bonus et majorations pour les gros producteurs en retail ?",
    category: "particulier",
    theme: "retail",
  },
  {
    id: "retail-4",
    text: "Quelles sont les offres spécifiques pour l'assurance Auto ?",
    category: "auto",
    theme: "retail",
  },
  {
    id: "retail-5",
    text: "Quelles sont les offres spécifiques pour la MRH ?",
    category: "mrh",
    theme: "retail",
  },
  {
    id: "retail-6",
    text: "Quelles sont les offres spécifiques pour la Santé ?",
    category: "sante",
    theme: "retail",
  },
  {
    id: "retail-7",
    text: "Quelles sont les offres spécifiques pour la Prévoyance ?",
    category: "particulier",
    theme: "retail",
  },
  {
    id: "retail-8",
    text: "Quelles sont les offres spécifiques pour la GAV ?",
    category: "gav",
    theme: "retail",
  },
  {
    id: "retail-9",
    text: "Quelles promotions sont actuellement en cours pour les particuliers ?",
    category: "particulier",
    theme: "retail",
  },
  {
    id: "retail-10",
    text: "Quels sont les dispositifs commerciaux récurrents pour le marché retail ?",
    category: "particulier",
    theme: "retail",
  },
];

/**
 * Thème 2: Offres Pro / Agri / Entreprise
 */
const PRO_PROMPTS: PromptSuggestion[] = [
  {
    id: "pro-1",
    text: "Quelles sont les offres du moment pour les clients professionnels ?",
    category: "pro",
    theme: "pro",
  },
  {
    id: "pro-2",
    text: "Quelles sont les offres du moment pour les clients agricoles ?",
    category: "pro",
    theme: "pro",
  },
  {
    id: "pro-3",
    text: "Quelles sont les offres du moment pour les entreprises ?",
    category: "pro",
    theme: "pro",
  },
  {
    id: "pro-4",
    text: "Quels sont les dispositifs annuels pour les contrats Pro/Agri ?",
    category: "pro",
    theme: "pro",
  },
  {
    id: "pro-5",
    text: "Quelles sont les offres pour les TNS (Travailleurs Non Salariés) ?",
    category: "pro",
    theme: "pro",
  },
  {
    id: "pro-6",
    text: "Quelles sont les offres pour les artisans et commerçants ?",
    category: "pro",
    theme: "pro",
  },
  {
    id: "pro-7",
    text: "Quelles sont les offres pour les entreprises ?",
    category: "pro",
    theme: "pro",
  },
  {
    id: "pro-8",
    text: "Quelles sont les offres pour les agriculteurs ?",
    category: "pro",
    theme: "pro",
  },
  {
    id: "pro-9",
    text: "Quels sont les bonus et majorations de production selon les gammes Pro ?",
    category: "pro",
    theme: "pro",
  },
  {
    id: "pro-10",
    text: "Quelles sont les mécaniques commerciales pour le segment professionnel ?",
    category: "pro",
    theme: "pro",
  },
];

/**
 * Thème 3: Offres réservées aux Agents Différenciés & Spécialistes
 */
const SPECIALIZED_PROMPTS: PromptSuggestion[] = [
  {
    id: "specialized-1",
    text: "Quels sont les dispositifs annuels pour les agents différenciés Pros ?",
    category: "pro",
    theme: "specialized",
  },
  {
    id: "specialized-2",
    text: "Quels sont les bonus pour les Spécialistes Entreprise ?",
    category: "pro",
    theme: "specialized",
  },
  {
    id: "specialized-3",
    text: "Quels sont les bonus pour les Spécialistes Construction ?",
    category: "pro",
    theme: "specialized",
  },
  {
    id: "specialized-4",
    text: "Quels sont les bonus pour les Spécialistes Flottes & Garages ?",
    category: "pro",
    theme: "specialized",
  },
  {
    id: "specialized-5",
    text: "Quels sont les bonus pour les Spécialistes Agricole ?",
    category: "pro",
    theme: "specialized",
  },
  {
    id: "specialized-6",
    text: "Quelles sont les mécaniques commerciales pour les gros producteurs PJ Pro ?",
    category: "pj",
    theme: "specialized",
  },
  {
    id: "specialized-7",
    text: "Quels sont les dispositifs spécifiques aux profils Différenciés Pros ?",
    category: "pro",
    theme: "specialized",
  },
  {
    id: "specialized-8",
    text: "Comment fonctionnent les bonus de production pour les spécialistes ?",
    category: "pro",
    theme: "specialized",
  },
];

/**
 * Configuration complète des thèmes
 */
export const THEME_CONFIGS: ThemeConfig[] = [
  {
    id: "retail",
    label: "Offres Retail (Particuliers)",
    description:
      "Offres du moment, dispositifs annuels et bonus pour particuliers",
    prompts: RETAIL_PROMPTS,
  },
  {
    id: "pro",
    label: "Offres Pro / Agri / Entreprise",
    description:
      "Offres professionnelles, agricoles et entreprises avec dispositifs annuels",
    prompts: PRO_PROMPTS,
  },
  {
    id: "specialized",
    label: "Agents Différenciés & Spécialistes",
    description:
      "Dispositifs spécifiques et bonus pour spécialistes et gros producteurs",
    prompts: SPECIALIZED_PROMPTS,
  },
];

/**
 * Récupère toutes les amorces pour un thème donné
 */
export function getPromptsByTheme(
  theme: "retail" | "pro" | "specialized"
): PromptSuggestion[] {
  const config = THEME_CONFIGS.find((t) => t.id === theme);
  return config?.prompts || [];
}

/**
 * Récupère toutes les amorces
 */
export function getAllPrompts(): PromptSuggestion[] {
  return THEME_CONFIGS.flatMap((config) => config.prompts);
}

/**
 * Récupère les amorces par catégorie
 */
export function getPromptsByCategory(
  category: string
): PromptSuggestion[] {
  return getAllPrompts().filter((p) => p.category === category);
}

/**
 * Récupère une amorce par son ID
 */
export function getPromptById(id: string): PromptSuggestion | undefined {
  return getAllPrompts().find((p) => p.id === id);
}

