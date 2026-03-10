/**
 * Utilitaires Firestore pour la gestion des prétermes Auto
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import type {
  PretermeConfig,
  PretermeImport,
  PretermeClient,
  PretermeLog,
  AgenceCode,
} from "@/types/preterme";

// ─── Helpers ────────────────────────────────────────────────────────────────

function toDate(value: Date | Timestamp | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return new Date();
}

function assertDb() {
  if (!db) throw new Error("Firebase non initialisé");
}

// ─── PretermeConfig ─────────────────────────────────────────────────────────

/** Crée ou remplace la config d'un mois donné (upsert par moisKey) */
export async function upsertPretermeConfig(
  config: Omit<PretermeConfig, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  assertDb();
  const colRef = collection(db!, "preterme_configs");
  const q = query(colRef, where("moisKey", "==", config.moisKey));
  const snap = await getDocs(q);

  const now = Timestamp.now();

  if (!snap.empty) {
    const existing = snap.docs[0];
    await updateDoc(existing.ref, { ...config, updatedAt: now });
    return existing.id;
  }

  const docRef = await addDoc(colRef, {
    ...config,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function getPretermeConfig(moisKey: string): Promise<PretermeConfig | null> {
  assertDb();
  const q = query(
    collection(db!, "preterme_configs"),
    where("moisKey", "==", moisKey)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id,
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as PretermeConfig;
}

export async function getAllPretermeConfigs(): Promise<PretermeConfig[]> {
  assertDb();
  const q = query(
    collection(db!, "preterme_configs"),
    orderBy("moisKey", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as PretermeConfig;
  });
}

export async function validerPretermeConfig(id: string): Promise<void> {
  assertDb();
  await updateDoc(doc(db!, "preterme_configs", id), {
    valide: true,
    updatedAt: Timestamp.now(),
  });
}

// ─── PretermeImport ──────────────────────────────────────────────────────────

export async function createPretermeImport(
  data: Omit<PretermeImport, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  assertDb();
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db!, "preterme_imports"), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function getPretermeImport(id: string): Promise<PretermeImport | null> {
  assertDb();
  const snap = await getDoc(doc(db!, "preterme_imports", id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as PretermeImport;
}

export async function getPretermeImportsByMois(moisKey: string): Promise<PretermeImport[]> {
  assertDb();
  const q = query(
    collection(db!, "preterme_imports"),
    where("moisKey", "==", moisKey)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as PretermeImport;
  }).sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime());
}

export async function getAllPretermeImports(): Promise<PretermeImport[]> {
  assertDb();
  const q = query(
    collection(db!, "preterme_imports"),
    orderBy("moisKey", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as PretermeImport;
  });
}

export async function updatePretermeImport(
  id: string,
  data: Partial<Omit<PretermeImport, "id" | "createdAt">>
): Promise<void> {
  assertDb();
  await updateDoc(doc(db!, "preterme_imports", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/** Purge un import (clients + logs Trello + import) pour idempotence */
export async function purgePretermeImport(
  moisKey: string,
  agence: AgenceCode
): Promise<void> {
  assertDb();

  // Récupérer les IDs d'imports existants pour purger les logs
  const importQ = query(
    collection(db!, "preterme_imports"),
    where("moisKey", "==", moisKey),
    where("agence", "==", agence)
  );
  const importSnap = await getDocs(importQ);
  const importIds = importSnap.docs.map((d) => d.id);

  // Supprimer les clients associés
  const clientsQ = query(
    collection(db!, "preterme_clients"),
    where("moisKey", "==", moisKey),
    where("agence", "==", agence)
  );
  const clientsSnap = await getDocs(clientsQ);

  // Supprimer les logs Trello pour chaque import
  const logsSnaps = await Promise.all(
    importIds.map((id) =>
      getDocs(query(
        collection(db!, "preterme_trello_logs"),
        where("importId", "==", id)
      ))
    )
  );
  const allLogDocs = logsSnaps.flatMap((s) => s.docs);

  await Promise.all([
    ...clientsSnap.docs.map((d) => deleteDoc(d.ref)),
    ...allLogDocs.map((d) => deleteDoc(d.ref)),
    ...importSnap.docs.map((d) => deleteDoc(d.ref)),
  ]);
}

// ─── PretermeClient ──────────────────────────────────────────────────────────

export async function createPretermeClients(
  clients: Omit<PretermeClient, "id" | "createdAt" | "updatedAt">[]
): Promise<void> {
  assertDb();
  const now = Timestamp.now();
  await Promise.all(
    clients.map((c) =>
      addDoc(collection(db!, "preterme_clients"), {
        ...c,
        createdAt: now,
        updatedAt: now,
      })
    )
  );
}

export async function getPretermeClients(importId: string): Promise<PretermeClient[]> {
  assertDb();
  const q = query(
    collection(db!, "preterme_clients"),
    where("importId", "==", importId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as PretermeClient;
  }).sort((a, b) => a.nomClient.localeCompare(b.nomClient, "fr"));
}

export async function getSocietesAValider(importId: string): Promise<PretermeClient[]> {
  assertDb();
  const q = query(
    collection(db!, "preterme_clients"),
    where("importId", "==", importId),
    where("typeEntite", "==", "a_valider")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as PretermeClient;
  });
}

export async function updatePretermeClient(
  id: string,
  data: Partial<Omit<PretermeClient, "id" | "createdAt">>
): Promise<void> {
  assertDb();
  await updateDoc(doc(db!, "preterme_clients", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// ─── PretermeLog (Trello) ────────────────────────────────────────────────────

export async function createPretermeLog(
  log: Omit<PretermeLog, "id" | "createdAt">
): Promise<void> {
  assertDb();
  await addDoc(collection(db!, "preterme_trello_logs"), {
    ...log,
    createdAt: Timestamp.now(),
  });
}

export async function getPretermeLogsByImport(importId: string): Promise<PretermeLog[]> {
  assertDb();
  const q = query(
    collection(db!, "preterme_trello_logs"),
    where("importId", "==", importId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: toDate(data.createdAt),
    } as PretermeLog;
  }).sort((a, b) => (a.createdAt as Date).getTime() - (b.createdAt as Date).getTime());
}
