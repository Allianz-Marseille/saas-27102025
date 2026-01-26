/**
 * Fonctions d'extraction et de validation des données depuis les fiches Lagon
 */

import { ClientData, ClientDataPhysique, ClientDataMorale, ClientType, ContractData } from "@/types/m3-session";

/**
 * Détecte le type de client depuis le texte de la fiche Lagon
 */
export function detectClientType(text: string): ClientType | null {
  const lowerText = text.toLowerCase();

  // Indicateurs personne morale
  const entrepriseIndicators = [
    "siret",
    "siren",
    "raison sociale",
    "sarl",
    "sas",
    "eurl",
    "sci",
    "sas",
    "société",
    "entreprise",
    "naf",
    "ape",
  ];

  // Indicateurs TNS
  const tnsIndicators = [
    "tns",
    "travailleur non salarié",
    "profession libérale",
    "artisan",
    "commerçant",
    "micro-entreprise",
    "auto-entrepreneur",
  ];

  // Vérifier d'abord si c'est une entreprise
  const hasEntrepriseIndicators = entrepriseIndicators.some((indicator) =>
    lowerText.includes(indicator)
  );

  if (hasEntrepriseIndicators) {
    // Distinguer TNS et Entreprise selon la présence de SIRET/SIREN
    if (lowerText.includes("siret") || lowerText.includes("siren")) {
      return "entreprise";
    }
    // Si pas de SIRET mais indicateurs TNS, c'est un TNS
    if (tnsIndicators.some((indicator) => lowerText.includes(indicator))) {
      return "tns";
    }
    return "entreprise";
  }

  // Vérifier si c'est un TNS
  if (tnsIndicators.some((indicator) => lowerText.includes(indicator))) {
    return "tns";
  }

  // Par défaut, considérer comme particulier
  return "particulier";
}

/**
 * Extrait les données client depuis le texte de la fiche Lagon
 * Cette fonction utilise des patterns regex pour extraire les données
 * L'extraction complète sera faite par OpenAI dans le prompt système
 */
export function extractClientDataFromText(text: string): Partial<ClientData> | null {
  const clientType = detectClientType(text);
  if (!clientType) return null;

  if (clientType === "particulier") {
    return extractClientDataPhysique(text);
  } else {
    return extractClientDataMorale(text, clientType);
  }
}

/**
 * Extrait les données d'une personne physique
 */
function extractClientDataPhysique(text: string): Partial<ClientDataPhysique> {
  const data: Partial<ClientDataPhysique> = {
    type: "particulier",
  };

  // Numéro Lagon (format variable : LAGON-XXXXX, LAGON XXXXX, etc.)
  const lagonMatch = text.match(/(?:lagon|n°|numero|numéro)[\s:]*([A-Z0-9\-]+)/i);
  if (lagonMatch) {
    data.numeroLagon = lagonMatch[1].trim();
  }

  // Prénom et Nom (patterns variés)
  const nomMatch = text.match(/(?:nom|name)[\s:]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)*)/);
  if (nomMatch) {
    const nomComplet = nomMatch[1].trim();
    const parties = nomComplet.split(/\s+/);
    if (parties.length >= 2) {
      data.prenom = parties[0];
      data.nom = parties.slice(1).join(" ");
    } else {
      data.nom = nomComplet;
    }
  }

  // Email
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    data.mail = emailMatch[1];
  }

  // Téléphone (formats français)
  const telMatch = text.match(/(?:tel|téléphone|phone)[\s:]*([0-9]{2}[\s.\-]?[0-9]{2}[\s.\-]?[0-9]{2}[\s.\-]?[0-9]{2}[\s.\-]?[0-9]{2})/i);
  if (telMatch) {
    data.telephone = telMatch[1].replace(/[\s.\-]/g, "");
  }

  // Adresse (pattern basique)
  const adresseMatch = text.match(/(?:adresse|address)[\s:]*([^\n]{10,100})/i);
  if (adresseMatch) {
    data.adresseComplete = adresseMatch[1].trim();
  }

  // Code postal
  const cpMatch = text.match(/\b([0-9]{5})\b/);
  if (cpMatch) {
    data.codePostal = cpMatch[1];
  }

  // Situation matrimoniale
  const sitMatMatch = text.match(/(?:situation matrimoniale|statut marital)[\s:]*([a-zéèêëàâäôöùûüç]+)/i);
  if (sitMatMatch) {
    const sitMat = sitMatMatch[1].toLowerCase();
    if (sitMat.includes("célibataire")) data.situationMatrimoniale = "Célibataire";
    else if (sitMat.includes("marié")) data.situationMatrimoniale = "Marié(e)";
    else if (sitMat.includes("pacsé")) data.situationMatrimoniale = "Pacsé(e)";
    else if (sitMat.includes("divorcé")) data.situationMatrimoniale = "Divorcé(e)";
    else if (sitMat.includes("veuf")) data.situationMatrimoniale = "Veuf(ve)";
  }

  // Enfants
  const enfantsMatch = text.match(/(?:enfants|enfant)[\s:]*([0-9]+|oui|non|yes|no)/i);
  if (enfantsMatch) {
    const enfantsValue = enfantsMatch[1].toLowerCase();
    if (enfantsValue === "oui" || enfantsValue === "yes" || /[0-9]+/.test(enfantsValue)) {
      data.enfants = {
        aEnfants: true,
        nombre: /[0-9]+/.test(enfantsValue) ? parseInt(enfantsValue) : undefined,
      };
    } else {
      data.enfants = { aEnfants: false };
    }
  }

  return data;
}

/**
 * Extrait les données d'une personne morale (TNS ou Entreprise)
 */
function extractClientDataMorale(
  text: string,
  type: "tns" | "entreprise"
): Partial<ClientDataMorale> {
  const data: Partial<ClientDataMorale> = {
    type,
  };

  // Numéro Lagon
  const lagonMatch = text.match(/(?:lagon|n°|numero|numéro)[\s:]*([A-Z0-9\-]+)/i);
  if (lagonMatch) {
    data.numeroLagon = lagonMatch[1].trim();
  }

  // Raison sociale
  const raisonSocialeMatch = text.match(/(?:raison sociale|dénomination)[\s:]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ][^\n]{5,100})/i);
  if (raisonSocialeMatch) {
    data.raisonSociale = raisonSocialeMatch[1].trim();
  }

  // SIRET
  const siretMatch = text.match(/(?:siret|siren)[\s:]*([0-9]{9,14})/i);
  if (siretMatch) {
    data.siret = siretMatch[1].trim();
  }

  // NAF
  const nafMatch = text.match(/(?:naf|ape|code activité)[\s:]*([0-9]{4}[A-Z])/i);
  if (nafMatch) {
    data.naf = nafMatch[1].trim();
  }

  // Qui la gère
  const quiGereMatch = text.match(/(?:qui la gère|dirigeant|gérant|représentant)[\s:]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)*)/i);
  if (quiGereMatch) {
    data.quiLaGere = quiGereMatch[1].trim();
  }

  // Email
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    data.mail = emailMatch[1];
  }

  // Téléphone
  const telMatch = text.match(/(?:tel|téléphone|phone)[\s:]*([0-9]{2}[\s.\-]?[0-9]{2}[\s.\-]?[0-9]{2}[\s.\-]?[0-9]{2}[\s.\-]?[0-9]{2})/i);
  if (telMatch) {
    data.telephone = telMatch[1].replace(/[\s.\-]/g, "");
  }

  return data;
}

/**
 * Extrait les contrats depuis le masque des contrats Lagon
 */
export function extractContractsFromText(text: string): ContractData[] {
  const contracts: ContractData[] = [];

  // Liste des types de contrats possibles avec leurs patterns de détection
  const contractPatterns: Array<{
    type: string;
    libelle: string;
    patterns: RegExp[];
  }> = [
    {
      type: "auto_moto",
      libelle: "Auto / Moto",
      patterns: [/auto|voiture|véhicule|moto|scooter/i],
    },
    {
      type: "mrh_habitation",
      libelle: "MRH - Habitation",
      patterns: [/mrh|habitation|multirisque habitation|assurance habitation/i],
    },
    {
      type: "pno",
      libelle: "PNO - Propriétaire non occupant",
      patterns: [/pno|propriétaire non occupant|bailleur/i],
    },
    {
      type: "sante_individuelle",
      libelle: "Santé individuelle",
      patterns: [/santé individuelle|mutuelle|complémentaire santé/i],
    },
    {
      type: "prevoyance_itt_ipt",
      libelle: "Prévoyance ITT/IPT",
      patterns: [/prévoyance|itt|ipt|incapacité/i],
    },
    {
      type: "protection_juridique",
      libelle: "Protection juridique",
      patterns: [/protection juridique|juridique/i],
    },
    {
      type: "gav",
      libelle: "GAV - Garantie Accidents de la Vie",
      patterns: [/gav|garantie accidents|accidents de la vie/i],
    },
    {
      type: "rc_pro_generale",
      libelle: "RC Pro générale",
      patterns: [/rc pro|responsabilité civile professionnelle|rc professionnelle/i],
    },
    {
      type: "sante_collective",
      libelle: "Santé collective",
      patterns: [/santé collective|mutuelle entreprise|collectif/i],
    },
    {
      type: "prevoyance_collective",
      libelle: "Prévoyance collective",
      patterns: [/prévoyance collective|collectif/i],
    },
  ];

  // Détecter les contrats présents
  contractPatterns.forEach((contractPattern) => {
    const isPresent = contractPattern.patterns.some((pattern) => pattern.test(text));

    if (isPresent) {
      // Extraire le numéro de contrat si présent
      const numeroMatch = text.match(
        new RegExp(
          `(?:${contractPattern.libelle}|${contractPattern.type})[\\s:]*n[°o]?[\\s:]*([A-Z0-9\\-]+)`,
          "i"
        )
      );

      contracts.push({
        id: `${contractPattern.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: contractPattern.type,
        libelle: contractPattern.libelle,
        numeroContrat: numeroMatch ? numeroMatch[1] : undefined,
        statut: "detecte",
      });
    }
  });

  return contracts;
}

/**
 * Valide les données client selon le type
 * Retourne la liste des champs manquants
 */
export function validateClientData(
  data: Partial<ClientData>,
  type: ClientType
): {
  isValid: boolean;
  missingFields: string[];
  fieldsToConfirm: string[];
} {
  const missingFields: string[] = [];
  const fieldsToConfirm: string[] = [];

  if (type === "particulier") {
    const requiredFields: Array<{
      key: keyof ClientDataPhysique;
      label: string;
    }> = [
      { key: "numeroLagon", label: "Numéro Lagon" },
      { key: "prenom", label: "Prénom" },
      { key: "nom", label: "Nom" },
      { key: "adresseComplete", label: "Adresse complète" },
      { key: "mail", label: "Mail" },
      { key: "telephone", label: "Téléphone" },
      { key: "situationMatrimoniale", label: "Situation matrimoniale" },
      { key: "enfants", label: "Enfants" },
      { key: "situationProfessionnelle", label: "Situation professionnelle" },
    ];

    requiredFields.forEach((field) => {
      const value = (data as Partial<ClientDataPhysique>)[field.key];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        missingFields.push(field.label);
      } else {
        fieldsToConfirm.push(field.label);
      }
    });
  } else {
    // TNS ou Entreprise
    const requiredFields: Array<{
      key: keyof ClientDataMorale;
      label: string;
    }> = [
      { key: "numeroLagon", label: "Numéro Lagon" },
      { key: "raisonSociale", label: "Raison sociale" },
      { key: "quiLaGere", label: "Qui la gère" },
      { key: "telephone", label: "Téléphone" },
      { key: "mail", label: "Mail" },
      { key: "siret", label: "SIRET" },
      { key: "naf", label: "NAF" },
    ];

    requiredFields.forEach((field) => {
      const value = (data as Partial<ClientDataMorale>)[field.key];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        missingFields.push(field.label);
      } else {
        fieldsToConfirm.push(field.label);
      }
    });
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    fieldsToConfirm,
  };
}
