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
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./config";
import type { Boost, BoostType } from "@/types/boost";
import { BOOST_REMUNERATION } from "@/types/boost";

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
 * Crée un boost par l'admin (pour n'importe quel collaborateur, date et rémunération optionnelles)
 */
export async function createBoostAdmin(
  userId: string,
  type: BoostType,
  clientName: string,
  stars: number,
  date?: Date,
  remuneration?: number
): Promise<string> {
  if (!db) {
    throw new Error("Firebase non initialisé");
  }

  const boostDate = date ?? new Date();
  const amount =
    remuneration !== undefined && remuneration >= 0
      ? remuneration
      : BOOST_REMUNERATION[type] ?? 5;

  const boostData = {
    userId,
    type,
    clientName: clientName.trim(),
    stars,
    remuneration: amount,
    date: Timestamp.fromDate(boostDate),
    createdAt: Timestamp.fromDate(new Date()),
  };

  const docRef = await addDoc(collection(db, "boosts"), boostData);
  return docRef.id;
}

/**
 * Met à jour un boost (admin)
 */
export async function updateBoost(
  id: string,
  data: Partial<Pick<Boost, "type" | "clientName" | "stars" | "remuneration" | "date">>
): Promise<void> {
  if (!db) {
    throw new Error("Firebase non initialisé");
  }

  const updateData: Record<string, unknown> = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.clientName !== undefined) updateData.clientName = data.clientName.trim();
  if (data.stars !== undefined) updateData.stars = data.stars;
  if (data.remuneration !== undefined) updateData.remuneration = data.remuneration;
  if (data.date !== undefined) {
    updateData.date =
      data.date instanceof Date ? Timestamp.fromDate(data.date) : data.date;
  }

  if (Object.keys(updateData).length === 0) return;

  await updateDoc(doc(db, "boosts", id), updateData);
}

/**
 * Supprime un boost (admin)
 */
export async function deleteBoost(id: string): Promise<void> {
  if (!db) {
    throw new Error("Firebase non initialisé");
  }
  await deleteDoc(doc(db, "boosts", id));
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
