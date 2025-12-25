/**
 * Fonction utilitaire pour convertir les données OCR Lagon en contexte de segmentation
 */

import { LagonOCRData } from "./ocr-parser";

export interface SegmentationContext {
  caseType: "general" | "client" | null;
  clientType: "particulier" | "tns" | "entreprise" | null;
  csp: string | null;
  ageBand: string | null;
  companyBand: { effectifBand: string | null; caBand: string | null } | null;
  dirigeantStatut: "tns" | "assimile_salarie" | null;
}

/**
 * Convertit les données OCR Lagon en contexte de segmentation
 * @param ocrData Les données extraites de l'OCR
 * @param age Optionnel : âge du client (pour déterminer ageBand)
 * @param ca Optionnel : chiffre d'affaires (pour déterminer caBand)
 * @param effectif Optionnel : nombre de salariés (pour déterminer effectifBand)
 * @returns Le contexte de segmentation ou null si insuffisant
 */
export function convertOCRToContext(
  ocrData: LagonOCRData,
  age?: number | null,
  ca?: number | null,
  effectif?: number | null
): SegmentationContext | null {
  if (!ocrData.typeClient) {
    return null;
  }

  const context: SegmentationContext = {
    caseType: "client",
    clientType: ocrData.typeClient,
    csp: null,
    ageBand: null,
    companyBand: null,
    dirigeantStatut: null,
  };

  // Déterminer la CSP pour particuliers/TNS
  if (ocrData.typeClient === "particulier" || ocrData.typeClient === "tns") {
    // Analyser situationPro pour déterminer la CSP
    const situationPro = ocrData.situationPro?.toLowerCase() || "";
    
    if (situationPro.includes("étudiant") || situationPro.includes("etudiant")) {
      context.csp = "etudiant";
    } else if (situationPro.includes("fonctionnaire")) {
      context.csp = "fonctionnaire";
    } else if (situationPro.includes("auto-entrepreneur") || situationPro.includes("micro-entreprise")) {
      context.csp = "auto-entrepreneur";
    } else if (situationPro.includes("artisan")) {
      context.csp = "tns-artisan";
    } else if (situationPro.includes("commerçant") || situationPro.includes("commercant")) {
      context.csp = "tns-commercant";
    } else if (situationPro.includes("profession libérale") || situationPro.includes("profession liberale") || situationPro.includes("prof lib")) {
      context.csp = "tns-prof-liberale";
    } else if (situationPro.includes("cadre")) {
      context.csp = "salarie-cadre";
    } else if (situationPro.includes("salarié") || situationPro.includes("salarie")) {
      context.csp = "salarie-non-cadre";
    }
    // Si TNS mais CSP non déterminée, utiliser le type client comme CSP
    if (ocrData.typeClient === "tns" && !context.csp) {
      // Par défaut, on ne peut pas déterminer sans plus d'infos
      // L'IA devra demander
    }

    // Déterminer ageBand si âge fourni
    if (age !== null && age !== undefined) {
      if (age < 18) {
        context.ageBand = "0-17";
      } else if (age <= 25) {
        context.ageBand = "18-25";
      } else if (age <= 35) {
        context.ageBand = "26-35";
      } else if (age <= 50) {
        context.ageBand = "36-50";
      } else if (age <= 60) {
        context.ageBand = "51-60";
      } else if (age <= 75) {
        context.ageBand = "61-75";
      } else {
        context.ageBand = "76+";
      }
    }
  }

  // Déterminer les bandes pour entreprises
  if (ocrData.typeClient === "entreprise") {
    context.companyBand = {
      effectifBand: null,
      caBand: null,
    };

    // Déterminer effectifBand
    if (effectif !== null && effectif !== undefined) {
      if (effectif === 0) {
        context.companyBand.effectifBand = "0";
      } else if (effectif < 10) {
        context.companyBand.effectifBand = "1-9";
      } else if (effectif < 50) {
        context.companyBand.effectifBand = "10-49";
      } else if (effectif < 250) {
        context.companyBand.effectifBand = "50-249";
      } else {
        context.companyBand.effectifBand = "250+";
      }
    }

    // Déterminer caBand
    if (ca !== null && ca !== undefined) {
      if (ca < 250000) {
        context.companyBand.caBand = "<250k";
      } else if (ca < 1000000) {
        context.companyBand.caBand = "250k-1M";
      } else if (ca < 5000000) {
        context.companyBand.caBand = "1M-5M";
      } else if (ca < 20000000) {
        context.companyBand.caBand = "5M-20M";
      } else {
        context.companyBand.caBand = "20M+";
      }
    }

    // Déterminer dirigeantStatut depuis situationPro
    const situationPro = ocrData.situationPro?.toLowerCase() || "";
    if (situationPro.includes("tns") || situationPro.includes("travailleur non salarié")) {
      context.dirigeantStatut = "tns";
    } else if (situationPro.includes("assimilé") || situationPro.includes("assimile") || situationPro.includes("salarié")) {
      context.dirigeantStatut = "assimile_salarie";
    }
  }

  return context;
}

/**
 * Extrait l'âge depuis une chaîne de texte (pour OCR ou conversation)
 * @param text Texte contenant potentiellement un âge
 * @returns L'âge extrait ou null
 */
export function extractAgeFromText(text: string): number | null {
  // Rechercher des patterns comme "45 ans", "45ans", "âge: 45", etc.
  const patterns = [
    /(\d+)\s*ans?/i,
    /âge[:\s]*(\d+)/i,
    /(\d+)\s*années?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const age = parseInt(match[1], 10);
      if (age >= 0 && age <= 120) {
        return age;
      }
    }
  }

  return null;
}

/**
 * Extrait le CA depuis une chaîne de texte
 * @param text Texte contenant potentiellement un CA
 * @returns Le CA en euros ou null
 */
export function extractCAFromText(text: string): number | null {
  // Rechercher des patterns comme "250k", "1M", "500 000€", etc.
  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*k\s*€?/i,
    /(\d+(?:[.,]\d+)?)\s*M\s*€?/i,
    /(\d+(?:\s*\d+)*)\s*€/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let value = parseFloat(match[1].replace(/\s/g, "").replace(",", "."));
      if (pattern.source.includes("M")) {
        value *= 1000000;
      } else if (pattern.source.includes("k")) {
        value *= 1000;
      }
      if (value > 0 && value < 1000000000) {
        return Math.round(value);
      }
    }
  }

  return null;
}

/**
 * Extrait l'effectif depuis une chaîne de texte
 * @param text Texte contenant potentiellement un effectif
 * @returns L'effectif ou null
 */
export function extractEffectifFromText(text: string): number | null {
  // Rechercher des patterns comme "10 salariés", "effectif: 25", etc.
  const patterns = [
    /(\d+)\s*salariés?/i,
    /effectif[:\s]*(\d+)/i,
    /(\d+)\s*employés?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const effectif = parseInt(match[1], 10);
      if (effectif >= 0 && effectif < 10000) {
        return effectif;
      }
    }
  }

  return null;
}

