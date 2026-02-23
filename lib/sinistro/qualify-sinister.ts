/**
 * Qualification des sinistres — logique multi-étapes (Sinistro).
 * 1. Identifie la convention (ex. auto + matériel → IRSA/IDA).
 * 2. Assigne l'assureur gestionnaire (IDA : chaque assureur indemnise son client).
 * 3. Calcule le recours selon le cas IRSA (total, partiel, aucun).
 */

import { getIrsaCase } from "./irsa-cases";
import type {
  SinisterInput,
  QualifySinisterResult,
  AssureurGestionnaire,
  RecourseDetail,
  RecourseType,
} from "./types";

const DROIT_COMMUN_RAPPEL =
  "Les conventions (IRSA, IDA, etc.) ne sont pas opposables aux tiers : elles organisent le règlement entre assureurs. Le droit du client à être indemnisé par son assureur relève du droit commun (contrat, loi).";

/**
 * Détermine le type de recours à partir de la répartition de responsabilité (cas IRSA).
 */
function getRecourseType(respA: number, respB: number): RecourseType {
  if (respA === 0 && respB === 100) return "full"; // B responsable → recours total de A vers B
  if (respA === 100 && respB === 0) return "full"; // A responsable → recours total de B vers A
  if (respA > 0 && respA < 100 && respB > 0 && respB < 100) return "partial";
  return "none";
}

/**
 * Construit le détail du recours pour un cas IRSA donné.
 */
function buildRecourseDetail(
  respA: number,
  respB: number,
  irsaCase: number
): RecourseDetail {
  const type = getRecourseType(respA, respB);
  let recourseBy: "A" | "B" | "both" | undefined;
  let summary: string;

  if (type === "full") {
    if (respA === 100) {
      recourseBy = "B";
      summary = "Recours total : l'assureur du conducteur B exerce un recours contre l'assureur du conducteur A (responsable 100 %).";
    } else {
      recourseBy = "A";
      summary = "Recours total : l'assureur du conducteur A exerce un recours contre l'assureur du conducteur B (responsable 100 %).";
    }
  } else if (type === "partial") {
    recourseBy = "both";
    summary = `Recours partiel : chaque assureur peut exercer un recours à hauteur de la part de responsabilité de l'autre (Cas ${irsaCase} : ${respA} % A / ${respB} % B).`;
  } else {
    summary = "Aucun recours entre assureurs au titre de ce cas.";
  }

  return {
    type,
    recourseBy,
    split: { partyA: respA, partyB: respB },
    summary,
  };
}

/**
 * Qualifie un sinistre : convention, assureur gestionnaire, recours.
 * Pour l'auto matériel, applique IRSA/IDA et le cas IRSA (fourni ou déduit).
 */
export function qualifySinister(data: SinisterInput): QualifySinisterResult {
  const { type, irsaCase, amountEstimate, location } = data;

  // ——— Auto matériel : IRSA / IDA ———
  if (type === "auto_materiel") {
    const cas = irsaCase ?? 13; // défaut 50/50 si non précisé
    const definition = getIrsaCase(cas);

    const assureurGestionnaire: AssureurGestionnaire = {
      principle: "IDA",
      forPartyA: "L'assureur du conducteur A est gestionnaire pour l'indemnisation du conducteur A.",
      forPartyB: "L'assureur du conducteur B est gestionnaire pour l'indemnisation du conducteur B.",
      summary: "IDA : chaque assureur indemnise directement son propre client, puis règle le recours avec l'autre assureur selon le cas IRSA.",
    };

    const recourse = buildRecourseDetail(
      definition.respA,
      definition.respB,
      definition.cas
    );

    return {
      convention: "IRSA_IDA",
      sinisterType: "auto_materiel",
      irsaCase: definition.cas,
      irsaCaseLabel: definition.label,
      assureurGestionnaire,
      recourse,
      droitCommunRappel: DROIT_COMMUN_RAPPEL,
    };
  }

  // ——— Auto corporel : IRCA / PAOS ———
  if (type === "auto_corporel") {
    return {
      convention: "IRCA",
      sinisterType: "auto_corporel",
      assureurGestionnaire: {
        principle: "IDA",
        forPartyA: "Assureur du conducteur A (victime ou responsable).",
        forPartyB: "Assureur du conducteur B.",
        summary: "IRCA/PAOS : indemnisation et recours corporels selon barème ; provisions possibles (PAOS) pour les cas graves.",
      },
      droitCommunRappel: DROIT_COMMUN_RAPPEL,
    };
  }

  // ——— Dégâts des eaux / incendie immeuble : IRSI ou CIDE-COP ———
  if (type === "degats_eaux" || type === "incendie_immeuble") {
    const amount = amountEstimate ?? 0;
    let convention: "IRSI" | "CIDE_COP" = "IRSI";
    if (amount > 5_000) convention = "CIDE_COP";
    else if (amount > 1_600) convention = "IRSI"; // tranche 2

    const summary =
      amount < 1_600
        ? "IRSI Tranche 1 : assureur gestionnaire (souvent celui du local sinistré) indemnise sans recours."
        : amount <= 5_000
          ? "IRSI Tranche 2 : assureur gestionnaire indemnise, recours possible selon barème."
          : "CIDE-COP : gros sinistre copropriété ; recours selon convention.";

    return {
      convention,
      sinisterType: type,
      assureurGestionnaire: {
        principle: "IDA",
        forPartyA: "Assureur du local / occupant (souvent assureur gestionnaire).",
        forPartyB: "Autres parties (copropriété, voisins).",
        summary,
      },
      recourse: {
        type: amount < 1_600 ? "none" : "partial",
        split: { partyA: 0, partyB: 0 },
        summary,
      },
      droitCommunRappel: DROIT_COMMUN_RAPPEL,
    };
  }

  // ——— Pro / RC : CID-PIV, CRAC ———
  if (type === "pertes_indirectes_vol") {
    return {
      convention: "CID_PIV",
      sinisterType: "pertes_indirectes_vol",
      droitCommunRappel: DROIT_COMMUN_RAPPEL,
    };
  }
  if (type === "construction") {
    return {
      convention: "CRAC",
      sinisterType: "construction",
      droitCommunRappel: DROIT_COMMUN_RAPPEL,
    };
  }

  return {
    convention: "hors_convention",
    sinisterType: type,
    droitCommunRappel: DROIT_COMMUN_RAPPEL,
  };
}
