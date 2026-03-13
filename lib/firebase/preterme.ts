import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore"
import { db } from "./config"
import type { WorkflowState, SnapshotCdc } from "@/types/preterme"

function assertDb() {
  if (!db) throw new Error("Firebase non initialisé")
  return db
}

export async function getWorkflow(moisKey: string): Promise<WorkflowState | null> {
  const database = assertDb()
  const snap = await getDoc(doc(database, "preterme_workflows", moisKey))
  if (!snap.exists()) return null
  return snap.data() as WorkflowState
}

export async function getActiveWorkflow(): Promise<WorkflowState | null> {
  const database = assertDb()
  const q = query(
    collection(database, "preterme_workflows"),
    where("statut", "==", "en_cours")
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].data() as WorkflowState
}

export async function createWorkflow(state: WorkflowState): Promise<void> {
  const database = assertDb()
  await setDoc(doc(database, "preterme_workflows", state.moisKey), state)
}

export async function updateWorkflow(
  moisKey: string,
  update: Partial<WorkflowState> | Record<string, unknown>
): Promise<void> {
  const database = assertDb()
  await updateDoc(doc(database, "preterme_workflows", moisKey), update as Record<string, unknown>)
}

export async function saveSnapshot(snapshot: SnapshotCdc): Promise<void> {
  const database = assertDb()
  const id = `${snapshot.moisKey}_${snapshot.cdcId}`
  await setDoc(doc(database, "preterme_snapshots", id), snapshot)
}

export async function getSnapshots(moisKey: string): Promise<SnapshotCdc[]> {
  const database = assertDb()
  const q = query(
    collection(database, "preterme_snapshots"),
    where("moisKey", "==", moisKey)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as SnapshotCdc)
}
