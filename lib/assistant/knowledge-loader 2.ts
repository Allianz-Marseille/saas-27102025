/**
 * Utilitaire pour charger et injecter les connaissances métier depuis les fichiers Markdown
 * 
 * Ce module permet de charger dynamiquement des fichiers de connaissances
 * selon le contexte de la question pour enrichir le prompt de l'assistant.
 * 
 * Note : Pour l'instant, cette fonctionnalité est préparée pour une évolution future.
 * Le system prompt enrichi couvre déjà l'essentiel des connaissances métier.
 */

import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Chemin de base vers les fichiers de connaissances
 */
const KNOWLEDGE_BASE_PATH = join(process.cwd(), "docs", "knowledge");

/**
 * Mapping des mots-clés vers les fichiers de connaissances
 * Permet de détecter automatiquement quels fichiers charger selon le sujet
 */
const KEYWORD_TO_FILE_MAP: Record<string, string[]> = {
  // Produits - Assurance Santé
  santé: ["produits/assurance-sante.md", "produits/particuliers-contracts.md"],
  "assurance santé": ["produits/assurance-sante.md", "produits/particuliers-contracts.md"],
  santé_individuelle: ["produits/assurance-sante.md", "produits/particuliers-contracts.md"],
  santé_collective: ["produits/assurance-sante.md", "produits/entreprises-contracts.md"],
  mutuelle: ["produits/assurance-sante.md", "produits/particuliers-contracts.md"],
  complémentaire: ["produits/assurance-sante.md", "produits/particuliers-contracts.md"],
  complémentaire_sante: ["produits/particuliers-contracts.md"],
  surcomplementaire: ["produits/particuliers-contracts.md"],
  hospitalisation: ["produits/particuliers-contracts.md"],
  remboursement: ["produits/assurance-sante.md"],

  // Produits - Assurance IARD
  iard: ["produits/assurance-iard.md"],
  auto: ["produits/assurance-iard.md", "produits/assurance-vtm-allianz.md", "produits/particuliers-contracts.md"],
  automobile: ["produits/assurance-iard.md", "produits/assurance-vtm-allianz.md", "produits/particuliers-contracts.md"],
  moto: ["produits/particuliers-contracts.md"],
  habitation: ["produits/assurance-iard.md", "produits/particuliers-contracts.md"],
  mrh: ["produits/particuliers-contracts.md"],
  pno: ["produits/particuliers-contracts.md"],
  professionnelle: ["produits/assurance-iard.md", "produits/professionnels-contracts.md"],
  décennale: ["produits/assurance-iard.md", "produits/professionnels-contracts.md"],
  "dommages ouvrage": ["produits/assurance-iard.md", "contrats/professionnel.md"],
  dommages_ouvrage_produits: ["produits/assurance-iard.md"],

  // Produits - Assurance VTM Allianz (spécifique)
  vtm: ["produits/assurance-vtm-allianz.md"],
  "véhicule terrestre à moteur": ["produits/assurance-vtm-allianz.md"],
  permis_conduire: ["produits/assurance-vtm-allianz.md"],
  "permis de conduire": ["produits/assurance-vtm-allianz.md"],
  catégorie_permis: ["produits/assurance-vtm-allianz.md"],
  "catégorie permis": ["produits/assurance-vtm-allianz.md"],
  bonus_malus: ["produits/assurance-vtm-allianz.md"],
  "bonus malus": ["produits/assurance-vtm-allianz.md"],
  crm: ["produits/assurance-vtm-allianz.md"],
  coefficient_réduction: ["produits/assurance-vtm-allianz.md"],
  contrôle_technique: ["produits/assurance-vtm-allianz.md"],
  "contrôle technique": ["produits/assurance-vtm-allianz.md"],
  carte_grise: ["produits/assurance-vtm-allianz.md"],
  "carte grise": ["produits/assurance-vtm-allianz.md"],
  immatriculation: ["produits/assurance-vtm-allianz.md"],
  siv: ["produits/assurance-vtm-allianz.md"],
  fva: ["produits/assurance-vtm-allianz.md"],
  "fichier véhicules assurés": ["produits/assurance-vtm-allianz.md"],
  din: ["produits/assurance-vtm-allianz.md"],
  "document information normalisé": ["produits/assurance-vtm-allianz.md"],
  étude_besoins: ["produits/assurance-vtm-allianz.md"],
  "étude de besoins": ["produits/assurance-vtm-allianz.md"],
  résiliation: ["produits/assurance-vtm-allianz.md"],
  suspension_contrat: ["produits/assurance-vtm-allianz.md"],
  transfert_bonus: ["produits/assurance-vtm-allianz.md"],
  bct: ["produits/assurance-vtm-allianz.md"],
  "bureau central tarification": ["produits/assurance-vtm-allianz.md"],

  // Produits - Prévoyance
  prévoyance: ["produits/prevoyance.md", "produits/particuliers-contracts.md", "produits/professionnels-contracts.md"],
  tns: ["produits/prevoyance.md", "produits/professionnels-contracts.md"],
  "travailleur non salarié": ["produits/prevoyance.md", "produits/professionnels-contracts.md"],
  décès: ["produits/prevoyance.md", "produits/particuliers-contracts.md"],
  invalidité: ["produits/prevoyance.md", "produits/particuliers-contracts.md"],
  incapacité: ["produits/prevoyance.md"],
  prévoyance_collective: ["produits/prevoyance.md", "produits/entreprises-contracts.md"],
  prevoyance_tns: ["produits/professionnels-contracts.md", "contrats/professionnel.md"],
  itt: ["produits/particuliers-contracts.md"],
  ipt: ["produits/particuliers-contracts.md"],

  // Produits - Épargne
  épargne: ["produits/epargne.md", "produits/particuliers-contracts.md"],
  epargne_projet: ["produits/particuliers-contracts.md"],
  retraite: ["produits/epargne.md", "produits/particuliers-contracts.md", "produits/professionnels-contracts.md"],
  per: ["produits/epargne.md", "produits/particuliers-contracts.md", "produits/professionnels-contracts.md"],
  "plan épargne retraite": ["produits/epargne.md", "produits/particuliers-contracts.md", "produits/professionnels-contracts.md"],
  perp: ["produits/epargne.md"],
  "plan épargne retraite populaire": ["produits/epargne.md"],
  assurance_vie: ["produits/epargne.md", "produits/particuliers-contracts.md", "produits/professionnels-contracts.md"],
  capitalisation: ["produits/particuliers-contracts.md"],
  scpi: ["produits/particuliers-contracts.md"],

  // Process - Leads
  lead: ["process/leads.md"],
  leads: ["process/leads.md"],
  prospect: ["process/leads.md"],
  prospection: ["process/leads.md"],
  qualification: ["process/leads.md"],

  // Process - M+3
  "m+3": ["process/m-plus-3.md"],
  "m plus 3": ["process/m-plus-3.md"],
  "trois mois": ["process/m-plus-3.md"],
  "3 mois": ["process/m-plus-3.md"],
  "3mois": ["process/m-plus-3.md"],
  satisfaction: ["process/m-plus-3.md"],
  relance_satisfaction: ["process/m-plus-3.md"],
  relance: ["process/m-plus-3.md"],

  // Process - Préterme
  préterme: ["process/preterme-auto.md", "process/preterme-ird.md"],
  préterme_auto: ["process/preterme-auto.md"],
  préterme_ird: ["process/preterme-ird.md"],
  renouvellement: ["process/preterme-auto.md", "process/preterme-ird.md"],
  échéance: ["process/preterme-auto.md", "process/preterme-ird.md"],
  échéance_auto: ["process/preterme-auto.md"],
  échéance_habitation: ["process/preterme-ird.md"],

  // Sinistres - Général
  sinistre: ["process/sinistres.md"],
  sinistres: ["process/sinistres.md"],
  déclaration_sinistre: ["process/sinistres.md"],
  gestion_sinistre: ["process/sinistres.md"],

  // Sinistres - Conventions inter-assureurs
  convention: ["process/sinistres.md"],
  convention_irsa: ["process/sinistres.md"],
  irsa: ["process/sinistres.md"],
  irca: ["process/sinistres.md"],
  irsi: ["process/sinistres.md"],
  cide_cop: ["process/sinistres.md"],
  gestion_conventionnelle: ["process/sinistres.md"],
  droit_commun: ["process/sinistres.md"],

  // Sinistres - Types de sinistres
  dégâts_des_eaux: ["process/sinistres.md"],
  "dégâts des eaux": ["process/sinistres.md"],
  dégâts_eaux: ["process/sinistres.md"],
  fuite: ["process/sinistres.md"],
  inondation: ["process/sinistres.md"],
  incendie: ["process/sinistres.md"],
  explosion: ["process/sinistres.md"],
  accident: ["process/sinistres.md"],
  accident_auto: ["process/sinistres.md"],
  accident_circulation: ["process/sinistres.md"],

  // Sinistres - Procédures
  expertise: ["process/sinistres.md"],
  expert: ["process/sinistres.md"],
  indemnisation: ["process/sinistres.md"],
  recours: ["process/sinistres.md"],
  franchise: ["process/sinistres.md"],

  // Sinistres - Conventions spécifiques
  badinter: ["process/sinistres.md"],
  "loi badinter": ["process/sinistres.md"],
  victime: ["process/sinistres.md"],
  victimes: ["process/sinistres.md"],

  // Sinistres - Construction
  construction: ["process/sinistres.md"],
  décennale_sinistre: ["process/sinistres.md"],
  dommages_ouvrage: ["process/sinistres.md"],
  crac: ["process/sinistres.md"],
  rcd: ["process/sinistres.md"],

  // Sinistres - Corporel
  corporel: ["process/sinistres.md"],
  préjudice_corporel: ["process/sinistres.md"],
  dommage_corporel: ["process/sinistres.md"],
  dintilhac: ["process/sinistres.md"],
  nomenclature_dintilhac: ["process/sinistres.md"],

  // Sinistres - Catastrophes
  cat_nat: ["process/sinistres.md"],
  "cat nat": ["process/sinistres.md"],
  catastrophe_naturelle: ["process/sinistres.md"],
  catastrophes_naturelles: ["process/sinistres.md"],
  terrorisme: ["process/sinistres.md"],
  attentat: ["process/sinistres.md"],
  attentats: ["process/sinistres.md"],

  // Sinistres - Fonds de garantie
  fgti: ["process/sinistres.md"],
  fgao: ["process/sinistres.md"],
  oniam: ["process/sinistres.md"],
  "fonds de garantie": ["process/sinistres.md"],

  // Agences et coordonnées
  agence: ["core/agences.md"],
  agences: ["core/agences.md"],
  corniche: ["core/agences.md"],
  rouvière: ["core/agences.md"],
  adresse: ["core/agences.md"],
  horaires: ["core/agences.md"],
  whatsapp: ["core/agences.md"],
  localisation: ["core/agences.md"],

  // Effectif
  effectif: ["core/effectif-agence.md"],
  collaborateur: ["core/effectif-agence.md"],
  collaborateurs: ["core/effectif-agence.md"],
  équipe: ["core/effectif-agence.md"],
  contact: ["core/effectif-agence.md"],

  // Assistance et urgences
  assistance: ["core/numeros-assistance.md"],
  "numéro d'assistance": ["core/numeros-assistance.md"],
  urgence: ["core/numeros-assistance.md"],
  numéro: ["core/numeros-assistance.md"],
  téléphone: ["core/numeros-assistance.md", "produits/particuliers-contracts.md", "contrats/particulier.md"],
  panne: ["core/numeros-assistance.md"],
  dépannage: ["core/numeros-assistance.md"],
  crevaison: ["core/numeros-assistance.md"],
  plomberie: ["core/numeros-assistance.md"],
  serrurerie: ["core/numeros-assistance.md"],
  "garde d'enfant": ["core/numeros-assistance.md"],
  garde_enfant: ["core/numeros-assistance.md"],
  perte_carte: ["core/numeros-assistance.md"],
  vol_carte: ["core/numeros-assistance.md"],
  "perte de carte": ["core/numeros-assistance.md"],
  "vol de carte": ["core/numeros-assistance.md"],
  chéquier: ["core/numeros-assistance.md"],
  opposition: ["core/numeros-assistance.md"],

  // Devis et formulaires
  devis: ["core/liens-devis.md", "core/outils-tarification.md"],
  "demande de devis": ["core/liens-devis.md", "core/outils-tarification.md"],
  demande_devis: ["core/liens-devis.md", "core/outils-tarification.md"],
  formulaire: ["core/liens-devis.md", "core/outils-tarification.md"],
  formulaires: ["core/liens-devis.md", "core/outils-tarification.md"],
  lien: ["core/liens-devis.md", "core/outils-tarification.md"],
  liens: ["core/liens-devis.md", "core/outils-tarification.md"],
  code_agence: ["core/liens-devis.md", "core/outils-tarification.md"],
  "code agence": ["core/liens-devis.md", "core/outils-tarification.md"],
  h91358: ["core/liens-devis.md", "core/outils-tarification.md"],
  rendez_vous: ["core/liens-devis.md", "core/outils-tarification.md"],
  "rendez-vous": ["core/liens-devis.md", "core/outils-tarification.md"],
  tarification: ["core/outils-tarification.md"],
  "outil tarification": ["core/outils-tarification.md"],
  "outils tarification": ["core/outils-tarification.md"],
  outil_tarification: ["core/outils-tarification.md"],
  calculateur: ["core/outils-tarification.md"],
  simulateur: ["core/outils-tarification.md"],
  "calcul de prime": ["core/outils-tarification.md"],
  estimation: ["core/outils-tarification.md"],

  // Réglementation et légal
  réglementation: ["core/reglementation.md"],
  légal: ["core/reglementation.md"],
  juridique: ["core/reglementation.md"],
  acpr: ["core/reglementation.md"],
  "autorité de contrôle": ["core/reglementation.md"],
  devoir_conseil: ["core/reglementation.md"],
  "devoir de conseil": ["core/reglementation.md"],
  rgpd: ["core/reglementation.md"],
  "protection des données": ["core/reglementation.md"],
  données_personnelles: ["core/reglementation.md"],
  protection_données: ["core/reglementation.md"],
  médiation: ["core/reglementation.md"],
  "médiateur de l'assurance": ["core/reglementation.md"],
  réclamation: ["core/reglementation.md"],
  siren: ["core/reglementation.md"],
  orias: ["core/reglementation.md"],
  rcs: ["core/reglementation.md"],
  conformité: ["core/reglementation.md"],
  "informations légales": ["core/reglementation.md"],
  informations_légales: ["core/reglementation.md"],
  spéc: ["core/reglementation.md"],
  "spec boetti-nogaro": ["core/reglementation.md"],

  // Identité agence
  identité: ["core/identite-agence.md"],
  posture: ["core/identite-agence.md"],
  valeurs: ["core/identite-agence.md"],

  // Contrats particuliers - compléments
  pj: ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  "protection juridique": ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  bijoux: ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  "objets de valeur": ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  collections: ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  multimédia: ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  nomade: ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  caravane: ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  van: ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  camping_car: ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  plaisance: ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  bateau: ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  vélo: ["contrats/particulier.md"],
  edpm: ["contrats/particulier.md"],
  trottinette: ["contrats/particulier.md"],
  chasse: ["contrats/particulier.md"],
  "rc chasse": ["contrats/particulier.md"],
  "rc sport": ["contrats/particulier.md"],
  licences: ["contrats/particulier.md"],
  scolaire: ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  "assurance scolaire": ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  extra_scolaire: ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  gav: ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  "garantie accidents de la vie": ["produits/particuliers-contracts.md", "contrats/particulier.md"],
  animaux: ["contrats/particulier.md"],
  "santé animaux": ["contrats/particulier.md"],
  chien: ["contrats/particulier.md"],
  chat: ["contrats/particulier.md"],
  emprunteur: ["contrats/particulier.md"],
  "assurance emprunteur": ["contrats/particulier.md"],
  crédit: ["contrats/particulier.md"],

  // Contrats professionnels - compléments
  materiel: ["produits/professionnels-contracts.md", "contrats/professionnel.md"],
  "bris de machine": ["produits/professionnels-contracts.md", "contrats/professionnel.md"],
  bris_machine: ["produits/professionnels-contracts.md", "contrats/professionnel.md"],
  flotte: ["produits/professionnels-contracts.md", "contrats/professionnel.md"],
  "auto mission": ["produits/professionnels-contracts.md", "contrats/professionnel.md"],
  auto_mission: ["produits/professionnels-contracts.md", "contrats/professionnel.md"],
  "rc médicale": ["contrats/professionnel.md"],
  "rc paramédicale": ["contrats/professionnel.md"],
  rc_medicale: ["contrats/professionnel.md"],
  rc_paramedicale: ["contrats/professionnel.md"],
  do: ["produits/assurance-iard.md", "contrats/professionnel.md"],
  "transport marchandises": ["contrats/professionnel.md"],
  transport_marchandises: ["contrats/professionnel.md"],
  facultés: ["contrats/professionnel.md"],
  cargo: ["contrats/professionnel.md"],
  trc: ["contrats/professionnel.md"],
  "tous risques chantier": ["contrats/professionnel.md"],
  tous_risques_chantier: ["contrats/professionnel.md"],
  "chômage dirigeant": ["contrats/professionnel.md"],
  chomage_dirigeant: ["contrats/professionnel.md"],
  "santé tns": ["produits/professionnels-contracts.md", "contrats/professionnel.md"],
  sante_tns: ["produits/professionnels-contracts.md", "contrats/professionnel.md"],
  "prévoyance tns": ["produits/professionnels-contracts.md", "contrats/professionnel.md"],
  "gav dirigeant": ["contrats/professionnel.md"],
  gav_dirigeant: ["contrats/professionnel.md"],

  // Contrats entreprises - compléments
  "responsabilité dirigeants": ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  "rc mandataires sociaux": ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  do_entreprise: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  "d&o": ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  "homme clé": ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  homme_cle: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  cautions: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  "garanties financières": ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  garanties_financieres: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  "assurance crédit": ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  assurance_credit: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  "rc exploitation": ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  rc_exploitation: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  "rc produits": ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  rc_produits: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  "rc prestations": ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  rc_prestations: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  "multirisque entreprise": ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  multirisque_entreprise: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  mre: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  "transport logistique": ["contrats/entreprise.md"],
  transport_logistique: ["contrats/entreprise.md"],
  "santé collective": ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  sante_collective: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  "prévoyance collective": ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  prevoyance_collective: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  "épargne salariale": ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  epargne_salariale: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  pee: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  "retraite collective": ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  retraite_collective: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  percol: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  pero: ["produits/entreprises-contracts.md", "contrats/entreprise.md"],
  "dirigeant assimilé salarié": ["contrats/entreprise.md"],
  dirigeant_assimile_salarie: ["contrats/entreprise.md"],
};

/**
 * Charge le contenu d'un fichier de connaissances Markdown
 * 
 * @param filePath Chemin relatif au dossier knowledge/ (ex: "produits/assurance-sante.md")
 * @returns Le contenu du fichier, ou null si le fichier n'existe pas
 */
export async function loadKnowledgeFile(filePath: string): Promise<string | null> {
  try {
    const fullPath = join(KNOWLEDGE_BASE_PATH, filePath);
    const content = await readFile(fullPath, "utf-8");
    
    // Retirer le titre du fichier (première ligne # Titre) pour éviter la duplication
    const lines = content.split("\n");
    if (lines[0].startsWith("#")) {
      return lines.slice(1).join("\n").trim();
    }
    
    return content.trim();
  } catch (error) {
    console.warn(`Impossible de charger le fichier de connaissances ${filePath}:`, error);
    return null;
  }
}

/**
 * Charge plusieurs fichiers de connaissances en parallèle
 * 
 * @param filePaths Tableau de chemins relatifs
 * @returns Tableau des contenus chargés (les fichiers non trouvés sont exclus)
 */
export async function loadKnowledgeFiles(filePaths: string[]): Promise<string[]> {
  const contents = await Promise.all(
    filePaths.map((path) => loadKnowledgeFile(path))
  );
  
  return contents.filter((content): content is string => content !== null);
}

/**
 * Détecte les fichiers de connaissances pertinents selon le contenu du message
 * 
 * Amélioration : Détection plus agressive avec recherche de mots-clés partiels
 * et priorisation des fichiers les plus pertinents.
 * 
 * @param message Le message de l'utilisateur
 * @returns Tableau de chemins de fichiers à charger (dédupliqués)
 */
export function selectRelevantContext(message: string): string[] {
  const messageLower = message.toLowerCase();
  const relevantFiles = new Set<string>();
  const fileScores = new Map<string, number>();

  // Parcourir le mapping des mots-clés avec scoring
  for (const [keyword, files] of Object.entries(KEYWORD_TO_FILE_MAP)) {
    // Recherche exacte du mot-clé
    if (messageLower.includes(keyword)) {
      files.forEach((file) => {
        relevantFiles.add(file);
        // Augmenter le score pour les fichiers détectés plusieurs fois
        fileScores.set(file, (fileScores.get(file) || 0) + 1);
      });
    }
  }

  // Recherche de mots-clés partiels pour améliorer la détection
  // (ex: "mutuelle" détecte aussi "mutuelles", "mutuel", etc.)
  const words = messageLower.split(/\s+/);
  for (const word of words) {
    // Chercher des mots-clés qui commencent ou finissent par ce mot
    for (const [keyword, files] of Object.entries(KEYWORD_TO_FILE_MAP)) {
      if (keyword.includes(word) || word.includes(keyword)) {
        files.forEach((file) => {
          relevantFiles.add(file);
          fileScores.set(file, (fileScores.get(file) || 0) + 0.5); // Score plus faible pour détection partielle
        });
      }
    }
  }

  // Trier les fichiers par score (les plus pertinents en premier)
  const sortedFiles = Array.from(relevantFiles).sort((a, b) => {
    const scoreA = fileScores.get(a) || 0;
    const scoreB = fileScores.get(b) || 0;
    return scoreB - scoreA;
  });

  return sortedFiles;
}

/**
 * Charge les connaissances pertinentes selon le message et les formate pour injection
 * 
 * @param message Le message de l'utilisateur
 * @param maxFiles Nombre maximum de fichiers à charger (par défaut 5 pour une meilleure couverture)
 * @returns Le contenu formaté des connaissances, ou null si aucune connaissance pertinente
 */
export async function loadRelevantKnowledge(
  message: string,
  maxFiles: number = 5
): Promise<string | null> {
  const relevantFiles = selectRelevantContext(message);
  
  if (relevantFiles.length === 0) {
    return null;
  }

  // Dédupliquer les fichiers (un même fichier peut être détecté par plusieurs mots-clés)
  const uniqueFiles = Array.from(new Set(relevantFiles));

  // Limiter le nombre de fichiers pour éviter de dépasser les limites de tokens
  // Prioriser les fichiers les plus pertinents (ceux détectés en premier)
  const filesToLoad = uniqueFiles.slice(0, maxFiles);
  const contents = await loadKnowledgeFiles(filesToLoad);

  if (contents.length === 0) {
    return null;
  }

  // Formater pour injection dans le prompt avec indication des sources
  const fileNames = filesToLoad.map(f => f.replace(/\.md$/, '').split('/').pop()).join(', ');
  return `\n\n--- 📚 Connaissances métier pertinentes (${contents.length} fichier${contents.length > 1 ? 's' : ''} : ${fileNames}) ---\n\n${contents.join("\n\n---\n\n")}\n\n⚠️ IMPORTANT : Utilise ces informations en priorité et cite-les dans ta réponse.`;
}

/**
 * Injection optionnelle : Ajoute les connaissances pertinentes au système de messages
 * 
 * Cette fonction peut être utilisée pour injecter dynamiquement des connaissances
 * dans le prompt, au-delà du system prompt de base.
 * 
 * Note : À utiliser avec parcimonie pour éviter de dépasser les limites de tokens.
 * 
 * @param messages Le tableau de messages OpenAI
 * @param userMessage Le message de l'utilisateur
 * @returns Le tableau de messages enrichi (ou inchangé si pas de connaissances pertinentes)
 */
export async function enrichMessagesWithKnowledge<T extends { role: string; content?: any }>(
  messages: T[],
  userMessage: string
): Promise<T[]> {
  // Charger les connaissances pertinentes selon le message utilisateur
  // Limité à 1 fichier pour éviter la surcharge de tokens
  const relevantKnowledge = await loadRelevantKnowledge(userMessage, 1);
  
  if (relevantKnowledge) {
    // Insérer les connaissances après le system prompt
    const enrichedMessages = [...messages] as T[];
    if (enrichedMessages.length > 0 && enrichedMessages[0].role === "system") {
      enrichedMessages.splice(1, 0, {
        role: "system",
        content: relevantKnowledge,
      } as T);
    }
    return enrichedMessages;
  }

  return messages;
}

