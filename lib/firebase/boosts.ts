/**
 * Gestion Firestore des boosts (avis clients et rémunération)
 */

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { Boost, BoostType } from "@/types/boost";
import { BOOST_REMUNERATION } from "@/types/boost";
import { doc, getDoc } from "firebase/firestore";

function toDate(value: Date | Timestamp | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return new Date();
}

/**
 * Génère la clé du mois au format YYYY-MM
 */
function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Crée un nouveau boost
 */
export async function createBoost(
  userId: string,
  type: BoostType,
  clientName: string,
  stars: number
): Promise<string> {
  if (!db) {
    throw new Error("Firebase non initialisé");
  }

  const now = new Date();
  const remuneration = BOOST_REMUNERATION[type] ?? 5;

  const boostData = {
    userId,
    type,
    clientName: clientName.trim(),
    stars,
    remuneration,
    date: Timestamp.fromDate(now),
    createdAt: Timestamp.fromDate(now),
  };

  const docRef = await addDoc(collection(db, "boosts"), boostData);
  return docRef.id;
}

/**
 * Récupère les boosts d'un mois donné (tous utilisateurs)
 */
export async function getBoostsByMonth(monthKey: string): Promise<Boost[]> {
  if (!db) {
    throw new Error("Firebase non initialisé");
  }

  const [year, month] = monthKey.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const q = query(
    collection(db, "boosts"),
    where("date", ">=", Timestamp.fromDate(startDate)),
    where("date", "<", Timestamp.fromDate(endDate)),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      date: toDate(data.date),
      createdAt: toDate(data.createdAt),
    } as Boost;
  });
}

/**
 * Récupère les boosts d'un utilisateur pour un mois donné
 */
export async function getBoostsByUserAndMonth(
  userId: string,
  monthKey: string
): Promise<Boost[]> {
  if (!db) {
    throw new Error("Firebase non initialisé");
  }

  const [year, month] = monthKey.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const q = query(
    collection(db, "boosts"),
    where("userId", "==", userId),
    where("date", ">=", Timestamp.fromDate(startDate)),
    where("date", "<", Timestamp.fromDate(endDate)),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      date: toDate(data.date),
      createdAt: toDate(data.createdAt),
    } as Boost;
  });
}

/**
 * Récupère tous les boosts (admin) avec filtres optionnels
 * Filtrage côté client pour userId et type afin d'éviter des index composites complexes
 */
export async function getAllBoostsForAdmin(
  monthKey?: string,
  userId?: string,
  type?: BoostType,
  limitCount = 500
): Promise<Boost[]> {
  if (!db) {
    throw new Error("Firebase non initialisé");
  }

  const defaultMonthKey =
    monthKey ||
    getMonthKey(new Date());

  let boosts = await getBoostsByMonth(defaultMonthKey);

  if (userId) {
    boosts = boosts.filter((b) => b.userId === userId);
  }

  if (type) {
    boosts = boosts.filter((b) => b.type === type);
  }

  return boosts.slice(0, limitCount);
}

/**
 * Récupère les infos utilisateur pour enrichir les boosts
 */
export async function getUsersMap(
  userIds: string[]
): Promise<Record<string, { email: string; firstName?: string; lastName?: string }>> {
  if (!db || userIds.length === 0) {
    return {};
  }

  const firestoreDb = db;

  const uniqueIds = [...new Set(userIds)];
  const usersMap: Record<string, { email: string; firstName?: string; lastName?: string }> = {};

  await Promise.all(
    uniqueIds.map(async (uid) => {
      try {
        const userDoc = await getDoc(doc(firestoreDb, "users", uid));
        if (userDoc.exists()) {
          const d = userDoc.data();
          usersMap[uid] = {
            email: d.email ?? "",
            firstName: d.firstName,
            lastName: d.lastName,
          };
        }
      } catch {
        // ignorer les erreurs
      }
    })
  );

  return usersMap;
}
