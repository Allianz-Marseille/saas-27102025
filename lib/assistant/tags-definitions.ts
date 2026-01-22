export interface Tag {
  id: string;
  label: string;
  description: string;
  category: "metier" | "intention" | "process" | "reglementaire" | "gestion";
  knowledgeFiles?: string[]; // Fichiers de connaissance à charger
  isMain?: boolean; // Tag principal obligatoire
  color?: string; // Couleur pour l'affichage
}

/**
 * Tags principaux (obligatoires - choix unique)
 * Domaines cœur métier
 */
export const MAIN_TAGS: Tag[] = [
  {
    id: "sinistres",
    label: "Sinistres",
    description: "Déclaration, suivi, indemnisation, conventions (IRSA, IRSI, IRCA), recours",
    category: "metier",
    isMain: true,
    knowledgeFiles: ["process/sinistres.md", "produits/assurance-iard.md"],
    color: "red",
  },
  {
    id: "commercial",
    label: "Commercial / Vente",
    description: "Découverte client, argumentaires, objections, closing, multi-équipement",
    category: "metier",
    isMain: true,
    knowledgeFiles: ["process/leads.md"],
    color: "blue",
  },
  {
    id: "sante",
    label: "Santé",
    description: "Complémentaire santé, surcomplémentaire, remboursements, délais, résiliations",
    category: "metier",
    isMain: true,
    knowledgeFiles: ["produits/assurance-sante.md"],
    color: "green",
  },
  {
    id: "prevoyance",
    label: "Prévoyance",
    description: "Décès, ITT/IPT, GAV, dépendance, analyse de besoins, écarts de couverture",
    category: "metier",
    isMain: true,
    knowledgeFiles: ["produits/prevoyance.md"],
    color: "purple",
  },
  {
    id: "auto",
    label: "Auto / Mobilité",
    description: "Auto, 2 roues, flottes, permis, bonus-malus, réglementation VTM",
    category: "metier",
    isMain: true,
    knowledgeFiles: ["produits/assurance-vtm-allianz.md", "produits/assurance-iard.md"],
    color: "orange",
  },
  {
    id: "habitation",
    label: "Habitation / IARD particuliers",
    description: "MRH, PNO, risques locatifs, garanties, exclusions",
    category: "metier",
    isMain: true,
    knowledgeFiles: ["produits/assurance-iard.md"],
    color: "teal",
  },
  {
    id: "professionnels",
    label: "Professionnels / TNS",
    description: "RC Pro, prévoyance TNS, régimes sociaux, obligations légales",
    category: "metier",
    isMain: true,
    knowledgeFiles: ["produits/assurance-iard.md"],
    color: "indigo",
  },
  {
    id: "entreprises",
    label: "Entreprises / Flottes",
    description: "Flottes auto, RC exploitation, RC employeur, D&O, assurances collectives",
    category: "metier",
    isMain: true,
    knowledgeFiles: ["produits/assurance-iard.md"],
    color: "pink",
  },
  {
    id: "sante-collective",
    label: "Santé Collective",
    description: "Obligations ANI, conventions collectives, dispenses, portabilité",
    category: "metier",
    isMain: true,
    knowledgeFiles: ["produits/assurance-sante.md"],
    color: "cyan",
  },
];

/**
 * Tags optionnels (multi-sélection)
 */

// Tags réglementaires
export const REGLEMENTAIRE_TAGS: Tag[] = [
  {
    id: "reglementation",
    label: "Réglementation / Conformité",
    description: "ACPR, DDA, devoir de conseil, DIN, étude de besoins, LCB-FT",
    category: "reglementaire",
    knowledgeFiles: ["core/reglementation.md"],
    color: "amber",
  },
  {
    id: "juridique",
    label: "Juridique / Responsabilités",
    description: "Responsabilité civile, responsabilités pénales, exclusions, jurisprudence",
    category: "reglementaire",
    knowledgeFiles: ["core/reglementation.md"],
    color: "amber",
  },
];

// Tags gestion quotidienne
export const GESTION_TAGS: Tag[] = [
  {
    id: "gestion-contrat",
    label: "Gestion de contrat",
    description: "Avenants, modifications, résiliations, suspensions, échéances",
    category: "gestion",
    color: "slate",
  },
  {
    id: "cotisations",
    label: "Cotisations / Impayés",
    description: "Primes, relances, suspensions, régularisations",
    category: "gestion",
    color: "slate",
  },
  {
    id: "bonus-malus",
    label: "Bonus-Malus / CRM",
    description: "Calcul, transfert, cas particuliers, étrangers, interruptions",
    category: "gestion",
    knowledgeFiles: ["produits/assurance-vtm-allianz.md"],
    color: "slate",
  },
];

// Tags process internes
export const PROCESS_TAGS: Tag[] = [
  {
    id: "process-agence",
    label: "Process internes agence",
    description: "Leads, M+3, préterme, clé de répartition, organisation interne",
    category: "process",
    knowledgeFiles: ["process/leads.md"],
    color: "violet",
  },
  {
    id: "outils-digital",
    label: "Outils & Digital",
    description: "CRM Lagon, Trello, Slack, outils internes, automatisations",
    category: "process",
    color: "violet",
  },
  {
    id: "reporting",
    label: "Reporting / Performance",
    description: "CA, commissions, objectifs, ratios, qualité du portefeuille",
    category: "process",
    color: "violet",
  },
];

// Tags intention
export const INTENTION_TAGS: Tag[] = [
  {
    id: "aide-reponse",
    label: "Aide à la réponse client",
    description: "Besoin d'aide pour formuler une réponse au client",
    category: "intention",
    color: "emerald",
  },
  {
    id: "aide-decision",
    label: "Aide à la décision",
    description: "Besoin d'aide pour prendre une décision",
    category: "intention",
    color: "emerald",
  },
  {
    id: "argumentaire",
    label: "Argumentaire / Script",
    description: "Besoin d'un argumentaire ou d'un script de vente",
    category: "intention",
    color: "emerald",
  },
  {
    id: "verification",
    label: "Vérification réglementaire",
    description: "Vérifier la conformité réglementaire d'une situation",
    category: "intention",
    knowledgeFiles: ["core/reglementation.md"],
    color: "emerald",
  },
  {
    id: "formation",
    label: "Formation / Compréhension",
    description: "Comprendre un concept ou se former sur un sujet",
    category: "intention",
    color: "emerald",
  },
];

// Tags contextuels supplémentaires
export const CONTEXT_TAGS: Tag[] = [
  {
    id: "urgent",
    label: "Urgent",
    description: "Situation nécessitant une réponse rapide",
    category: "intention",
    color: "rose",
  },
  {
    id: "client-mecontent",
    label: "Client mécontent",
    description: "Gestion d'un client mécontent ou réclamation",
    category: "intention",
    color: "rose",
  },
  {
    id: "risque-juridique",
    label: "Risque juridique",
    description: "Situation présentant un risque juridique",
    category: "reglementaire",
    knowledgeFiles: ["core/reglementation.md"],
    color: "rose",
  },
];

/**
 * Tous les tags optionnels regroupés
 */
export const OPTIONAL_TAGS: Tag[] = [
  ...REGLEMENTAIRE_TAGS,
  ...GESTION_TAGS,
  ...PROCESS_TAGS,
  ...INTENTION_TAGS,
  ...CONTEXT_TAGS,
];

/**
 * Tous les tags (principaux + optionnels)
 */
export const ALL_TAGS: Tag[] = [...MAIN_TAGS, ...OPTIONAL_TAGS];

/**
 * Récupère un tag par son ID
 */
export function getTagById(tagId: string): Tag | undefined {
  return ALL_TAGS.find((tag) => tag.id === tagId);
}

/**
 * Récupère les tags principaux
 */
export function getMainTags(): Tag[] {
  return MAIN_TAGS;
}

/**
 * Récupère les tags optionnels par catégorie
 */
export function getOptionalTagsByCategory(
  category: Tag["category"]
): Tag[] {
  return OPTIONAL_TAGS.filter((tag) => tag.category === category);
}

/**
 * Génère un prompt système basé sur le tag principal sélectionné
 */
export function generateSystemPromptFromTags(mainTag: string): string {
  const main = getTagById(mainTag);
  if (!main) {
    return "";
  }

  let prompt = `**Domaine métier** : ${main.label}\n`;
  if (main.description) {
    prompt += `${main.description}\n\n`;
  }

  // Instructions selon le tag principal
  const instructions: Record<string, string> = {
    sinistres:
      "Posture rassurante et professionnelle. Utilise les conventions IRSA, IRSI, IRCA. Sois précis sur les délais et procédures.",
    commercial:
      "Ton commercial et orienté solution. Propose des argumentaires clairs et adaptés aux besoins du client.",
    sante: "Pédagogie importante. Explique clairement les garanties, remboursements et délais. Sois précis sur les règles de résiliation.",
    prevoyance:
      "Analyse de besoins approfondie. Explique les écarts de couverture et les garanties disponibles.",
    auto: "Précision sur la réglementation VTM, bonus-malus, permis. Sois clair sur les obligations et les délais.",
    habitation:
      "Détaille les garanties et exclusions. Sois précis sur les risques couverts et non couverts.",
    professionnels:
      "Orienté obligations légales et réglementaires. Précise les garanties professionnelles et les exclusions.",
    entreprises:
      "Approche collective et entreprise. Détaille les garanties collectives et les obligations.",
    "sante-collective":
      "Orienté obligations ANI et conventions collectives. Précise les règles de portabilité et dispenses.",
  };

  if (instructions[mainTag]) {
    prompt += `**Instructions spécifiques** : ${instructions[mainTag]}\n\n`;
  }

  prompt +=
    "Adapte ton langage, ton expertise et tes réponses en fonction du domaine métier et du contexte définis ci-dessus.";

  return prompt;
}

