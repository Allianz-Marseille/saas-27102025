/**
 * Utilitaires Firestore pour la gestion des sessions M+3
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import { M3Session, M3SessionStatus } from "@/types/m3-session";

const M3_SESSIONS_COLLECTION = "m3_sessions";

/**
 * Convertit un Timestamp Firestore en Date
 */
function toDate(value: Date | Timestamp | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return new Date();
}

/**
 * Convertit une Date en Timestamp Firestore
 */
function toTimestamp(value: Date | Timestamp): Timestamp {
  if (value instanceof Timestamp) return value;
  return Timestamp.fromDate(value);
}

/**
 * Crée une nouvelle session M+3
 */
export async function createM3Session(userId: string): Promise<string> {
  if (!db) throw new Error("Firebase not initialized");

  const now = new Date();
  const sessionData = {
    userId,
    status: "preparation" as M3SessionStatus,
    createdAt: toTimestamp(now),
    updatedAt: toTimestamp(now),
  };

  const docRef = doc(collection(db, M3_SESSIONS_COLLECTION));
  await setDoc(docRef, sessionData);

  return docRef.id;
}

/**
 * Récupère une session M+3 par son ID
 */
export async function getM3Session(sessionId: string): Promise<M3Session> {
  if (!db) throw new Error("Firebase not initialized");

  const docRef = doc(db, M3_SESSIONS_COLLECTION, sessionId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error(`Session M+3 ${sessionId} introuvable`);
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId,
    status: data.status || "preparation",
    clientData: data.clientData,
    contracts: data.contracts?.map((contract: any) => ({
      ...contract,
      dateEffet: contract.dateEffet ? toDate(contract.dateEffet) : undefined,
    })),
    analysis: data.analysis,
    outputs: data.outputs,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as M3Session;
}

/**
 * Met à jour une session M+3
 */
export async function updateM3Session(
  sessionId: string,
  updates: Partial<Omit<M3Session, "id" | "userId" | "createdAt">>
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const docRef = doc(db, M3_SESSIONS_COLLECTION, sessionId);
  const updateData: any = {
    ...updates,
    updatedAt: toTimestamp(new Date()),
  };

  // Convertir les dates en Timestamp pour Firestore
  if (updates.contracts) {
    updateData.contracts = updates.contracts.map((contract) => ({
      ...contract,
      dateEffet: contract.dateEffet
        ? toTimestamp(contract.dateEffet)
        : undefined,
    }));
  }

  await updateDoc(docRef, updateData);
}
