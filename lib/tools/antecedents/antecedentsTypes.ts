/**
 * Types pour le module Antécédents (journal de décision, règles CRM, sinistres)
 */

export interface JournalDecision {
  contexte: {
    [key: string]: unknown;
  };
  crm: {
    valeur: string;
    justification: string;
    calcul?: string;
  };
  sinistres: {
    regle: {
      periode_mois: number;
    };
    liste: Array<{ [key: string]: unknown }>;
  };
  alertes: Array<{
    message: string;
    [key: string]: unknown;
  }>;
}
