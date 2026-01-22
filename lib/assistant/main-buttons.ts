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
 * Boutons principaux (9 catégories métier + Chat libre)
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
    hasSubButtons: true,
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
    hasSubButtons: true,
    description: "Assistant administratif, organisation",
  },
  {
    id: "community-manager",
    label: "Community Manager",
    icon: "📱",
    color: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-500",
    hasSubButtons: true,
    description: "Contenu réseaux sociaux, communication",
  },
  {
    id: "avocat",
    label: "Avocat",
    icon: "⚖️",
    color: "bg-indigo-50 dark:bg-indigo-950/20",
    borderColor: "border-indigo-500",
    hasSubButtons: true,
    description: "Conseil juridique, droit assurance",
  },
  {
    id: "expert-comptable",
    label: "Expert-comptable",
    icon: "📊",
    color: "bg-cyan-50 dark:bg-cyan-950/20",
    borderColor: "border-cyan-500",
    hasSubButtons: true,
    description: "Conseil comptable, fiscalité",
  },
  {
    id: "analyste-performance",
    label: "Analyste de Performance",
    icon: "📊",
    color: "bg-teal-50 dark:bg-teal-950/20",
    borderColor: "border-teal-500",
    hasSubButtons: false,
    description: "Classements agence, analyse Excel/PDF, benchmarking",
  },
  {
    id: "fiscaliste",
    label: "Fiscaliste",
    icon: "🧾",
    color: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-500",
    hasSubButtons: true,
    description: "Optimisation fiscale, déclarations, conformité",
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
  {
    id: "bilan-complet",
    label: "Bilan complet",
    mainButtonId: "commercial",
    description: "Analyse complète du portefeuille client",
  },
  // Sinistre
  {
    id: "analyser-constat",
    label: "Analyser un constat",
    mainButtonId: "sinistre",
    description: "Analyse d'un constat amiable",
  },
  {
    id: "appliquer-convention",
    label: "Appliquer une convention",
    mainButtonId: "sinistre",
    description: "IRSA, IRCA, IRSI, CIDRE",
  },
  {
    id: "droit-commun",
    label: "Droit commun",
    mainButtonId: "sinistre",
    description: "Hors conventions, responsabilité civile",
  },
  {
    id: "question-generale-sinistre",
    label: "Question générale",
    mainButtonId: "sinistre",
    description: "Questions diverses sur les sinistres",
  },
  {
    id: "points-vigilance",
    label: "Points de vigilance",
    mainButtonId: "sinistre",
    description: "Précautions et erreurs à éviter",
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
  {
    id: "analyse-devis-sante",
    label: "Analyse devis santé",
    mainButtonId: "sante",
    description: "Analyse approfondie d'un devis santé",
  },
  {
    id: "comparaison-devis-sante",
    label: "Comparaison devis santé",
    mainButtonId: "sante",
    description: "Comparer plusieurs devis santé",
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
  {
    id: "analyse-besoins-prevoyance",
    label: "Analyse des besoins",
    mainButtonId: "prevoyance",
    description: "Analyser les besoins en prévoyance",
  },
  {
    id: "professions-medicales-unim",
    label: "Professions médicales (UNIM)",
    mainButtonId: "prevoyance",
    description: "Spécificités médecins, dentistes, etc.",
  },
  {
    id: "professions-chiffre-droit-uniced",
    label: "Professions du chiffre/droit (UNICED)",
    mainButtonId: "prevoyance",
    description: "Spécificités comptables, avocats, etc.",
  },
  // Secrétariat
  {
    id: "rediger-mail",
    label: "Rédiger un mail",
    mainButtonId: "secretariat",
    description: "Rédaction de mail professionnel",
  },
  {
    id: "relance-client",
    label: "Relance client",
    mainButtonId: "secretariat",
    description: "Mail ou courrier de relance",
  },
  {
    id: "compte-rendu",
    label: "Compte-rendu",
    mainButtonId: "secretariat",
    description: "Rédaction de compte-rendu de réunion",
  },
  {
    id: "checklist-pieces",
    label: "Checklist pièces",
    mainButtonId: "secretariat",
    description: "Liste des documents à réclamer",
  },
  {
    id: "organisation",
    label: "Organisation",
    mainButtonId: "secretariat",
    description: "Conseils d'organisation et méthodes",
  },
  // Community Manager
  {
    id: "post-unique",
    label: "Post unique",
    mainButtonId: "community-manager",
    description: "Création d'un post pour les réseaux sociaux",
  },
  {
    id: "campagne",
    label: "Campagne",
    mainButtonId: "community-manager",
    description: "Plan de campagne sur plusieurs posts",
  },
  {
    id: "reponse-avis",
    label: "Réponse à un avis",
    mainButtonId: "community-manager",
    description: "Répondre à un avis client (positif/négatif)",
  },
  {
    id: "idees-contenu",
    label: "Idées de contenu",
    mainButtonId: "community-manager",
    description: "Inspiration et idées de publications",
  },
  // Avocat
  {
    id: "droit-assurances",
    label: "Droit des assurances",
    mainButtonId: "avocat",
    description: "Conseil juridique en assurance",
  },
  {
    id: "droit-affaires",
    label: "Droit des affaires",
    mainButtonId: "avocat",
    description: "Droit commercial et sociétés",
  },
  {
    id: "droit-social",
    label: "Droit social",
    mainButtonId: "avocat",
    description: "Droit du travail et social",
  },
  {
    id: "responsabilite",
    label: "Responsabilité",
    mainButtonId: "avocat",
    description: "Questions de responsabilité civile/professionnelle",
  },
  // Expert-comptable
  {
    id: "lecture-document",
    label: "Lecture de document",
    mainButtonId: "expert-comptable",
    description: "Analyse de bilan, compte de résultat",
  },
  {
    id: "fiscalite",
    label: "Fiscalité",
    mainButtonId: "expert-comptable",
    description: "Questions fiscales et optimisation",
  },
  {
    id: "calcul-simulation",
    label: "Calcul / Simulation",
    mainButtonId: "expert-comptable",
    description: "Calculs comptables et simulations",
  },
  {
    id: "structuration",
    label: "Structuration",
    mainButtonId: "expert-comptable",
    description: "Conseils de structuration d'entreprise",
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

