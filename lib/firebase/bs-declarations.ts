import {
  collection,
  doc,
  getDocFromServer,
  setDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./config"
import type { BsDeclaration, SalarieDeclaration } from "@/types/bs"

function assertDb() {
  if (!db) throw new Error("Firebase non initialisé")
  return db
}

const COLLECTION = "bs_declarations"

function toDeclaration(data: Record<string, unknown>): BsDeclaration {
  return {
    moisKey: data.moisKey as string,
    statut: data.statut as BsDeclaration["statut"],
    salaries: (data.salaries ?? {}) as Record<string, SalarieDeclaration>,
    prenomsSansMatch: (data.prenomsSansMatch as string[]) ?? [],
    closedAt: (data.closedAt as { toDate: () => Date })?.toDate?.() ?? undefined,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate?.() ?? new Date(),
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate?.() ?? new Date(),
  }
}

/** getDocFromServer : bypass cache — indispensable après une écriture Admin SDK */
export async function getDeclaration(moisKey: string): Promise<BsDeclaration | null> {
  const database = assertDb()
  const snap = await getDocFromServer(doc(database, COLLECTION, moisKey))
  if (!snap.exists()) return null
  return toDeclaration(snap.data() as Record<string, unknown>)
}

export async function upsertDeclaration(decl: Omit<BsDeclaration, "createdAt" | "updatedAt">): Promise<void> {
  const database = assertDb()
  await setDoc(doc(database, COLLECTION, decl.moisKey), {
    ...decl,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  })
}

/** Met à jour les champs manuels d'un salarié (dot-notation Firestore) */
export async function updateDeclarationSalarie(
  moisKey: string,
  collaborateurId: string,
  fields: Partial<SalarieDeclaration>
): Promise<void> {
  const database = assertDb()
  const update: Record<string, unknown> = { updatedAt: serverTimestamp() }
  for (const [k, v] of Object.entries(fields)) {
    update[`salaries.${collaborateurId}.${k}`] = v
  }
  await updateDoc(doc(database, COLLECTION, moisKey), update)
}

/** Retourne toutes les déclarations pour la navigation (liste des mois avec statut) */
export async function getAllDeclarations(): Promise<BsDeclaration[]> {
  const database = assertDb()
  const snap = await getDocs(collection(database, COLLECTION))
  return snap.docs
    .map((d) => toDeclaration(d.data() as Record<string, unknown>))
    .sort((a, b) => b.moisKey.localeCompare(a.moisKey))
}
