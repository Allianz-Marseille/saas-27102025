/**
 * Définitions des boutons principaux et sous-boutons pour le système IA métier
 */

export interface MainButton {
  id: string;
  label: string;
  icon: string; // emoji
  color: string; // classe Tailwind pour le fond
  borderColor: string; // classe Tailwind pour la bordure
  hasSubButtons: boolean;
  description?: string;
}

export interface SubButton {
  id: string;
  label: string;
  mainButtonId: string; // référence au bouton parent
  description?: string;
}

/**
 * Boutons principaux (8 catégories métier)
 */
export const MAIN_BUTTONS: MainButton[] = [
  {
    id: "commercial",
    label: "Commercial",
    icon: "💼",
    color: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-500",
    hasSubButtons: true,
    description: "M+3, Préterme, Devis, Arguments commerciaux",
  },
  {
    id: "sinistre",
    label: "Sinistre",
    icon: "🚨",
    color: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-500",
    hasSubButtons: false,
    description: "Gestion des sinistres, conventions IRSA/IRSI/IRCA",
  },
  {
    id: "sante",
    label: "Santé",
    icon: "💚",
    color: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-500",
    hasSubButtons: true,
    description: "Santé individuelle et collective",
  },
  {
    id: "prevoyance",
    label: "Prévoyance",
    icon: "🟣",
    color: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-500",
    hasSubButtons: true,
    description: "Prévoyance individuelle et collective",
  },
  {
    id: "secretariat",
    label: "Secrétariat",
    icon: "📋",
    color: "bg-yellow-50 dark:bg-yellow-950/20",
    borderColor: "border-yellow-500",
    hasSubButtons: false,
    description: "Assistant administratif, organisation",
  },
  {
    id: "community-manager",
    label: "Community Manager",
    icon: "📱",
    color: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-500",
    hasSubButtons: false,
    description: "Contenu réseaux sociaux, communication",
  },
  {
    id: "avocat",
    label: "Avocat",
    icon: "⚖️",
    color: "bg-indigo-50 dark:bg-indigo-950/20",
    borderColor: "border-indigo-500",
    hasSubButtons: false,
    description: "Conseil juridique, droit assurance",
  },
  {
    id: "expert-comptable",
    label: "Expert-comptable",
    icon: "📊",
    color: "bg-cyan-50 dark:bg-cyan-950/20",
    borderColor: "border-cyan-500",
    hasSubButtons: false,
    description: "Conseil comptable, fiscalité",
  },
];

/**
 * Sous-boutons pour chaque bouton principal
 */
export const SUB_BUTTONS: SubButton[] = [
  // Commercial
  {
    id: "m-plus-3",
    label: "M+3",
    mainButtonId: "commercial",
    description: "Clients à 3 mois après souscription",
  },
  {
    id: "preterme-auto",
    label: "Préterme Auto",
    mainButtonId: "commercial",
    description: "Relance 45 jours avant échéance auto",
  },
  {
    id: "preterme-iard",
    label: "Préterme IARD",
    mainButtonId: "commercial",
    description: "Relance 60 jours avant échéance habitation/pro",
  },
  {
    id: "presentation-devis",
    label: "Présentation de devis",
    mainButtonId: "commercial",
    description: "Rédaction mail/lettre pour présenter un devis",
  },
  {
    id: "comparaison-devis",
    label: "Comparaison de devis",
    mainButtonId: "commercial",
    description: "Comparaison objective puis orientée commercialement",
  },
  {
    id: "argument-commercial",
    label: "Argument commercial",
    mainButtonId: "commercial",
    description: "Argumentaires et scripts de vente",
  },
  {
    id: "explication-garanties",
    label: "Explication des garanties",
    mainButtonId: "commercial",
    description: "Explication pédagogique des garanties",
  },
  // Santé
  {
    id: "sante-individuel",
    label: "Individuel",
    mainButtonId: "sante",
    description: "Santé individuelle, mutuelle complémentaire",
  },
  {
    id: "sante-collectif",
    label: "Collectif",
    mainButtonId: "sante",
    description: "Santé collective, obligations ANI",
  },
  // Prévoyance
  {
    id: "prevoyance-individuel",
    label: "Individuel",
    mainButtonId: "prevoyance",
    description: "Prévoyance TNS, garanties individuelles",
  },
  {
    id: "prevoyance-collectif",
    label: "Collectif",
    mainButtonId: "prevoyance",
    description: "Prévoyance collective, conventions collectives",
  },
];

/**
 * Récupère un bouton principal par son ID
 */
export function getMainButtonById(buttonId: string): MainButton | undefined {
  return MAIN_BUTTONS.find((btn) => btn.id === buttonId);
}

/**
 * Récupère les sous-boutons d'un bouton principal
 */
export function getSubButtonsByMainButtonId(mainButtonId: string): SubButton[] {
  return SUB_BUTTONS.filter((subBtn) => subBtn.mainButtonId === mainButtonId);
}

/**
 * Récupère un sous-bouton par son ID
 */
export function getSubButtonById(subButtonId: string): SubButton | undefined {
  return SUB_BUTTONS.find((subBtn) => subBtn.id === subButtonId);
}

/**
 * Vérifie si un bouton principal nécessite une sélection de sous-bouton
 */
export function requiresSubButton(mainButtonId: string): boolean {
  const mainButton = getMainButtonById(mainButtonId);
  return mainButton?.hasSubButtons ?? false;
}

