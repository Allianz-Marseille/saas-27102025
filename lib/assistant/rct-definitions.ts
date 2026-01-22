export interface Role {
  id: string;
  label: string;
  description: string;
}

export interface Context {
  id: string;
  label: string;
  description?: string;
}

export interface Task {
  id: string;
  label: string;
  description?: string;
}

export const ROLES: Role[] = [
  {
    id: "sinistre",
    label: "Gestionnaire de sinistre",
    description: "Vous gérez les déclarations, expertises et indemnisations de sinistres",
  },
  {
    id: "commercial",
    label: "Commercial",
    description: "Vous êtes en charge de la prospection, vente et relation client",
  },
  {
    id: "community_manager",
    label: "Community manager",
    description: "Vous gérez la communication et la présence digitale de l'entreprise",
  },
  {
    id: "avocat",
    label: "Avocat spécialisé en assurance",
    description: "Vous conseillez sur les aspects juridiques et réglementaires",
  },
  {
    id: "sante",
    label: "Spécialiste santé",
    description: "Vous êtes expert en contrats et offres de santé",
  },
  {
    id: "prevoyance",
    label: "Spécialiste prévoyance",
    description: "Vous êtes expert en contrats et offres de prévoyance",
  },
  {
    id: "secretaire",
    label: "Secrétaire",
    description: "Vous assistez dans les tâches administratives et organisationnelles",
  },
  {
    id: "analyste",
    label: "Analyste de données",
    description: "Vous analysez les données et créez des rapports",
  },
  {
    id: "contrats",
    label: "Gestionnaire de contrats",
    description: "Vous gérez les contrats, renouvellements et modifications",
  },
  {
    id: "conformite",
    label: "Expert en conformité",
    description: "Vous assurez le respect des réglementations et normes",
  },
];

export const CONTEXTS_BY_ROLE: Record<string, Context[]> = {
  sinistre: [
    { id: "declaration", label: "Déclaration de sinistre" },
    { id: "expertise", label: "Expertise" },
    { id: "indemnisation", label: "Indemnisation" },
    { id: "litige", label: "Litige" },
    { id: "suivi", label: "Suivi de dossier" },
    { id: "reclamation", label: "Réclamation client" },
  ],
  commercial: [
    { id: "prospection", label: "Prospection" },
    { id: "relance", label: "Relance client" },
    { id: "devis", label: "Établissement de devis" },
    { id: "renouvellement", label: "Renouvellement de contrat" },
    { id: "conseil", label: "Conseil client" },
    { id: "negociation", label: "Négociation" },
  ],
  community_manager: [
    { id: "publication", label: "Création de contenu" },
    { id: "moderation", label: "Modération" },
    { id: "crise", label: "Gestion de crise" },
    { id: "animation", label: "Animation de communauté" },
    { id: "analyse", label: "Analyse de performance" },
  ],
  avocat: [
    { id: "conseil", label: "Conseil juridique" },
    { id: "litige", label: "Gestion de litige" },
    { id: "reglementation", label: "Conformité réglementaire" },
    { id: "contrat", label: "Rédaction de contrat" },
    { id: "mediation", label: "Médiation" },
  ],
  sante: [
    { id: "analyse_contrat", label: "Analyse de contrat" },
    { id: "comparaison", label: "Comparaison d'offres" },
    { id: "conseil_client", label: "Conseil client" },
    { id: "tarification", label: "Tarification" },
    { id: "garanties", label: "Analyse des garanties" },
  ],
  prevoyance: [
    { id: "analyse_contrat", label: "Analyse de contrat" },
    { id: "comparaison", label: "Comparaison d'offres" },
    { id: "conseil_client", label: "Conseil client" },
    { id: "tarification", label: "Tarification" },
    { id: "garanties", label: "Analyse des garanties" },
  ],
  secretaire: [
    { id: "courrier", label: "Rédaction de courrier" },
    { id: "planning", label: "Gestion de planning" },
    { id: "archivage", label: "Archivage" },
    { id: "accueil", label: "Accueil et orientation" },
    { id: "suivi", label: "Suivi administratif" },
  ],
  analyste: [
    { id: "analyse", label: "Analyse de données" },
    { id: "rapport", label: "Création de rapport" },
    { id: "kpi", label: "Suivi de KPI" },
    { id: "visualisation", label: "Visualisation de données" },
    { id: "prediction", label: "Prédiction et modélisation" },
  ],
  contrats: [
    { id: "creation", label: "Création de contrat" },
    { id: "modification", label: "Modification de contrat" },
    { id: "renouvellement", label: "Renouvellement" },
    { id: "resiliation", label: "Résiliation" },
    { id: "suivi", label: "Suivi de contrat" },
  ],
  conformite: [
    { id: "audit", label: "Audit de conformité" },
    { id: "reglementation", label: "Veille réglementaire" },
    { id: "formation", label: "Formation" },
    { id: "documentation", label: "Documentation" },
    { id: "controle", label: "Contrôle interne" },
  ],
};

export const TASKS: Task[] = [
  {
    id: "rediger",
    label: "Rédiger un document",
    description: "Créer un document, courrier, email ou texte",
  },
  {
    id: "analyser",
    label: "Analyser une situation",
    description: "Examiner et comprendre une situation complexe",
  },
  {
    id: "repondre",
    label: "Répondre à une question",
    description: "Fournir une réponse précise à une question",
  },
  {
    id: "comparer",
    label: "Comparer des options",
    description: "Évaluer et comparer différentes options",
  },
  {
    id: "expliquer",
    label: "Expliquer un concept",
    description: "Clarifier et expliquer un concept ou une notion",
  },
  {
    id: "plan",
    label: "Créer un plan d'action",
    description: "Élaborer un plan structuré pour atteindre un objectif",
  },
  {
    id: "autre",
    label: "Autre",
    description: "Autre type de demande",
  },
];

export const RCT_EXPLANATIONS = {
  role: "Votre rôle détermine le type d'expertise et le langage que l'assistant utilisera pour vous répondre. Cela permet à l'IA de s'adapter à votre domaine professionnel.",
  context: "Le contexte permet à l'assistant de comprendre la situation spécifique dans laquelle vous travaillez. Cela l'aide à adapter sa réponse en conséquence.",
  task: "La tâche définit l'action concrète que l'assistant doit accomplir pour vous aider. Cela oriente le type de réponse que vous recevrez.",
};

export function getContextsForRole(roleId: string): Context[] {
  return CONTEXTS_BY_ROLE[roleId] || [];
}

export function getRoleById(roleId: string): Role | undefined {
  return ROLES.find((r) => r.id === roleId);
}

export function getContextById(roleId: string, contextId: string): Context | undefined {
  const contexts = getContextsForRole(roleId);
  return contexts.find((c) => c.id === contextId);
}

export function getTaskById(taskId: string): Task | undefined {
  return TASKS.find((t) => t.id === taskId);
}

