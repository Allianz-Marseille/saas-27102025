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

/**
 * Formate une date en timestamp relatif (ex: "Il y a 2 min", "À l'instant")
 * @param date La date à formater
 * @returns Une chaîne de caractères avec le timestamp relatif
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) {
    return "À l'instant";
  }
  if (minutes < 60) {
    return `Il y a ${minutes} min`;
  }
  if (hours < 24) {
    return `Il y a ${hours}h`;
  }
  if (days === 1) {
    return "Hier";
  }
  if (days < 7) {
    return `Il y a ${days} jours`;
  }
  
  // Pour les dates plus anciennes, afficher la date complète
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formate une date pour l'affichage dans les séparateurs de groupe
 * @param date La date à formater
 * @returns "Aujourd'hui", "Hier", ou "dd/MM/yyyy"
 */
export function getDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (messageDate.getTime() === today.getTime()) {
    return "Aujourd'hui";
  }
  if (messageDate.getTime() === yesterday.getTime()) {
    return "Hier";
  }
  
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Groupe les messages par date
 * @param messages Tableau de messages avec timestamp
 * @returns Objet avec les dates comme clés et les messages comme valeurs
 */
export function groupMessagesByDate<T extends { timestamp: Date }>(
  messages: T[]
): { [key: string]: T[] } {
  const groups: { [key: string]: T[] } = {};
  
  messages.forEach((message) => {
    const date = new Date(message.timestamp);
    const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
  });
  
  return groups;
}

