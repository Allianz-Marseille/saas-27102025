/**
 * Barème IRSA — Cas de responsabilité automobile (matériel).
 * Source : conventions France Assureurs, fiche 02-cas-irsa-constat-amiable.md
 */

import type { IrsaCaseCode } from "./types";

export interface IrsaCaseDefinition {
  cas: IrsaCaseCode;
  label: string;
  respA: number;
  respB: number;
}

export const IRSA_CASES: Record<IrsaCaseCode, IrsaCaseDefinition> = {
  10: {
    cas: 10,
    label: "Véhicules même sens, même file — choc à l'arrière",
    respA: 100,
    respB: 0,
  },
  13: {
    cas: 13,
    label: "Sens inverse — empiètement axe médian",
    respA: 50,
    respB: 50,
  },
  15: {
    cas: 15,
    label: "Changement de file ou de direction",
    respA: 100, // responsable = celui qui change (à inverser si B a changé)
    respB: 0,
  },
  17: {
    cas: 17,
    label: "Véhicule quittant stationnement ou voie privée",
    respA: 100, // responsable = celui qui sort (à inverser si B sort)
    respB: 0,
  },
  20: {
    cas: 20,
    label: "Refus de priorité à une intersection",
    respA: 100, // responsable = celui qui refuse la priorité (à inverser si B)
    respB: 0,
  },
  40: {
    cas: 40,
    label: "Choc contre véhicule en stationnement régulier",
    respA: 100, // A = véhicule circulant, B = en stationnement
    respB: 0,
  },
  21: {
    cas: 21,
    label: "Autre cas (à préciser selon barème officiel)",
    respA: 50,
    respB: 50,
  },
};

export function getIrsaCase(cas: IrsaCaseCode): IrsaCaseDefinition {
  return IRSA_CASES[cas];
}
