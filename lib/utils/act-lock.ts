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
 * @param act L'acte à vérifier (avec dateSaisie pouvant être Date, Timestamp ou string)
 * @param userData Les données de l'utilisateur connecté
 * @returns true si l'acte est bloqué pour cet utilisateur, false sinon
 */
export function isActLocked(
  act: { dateSaisie: Date | Timestamp | string | unknown } | null, 
  userData: UserData | null
): boolean {
  if (!act) return false;
  
  // Les administrateurs ne sont jamais bloqués
  if (isAdmin(userData)) {
    return false;
  }
  
  const now = new Date();
  const today = now.getDate();
  
  // Convertir dateSaisie en Date quelque soit son format
  let dateSaisie: Date;
  
  if (act.dateSaisie instanceof Date) {
    dateSaisie = act.dateSaisie;
  } else if (act.dateSaisie instanceof Timestamp) {
    dateSaisie = act.dateSaisie.toDate();
  } else if (typeof act.dateSaisie === 'object' && act.dateSaisie !== null && 'toDate' in act.dateSaisie) {
    dateSaisie = (act.dateSaisie as Timestamp).toDate();
  } else {
    dateSaisie = new Date(act.dateSaisie as string | number);
  }
  
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

