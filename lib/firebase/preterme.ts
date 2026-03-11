/**
 * Utilitaires Firestore pour la gestion des prétermes Auto
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
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
  PretermeQualityOverride,
  AgenceCode,
  PretermeWorkflowStep,
} from "@/types/preterme";
import { normalizeClientName } from "@/lib/utils/preterme-quality";

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

export async function updatePretermeConfigWorkflow(
  id: string,
  workflow: {
    lastStep?: PretermeWorkflowStep;
    completedSteps?: Partial<Record<PretermeWorkflowStep, boolean>>;
  }
): Promise<void> {
  assertDb();
  const payload: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };
  if (workflow.lastStep) {
    payload["workflow.lastStep"] = workflow.lastStep;
  }
  if (workflow.completedSteps) {
    payload["workflow.completedSteps"] = workflow.completedSteps;
  }
  await updateDoc(doc(db!, "preterme_configs", id), payload);
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

export async function getPretermeClientsByMoisKey(moisKey: string): Promise<PretermeClient[]> {
  assertDb();
  const q = query(
    collection(db!, "preterme_clients"),
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
    } as PretermeClient;
  });
}

export async function getSocietesAValider(importId: string): Promise<PretermeClient[]> {
  assertDb();
  const q = query(
    collection(db!, "preterme_clients"),
    where("importId", "==", importId),
    where("conserve", "==", true),
    where("typeEntite", "==", "societe")
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

// ─── Overrides qualité ───────────────────────────────────────────────────────

export async function getQualityOverridesByNormalizedNames(
  normalizedNames: string[]
): Promise<Record<string, "particulier" | "societe">> {
  assertDb();
  const uniqueNames = Array.from(new Set(normalizedNames.filter(Boolean)));
  if (uniqueNames.length === 0) return {};

  const result: Record<string, "particulier" | "societe"> = {};
  const CHUNK_SIZE = 10; // where("in") max 10

  for (let i = 0; i < uniqueNames.length; i += CHUNK_SIZE) {
    const chunk = uniqueNames.slice(i, i + CHUNK_SIZE);
    const q = query(
      collection(db!, "preterme_quality_overrides"),
      where("normalizedName", "in", chunk)
    );
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      const data = d.data() as { normalizedName?: string; entityType?: "particulier" | "societe" };
      if (data.normalizedName && data.entityType) {
        result[data.normalizedName] = data.entityType;
      }
    });
  }

  return result;
}

export async function upsertQualityOverride(
  nomClient: string,
  entityType: "particulier" | "societe",
  userId: string
): Promise<void> {
  assertDb();
  const normalizedName = normalizeClientName(nomClient);
  if (!normalizedName) return;

  const now = Timestamp.now();
  const colRef = collection(db!, "preterme_quality_overrides");
  const existingSnap = await getDocs(query(colRef, where("normalizedName", "==", normalizedName), limit(1)));

  if (!existingSnap.empty) {
    const existing = existingSnap.docs[0];
    const data = existing.data() as { examples?: string[] };
    const examples = Array.from(new Set([...(data.examples ?? []), nomClient])).slice(0, 10);
    await updateDoc(existing.ref, {
      entityType,
      updatedBy: userId,
      updatedAt: now,
      examples,
    });
    return;
  }

  await addDoc(colRef, {
    normalizedName,
    entityType,
    source: "manual",
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    examples: [nomClient],
  } satisfies Omit<PretermeQualityOverride, "id" | "createdAt" | "updatedAt"> & {
    createdAt: Timestamp;
    updatedAt: Timestamp;
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
