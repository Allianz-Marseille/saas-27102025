/**
 * Gestion des sessions M+3 dans Firestore
 */

import { adminDb } from "@/lib/firebase/admin-config";
import {
  M3Session,
  M3SessionStatus,
  ClientData,
  ContractData,
  M3Analysis,
  M3Output,
} from "@/types/m3-session";
import { Timestamp } from "firebase/firestore";

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
  return Timestamp.fromDate(value instanceof Date ? value : new Date(value));
}

/**
 * Crée une nouvelle session M+3
 */
export async function createM3Session(
  userId: string,
  initialData?: {
    rawClientFiche?: string;
    rawContractFiche?: string;
  }
): Promise<string> {
  const now = new Date();
  const sessionData: Omit<M3Session, "id"> = {
    userId,
    status: "preparation",
    contracts: [],
    outputs: [],
    createdAt: now,
    updatedAt: now,
    ...initialData,
  };

  const docRef = await adminDb.collection(M3_SESSIONS_COLLECTION).add(sessionData);
  return docRef.id;
}

/**
 * Met à jour une session M+3
 */
export async function updateM3Session(
  sessionId: string,
  updates: Partial<{
    status: M3SessionStatus;
    clientData: ClientData;
    contracts: ContractData[];
    analysis: M3Analysis;
    outputs: M3Output[];
    rawClientFiche: string;
    rawContractFiche: string;
    completedAt: Date | Timestamp;
  }>
): Promise<void> {
  const updateData: any = {
    ...updates,
    updatedAt: new Date(),
  };

  // Convertir les dates en Timestamp si nécessaire
  if (updateData.completedAt) {
    updateData.completedAt = toTimestamp(updateData.completedAt);
  }

  await adminDb.collection(M3_SESSIONS_COLLECTION).doc(sessionId).update(updateData);
}

/**
 * Récupère une session M+3 par son ID
 */
export async function getM3Session(sessionId: string): Promise<M3Session | null> {
  const doc = await adminDb.collection(M3_SESSIONS_COLLECTION).doc(sessionId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    completedAt: data.completedAt ? toDate(data.completedAt) : undefined,
    clientData: data.clientData
      ? {
          ...data.clientData,
          dateCreationFiche: data.clientData.dateCreationFiche
            ? toDate(data.clientData.dateCreationFiche)
            : undefined,
          dateNaissance: data.clientData.dateNaissance
            ? toDate(data.clientData.dateNaissance)
            : undefined,
          dateCreation: data.clientData.dateCreation
            ? toDate(data.clientData.dateCreation)
            : undefined,
        }
      : undefined,
    contracts: (data.contracts || []).map((contract: any) => ({
      ...contract,
      dateEffet: contract.dateEffet ? toDate(contract.dateEffet) : undefined,
    })),
    outputs: (data.outputs || []).map((output: any) => ({
      ...output,
      dateGeneration: output.dateGeneration ? toDate(output.dateGeneration) : undefined,
      planAction: output.planAction
        ? output.planAction.map((action: any) => ({
            ...action,
            date: action.date ? toDate(action.date) : undefined,
          }))
        : undefined,
    })),
  } as M3Session;
}

/**
 * Récupère toutes les sessions M+3 d'un utilisateur
 */
export async function getM3SessionsByUser(
  userId: string,
  limit: number = 50
): Promise<M3Session[]> {
  const snapshot = await adminDb
    .collection(M3_SESSIONS_COLLECTION)
    .where("userId", "==", userId)
    .orderBy("updatedAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      completedAt: data.completedAt ? toDate(data.completedAt) : undefined,
      clientData: data.clientData
        ? {
            ...data.clientData,
            dateCreationFiche: data.clientData.dateCreationFiche
              ? toDate(data.clientData.dateCreationFiche)
              : undefined,
            dateNaissance: data.clientData.dateNaissance
              ? toDate(data.clientData.dateNaissance)
              : undefined,
            dateCreation: data.clientData.dateCreation
              ? toDate(data.clientData.dateCreation)
              : undefined,
          }
        : undefined,
      contracts: (data.contracts || []).map((contract: any) => ({
        ...contract,
        dateEffet: contract.dateEffet ? toDate(contract.dateEffet) : undefined,
      })),
      outputs: (data.outputs || []).map((output: any) => ({
        ...output,
        dateGeneration: output.dateGeneration ? toDate(output.dateGeneration) : undefined,
        planAction: output.planAction
          ? output.planAction.map((action: any) => ({
              ...action,
              date: action.date ? toDate(action.date) : undefined,
            }))
          : undefined,
      })),
    } as M3Session;
  });
}

/**
 * Supprime une session M+3
 */
export async function deleteM3Session(sessionId: string): Promise<void> {
  await adminDb.collection(M3_SESSIONS_COLLECTION).doc(sessionId).delete();
}

/**
 * Marque une session comme complétée
 */
export async function completeM3Session(sessionId: string): Promise<void> {
  await updateM3Session(sessionId, {
    status: "completed",
    completedAt: new Date(),
  });
}
