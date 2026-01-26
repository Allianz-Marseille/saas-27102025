/**
 * Fonctions d'analyse pour le workflow M+3
 * Analyse de complétude, identification des trous logiques et opportunités commerciales
 */

import {
  ClientData,
  ClientDataPhysique,
  ClientDataMorale,
  ContractData,
  M3Analysis,
} from "@/types/m3-session";
import { validateClientData } from "./m3-extraction";

/**
 * Mapping des contrats possibles par type de client
 */
const CONTRACTS_BY_CLIENT_TYPE: Record<
  string,
  Array<{ type: string; libelle: string; priorite: number }>
> = {
  particulier: [
    { type: "auto_moto", libelle: "Auto / Moto", priorite: 1 },
    { type: "mrh_habitation", libelle: "MRH - Habitation", priorite: 2 },
    { type: "pno", libelle: "PNO - Propriétaire non occupant", priorite: 3 },
    { type: "gav", libelle: "GAV - Garantie Accidents de la Vie", priorite: 4 },
    { type: "protection_juridique", libelle: "Protection juridique", priorite: 5 },
    { type: "sante_individuelle", libelle: "Santé individuelle", priorite: 6 },
    { type: "prevoyance_itt_ipt", libelle: "Prévoyance ITT/IPT", priorite: 7 },
    { type: "assurance_emprunteur", libelle: "Assurance emprunteur", priorite: 8 },
    { type: "epargne_retraite", libelle: "Épargne retraite", priorite: 9 },
    { type: "objets_valeur", libelle: "Objets de valeur", priorite: 10 },
    { type: "assurance_scolaire", libelle: "Assurance scolaire", priorite: 11 },
    { type: "assurance_animaux", libelle: "Animaux (chien/chat)", priorite: 12 },
    { type: "nautisme", libelle: "Nautisme", priorite: 13 },
    { type: "residence_secondaire", libelle: "Résidence secondaire", priorite: 14 },
    { type: "equipements_specifiques", libelle: "Équipements spécifiques", priorite: 15 },
    { type: "dependance", libelle: "Dépendance", priorite: 16 },
  ],
  tns: [
    { type: "rc_pro_generale", libelle: "RC Pro générale", priorite: 1 },
    { type: "rc_medicale_paramedicale", libelle: "RC médicale / paramédicale", priorite: 2 },
    { type: "decennale", libelle: "Décennale", priorite: 3 },
    { type: "multirisque_pro", libelle: "Multirisque pro", priorite: 4 },
    { type: "perte_exploitation_pro", libelle: "Perte d'exploitation pro", priorite: 5 },
    { type: "bris_machine_pro", libelle: "Bris de machine pro", priorite: 6 },
    { type: "auto_mission_flotte", libelle: "Auto mission / flotte", priorite: 7 },
    { type: "cyber_pro", libelle: "Cyber pro", priorite: 8 },
    { type: "protection_juridique_pro", libelle: "Protection juridique pro", priorite: 9 },
    { type: "sante_tns", libelle: "Santé TNS", priorite: 10 },
    { type: "prevoyance_tns", libelle: "Prévoyance TNS", priorite: 11 },
    { type: "retraite_tns", libelle: "Retraite TNS", priorite: 12 },
  ],
  entreprise: [
    { type: "rc_exploitation_produits_prestations", libelle: "RC exploitation / produits / prestations", priorite: 1 },
    { type: "multirisque_entreprise", libelle: "Multirisque entreprise", priorite: 2 },
    { type: "perte_exploitation_entreprise", libelle: "Perte d'exploitation", priorite: 3 },
    { type: "bris_machine_entreprise", libelle: "Bris de machine entreprise", priorite: 4 },
    { type: "cyber_entreprise", libelle: "Cyber entreprise", priorite: 5 },
    { type: "do_dirigeants", libelle: "D&O - Dirigeants et mandataires", priorite: 6 },
    { type: "rc_transporteur", libelle: "RC transporteur", priorite: 7 },
    { type: "trc_do_entreprise", libelle: "TRC / DO - Travaux et dommages ouvrage", priorite: 8 },
    { type: "flotte_auto_mission", libelle: "Flotte / auto mission", priorite: 9 },
    { type: "protection_juridique_entreprise", libelle: "Protection juridique entreprise", priorite: 10 },
    { type: "assurance_credit_poste_client", libelle: "Assurance-crédit / Poste client (Allianz Trade)", priorite: 11 },
    { type: "sante_collective", libelle: "Santé collective", priorite: 12 },
    { type: "prevoyance_collective", libelle: "Prévoyance collective", priorite: 13 },
    { type: "epargne_salariale", libelle: "Épargne salariale", priorite: 14 },
    { type: "dirigeant_tns_sante_prevoyance", libelle: "Dirigeant TNS : santé + prévoyance + retraite", priorite: 15 },
    { type: "assurance_cle", libelle: "Assurance clé", priorite: 16 },
  ],
};

/**
 * Mapping des tarificateurs par type de contrat
 */
const TARIFICATEURS_BY_CONTRACT: Record<string, string> = {
  auto_moto: "https://www.allianz.fr/forms/api/context/sharing/quotes/auto?codeAgence=H91358",
  mrh_habitation: "https://www.allianz.fr/forms/api/context/sharing/fast-quotes/household?codeAgence=H91358",
  sante_individuelle: "https://www.allianz.fr/assurance-particulier/formulaire/devis-sante.html?codeAgence=H91358",
  assurance_emprunteur: "https://www.allianz.fr/forms/api/context/sharing/long-quotes/borrower?codeAgence=H91358",
  rc_pro_generale: "https://www.allianz.fr/forms/api/context/sharing/fast-quotes/multiaccess-pro?codeAgence=H91358",
  protection_juridique: "https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-juridique/mes-droits-au-quotidien/devis-contact.html?codeAgence=H91358",
  gav: "https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-de-la-famille/garantie-des-accidents-de-la-vie-privee/devis-contact.html/?codeAgence=H91358",
  assurance_scolaire: "https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-de-la-famille/assurance-scolaire/devis-contact.html/?codeAgence=H91358",
};

/**
 * Analyse la complétude des données client et contrats
 */
export function analyzeCompleteness(
  clientData: Partial<ClientData>,
  contracts: ContractData[]
): M3Analysis {
  const clientType = clientData.type || "particulier";
  const validation = validateClientData(clientData, clientType);

  // ✅ Ce qui est présent mais à confirmer
  const aConfirmer = {
    donneesClient: validation.fieldsToConfirm.map((field) => ({
      champ: field,
      valeur: getFieldValue(clientData, field),
      question: `Confirmez-vous que ${field} est correct ?`,
    })),
    contrats: contracts
      .filter((c) => c.statut === "detecte")
      .map((contract) => ({
        contrat: contract.libelle,
        question: `J'ai détecté un contrat ${contract.libelle}, confirmez-vous ?`,
      })),
    pieces: contracts
      .filter((c) => c.piecesManquantes && c.piecesManquantes.length > 0)
      .flatMap((contract) =>
        contract.piecesManquantes!.map((piece) => ({
          piece,
          statut: "incertain" as const,
        }))
      ),
  };

  // ❌ Ce qui est absent et à compléter
  const aCompleter = {
    champsManquants: validation.missingFields.map((field) => ({
      champ: field,
      question: generateQuestionForField(field, clientType),
      priorite: getPriorityForField(field) as "critique" | "important" | "normal",
    })),
    piecesManquantes: contracts
      .filter((c) => c.piecesManquantes && c.piecesManquantes.length > 0)
      .flatMap((contract) =>
        contract.piecesManquantes!.map((piece) => ({
          piece,
          contrat: contract.libelle,
          question: `Avez-vous la pièce ${piece} pour le contrat ${contract.libelle} ?`,
        }))
      ),
  };

  // 🎯 Axes commerciaux prioritaires
  const axesPrioritaires = identifyCommercialOpportunities(clientData, contracts);

  return {
    aConfirmer,
    aCompleter,
    axesPrioritaires,
  };
}

/**
 * Identifie les champs manquants
 */
export function identifyMissingFields(
  clientData: Partial<ClientData>,
  clientType: "particulier" | "tns" | "entreprise"
): string[] {
  const validation = validateClientData(clientData, clientType);
  return validation.missingFields;
}

/**
 * Identifie les opportunités commerciales
 */
export function identifyCommercialOpportunities(
  clientData: Partial<ClientData>,
  contracts: ContractData[]
): M3Analysis["axesPrioritaires"] {
  const clientType = clientData.type || "particulier";
  const contractsPresent = contracts
    .filter((c) => c.statut === "confirme" || c.statut === "detecte")
    .map((c) => c.type);

  // Liste des contrats possibles pour ce type de client
  const possibleContracts = CONTRACTS_BY_CLIENT_TYPE[clientType] || [];

  // Identifier les trous logiques (contrats manquants)
  const trousLogiques = possibleContracts
    .filter((contract) => !contractsPresent.includes(contract.type))
    .map((contract, index) => ({
      contrat: contract.type,
      raison: generateReasonForContract(contract.type, clientData),
      priorite: contract.priorite,
    }))
    .sort((a, b) => a.priorite - b.priorite);

  // TOP 3 opportunités commerciales
  const opportunitesCommerciales = trousLogiques
    .slice(0, 3)
    .map((trou, index) => {
      const contractInfo = possibleContracts.find((c) => c.type === trou.contrat);
      return {
        contrat: trou.contrat,
        libelle: contractInfo?.libelle || trou.contrat,
        raison: trou.raison,
        priorite: index + 1,
        lienTarificateur: TARIFICATEURS_BY_CONTRACT[trou.contrat] || undefined,
      };
    });

  // Questions clés à poser
  const questionsCles = generateKeyQuestions(clientData, trousLogiques);

  // Plan d'action suggéré
  const planActionSuggere = opportunitesCommerciales.map((opp, index) => ({
    action: `Faire un devis ${opp.libelle}`,
    type: "devis" as const,
    echeance: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000), // +7 jours, +14 jours, +21 jours
  }));

  return {
    trousLogiques,
    opportunitesCommerciales,
    questionsCles,
    planActionSuggere,
  };
}

/**
 * Récupère les tarificateurs pertinents selon les opportunités
 */
export function getRelevantTarificateurs(
  opportunities: M3Analysis["axesPrioritaires"]["opportunitesCommerciales"]
): Array<{ contrat: string; libelle: string; lien: string }> {
  return opportunities
    .filter((opp) => opp.lienTarificateur)
    .map((opp) => ({
      contrat: opp.contrat,
      libelle: opp.libelle,
      lien: opp.lienTarificateur!,
    }));
}

// ============================================================================
// Fonctions utilitaires privées
// ============================================================================

function getFieldValue(clientData: Partial<ClientData>, field: string): string {
  const fieldMap: Record<string, keyof ClientData> = {
    "Numéro Lagon": "numeroLagon",
    "Prénom": "prenom",
    "Nom": "nom",
    "Adresse complète": "adresseComplete",
    "Mail": "mail",
    "Téléphone": "telephone",
    "Raison sociale": "raisonSociale",
    "SIRET": "siret",
    "NAF": "naf",
  } as any;

  const key = fieldMap[field];
  if (!key) return "";

  const value = (clientData as any)[key];
  return value ? String(value) : "";
}

function generateQuestionForField(
  field: string,
  clientType: string
): string {
  const questions: Record<string, string> = {
    "Numéro Lagon": "Quel est le numéro Lagon du client ?",
    "Prénom": "Quel est le prénom du client ?",
    "Nom": "Quel est le nom du client ?",
    "Adresse complète": "Quelle est l'adresse complète du client ?",
    "Mail": "Quel est l'email du client ?",
    "Téléphone": "Quel est le numéro de téléphone du client ?",
    "Situation matrimoniale": "Quelle est la situation matrimoniale du client ?",
    "Enfants": "Le client a-t-il des enfants ?",
    "Situation professionnelle": "Quelle est la situation professionnelle du client ?",
    "Raison sociale": "Quelle est la raison sociale de l'entreprise ?",
    "SIRET": "Quel est le SIRET de l'entreprise ?",
    "NAF": "Quel est le code NAF de l'entreprise ?",
  };

  return questions[field] || `Quelle est la valeur de ${field} ?`;
}

function getPriorityForField(field: string): "critique" | "important" | "normal" {
  const criticalFields = ["Numéro Lagon", "Nom", "Mail", "Téléphone", "Raison sociale", "SIRET"];
  const importantFields = ["Adresse complète", "Situation professionnelle", "NAF"];

  if (criticalFields.includes(field)) return "critique";
  if (importantFields.includes(field)) return "important";
  return "normal";
}

function generateReasonForContract(
  contractType: string,
  clientData: Partial<ClientData>
): string {
  const reasons: Record<string, string> = {
    mrh_habitation: "Le client est propriétaire ou locataire, une assurance habitation est essentielle",
    sante_individuelle: "Protection santé importante pour le client et sa famille",
    prevoyance_itt_ipt: "Protection des revenus en cas d'incapacité",
    protection_juridique: "Protection juridique utile pour les litiges quotidiens",
    gav: "Garantie accidents de la vie pour protéger la famille",
    rc_pro_generale: "Responsabilité civile professionnelle obligatoire pour l'activité",
    sante_tns: "Complémentaire santé nécessaire pour le dirigeant TNS",
    prevoyance_tns: "Protection revenus essentielle pour le dirigeant",
    sante_collective: "Obligation légale pour l'entreprise (50% minimum employeur)",
    prevoyance_collective: "Protection collective des salariés",
  };

  return reasons[contractType] || `Contrat ${contractType} recommandé selon le profil client`;
}

function generateKeyQuestions(
  clientData: Partial<ClientData>,
  trousLogiques: Array<{ contrat: string; raison: string }>
): string[] {
  const questions: string[] = [];

  if (clientData.type === "particulier") {
    const data = clientData as Partial<ClientDataPhysique>;
    if (!data.situationMatrimoniale) {
      questions.push("Quelle est la situation matrimoniale du client ?");
    }
    if (!data.enfants) {
      questions.push("Le client a-t-il des enfants ?");
    }
    if (trousLogiques.some((t) => t.contrat === "mrh_habitation")) {
      questions.push("Le client est-il propriétaire ou locataire ?");
    }
    if (trousLogiques.some((t) => t.contrat === "sante_individuelle")) {
      questions.push("Le client a-t-il une complémentaire santé ?");
    }
  } else if (clientData.type === "tns" || clientData.type === "entreprise") {
    if (trousLogiques.some((t) => t.contrat === "rc_pro_generale")) {
      questions.push("L'entreprise a-t-elle une RC Pro ?");
    }
    if (trousLogiques.some((t) => t.contrat === "sante_collective")) {
      questions.push("L'entreprise a-t-elle une mutuelle collective pour ses salariés ?");
    }
  }

  questions.push("Quels sont les autres assureurs du client ?");
  questions.push("Y a-t-il des besoins non couverts actuellement ?");

  return questions;
}
