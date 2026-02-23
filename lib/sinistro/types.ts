/**
 * Types pour le module de qualification des sinistres (Sinistro).
 * Alignés sur les conventions IRSA/IDA, IRSI, CIDE-COP, etc.
 */

/** Type de sinistre pour la qualification */
export type SinisterType =
  | "auto_materiel"
  | "auto_corporel"
  | "degats_eaux"
  | "incendie_immeuble"
  | "rc_pro"
  | "construction"
  | "pertes_indirectes_vol"
  | "autre";

/** Conventions inter-assurances applicables */
export type ConventionCode =
  | "IRSA_IDA"
  | "IRCA"
  | "PAOS"
  | "IRSI"
  | "CIDE_COP"
  | "CID_PIV"
  | "CRAC"
  | "hors_convention";

/** Cas IRSA (barème automobile matériel) */
export type IrsaCaseCode = 10 | 13 | 15 | 17 | 20 | 40 | 21;

/** Type de recours entre assureurs */
export type RecourseType = "full" | "partial" | "none";

/** Entrée pour la qualification d'un sinistre */
export interface SinisterInput {
  /** Type de sinistre (déduit ou fourni) */
  type: SinisterType;
  /** Pour auto : cas IRSA si déjà connu (sinon déduit des croix) */
  irsaCase?: IrsaCaseCode;
  /** Croix cochées côté conducteur A (cases 1 à 17) */
  croixA?: number[];
  /** Croix cochées côté conducteur B (cases 1 à 17) */
  croixB?: number[];
  /** Montant estimé du sinistre (HT, en euros) — pour habitation (IRSI, CIDE-COP) */
  amountEstimate?: number;
  /** Localisation : copropriété, maison_individuelle, locatif — pour habitation */
  location?: "copropriete" | "maison_individuelle" | "locatif";
  /** Pour auto : quel conducteur est "notre" assuré (A ou B) — pour désigner l'assureur gestionnaire côté client */
  ourPolicyHolder?: "A" | "B";
}

/** Répartition de responsabilité (A / B) en pourcentage */
export interface ResponsibilitySplit {
  partyA: number;
  partyB: number;
}

/** Assureur gestionnaire au sens IDA : chaque assureur gère son propre assuré */
export interface AssureurGestionnaire {
  /** Principe IDA : chaque assureur est gestionnaire pour son assuré */
  principle: "IDA";
  /** Pour l'assuré A : son assureur est gestionnaire pour A */
  forPartyA: string;
  /** Pour l'assuré B : son assureur est gestionnaire pour B */
  forPartyB: string;
  /** Libellé court pour affichage */
  summary: string;
}

/** Détail du recours entre assureurs */
export interface RecourseDetail {
  type: RecourseType;
  /** Qui peut exercer un recours (assureur du non-responsable ou partiellement responsable) */
  recourseBy?: "A" | "B" | "both";
  /** Répartition appliquée (ex. 100 % A → recours total de B vers A) */
  split: ResponsibilitySplit;
  /** Description courte */
  summary: string;
}

/** Résultat de la qualification (convention + gestionnaire + recours) */
export interface QualifySinisterResult {
  /** Convention(s) applicable(s) */
  convention: ConventionCode;
  /** Type de sinistre retenu */
  sinisterType: SinisterType;
  /** Cas IRSA si auto matériel */
  irsaCase?: IrsaCaseCode;
  /** Libellé du cas IRSA (ex. "Choc à l'arrière, même sens même file") */
  irsaCaseLabel?: string;
  /** Assureur gestionnaire (IDA : chacun pour son assuré) */
  assureurGestionnaire?: AssureurGestionnaire;
  /** Recours entre assureurs */
  recourse?: RecourseDetail;
  /** Message pour l'agent IA : rappel Convention vs Droit commun */
  droitCommunRappel: string;
}
