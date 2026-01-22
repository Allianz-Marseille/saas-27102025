/**
 * Service IA pour l'Assistant Antécédents Auto
 * 
 * IMPORTANT : L'IA est utilisée UNIQUEMENT pour :
 * - Reformulation du journal en français naturel
 * - Explications pédagogiques des règles
 * - Génération d'emails personnalisés
 * 
 * L'IA ne calcule JAMAIS le CRM ou ne décide JAMAIS des sinistres à retenir.
 */

import type { JournalDecision, ResultatCRM } from "@/lib/tools/antecedents/antecedentsTypes";

/**
 * Reformule le journal structuré en français naturel et client-friendly
 */
export async function reformulerJournal(
  journal: JournalDecision
): Promise<string> {
  // Pour l'instant, on retourne une version simplifiée
  // TODO: Intégrer avec l'API IA (OpenAI, etc.)
  
  const contexte = journal.contexte;
  const crm = journal.crm;
  const sinistres = journal.sinistres;

  let texte = `Bonjour,\n\n`;
  texte += `Suite à l'analyse de votre dossier, voici les éléments retenus :\n\n`;

  // Section CRM
  texte += `**Coefficient retenu : ${crm.valeur}**\n`;
  texte += `${crm.justification}\n`;
  if (crm.calcul) {
    texte += `Calcul : ${crm.calcul}\n`;
  }
  texte += `\n`;

  // Section Sinistres
  texte += `**Sinistres à déclarer :**\n`;
  texte += `Période : ${sinistres.regle.periode_mois} mois\n`;
  if (sinistres.liste.length > 0) {
    texte += `Nombre de sinistres : ${sinistres.liste.length}\n`;
  }
  texte += `\n`;

  // Alertes
  if (journal.alertes.length > 0) {
    texte += `**Points de vigilance :**\n`;
    journal.alertes.forEach((alerte) => {
      texte += `• ${alerte.message}\n`;
    });
    texte += `\n`;
  }

  texte += `N'hésitez pas si vous avez des questions.\n\nCordialement,`;

  return texte;
}

/**
 * Explique une règle de manière pédagogique
 */
export async function expliquerRegle(
  regleId: string,
  question?: string
): Promise<string> {
  // TODO: Intégrer avec l'API IA pour des explications contextuelles
  
  const explications: Record<string, string> = {
    PM_01: "Pour une personne morale assurant son premier véhicule sans conducteur désigné, le coefficient de base est de 0,70. C'est le coefficient de départ pour toute nouvelle société.",
    PM_02: "Lors de l'ajout d'un véhicule supplémentaire, on calcule la moyenne des coefficients de tous les véhicules 4 roues <3,5t de la société (y compris ceux résiliés depuis moins de 12 mois). Cette moyenne est calculée sans arrondi.",
    PM_03: "Si un conducteur habituel est désigné, on reprend le coefficient du relevé d'informations de ce conducteur. C'est le coefficient personnel du conducteur qui s'applique.",
    VTC_01: "Pour un véhicule VTC en personne physique, on peut reprendre le coefficient du RI sous conditions strictes : CRM ≤1,00, durée RI ≥21 mois consécutifs sur 24, et présence d'une carte VTC valide. Un malus (CRM >1,00) bloque la souscription.",
    VTC_02: "Pour une société VTC en création, le coefficient de base est de 0,85. Une carte VTC est obligatoire.",
    SIN_01: "Pour un véhicule standard 4 roues <3,5t, on retient tous les sinistres sur 36 mois (responsables, partiellement responsables, non responsables, bris de glace). Les catastrophes naturelles, technologiques et attentats sont exclus.",
    SIN_02: "Pour le 2e véhicule d'une personne morale, on cumule les sinistres du 1er véhicule (ceux figurant au RI) avec ceux du nouveau véhicule sur 36 mois.",
    SIN_03: "Pour un parc de 3 à 30 véhicules, on retient uniquement le sinistre le plus récent sur 12 mois, avec de nombreuses exclusions (catastrophes, vol, incendie, bris de glace).",
  };

  const explication = explications[regleId] || `La règle ${regleId} s'applique selon les conditions définies dans les vademecums.`;

  if (question) {
    return `${explication}\n\nEn réponse à votre question : ${question}`;
  }

  return explication;
}

/**
 * Génère un email personnalisé à partir du journal
 */
export async function genererEmail(
  journal: JournalDecision,
  ton: "formel" | "amical" = "formel"
): Promise<string> {
  const reformule = await reformulerJournal(journal);
  
  if (ton === "amical") {
    return reformule.replace("Bonjour,", "Bonjour,").replace("Cordialement,", "À bientôt,");
  }

  return reformule;
}
