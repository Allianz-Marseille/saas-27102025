/**
 * Types TypeScript pour l'outil Assistant Antécédents Auto
 */

export type TypeSouscripteur = "personne_morale" | "personne_physique" | "assimile_pm";
export type UsageVehicule = "prive" | "tous_deplacements" | "professionnel" | "VTC" | "transport_marchandises" | "transport_personnes";
export type SituationSouscription = "premier_vehicule" | "ajout_vehicule" | "remplacement" | "flotte_importante";
export type TypeConducteur = "gerant" | "salarie" | "autre";
export type ResponsabiliteSinistre = "responsable" | "partiellement_responsable" | "non_responsable";
export type NatureSinistre = "collision" | "bris_de_glace" | "vol" | "incendie" | "catastrophe_naturelle" | "catastrophe_technologique" | "attentat" | "autre";
export type StatutSinistre = "clos" | "en_cours" | "sans_reglement" | "pre_ouverture";

/**
 * Contexte de souscription
 */
export interface ContexteSouscription {
  type_souscripteur: TypeSouscripteur;
  usage: UsageVehicule;
  situation: SituationSouscription;
  nb_vehicules_actuels: number;
  conducteur_designe: boolean;
  conducteur_type?: TypeConducteur;
  conducteur_nom?: string;
  nb_vehicules_gerant?: number; // Nombre de véhicules où le gérant est déjà désigné
}

/**
 * Relevé d'informations (RI)
 */
export interface ReleveInformations {
  present: boolean;
  date?: Date;
  crm_ri?: number;
  duree_ri_mois?: number;
  duree_ri_consecutive_mois?: number; // Pour VTC : >=21 sur 24 mois
  continuite_assurance: boolean;
  interruption_mois?: number; // Durée d'interruption si applicable
  annees_ri_justifiees?: number;
}

/**
 * Sinistre déclaré
 */
export interface Sinistre {
  id?: string;
  date: Date;
  nature: NatureSinistre;
  responsabilite: ResponsabiliteSinistre;
  montant: number;
  statut: StatutSinistre;
}

/**
 * Résultat du calcul CRM
 */
export interface ResultatCRM {
  valeur: number;
  regle_id: string;
  justification: string;
  calcul?: string; // Formule de calcul si applicable (ex: moyenne parc)
  annees_ri_justifiees?: number;
  sources: SourceReglementaire[];
}

/**
 * Règle de sinistres appliquée
 */
export interface RegleSinistres {
  regle_id: string;
  periode_mois: number;
  a_retenir: ResponsabiliteSinistre[];
  a_exclure: NatureSinistre[];
  regle_speciale?: string; // Ex: "Cumuler sinistres RI du 1er véhicule"
  sources: SourceReglementaire[];
}

/**
 * Blocage détecté
 */
export interface Blocage {
  id: string;
  message: string;
  type: "bloquant" | "alerte";
  source: string;
}

/**
 * Alerte de vigilance
 */
export interface Alerte {
  id: string;
  message: string;
  type: "vigilance" | "question_securite";
  action?: string;
}

/**
 * Source réglementaire (vademecum)
 */
export interface SourceReglementaire {
  document: string;
  page: number;
  section?: string;
  ligne?: string;
}

/**
 * Pièces à conserver
 */
export interface PiecesAConserver {
  ri_conducteur: boolean;
  ri_vehicule?: boolean; // Pour PM avec plusieurs véhicules
  carte_vtc?: boolean;
  justificatif_affectation?: boolean; // Pour conducteur désigné
}

/**
 * Journal de décision complet
 */
export interface JournalDecision {
  contexte: ContexteSouscription;
  crm: ResultatCRM;
  sinistres: {
    regle: RegleSinistres;
    liste: Sinistre[];
  };
  pieces: PiecesAConserver;
  blocages: Blocage[];
  alertes: Alerte[];
  sources: SourceReglementaire[];
  date_generation: Date;
  version_regles: string;
}
