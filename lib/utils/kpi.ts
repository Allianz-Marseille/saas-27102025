import { Act, KPI } from "@/types";
import { COMMISSION_RULES } from "@/lib/firebase/commission-rules";

export const calculateKPI = (acts: Act[]): KPI => {
  const caMensuel = acts.reduce((sum, act) => sum + (act.primeAnnuelle || 0) + (act.montantVersement || 0), 0);
  
  // Filtrer uniquement les AN (Apport Nouveau) pour les contrats
  const actsAN = acts.filter(act => act.kind === "AN");
  
  // Contrats Auto : uniquement les AN avec contratType === "AUTO_MOTO"
  const actsAuto = actsAN.filter(act => act.contratType === "AUTO_MOTO");
  const caAuto = actsAuto.reduce((sum, act) => sum + (act.primeAnnuelle || 0), 0);
  const nbContratsAuto = actsAuto.length;

  // Contrats Autres : uniquement les AN avec contratType !== "AUTO_MOTO"
  const actsAutres = actsAN.filter(act => act.contratType !== "AUTO_MOTO");
  const caAutres = actsAutres.reduce((sum, act) => sum + (act.primeAnnuelle || 0) + (act.montantVersement || 0), 0);
  const nbContratsAutres = actsAutres.length;

  // Nombre total de contrats = uniquement les AN
  const nbContrats = actsAN.length;
  const ratio = nbContratsAuto === 0 ? 100 : (nbContratsAutres / nbContratsAuto) * 100;
  
  // Calcul du nombre de process (M+3, PRETERME_AUTO, PRETERME_IRD uniquement)
  const nbProcess = acts.filter(act => 
    act.kind === "M+3" || 
    act.kind === "PRETERME_AUTO" || 
    act.kind === "PRETERME_IRD"
  ).length;
  
  const commissionsPotentielles = acts.reduce((sum, act) => sum + act.commissionPotentielle, 0);
  
  // Validation des commissions si :
  // 1. potentielles ≥ 200 €
  // 2. process ≥ 15
  // 3. ratio ≥ 100 %
  const commissionValidee = 
    commissionsPotentielles >= 200 && 
    nbProcess >= 15 && 
    ratio >= 100;
  
  const commissionsReelles = commissionValidee ? commissionsPotentielles : 0;

  return {
    caMensuel,
    caAuto,
    caAutres,
    nbContrats,
    nbContratsAuto,
    nbContratsAutres,
    ratio,
    nbProcess,
    commissionsPotentielles,
    commissionsReelles,
    commissionValidee,
  };
};

export const calculateCommissionForAct = (
  contratType: string,
  primeAnnuelle: number,
  montantVersement: number
): number => {
  const rule = COMMISSION_RULES[contratType];
  
  if (!rule) return 0;

  if (rule.montant) {
    return rule.montant;
  }

  if (rule.pourcentage) {
    if (contratType === "VIE_PU") {
      return montantVersement * (rule.pourcentage / 100);
    }
    return primeAnnuelle * (rule.pourcentage / 100);
  }

  if (rule.trancheMin && contratType === "IRD_PRO") {
    // 20 € + 10 €/tranche de 1000 € > 999 €
    const montantExcedent = primeAnnuelle - 999;
    if (montantExcedent <= 0) return 20;
    const tranches = Math.floor(montantExcedent / 1000);
    return 20 + tranches * 10;
  }

  return 0;
};

