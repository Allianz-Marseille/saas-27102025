import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
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
  // getDocFromServer bypass le cache Firestore client — indispensable après une
  // écriture faite par l'admin SDK (ex: dispatch route) pour voir les données fraîches.
  const snap = await getDocFromServer(doc(database, "preterme_workflows", moisKey))
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

export async function getAllWorkflows(): Promise<WorkflowState[]> {
  const database = assertDb()
  const snap = await getDocs(collection(database, "preterme_workflows"))
  return snap.docs
    .map(d => d.data() as WorkflowState)
    .sort((a, b) => b.moisKey.localeCompare(a.moisKey))
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

// ─── Mémoire gérants ──────────────────────────────────────────────────────────
// Clé = nomClient normalisé (uppercase, trim) → équivalence stricte

function gerantDocId(nomClient: string): string {
  return nomClient.trim().toUpperCase().replace(/\//g, "_")
}

/**
 * Retourne un map nomClient → gérant pour tous les noms trouvés en mémoire.
 */
export async function getGerantsMemo(nomClients: string[]): Promise<Record<string, string>> {
  const database = assertDb()
  const result: Record<string, string> = {}
  await Promise.all(
    nomClients.map(async nom => {
      const snap = await getDoc(doc(database, "preterme_gerants", gerantDocId(nom)))
      if (snap.exists()) {
        result[nom] = (snap.data() as { gerant: string }).gerant
      }
    })
  )
  return result
}

/**
 * Mémorise les gérants (upsert). Appelé au blocage de l'agence.
 */
export async function saveGerantsMemo(entries: { nomClient: string; gerant: string }[]): Promise<void> {
  const database = assertDb()
  await Promise.all(
    entries
      .filter(e => e.gerant.trim())
      .map(({ nomClient, gerant }) =>
        setDoc(doc(database, "preterme_gerants", gerantDocId(nomClient)), {
          nomClient,
          gerant: gerant.trim(),
          updatedAt: new Date().toISOString(),
        })
      )
  )
}
