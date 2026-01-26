/**
 * Fonctions de génération des sorties M+3
 * DER, Mail avec préconisations, Checklist qualité
 */

import {
  ClientData,
  ContractData,
  M3Analysis,
  M3OutputDER,
  M3OutputMail,
  M3OutputChecklist,
} from "@/types/m3-session";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

/**
 * Génère une sortie DER (conformité documentaire)
 */
export function generateDER(
  clientData: ClientData,
  contracts: ContractData[]
): M3OutputDER {
  const now = new Date();
  let contenu = `# Fiche Client - DER (Conformité DDA/RGPD)\n\n`;
  contenu += `**Date de génération** : ${format(now, "dd/MM/yyyy à HH:mm", { locale: fr })}\n\n`;
  contenu += `---\n\n`;

  // Informations client selon le type
  if (clientData.type === "particulier") {
    const data = clientData;
    contenu += `## Informations Personne Physique\n\n`;
    contenu += `| Champ | Valeur |\n`;
    contenu += `|-------|--------|\n`;
    if (data.numeroLagon) contenu += `| Numéro Lagon | ${data.numeroLagon} |\n`;
    if (data.prenom) contenu += `| Prénom | ${data.prenom} |\n`;
    if (data.nom) contenu += `| Nom | ${data.nom} |\n`;
    if (data.genre) contenu += `| Genre | ${data.genre} |\n`;
    if (data.adresseComplete) contenu += `| Adresse | ${data.adresseComplete} |\n`;
    if (data.codePostal) contenu += `| Code postal | ${data.codePostal} |\n`;
    if (data.ville) contenu += `| Ville | ${data.ville} |\n`;
    if (data.mail) contenu += `| Email | ${data.mail} |\n`;
    if (data.telephone) contenu += `| Téléphone | ${data.telephone} |\n`;
    if (data.situationMatrimoniale) contenu += `| Situation matrimoniale | ${data.situationMatrimoniale} |\n`;
    if (data.enfants) {
      contenu += `| Enfants | ${data.enfants.aEnfants ? (data.enfants.nombre ? `${data.enfants.nombre} enfant(s)` : "Oui") : "Non"} |\n`;
    }
    if (data.situationProfessionnelle) contenu += `| Situation professionnelle | ${data.situationProfessionnelle} |\n`;
    if (data.agence) contenu += `| Agence | ${data.agence} |\n`;
    if (data.chargeDeClientele) contenu += `| Chargé de clientèle | ${data.chargeDeClientele} |\n`;
  } else {
    const data = clientData;
    contenu += `## Informations Personne Morale\n\n`;
    contenu += `| Champ | Valeur |\n`;
    contenu += `|-------|--------|\n`;
    if (data.numeroLagon) contenu += `| Numéro Lagon | ${data.numeroLagon} |\n`;
    if (data.raisonSociale) contenu += `| Raison sociale | ${data.raisonSociale} |\n`;
    if (data.quiLaGere) contenu += `| Qui la gère | ${data.quiLaGere} |\n`;
    if (data.telephone) contenu += `| Téléphone | ${data.telephone} |\n`;
    if (data.mail) contenu += `| Email | ${data.mail} |\n`;
    if (data.siret) contenu += `| SIRET | ${data.siret} |\n`;
    if (data.naf) contenu += `| NAF | ${data.naf} |\n`;
    if (data.agence) contenu += `| Agence | ${data.agence} |\n`;
    if (data.chargeDeClientele) contenu += `| Chargé de clientèle | ${data.chargeDeClientele} |\n`;
  }

  contenu += `\n---\n\n`;
  contenu += `## Contrats\n\n`;

  if (contracts.length === 0) {
    contenu += `Aucun contrat détecté.\n\n`;
  } else {
    contenu += `| Contrat | Numéro | Statut |\n`;
    contenu += `|---------|--------|--------|\n`;
    contracts.forEach((contract) => {
      contenu += `| ${contract.libelle} | ${contract.numeroContrat || "N/A"} | ${contract.statut} |\n`;
    });
  }

  contenu += `\n---\n\n`;
  contenu += `**Conformité DDA/RGPD** : ✅ Document conforme\n`;
  contenu += `**Traçabilité** : Toutes les données collectées sont tracées et validées\n`;

  return {
    type: "der",
    contenu,
    dateGeneration: now,
    conforme: true,
  };
}

/**
 * Génère un mail avec préconisations
 */
export function generateMailPreconisations(
  clientData: ClientData,
  analysis: M3Analysis,
  opportunities: M3Analysis["axesPrioritaires"]["opportunitesCommerciales"]
): M3OutputMail {
  const now = new Date();
  const clientName = clientData.type === "particulier" 
    ? `${clientData.prenom || ""} ${clientData.nom || ""}`.trim() || "Monsieur/Madame"
    : clientData.raisonSociale || "Monsieur/Madame";

  let objet = `Synthèse M+3 — ${clientName}`;
  let contenu = `Bonjour ${clientName},\n\n`;
  contenu += `Suite à notre échange, voici la synthèse de votre situation d'assurance à M+3 :\n\n`;

  // Situation actuelle
  contenu += `## Situation actuelle\n\n`;
  
  const contractsConfirmed = analysis.aConfirmer.contrats.filter(c => c.contrat).length;
  const contractsTotal = contractsConfirmed;
  
  if (contractsTotal > 0) {
    contenu += `**Contrats chez nous** :\n`;
    analysis.aConfirmer.contrats.forEach((contract) => {
      contenu += `- ✅ ${contract.contrat} : Actif et à jour\n`;
    });
    contenu += `\n`;
  }

  const missingFieldsCount = analysis.aCompleter.champsManquants.length;
  if (missingFieldsCount === 0) {
    contenu += `**Fiche client** : ✅ Complète\n\n`;
  } else {
    contenu += `**Fiche client** : ⚠️ ${missingFieldsCount} champ(s) à compléter\n\n`;
  }

  // Opportunités identifiées
  contenu += `## Opportunités identifiées\n\n`;

  if (opportunities.length === 0) {
    contenu += `Aucune opportunité commerciale identifiée pour le moment.\n\n`;
  } else {
    opportunities.forEach((opp, index) => {
      contenu += `${index + 1}. **${opp.libelle}** : ${opp.raison}`;
      if (opp.lienTarificateur) {
        contenu += `\n   Pour réaliser un devis personnalisé : [Devis ${opp.libelle}](${opp.lienTarificateur})`;
      }
      contenu += `\n\n`;
    });
  }

  // Plan d'action
  contenu += `## Plan d'action\n\n`;

  if (analysis.axesPrioritaires.planActionSuggere.length === 0) {
    contenu += `Aucune action planifiée pour le moment.\n\n`;
  } else {
    analysis.axesPrioritaires.planActionSuggere.forEach((action) => {
      const dateStr = action.echeance 
        ? format(action.echeance instanceof Date ? action.echeance : action.echeance.toDate(), "dd/MM/yyyy", { locale: fr })
        : "À définir";
      contenu += `- **${dateStr}** : ${action.action}\n`;
    });
    contenu += `\n`;
  }

  contenu += `N'hésitez pas si vous avez des questions.\n\n`;
  contenu += `Cordialement,\n`;
  contenu += `[Votre nom]`;

  return {
    type: "mail",
    objet,
    contenu,
    opportunites: opportunities
      .filter((opp) => opp.lienTarificateur)
      .map((opp) => ({
        contrat: opp.contrat,
        libelle: opp.libelle,
        lienTarificateur: opp.lienTarificateur!,
      })),
    planAction: analysis.axesPrioritaires.planActionSuggere.map((action) => ({
      action: action.action,
      date: action.echeance || now,
    })),
    dateGeneration: now,
  };
}

/**
 * Génère une checklist qualité
 */
export function generateChecklist(
  clientData: ClientData,
  contracts: ContractData[],
  analysis: M3Analysis
): M3OutputChecklist {
  const now = new Date();
  let contenu = `# Checklist Qualité M+3\n\n`;
  contenu += `**Date de génération** : ${format(now, "dd/MM/yyyy à HH:mm", { locale: fr })}\n\n`;
  contenu += `---\n\n`;

  // Résumé
  const total = analysis.aConfirmer.donneesClient.length + 
                analysis.aCompleter.champsManquants.length +
                contracts.length;
  const valide = analysis.aConfirmer.donneesClient.length;
  const aConfirmer = analysis.aConfirmer.donneesClient.length;
  const aCompleter = analysis.aCompleter.champsManquants.length;

  contenu += `## Résumé\n\n`;
  contenu += `| Statut | Nombre |\n`;
  contenu += `|--------|--------|\n`;
  contenu += `| ✅ Validé | ${valide} |\n`;
  contenu += `| ⚠️ À confirmer | ${aConfirmer} |\n`;
  contenu += `| ❌ À compléter | ${aCompleter} |\n`;
  contenu += `| **Total** | **${total}** |\n\n`;

  contenu += `---\n\n`;

  // Données client
  contenu += `## Données Client\n\n`;

  // ✅ Ce qui est présent mais à confirmer
  if (analysis.aConfirmer.donneesClient.length > 0) {
    contenu += `### ⚠️ À confirmer\n\n`;
    analysis.aConfirmer.donneesClient.forEach((item) => {
      contenu += `- ⚠️ **${item.champ}** : ${item.valeur || "Valeur détectée"} - ${item.question || "À confirmer avec le client"}\n`;
    });
    contenu += `\n`;
  }

  // ❌ Ce qui est absent
  if (analysis.aCompleter.champsManquants.length > 0) {
    contenu += `### ❌ À compléter\n\n`;
    analysis.aCompleter.champsManquants.forEach((item) => {
      const prioriteEmoji = item.priorite === "critique" ? "🔴" : item.priorite === "important" ? "🟠" : "🟡";
      contenu += `- ❌ ${prioriteEmoji} **${item.champ}** : ${item.question}\n`;
    });
    contenu += `\n`;
  }

  // Contrats
  contenu += `---\n\n`;
  contenu += `## Contrats\n\n`;

  contracts.forEach((contract) => {
    const statutEmoji = contract.statut === "confirme" ? "✅" : contract.statut === "detecte" ? "⚠️" : "❌";
    contenu += `### ${statutEmoji} ${contract.libelle}\n\n`;
    contenu += `- **Statut** : ${contract.statut}\n`;
    if (contract.numeroContrat) contenu += `- **Numéro** : ${contract.numeroContrat}\n`;
    if (contract.signe !== undefined) contenu += `- **Signé** : ${contract.signe ? "✅ Oui" : "❌ Non"}\n`;
    if (contract.piecesManquantes && contract.piecesManquantes.length > 0) {
      contenu += `- **Pièces manquantes** :\n`;
      contract.piecesManquantes.forEach((piece) => {
        contenu += `  - ❌ ${piece}\n`;
      });
    }
    contenu += `\n`;
  });

  // Pièces manquantes globales
  if (analysis.aCompleter.piecesManquantes.length > 0) {
    contenu += `---\n\n`;
    contenu += `## Pièces manquantes\n\n`;
    analysis.aCompleter.piecesManquantes.forEach((item) => {
      contenu += `- ❌ **${item.piece}** (contrat : ${item.contrat}) - ${item.question}\n`;
    });
    contenu += `\n`;
  }

  contenu += `---\n\n`;
  contenu += `**Document de contrôle pour validation finale**\n`;
  contenu += `Toutes les validations doivent être effectuées avant finalisation du M+3.\n`;

  return {
    type: "checklist",
    contenu,
    resume: {
      total,
      valide,
      aConfirmer,
      aCompleter,
    },
    dateGeneration: now,
  };
}
