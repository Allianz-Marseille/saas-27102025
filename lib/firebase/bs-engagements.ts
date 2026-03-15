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
  where,
} from "firebase/firestore"
import { db } from "./config"
import type { BsEngagement, BsEngagementInput } from "@/types/bs"
import { addMoisKey, isEngagementActif } from "@/types/bs"

function assertDb() {
  if (!db) throw new Error("Firebase non initialisé")
  return db
}

const COLLECTION = "bs_engagements"

function toEngagement(id: string, data: Record<string, unknown>): BsEngagement {
  return {
    id,
    collaborateurId: data.collaborateurId as string,
    type: data.type as BsEngagement["type"],
    montantMensuel: data.montantMensuel as number,
    moisDebut: data.moisDebut as string,
    moisFin: data.moisFin as string,
    nbMois: data.nbMois as number,
    clos: (data.clos as boolean) ?? false,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate?.() ?? new Date(),
  }
}

export async function getEngagementsByCollaborateur(collaborateurId: string): Promise<BsEngagement[]> {
  const database = assertDb()
  const q = query(
    collection(database, COLLECTION),
    where("collaborateurId", "==", collaborateurId),
    orderBy("createdAt", "desc")
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => toEngagement(d.id, d.data() as Record<string, unknown>))
}

/** Retourne tous les engagements actifs pour un mois donné (filtre côté client) */
export async function getEngagementsActifsPourMois(moisKey: string): Promise<BsEngagement[]> {
  const database = assertDb()
  const q = query(
    collection(database, COLLECTION),
    where("clos", "==", false)
  )
  const snap = await getDocs(q)
  const all = snap.docs.map((d) => toEngagement(d.id, d.data() as Record<string, unknown>))
  return all.filter((e) => isEngagementActif(e, moisKey))
}

export async function createEngagement(input: BsEngagementInput): Promise<string> {
  const database = assertDb()
  const moisFin = addMoisKey(input.moisDebut, input.nbMois - 1)
  const ref = await addDoc(collection(database, COLLECTION), {
    ...input,
    moisFin,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function cloturerEngagement(id: string): Promise<void> {
  const database = assertDb()
  await updateDoc(doc(database, COLLECTION, id), { clos: true })
}

export async function deleteEngagement(id: string): Promise<void> {
  const database = assertDb()
  await deleteDoc(doc(database, COLLECTION, id))
}
