import { Timestamp } from "firebase/firestore";

/**
 * Convertit une date (Date, Timestamp ou autre) en objet Date
 * @param date La date à convertir
 * @returns Un objet Date valide
 */
export function toDate(date: Date | Timestamp | string | number | unknown): Date {
  if (date instanceof Date) {
    return date;
  }
  
  if (date instanceof Timestamp) {
    return date.toDate();
  }
  
  if (typeof date === 'object' && date !== null && 'toDate' in date) {
    return (date as Timestamp).toDate();
  }
  
  return new Date(date as string | number);
}

