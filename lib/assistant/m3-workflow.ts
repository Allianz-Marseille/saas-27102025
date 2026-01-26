/**
 * Orchestration du workflow M+3
 * Gère les 3 phases : Préparation, Appel client, Sorties
 */

import {
  M3Session,
  M3SessionStatus,
  ClientData,
  ContractData,
  M3Analysis,
  M3Output,
} from "@/types/m3-session";
import { updateM3Session, getM3Session } from "@/lib/firebase/m3-sessions";
import { extractClientDataFromText, extractContractsFromText } from "./m3-extraction";
import { analyzeCompleteness } from "./m3-analysis";
import { generateDER, generateMailPreconisations, generateChecklist } from "./m3-outputs";

/**
 * Gère le workflow M+3 selon la phase
 */
export async function handleM3Workflow(
  message: string,
  sessionId: string,
  phase: "preparation" | "appel" | "sorties"
): Promise<{
  session: M3Session;
  response?: string;
  analysis?: M3Analysis;
  output?: M3Output;
}> {
  const session = await getM3Session(sessionId);
  if (!session) {
    throw new Error("Session M+3 non trouvée");
  }

  // Phase Préparation : Extraction et analyse
  if (phase === "preparation") {
    return await handlePreparationPhase(message, session);
  }

  // Phase Appel : Mise à jour en temps réel
  if (phase === "appel") {
    return await handleAppelPhase(message, session);
  }

  // Phase Sorties : Génération des documents
  if (phase === "sorties") {
    return await handleSortiesPhase(message, session);
  }

  return { session };
}

/**
 * Phase Préparation : Extraction et analyse des données
 */
async function handlePreparationPhase(
  message: string,
  session: M3Session
): Promise<{ session: M3Session; analysis?: M3Analysis }> {
  // Détecter si c'est la fiche client ou le masque des contrats
  const isClientFiche = 
    message.toLowerCase().includes("client") ||
    message.toLowerCase().includes("lagon") ||
    !session.rawClientFiche;

  const isContractFiche = 
    message.toLowerCase().includes("contrat") ||
    message.toLowerCase().includes("masque") ||
    (session.rawClientFiche && !session.rawContractFiche);

  // Extraire les données
  if (isClientFiche && !session.rawClientFiche) {
    // Première fiche : fiche client
    const clientData = extractClientDataFromText(message);
    
    await updateM3Session(session.id, {
      rawClientFiche: message,
      clientData: clientData as ClientData,
    });

    // Mettre à jour la session
    const updatedSession = await getM3Session(session.id);
    return { session: updatedSession! };
  }

  if (isContractFiche && !session.rawContractFiche) {
    // Deuxième fiche : masque des contrats
    const contracts = extractContractsFromText(message);
    
    await updateM3Session(session.id, {
      rawContractFiche: message,
      contracts,
    });

    // Analyser la complétude
    const updatedSession = await getM3Session(session.id);
    if (updatedSession?.clientData && updatedSession.contracts) {
      const analysis = analyzeCompleteness(updatedSession.clientData, updatedSession.contracts);
      
      await updateM3Session(session.id, {
        analysis,
      });

      const finalSession = await getM3Session(session.id);
      return { 
        session: finalSession!,
        analysis,
      };
    }
  }

  return { session };
}

/**
 * Phase Appel : Mise à jour en temps réel
 */
async function handleAppelPhase(
  message: string,
  session: M3Session
): Promise<{ session: M3Session }> {
  // Mettre à jour le statut
  if (session.status === "preparation") {
    await updateM3Session(session.id, {
      status: "appel",
    });
  }

  // Ici, on pourrait parser le message pour extraire les mises à jour
  // Pour l'instant, on laisse OpenAI faire l'extraction via le prompt
  // et on met à jour manuellement via l'API

  const updatedSession = await getM3Session(session.id);
  return { session: updatedSession! };
}

/**
 * Phase Sorties : Génération des documents
 */
async function handleSortiesPhase(
  message: string,
  session: M3Session
): Promise<{ session: M3Session; output?: M3Output }> {
  if (!session.clientData || !session.analysis) {
    throw new Error("Données insuffisantes pour générer les sorties");
  }

  const outputs: M3Output[] = [];

  // Détecter quel type de sortie est demandé
  const messageLower = message.toLowerCase();
  const wantsDER = messageLower.includes("der") || messageLower.includes("conformité");
  const wantsMail = messageLower.includes("mail") || messageLower.includes("préconisation") || messageLower.includes("preconisation");
  const wantsChecklist = messageLower.includes("checklist") || messageLower.includes("qualité");
  const wantsAll = messageLower.includes("tout") || messageLower.includes("tous");

  if (wantsDER || wantsAll) {
    const der = generateDER(session.clientData, session.contracts);
    outputs.push(der);
  }

  if (wantsMail || wantsAll) {
    const mail = generateMailPreconisations(
      session.clientData,
      session.analysis,
      session.analysis.axesPrioritaires.opportunitesCommerciales
    );
    outputs.push(mail);
  }

  if (wantsChecklist || wantsAll) {
    const checklist = generateChecklist(
      session.clientData,
      session.contracts,
      session.analysis
    );
    outputs.push(checklist);
  }

  // Si aucune sortie spécifique demandée, générer toutes par défaut
  if (outputs.length === 0) {
    const der = generateDER(session.clientData, session.contracts);
    const mail = generateMailPreconisations(
      session.clientData,
      session.analysis,
      session.analysis.axesPrioritaires.opportunitesCommerciales
    );
    const checklist = generateChecklist(
      session.clientData,
      session.contracts,
      session.analysis
    );
    outputs.push(der, mail, checklist);
  }

  // Mettre à jour la session avec les sorties
  await updateM3Session(session.id, {
    outputs: [...(session.outputs || []), ...outputs],
    status: "completed",
  });

  const updatedSession = await getM3Session(session.id);
  return {
    session: updatedSession!,
    output: outputs[0], // Retourner la première sortie
  };
}

/**
 * Sauvegarde automatique de l'état de la session
 */
export async function autoSaveM3Session(
  sessionId: string,
  updates: Partial<{
    clientData: ClientData;
    contracts: ContractData[];
    analysis: M3Analysis;
    status: M3SessionStatus;
  }>
): Promise<void> {
  await updateM3Session(sessionId, updates);
}
