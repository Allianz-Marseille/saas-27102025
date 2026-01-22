import { HealthCollectiveAct, HealthCollectiveKPI } from "@/types";
import { getHealthCollectiveCommissionRate } from "./health-kpi";

/**
 * Calcule les KPIs par type d'acte santé collective
 */
export function calculateHealthCollectiveKPIsByType(acts: HealthCollectiveAct[]): {
  total: number;
  caIndANSante: number;
  caIndANPrevoyance: number;
  caIndANRetraite: number;
  caCollANSante: number;
  caCollANPrevoyance: number;
  caCollANRetraite: number;
  caCollAdhesionRenfort: number;
  caRevision: number;
  caAdhesionRenfort: number;
  caCourtageToAllianz: number;
  caAllianzToCourtage: number;
  caBrut: number;
  caPondere: number;
  seuilAtteint: number;
} {
  return {
    total: acts.length,
    caIndANSante: acts
      .filter((a) => a.kind === "IND_AN_SANTE")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caIndANPrevoyance: acts
      .filter((a) => a.kind === "IND_AN_PREVOYANCE")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caIndANRetraite: acts
      .filter((a) => a.kind === "IND_AN_RETRAITE")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caCollANSante: acts
      .filter((a) => a.kind === "COLL_AN_SANTE")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caCollANPrevoyance: acts
      .filter((a) => a.kind === "COLL_AN_PREVOYANCE")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caCollANRetraite: acts
      .filter((a) => a.kind === "COLL_AN_RETRAITE")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caCollAdhesionRenfort: acts
      .filter((a) => a.kind === "COLL_ADHESION_RENFORT")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caRevision: acts
      .filter((a) => a.kind === "REVISION")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caAdhesionRenfort: acts
      .filter((a) => a.kind === "ADHESION_RENFORT")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caCourtageToAllianz: acts
      .filter((a) => a.kind === "COURTAGE_TO_ALLIANZ")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caAllianzToCourtage: acts
      .filter((a) => a.kind === "ALLIANZ_TO_COURTAGE")
      .reduce((sum, a) => sum + a.caAnnuel, 0),
    caBrut: acts.reduce((sum, a) => sum + a.caAnnuel, 0),
    caPondere: acts.reduce((sum, a) => sum + a.caPondere, 0),
    seuilAtteint: 0, // Sera calculé dans calculateHealthCollectiveKPI
  };
}

/**
 * Calcule les KPIs santé collective à partir des actes
 */
export function calculateHealthCollectiveKPI(acts: HealthCollectiveAct[]): HealthCollectiveKPI {
  const kpisByType = calculateHealthCollectiveKPIsByType(acts);
  
  // Calculer le seuil atteint et les commissions (utiliser la fonction spécifique santé collective)
  const commissionInfo = getHealthCollectiveCommissionRate(kpisByType.caPondere);
  
  // Calculer les commissions acquises (le taux s'applique sur TOUTE la production depuis le 1er euro)
  const commissionsAcquises = kpisByType.caPondere * commissionInfo.taux;

  return {
    total: kpisByType.total,
    caIndANSante: kpisByType.caIndANSante,
    caIndANPrevoyance: kpisByType.caIndANPrevoyance,
    caIndANRetraite: kpisByType.caIndANRetraite,
    caCollANSante: kpisByType.caCollANSante,
    caCollANPrevoyance: kpisByType.caCollANPrevoyance,
    caCollANRetraite: kpisByType.caCollANRetraite,
    caCollAdhesionRenfort: kpisByType.caCollAdhesionRenfort,
    caRevision: kpisByType.caRevision,
    caAdhesionRenfort: kpisByType.caAdhesionRenfort,
    caCourtageToAllianz: kpisByType.caCourtageToAllianz,
    caAllianzToCourtage: kpisByType.caAllianzToCourtage,
    caBrut: kpisByType.caBrut,
    caPondere: kpisByType.caPondere,
    commissionsAcquises,
    seuilAtteint: commissionInfo.seuil,
    tauxCommission: commissionInfo.taux,
    objectifRestant: commissionInfo.objectifRestant,
    prochainSeuil: commissionInfo.prochainSeuil,
  };
}

