/**
 * CRUD Firestore — collection `courtage`
 */

import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { Courtage } from "@/types/courtage";

function assertDb() {
  if (!db) throw new Error("Firebase non initialisé");
}

function docToCourtage(id: string, data: Record<string, unknown>): Courtage {
  return {
    id,
    compagnie: (data.compagnie as string) ?? "",
    identifiant: (data.identifiant as string) ?? "",
    password: (data.password as string) ?? "",
    internet: (data.internet as string) ?? "",
    dateModification: (data.dateModification as string | null) ?? null,
    qui: (data.qui as string | null) ?? null,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : (data.createdAt as string | undefined),
  };
}

export async function getAllCourtages(): Promise<Courtage[]> {
  assertDb();
  const q = query(collection(db!, "courtage"), orderBy("compagnie", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToCourtage(d.id, d.data() as Record<string, unknown>));
}

export async function getCourtageById(id: string): Promise<Courtage | null> {
  assertDb();
  const snap = await getDoc(doc(db!, "courtage", id));
  if (!snap.exists()) return null;
  return docToCourtage(snap.id, snap.data() as Record<string, unknown>);
}
