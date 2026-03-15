import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./config";

function assertDb() {
  if (!db) throw new Error("Firebase non initialisé");
  return db;
}
import type { Collaborateur, CollaborateurInput } from "@/types/collaborateur";

const COLLECTION = "collaborateurs";

function toCollaborateur(id: string, data: Record<string, unknown>): Collaborateur {
  return {
    id,
    firstName: data.firstName as string,
    pole: data.pole as Collaborateur["pole"],
    joursParSemaine: data.joursParSemaine as number,
    joursTravail: (data.joursTravail as string[]) as Collaborateur["joursTravail"],
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate?.() ?? new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate?.() ?? new Date(),
  };
}

export async function getCollaborateurs(): Promise<Collaborateur[]> {
  const db = assertDb();
  const q = query(collection(db, COLLECTION), orderBy("firstName"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toCollaborateur(d.id, d.data() as Record<string, unknown>));
}

export async function createCollaborateur(input: CollaborateurInput): Promise<string> {
  const db = assertDb();
  const ref = await addDoc(collection(db, COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCollaborateur(id: string, input: CollaborateurInput): Promise<void> {
  const db = assertDb();
  await updateDoc(doc(db, COLLECTION, id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCollaborateur(id: string): Promise<void> {
  const db = assertDb();
  await deleteDoc(doc(db, COLLECTION, id));
}
