import { MAIN_TAGS, type Tag } from "./tags-definitions";

export interface InteractiveFlowState {
  role?: string;
  context?: string;
  task?: string;
}

/**
 * Rôles possibles selon le tag principal sélectionné
 */
export const ROLES_BY_TAG: Record<string, Array<{ id: string; label: string }>> = {
  sinistres: [
    { id: "gestionnaire-sinistre", label: "Gestionnaire de sinistre" },
    { id: "expert", label: "Expert sinistres" },
    { id: "assistant", label: "Assistant sinistres" },
  ],
  commercial: [
    { id: "commercial", label: "Commercial / Vendeur" },
    { id: "conseiller", label: "Conseiller client" },
    { id: "business-developer", label: "Business Developer" },
  ],
  sante: [
    { id: "specialiste-sante", label: "Spécialiste santé" },
    { id: "conseiller-sante", label: "Conseiller santé" },
    { id: "gestionnaire-sante", label: "Gestionnaire santé" },
  ],
  prevoyance: [
    { id: "specialiste-prevoyance", label: "Spécialiste prévoyance" },
    { id: "conseiller-prevoyance", label: "Conseiller prévoyance" },
    { id: "gestionnaire-prevoyance", label: "Gestionnaire prévoyance" },
  ],
  auto: [
    { id: "conseiller-auto", label: "Conseiller auto" },
    { id: "gestionnaire-auto", label: "Gestionnaire auto" },
    { id: "expert-auto", label: "Expert auto" },
  ],
  habitation: [
    { id: "conseiller-habitation", label: "Conseiller habitation" },
    { id: "gestionnaire-habitation", label: "Gestionnaire habitation" },
    { id: "expert-habitation", label: "Expert habitation" },
  ],
  professionnels: [
    { id: "conseiller-pro", label: "Conseiller professionnels" },
    { id: "gestionnaire-pro", label: "Gestionnaire professionnels" },
    { id: "expert-pro", label: "Expert professionnels" },
  ],
  entreprises: [
    { id: "conseiller-entreprises", label: "Conseiller entreprises" },
    { id: "gestionnaire-entreprises", label: "Gestionnaire entreprises" },
    { id: "expert-entreprises", label: "Expert entreprises" },
  ],
  "sante-collective": [
    { id: "specialiste-collective", label: "Spécialiste santé collective" },
    { id: "conseiller-collective", label: "Conseiller santé collective" },
    { id: "gestionnaire-collective", label: "Gestionnaire santé collective" },
  ],
};

/**
 * Contextes possibles selon le rôle sélectionné
 */
export const CONTEXTS_BY_ROLE: Record<string, Array<{ id: string; label: string }>> = {
  // Sinistres
  "gestionnaire-sinistre": [
    { id: "declaration", label: "Déclaration de sinistre" },
    { id: "suivi", label: "Suivi de dossier" },
    { id: "indemnisation", label: "Indemnisation" },
    { id: "litige", label: "Gestion de litige" },
  ],
  expert: [
    { id: "expertise", label: "Expertise" },
    { id: "evaluation", label: "Évaluation des dommages" },
    { id: "recours", label: "Recours" },
  ],
  "assistant-sinistres": [
    { id: "assistance", label: "Assistance client" },
    { id: "documentation", label: "Documentation" },
    { id: "suivi", label: "Suivi administratif" },
  ],

  // Commercial
  commercial: [
    { id: "prospection", label: "Prospection" },
    { id: "devis", label: "Établissement de devis" },
    { id: "closing", label: "Closing / Finalisation" },
    { id: "relance", label: "Relance client" },
  ],
  conseiller: [
    { id: "conseil", label: "Conseil client" },
    { id: "analyse-besoins", label: "Analyse de besoins" },
    { id: "argumentaire", label: "Argumentaire" },
  ],
  "business-developer": [
    { id: "developpement", label: "Développement commercial" },
    { id: "partenariats", label: "Partenariats" },
    { id: "strategie", label: "Stratégie commerciale" },
  ],

  // Santé
  "specialiste-sante": [
    { id: "analyse-contrat", label: "Analyse de contrat" },
    { id: "remboursements", label: "Remboursements" },
    { id: "resiliation", label: "Résiliation" },
  ],
  "conseiller-sante": [
    { id: "conseil", label: "Conseil client" },
    { id: "comparaison", label: "Comparaison d'offres" },
    { id: "garanties", label: "Garanties et couvertures" },
  ],
  "gestionnaire-sante": [
    { id: "gestion", label: "Gestion de contrats" },
    { id: "suivi", label: "Suivi client" },
    { id: "renouvellement", label: "Renouvellement" },
  ],

  // Prévoyance
  "specialiste-prevoyance": [
    { id: "analyse-besoins", label: "Analyse de besoins" },
    { id: "garanties", label: "Garanties prévoyance" },
    { id: "ecarts", label: "Écarts de couverture" },
  ],
  "conseiller-prevoyance": [
    { id: "conseil", label: "Conseil client" },
    { id: "comparaison", label: "Comparaison d'offres" },
    { id: "adaptation", label: "Adaptation de garanties" },
  ],

  // Auto
  "conseiller-auto": [
    { id: "conseil", label: "Conseil client" },
    { id: "devis", label: "Devis auto" },
    { id: "bonus-malus", label: "Bonus-Malus / CRM" },
  ],
  "gestionnaire-auto": [
    { id: "gestion", label: "Gestion de contrats" },
    { id: "modifications", label: "Modifications" },
    { id: "resiliation", label: "Résiliation" },
  ],

  // Habitation
  "conseiller-habitation": [
    { id: "conseil", label: "Conseil client" },
    { id: "devis", label: "Devis habitation" },
    { id: "garanties", label: "Garanties" },
  ],

  // Professionnels
  "conseiller-pro": [
    { id: "conseil", label: "Conseil professionnel" },
    { id: "rc-pro", label: "RC Professionnelle" },
    { id: "multirisque", label: "Multirisque Pro" },
  ],

  // Entreprises
  "conseiller-entreprises": [
    { id: "conseil", label: "Conseil entreprises" },
    { id: "flottes", label: "Flottes auto" },
    { id: "collectives", label: "Assurances collectives" },
  ],

  // Santé collective
  "specialiste-collective": [
    { id: "ani", label: "Obligations ANI" },
    { id: "conventions", label: "Conventions collectives" },
    { id: "portabilite", label: "Portabilité" },
  ],
};

/**
 * Tâches possibles (génériques)
 */
export const TASKS = [
  { id: "rediger", label: "Rédiger un document" },
  { id: "analyser", label: "Analyser une situation" },
  { id: "repondre", label: "Répondre à une question" },
  { id: "comparer", label: "Comparer des options" },
  { id: "expliquer", label: "Expliquer un concept" },
  { id: "plan", label: "Créer un plan d'action" },
];

/**
 * Génère le message du bot pour demander le rôle
 */
export function generateRoleQuestionMessage(tagId: string): string {
  const tag = MAIN_TAGS.find((t) => t.id === tagId);
  if (!tag) return "";

  return `Bonjour ! 👋

Je suis votre assistant IA spécialisé en **${tag.label}**.

Pour mieux vous aider, pouvez-vous me préciser votre rôle dans ce domaine ?`;
}

/**
 * Génère le message du bot pour demander le contexte
 */
export function generateContextQuestionMessage(roleId: string): string {
  const roleLabel = Object.values(ROLES_BY_TAG)
    .flat()
    .find((r) => r.id === roleId)?.label || "ce rôle";
  
  return `Parfait ! Vous êtes ${roleLabel}.

Maintenant, dans quel contexte travaillez-vous actuellement ?`;
}

/**
 * Génère le message du bot pour demander la tâche
 */
export function generateTaskQuestionMessage(): string {
  return `Excellent !

Enfin, que souhaitez-vous que je fasse pour vous aider ?`;
}

/**
 * Génère le message de confirmation quand tout est complété
 */
export function generateCompletionMessage(
  tagId: string,
  roleId: string,
  contextId: string,
  taskId: string
): string {
  const tag = MAIN_TAGS.find((t) => t.id === tagId);
  const role = ROLES_BY_TAG[tagId]?.find((r) => r.id === roleId);
  const context = CONTEXTS_BY_ROLE[roleId]?.find((c) => c.id === contextId);
  const task = TASKS.find((t) => t.id === taskId);

  return `Parfait ! Je suis maintenant configuré pour vous aider :

- **Domaine** : ${tag?.label || tagId}
- **Rôle** : ${role?.label || roleId}
- **Contexte** : ${context?.label || contextId}
- **Tâche** : ${task?.label || taskId}

Je suis prêt à répondre à vos questions. Comment puis-je vous aider ?`;
}

/**
 * Vérifie si le flux interactif est complété
 */
export function isFlowComplete(state: InteractiveFlowState): boolean {
  return !!(state.role && state.context && state.task);
}

/**
 * Récupère les options pour une étape du flux
 */
export function getFlowOptions(
  step: "role" | "context" | "task",
  tagId?: string,
  roleId?: string
): Array<{ id: string; label: string }> {
  if (step === "role" && tagId) {
    return ROLES_BY_TAG[tagId] || [];
  }
  if (step === "context" && roleId) {
    return CONTEXTS_BY_ROLE[roleId] || [];
  }
  if (step === "task") {
    return TASKS;
  }
  return [];
}

