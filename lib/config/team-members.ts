// Configuration centralisée des membres de l'équipe
// Facilite l'ajout/suppression de personnes sans modifier chaque page

export interface TeamMember {
  name: string;
  active: boolean; // true = actif, false = inactif (parti, absent longue durée...)
  portfolioH91358?: {
    range: string; // ex: "A → C"
  };
  portfolioH92083?: {
    range: string;
  };
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Corentin",
    active: true,
    portfolioH91358: { range: "A → C" },
  },
  {
    name: "Donia",
    active: true,
    portfolioH91358: { range: "N → Z" },
  },
  {
    name: "Emma",
    active: true,
    portfolioH91358: { range: "D → F" },
  },
  {
    name: "Audrey",
    active: false, // Désactivée - ATTENTION : range "G → M" doit être redistribué
    portfolioH91358: { range: "G → M" },
  },
  {
    name: "Gwendal",
    active: false, // Désactivé
  },
  {
    name: "Joëlle",
    active: true,
    portfolioH92083: { range: "A → H" },
  },
  {
    name: "Astrid",
    active: true,
    portfolioH92083: { range: "I → Z" },
  },
];

// Fonctions helper pour faciliter l'usage
export const getActiveMembers = () => TEAM_MEMBERS.filter(m => m.active);

export const getActiveMembersNames = () => getActiveMembers().map(m => m.name);

export const getPortfolioH91358 = () => 
  TEAM_MEMBERS
    .filter(m => m.active && m.portfolioH91358)
    .map(m => ({ name: m.name, range: m.portfolioH91358!.range }));

export const getPortfolioH92083 = () => 
  TEAM_MEMBERS
    .filter(m => m.active && m.portfolioH92083)
    .map(m => ({ name: m.name, range: m.portfolioH92083!.range }));

// Note : Pour ajouter une nouvelle personne :
// 1. Ajouter dans TEAM_MEMBERS avec active: true
// 2. Ajouter portfolioH91358 et/ou portfolioH92083 si applicable
// 3. Les pages se mettront à jour automatiquement
