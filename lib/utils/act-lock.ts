import { Act } from "@/types";
import { Timestamp } from "firebase/firestore";
import { UserData } from "@/lib/firebase/auth";
import { isAdmin } from "./roles";

/**
 * Vérifie si un acte est bloqué pour l'utilisateur connecté
 * 
 * Règle de blocage :
 * - Le 15 du mois M, les actes du mois M-1 sont bloqués pour les commerciaux
 * - Exemple : Le 15 février, la production de janvier est bloquée
 * 
 * Les administrateurs ne sont JAMAIS bloqués
 * 
 * @param act L'acte à vérifier
 * @param userData Les données de l'utilisateur connecté
 * @returns true si l'acte est bloqué pour cet utilisateur, false sinon
 */
export function isActLocked(act: Act | null, userData: UserData | null): boolean {
  if (!act) return false;
  
  // Les administrateurs ne sont jamais bloqués
  if (isAdmin(userData)) {
    return false;
  }
  
  const now = new Date();
  const today = now.getDate();
  
  // Convertir Timestamp en Date si nécessaire
  const dateSaisie = act.dateSaisie instanceof Timestamp 
    ? act.dateSaisie.toDate() 
    : act.dateSaisie instanceof Date 
      ? act.dateSaisie 
      : new Date(act.dateSaisie);
  
  // Si on est le 15 ou après le 15 du mois actuel
  if (today >= 15) {
    const actYear = dateSaisie.getFullYear();
    const actMonth = dateSaisie.getMonth();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    
    // Si l'acte est d'un mois précédent, il est bloqué pour les commerciaux
    if (actYear < nowYear || (actYear === nowYear && actMonth < nowMonth)) {
      return true;
    }
  }
  
  return false;
}

