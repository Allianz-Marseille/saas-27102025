/**
 * Types pour le module Boost (déclarations et suivi des avis clients)
 */

import { Timestamp } from "firebase/firestore";

/**
 * Types de boost supportés
 */
export type BoostType = "GOOGLE";

/**
 * Rémunération par type de boost (€)
 */
export const BOOST_REMUNERATION: Record<BoostType, number> = {
  GOOGLE: 5,
};

/**
 * Document principal d'un boost
 */
export interface Boost {
  id?: string;
  userId: string;
  type: BoostType;
  clientName: string;
  stars: number; // 1 à 5
  remuneration: number; // en euros
  date: Date | Timestamp; // date de saisie (auto)
  createdAt: Date | Timestamp;
}

/**
 * Boost avec données utilisateur enrichies (pour admin/liste)
 */
export interface BoostWithUser extends Boost {
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
}
