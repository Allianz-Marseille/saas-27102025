/**
 * Gestion de la collection leaderboard
 * 
 * Cette collection contient des données agrégées pour optimiser l'affichage
 * des classements sans exposer tous les actes individuels.
 * 
 * Structure d'un document leaderboard:
 * {
 *   userId: string;
 *   email: string;
 *   firstName: string;
 *   monthKey: string;  // format YYYY-MM
 *   commissions: number;
 *   process: number;
 *   ca: number;
 *   actsCount: number;
 *   lastUpdated: Timestamp;
 * }
 */

import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from "firebase/firestore";
import { db } from "./config";

export interface LeaderboardEntry {
  id?: string;
  userId: string;
  email: string;
  firstName: string;
  monthKey: string;
  commissions: number;
  process: number;
  ca: number;
  actsCount: number;
  lastUpdated?: Date;
}

/**
 * Récupère le leaderboard pour un mois donné
 * @param monthKey Format YYYY-MM
 * @param limit Nombre maximum de résultats (défaut: 100)
 */
export async function getLeaderboard(
  monthKey: string,
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  if (!db) {
    console.warn("Firestore not initialized");
    return [];
  }

  try {
    const leaderboardRef = collection(db, "leaderboard");
    const q = query(
      leaderboardRef,
      where("monthKey", "==", monthKey),
      orderBy("commissions", "desc"),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        email: data.email,
        firstName: data.firstName,
        monthKey: data.monthKey,
        commissions: data.commissions || 0,
        process: data.process || 0,
        ca: data.ca || 0,
        actsCount: data.actsCount || 0,
        lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
      } as LeaderboardEntry;
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

/**
 * Récupère le classement par process (M+3 et preterme)
 * @param monthKey Format YYYY-MM
 * @param limit Nombre maximum de résultats (défaut: 100)
 */
export async function getProcessLeaderboard(
  monthKey: string,
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  if (!db) {
    console.warn("Firestore not initialized");
    return [];
  }

  try {
    const leaderboardRef = collection(db, "leaderboard");
    const q = query(
      leaderboardRef,
      where("monthKey", "==", monthKey),
      orderBy("process", "desc"),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        email: data.email,
        firstName: data.firstName,
        monthKey: data.monthKey,
        commissions: data.commissions || 0,
        process: data.process || 0,
        ca: data.ca || 0,
        actsCount: data.actsCount || 0,
        lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
      } as LeaderboardEntry;
    });
  } catch (error) {
    console.error("Error fetching process leaderboard:", error);
    return [];
  }
}

/**
 * Récupère le classement par CA
 * @param monthKey Format YYYY-MM
 * @param limit Nombre maximum de résultats (défaut: 100)
 */
export async function getCALeaderboard(
  monthKey: string,
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  if (!db) {
    console.warn("Firestore not initialized");
    return [];
  }

  try {
    const leaderboardRef = collection(db, "leaderboard");
    const q = query(
      leaderboardRef,
      where("monthKey", "==", monthKey),
      orderBy("ca", "desc"),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        email: data.email,
        firstName: data.firstName,
        monthKey: data.monthKey,
        commissions: data.commissions || 0,
        process: data.process || 0,
        ca: data.ca || 0,
        actsCount: data.actsCount || 0,
        lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
      } as LeaderboardEntry;
    });
  } catch (error) {
    console.error("Error fetching CA leaderboard:", error);
    return [];
  }
}

/**
 * Récupère les stats d'un utilisateur spécifique pour un mois
 * @param userId ID de l'utilisateur
 * @param monthKey Format YYYY-MM
 */
export async function getUserLeaderboardStats(
  userId: string,
  monthKey: string
): Promise<LeaderboardEntry | null> {
  if (!db) {
    console.warn("Firestore not initialized");
    return null;
  }

  try {
    const leaderboardRef = collection(db, "leaderboard");
    const q = query(
      leaderboardRef,
      where("userId", "==", userId),
      where("monthKey", "==", monthKey)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      userId: data.userId,
      email: data.email,
      firstName: data.firstName,
      monthKey: data.monthKey,
      commissions: data.commissions || 0,
      process: data.process || 0,
      ca: data.ca || 0,
      actsCount: data.actsCount || 0,
      lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
    };
  } catch (error) {
    console.error("Error fetching user leaderboard stats:", error);
    return null;
  }
}

