import { HealthAct, HealthKPI } from "@/types";

// Grille de rémunération santé individuelle
export const HEALTH_COMMISSION_THRESHOLDS = [
  { min: 0, max: 10000, rate: 0, label: "Seuil 1" },
  { min: 10000, max: 14000, rate: 0.02, label: "Seuil 2" },
  { min: 14000, max: 18000, rate: 0.03, label: "Seuil 3" },
  { min: 18000, max: 22000, rate: 0.04, label: "Seuil 4" },
  { min: 22000, max: Infinity, rate: 0.06, label: "Seuil 5" },
];

// Grille de rémunération santé collective
export const HEALTH_COLLECTIVE_COMMISSION_THRESHOLDS = [
  { min: 0, max: 6000, rate: 0, label: "Seuil 1" },
  { min: 6000, max: 10000, rate: 0.02, label: "Seuil 2" },
  { min: 10000, max: 14000, rate: 0.03, label: "Seuil 3" },
  { min: 14000, max: 18000, rate: 0.04, label: "Seuil 4" },
  { min: 18000, max: Infinity, rate: 0.06, label: "Seuil 5" },
];

/**
 * Calcule le seuil atteint et le taux de commission applicable (santé individuelle)
 */
export function getHealthCommissionRate(caPondere: number): { 
  seuil: number; 
  taux: number; 
  label: string;
  prochainSeuil: number;
  objectifRestant: number;
} {
  for (let i = 0; i < HEALTH_COMMISSION_THRESHOLDS.length; i++) {
    const threshold = HEALTH_COMMISSION_THRESHOLDS[i];
    if (caPondere < threshold.max) {
      const prochainSeuilIndex = i + 1;
      const prochainSeuil = prochainSeuilIndex < HEALTH_COMMISSION_THRESHOLDS.length 
        ? HEALTH_COMMISSION_THRESHOLDS[prochainSeuilIndex].min 
        : threshold.max;
      const objectifRestant = prochainSeuilIndex < HEALTH_COMMISSION_THRESHOLDS.length 
        ? prochainSeuil - caPondere 
        : 0;
      
      return {
        seuil: i + 1,
        taux: threshold.rate,
        label: threshold.label,
        prochainSeuil,
        objectifRestant,
      };
    }
  }
  
  return {
    seuil: HEALTH_COMMISSION_THRESHOLDS.length,
    taux: HEALTH_COMMISSION_THRESHOLDS[HEALTH_COMMISSION_THRESHOLDS.length - 1].rate,
    label: HEALTH_COMMISSION_THRESHOLDS[HEALTH_COMMISSION_THRESHOLDS.length - 1].label,
    prochainSeuil: 0,
    objectifRestant: 0,
  };
}

/**
 * Calcule le seuil atteint et le taux de commission applicable (santé collective)
 */
export function getHealthCollectiveCommissionRate(caPondere: number): { 
  seuil: number; 
  taux: number; 
  label: string;
  prochainSeuil: number;
  objectifRestant: number;
} {
  for (let i = 0; i < HEALTH_COLLECTIVE_COMMISSION_THRESHOLDS.length; i++) {
    const threshold = HEALTH_COLLECTIVE_COMMISSION_THRESHOLDS[i];
    if (caPondere < threshold.max) {
      const prochainSeuilIndex = i + 1;
      const prochainSeuil = prochainSeuilIndex < HEALTH_COLLECTIVE_COMMISSION_THRESHOLDS.length 
        ? HEALTH_COLLECTIVE_COMMISSION_THRESHOLDS[prochainSeuilIndex].min 
        : threshold.max;
      const objectifRestant = prochainSeuilIndex < HEALTH_COLLECTIVE_COMMISSION_THRESHOLDS.length 
        ? prochainSeuil - caPondere 
        : 0;
      
      return {
        seuil: i + 1,
        taux: threshold.rate,
        label: threshold.label,
        prochainSeuil,
        objectifRestant,
      };
    }
  }
  
  return {
    seuil: HEALTH_COLLECTIVE_COMMISSION_THRESHOLDS.length,
    taux: HEALTH_COLLECTIVE_COMMISSION_THRESHOLDS[HEALTH_COLLECTIVE_COMMISSION_THRESHOLDS.length - 1].rate,
    label: HEALTH_COLLECTIVE_COMMISSION_THRESHOLDS[HEALTH_COLLECTIVE_COMMISSION_THRESHOLDS.length - 1].label,
    prochainSeuil: 0,
    objectifRestant: 0,
  };
}

/**
 * Calcule les KPIs santé individuelle à partir des actes
 */
export function calculateHealthKPI(acts: HealthAct[]): HealthKPI {
  // Initialiser les compteurs
  const kpi: HealthKPI = {
    caTotal: 0,
    caPondere: 0,
    nbAffaireNouvelle: 0,
    nbRevision: 0,
    nbAdhesionSalarie: 0,
    nbCourtToAz: 0,
    nbAzToCourtage: 0,
    commissionsAcquises: 0,
    seuilAtteint: 1,
    tauxCommission: 0,
    objectifRestant: 0,
    prochainSeuil: 0,
  };

  // Calculer les totaux et compteurs
  acts.forEach((act) => {
    kpi.caTotal += act.caAnnuel;
    kpi.caPondere += act.caPondere;

    // Comptage par type d'acte
    switch (act.kind) {
      case "AFFAIRE_NOUVELLE":
        kpi.nbAffaireNouvelle++;
        break;
      case "REVISION":
        kpi.nbRevision++;
        break;
      case "ADHESION_SALARIE":
        kpi.nbAdhesionSalarie++;
        break;
      case "COURT_TO_AZ":
        kpi.nbCourtToAz++;
        break;
      case "AZ_TO_COURTAGE":
        kpi.nbAzToCourtage++;
        break;
    }
  });

  // Calculer le seuil atteint et les commissions
  const commissionInfo = getHealthCommissionRate(kpi.caPondere);
  kpi.seuilAtteint = commissionInfo.seuil;
  kpi.tauxCommission = commissionInfo.taux;
  kpi.prochainSeuil = commissionInfo.prochainSeuil;
  kpi.objectifRestant = commissionInfo.objectifRestant;

  // Calculer les commissions acquises (le taux s'applique sur TOUTE la production depuis le 1er euro)
  kpi.commissionsAcquises = kpi.caPondere * kpi.tauxCommission;

  return kpi;
}

/**
 * Formatte le libellé du taux de commission
 */
export function formatCommissionRate(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

/**
 * Obtient la couleur du seuil pour les visualisations
 */
export function getThresholdColor(seuil: number): string {
  const colors = [
    "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300", // Seuil 1 (0%)
    "bg-yellow-200 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300", // Seuil 2 (2%)
    "bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300", // Seuil 3 (3%)
    "bg-blue-300 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200", // Seuil 4 (4%)
    "bg-green-300 text-green-800 dark:bg-green-900/50 dark:text-green-200", // Seuil 5 (6%)
  ];
  return colors[seuil - 1] || colors[0];
}

/**
 * Obtient la couleur de bordure du seuil
 */
export function getThresholdBorderColor(seuil: number): string {
  const colors = [
    "border-gray-300 dark:border-gray-700", // Seuil 1
    "border-yellow-400 dark:border-yellow-600", // Seuil 2
    "border-blue-400 dark:border-blue-600", // Seuil 3
    "border-blue-500 dark:border-blue-500", // Seuil 4
    "border-green-500 dark:border-green-600", // Seuil 5
  ];
  return colors[seuil - 1] || colors[0];
}

/**
 * Calcule les KPIs par type d'acte santé
 */
export function calculateHealthKPIsByType(acts: HealthAct[]): {
  total: number;
  caAN: number;
  caRevision: number;
  caAdhesion: number;
  caCourtToAz: number;
  caAzToCourtage: number;
  caBrut: number;
  caPondere: number;
} {
  return {
    total: acts.length,
    caAN: acts
      .filter((a) => a.kind === "AFFAIRE_NOUVELLE")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caRevision: acts
      .filter((a) => a.kind === "REVISION")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caAdhesion: acts
      .filter((a) => a.kind === "ADHESION_SALARIE")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caCourtToAz: acts
      .filter((a) => a.kind === "COURT_TO_AZ")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caAzToCourtage: acts
      .filter((a) => a.kind === "AZ_TO_COURTAGE")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caBrut: acts.reduce((sum, a) => sum + a.caAnnuel, 0),
    caPondere: acts.reduce((sum, a) => sum + a.caPondere, 0),
  };
}

