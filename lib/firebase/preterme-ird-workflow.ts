// CRUD Firestore pour le workflow Préterme IARD.
// Collections dédiées : preterme_ird_workflows, preterme_ird_snapshots
// Collection partagée avec Auto : preterme_gerants (mémoire gérants commune)

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
import type { WorkflowIrdState, SnapshotIrdCdc } from "@/types/preterme-ird"

function assertDb() {
  if (!db) throw new Error("Firebase non initialisé")
  return db
}

// ─── Workflows ────────────────────────────────────────────────────────────────

/**
 * Lit un workflow IARD depuis le serveur (bypass cache client).
 * getDocFromServer est indispensable après une écriture par l'admin SDK
 * (ex: route dispatch) pour voir les données fraîches.
 */
export async function getIrdWorkflow(moisKey: string): Promise<WorkflowIrdState | null> {
  const database = assertDb()
  const snap = await getDocFromServer(doc(database, "preterme_ird_workflows", moisKey))
  if (!snap.exists()) return null
  return snap.data() as WorkflowIrdState
}

/**
 * Charge tous les workflows IARD, triés par moisKey DESC (plus récent en premier).
 * Utilisé au mount de la page pour la sélection automatique.
 */
export async function getAllIrdWorkflows(): Promise<WorkflowIrdState[]> {
  const database = assertDb()
  const snap = await getDocs(collection(database, "preterme_ird_workflows"))
  return snap.docs
    .map(d => d.data() as WorkflowIrdState)
    .sort((a, b) => b.moisKey.localeCompare(a.moisKey))
}

export async function createIrdWorkflow(state: WorkflowIrdState): Promise<void> {
  const database = assertDb()
  await setDoc(doc(database, "preterme_ird_workflows", state.moisKey), state)
}

export async function updateIrdWorkflow(
  moisKey: string,
  update: Partial<WorkflowIrdState> | Record<string, unknown>
): Promise<void> {
  const database = assertDb()
  await updateDoc(doc(database, "preterme_ird_workflows", moisKey), update as Record<string, unknown>)
}

// ─── Snapshots ────────────────────────────────────────────────────────────────

export async function saveIrdSnapshot(snapshot: SnapshotIrdCdc): Promise<void> {
  const database = assertDb()
  const id = `${snapshot.moisKey}_${snapshot.cdcId}`
  await setDoc(doc(database, "preterme_ird_snapshots", id), snapshot)
}

// ─── Mémoire gérants (partagée avec Auto) ─────────────────────────────────────
// Même collection preterme_gerants — un gérant identifié en Auto est réutilisable en IARD.

function gerantDocId(nomClient: string): string {
  return nomClient.trim().toUpperCase().replace(/\//g, "_")
}

export async function getIrdGerantsMemo(nomClients: string[]): Promise<Record<string, string>> {
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

export async function saveIrdGerantsMemo(entries: { nomClient: string; gerant: string }[]): Promise<void> {
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
