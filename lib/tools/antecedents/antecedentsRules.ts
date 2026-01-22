/**
 * Base de règles pour l'Assistant Antécédents Auto
 * Version : 2025-04
 * Source : Vademecums 04/2023 + Guide Souscription 04/2025
 */

import { SourceReglementaire } from "./antecedentsTypes";

export interface RegleCRM {
  id: string;
  label: string;
  conditions: {
    type_souscripteur?: string;
    nb_vehicules_actuels?: number | string; // 0 ou ">=1"
    conducteur_designe?: boolean;
    usage?: string;
    crm_ri?: string; // "<=1.00", "<=0.85"
    duree_ri_consecutive?: string; // ">=21_sur_24_mois"
    societe?: string; // "nouvelle_creation"
  };
  resultat?: {
    crm: number | string; // nombre ou "crm_ri"
    justification: string;
    annees_ri?: number;
  };
  calcul?: {
    methode: string; // "moyenne", "bonus_malus"
    formule: string;
    inclure?: string[];
    precision?: number;
    arrondir?: boolean;
  };
  blocages?: Array<{
    condition: string;
    message: string;
    type: "bloquant" | "alerte";
  }>;
  sources: SourceReglementaire[];
}

export interface RegleSinistres {
  id: string;
  label: string;
  conditions: {
    categorie?: string;
    usage?: string[];
    type_souscripteur?: string;
    situation?: string;
    nb_vehicules?: string; // ">=3 AND <=30"
    conducteur_designe?: boolean;
  };
  periode_mois: number;
  a_retenir?: string[]; // Sera converti en ResponsabiliteSinistre[] dans le moteur
  a_exclure?: string[]; // Sera converti en NatureSinistre[] dans le moteur
  regle_speciale?: string;
  sources: SourceReglementaire[];
}

export interface RegleBlocage {
  id: string;
  condition: string; // Expression à évaluer
  message: string;
  type: "bloquant" | "alerte";
  source: string;
}

export interface RegleAlerte {
  id: string;
  condition?: string; // Optionnel (ex: ALERT_SINISTRE_CLOS toujours affichée)
  message: string;
  type: "vigilance" | "question_securite";
  action?: string;
}

export interface RegleBonusMalus {
  id: string;
  label: string;
  conditions: {
    actualiser: boolean;
  };
  usage_prive: {
    coefficient_annuel: number;
    sinistre_responsable: number;
    sinistre_part_responsable: number;
  };
  usage_tous_deplacements: {
    coefficient_annuel: number;
    sinistre_responsable: number;
    sinistre_part_responsable: number;
  };
  formule: string;
  plancher: number;
  plafond: number;
  sources: SourceReglementaire[];
}

export interface RegleInterruption {
  id: string;
  label: string;
  conditions: {
    interruption_mois: string; // "<36" ou ">=36"
  };
  resultat: {
    reprise_bonus: boolean;
    justification: string;
  };
  sources: SourceReglementaire[];
}

export interface BaseRegles {
  version: string;
  source: string;
  regles: {
    crm: RegleCRM[];
    sinistres: RegleSinistres[];
    bonus_malus: RegleBonusMalus[];
    interruption: RegleInterruption[];
    blocages: RegleBlocage[];
    alertes: RegleAlerte[];
  };
}

export const antecedentsRules: BaseRegles = {
  version: "2025-04",
  source: "Vademecums 04/2023 + Guide Souscription 04/2025",
  regles: {
    crm: [
      {
        id: "PM_01",
        label: "Personne morale – 1er véhicule sans conducteur",
        conditions: {
          type_souscripteur: "personne_morale",
          nb_vehicules_actuels: 0,
          conducteur_designe: false,
        },
        resultat: {
          crm: 0.70,
          justification: "Société assurant un véhicule 4R <3,5t pour la 1ère fois",
          annees_ri: 0,
        },
        sources: [
          {
            document: "Vademecum_Auto-Personnes_morales_V04-23.pdf",
            page: 8,
            ligne: "Tableau CRM initial PM",
          },
        ],
      },
      {
        id: "PM_02",
        label: "Personne morale – ajout véhicule (moyenne parc)",
        conditions: {
          type_souscripteur: "personne_morale",
          nb_vehicules_actuels: ">=1",
          conducteur_designe: false,
        },
        calcul: {
          methode: "moyenne",
          formule: "sum(crm_vehicules_4R_<3.5t) / count(vehicules)",
          inclure: ["contrats_actifs", "resilies_<12_mois"],
          precision: 2,
          arrondir: false,
        },
        sources: [
          {
            document: "Vademecum_Auto-Personnes_morales_V04-23.pdf",
            page: 9,
            section: "Ajout véhicule – calcul moyenne",
          },
        ],
      },
      {
        id: "PM_03",
        label: "Personne morale – conducteur désigné",
        conditions: {
          type_souscripteur: "personne_morale",
          conducteur_designe: true,
        },
        resultat: {
          crm: "crm_ri",
          justification: "Reprise antécédents du conducteur habituel",
        },
        sources: [
          {
            document: "Vademecum_Auto-Personnes_morales_V04-23.pdf",
            page: 11,
            section: "Conducteur désigné",
          },
        ],
      },
      {
        id: "VTC_01",
        label: "VTC – Personne physique avec antécédents",
        conditions: {
          usage: "VTC",
          type_souscripteur: "personne_physique",
          crm_ri: "<=1.00",
          duree_ri_consecutive: ">=21_sur_24_mois",
        },
        resultat: {
          crm: "crm_ri",
          justification: "Reprise CRM RI sous conditions strictes VTC",
        },
        blocages: [
          {
            condition: "crm_ri > 1.00",
            message: "SOUSCRIPTION INTERDITE – Malus VTC",
            type: "bloquant",
          },
          {
            condition: "carte_vtc == false",
            message: "SOUSCRIPTION INTERDITE – Carte VTC obligatoire",
            type: "bloquant",
          },
          {
            condition: "crm_ri > 0.85",
            message: "Majoration DTR +80%",
            type: "alerte",
          },
        ],
        sources: [
          {
            document: "GUIDE DE SOUSCRIPTION RES35901-V0425-BD.pdf",
            page: 14,
            section: "VTC – Conditions souscription PP",
          },
        ],
      },
      {
        id: "VTC_02",
        label: "VTC – Personne morale (société en création)",
        conditions: {
          usage: "VTC",
          type_souscripteur: "personne_morale",
          societe: "nouvelle_creation",
        },
        resultat: {
          crm: 0.85,
          justification: "Bonus société VTC en création",
        },
        blocages: [
          {
            condition: "carte_vtc == false",
            message: "SOUSCRIPTION INTERDITE – Carte VTC obligatoire",
            type: "bloquant",
          },
        ],
        sources: [
          {
            document: "GUIDE DE SOUSCRIPTION RES35901-V0425-BD.pdf",
            page: 17,
            section: "VTC – Société en création",
          },
        ],
      },
    ],
    sinistres: [
      {
        id: "SIN_01",
        label: "Standard 4 roues <3,5t – 36 mois",
        conditions: {
          categorie: "4_roues_<3.5t",
          usage: ["prive", "tous_deplacements", "professionnel"],
        },
        periode_mois: 36,
        a_retenir: [
          "responsable",
          "partiellement_responsable",
          "non_responsable",
          "bris_de_glace",
        ],
        a_exclure: [
          "catastrophe_naturelle",
          "catastrophe_technologique",
          "attentat",
        ],
        sources: [
          {
            document: "Vademecum_Saisie_des_sinistres_V04-23.pdf",
            page: 4,
            section: "Tableau récapitulatif 4R <3,5t",
          },
        ],
      },
      {
        id: "SIN_02",
        label: "PM – 2e véhicule (cumul parc)",
        conditions: {
          type_souscripteur: "personne_morale",
          situation: "ajout_2e_vehicule",
          conducteur_designe: false,
        },
        periode_mois: 36,
        regle_speciale: "Cumuler sinistres RI du 1er véhicule + nouveau véhicule",
        sources: [
          {
            document: "Vademecum_Auto-Personnes_morales_V04-23.pdf",
            page: 13,
            section: "Ajout 2e véhicule – sinistres",
          },
        ],
      },
      {
        id: "SIN_03",
        label: "PM – Parc 3 à 30 véhicules (sinistre le plus récent 12 mois)",
        conditions: {
          type_souscripteur: "personne_morale",
          nb_vehicules: ">=3 AND <=30",
          conducteur_designe: false,
        },
        periode_mois: 12,
        regle_speciale: "Retenir uniquement le sinistre le plus récent",
        a_exclure: [
          "catastrophe_naturelle",
          "catastrophe_technologique",
          "attentat",
          "vol",
          "incendie",
          "bris_de_glace",
        ],
        sources: [
          {
            document: "Vademecum_Auto-Personnes_morales_V04-23.pdf",
            page: 14,
            section: "Parc 3 à 30 véhicules",
          },
        ],
      },
      {
        id: "SIN_04_VTC",
        label: "VTC – règle spécifique",
        conditions: {
          usage: ["VTC"],
        },
        periode_mois: 36,
        a_retenir: [
          "responsable",
          "non_responsable",
          "bris_de_glace",
        ],
        sources: [
          {
            document: "GUIDE DE SOUSCRIPTION RES35901-V0425-BD.pdf",
            page: 15,
            section: "VTC – Sinistres",
          },
        ],
      },
    ],
    bonus_malus: [
      {
        id: "BM_01",
        label: "Bonus-malus – actualisation",
        conditions: {
          actualiser: true,
        },
        usage_prive: {
          coefficient_annuel: 0.95,
          sinistre_responsable: 0.25,
          sinistre_part_responsable: 0.125,
        },
        usage_tous_deplacements: {
          coefficient_annuel: 0.93,
          sinistre_responsable: 0.20,
          sinistre_part_responsable: 0.10,
        },
        formule: "CRM_nouveau = CRM_actuel × coef_annuel × (1 + malus_sinistres)",
        plancher: 0.50,
        plafond: 3.50,
        sources: [
          {
            document: "Vademecum_Bonus_malus_V04-23.pdf",
            page: 3,
            section: "Coefficients annuels et malus",
          },
        ],
      },
    ],
    interruption: [
      {
        id: "INT_01",
        label: "Interruption <36 mois",
        conditions: {
          interruption_mois: "<36",
        },
        resultat: {
          reprise_bonus: true,
          justification: "Interruption <36 mois : reprise bonus possible",
        },
        sources: [
          {
            document: "Vademecum_Auto-Releve_informations_V04-23.pdf",
            page: 6,
            section: "Interruption assurance",
          },
        ],
      },
      {
        id: "INT_02",
        label: "Interruption >36 mois",
        conditions: {
          interruption_mois: ">=36",
        },
        resultat: {
          reprise_bonus: false,
          justification: "Interruption >36 mois : perte bonus, CRM par défaut",
        },
        sources: [
          {
            document: "Vademecum_Auto-Releve_informations_V04-23.pdf",
            page: 7,
            section: "Interruption >36 mois",
          },
        ],
      },
    ],
    blocages: [
      {
        id: "BLOC_VTC_MALUS",
        condition: "usage == 'VTC' AND crm > 1.00",
        message: "SOUSCRIPTION INTERDITE – Risque VTC avec malus non accepté",
        type: "bloquant",
        source: "GUIDE DE SOUSCRIPTION RES35901-V0425-BD.pdf, p.15",
      },
      {
        id: "BLOC_VTC_CARTE",
        condition: "usage == 'VTC' AND carte_vtc == false",
        message: "SOUSCRIPTION INTERDITE – Carte VTC obligatoire",
        type: "bloquant",
        source: "GUIDE DE SOUSCRIPTION RES35901-V0425-BD.pdf, p.16",
      },
      {
        id: "BLOC_GERANT_MAX2",
        condition: "conducteur_type == 'gerant' AND nb_vehicules_gerant > 2",
        message: "BLOCAGE – Un gérant peut être désigné sur maximum 2 véhicules",
        type: "bloquant",
        source: "Vademecum_Auto-Personnes_morales_V04-23.pdf, p.11",
      },
    ],
    alertes: [
      {
        id: "ALERT_RI_ABSENT",
        condition: "ri_absent OR ri_date > 3_mois",
        message: "RI absent ou >3 mois : impossibilité de reprendre le bonus",
        type: "vigilance",
        action: "Demander RI à l'ancien assureur",
      },
      {
        id: "ALERT_SINISTRE_CLOS",
        message: "Un sinistre clos sans règlement peut ne pas figurer au RI",
        type: "question_securite",
        action: "Poser la question au client systématiquement",
      },
    ],
  },
};
