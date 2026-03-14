/**
 * POST /api/admin/preterme-auto/dispatch
 * Crée les cartes Trello pour tous les clients retenus d'une agence.
 */
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/utils/auth-utils"
import { adminDb } from "@/lib/firebase/admin-config"
import { createOrUpdateCard, type DispatchContext } from "@/lib/services/preterme-trello"
import { routeClientsTocdcs } from "@/lib/services/preterme-router"
import type { WorkflowState, ClientImporte, SnapshotCdc } from "@/types/preterme"
import type { Agency } from "@/lib/trello-config/types"

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req)
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let moisKey: string, codeAgence: string, filterCdcId: string | undefined
  try {
    const body = await req.json() as { moisKey: string; codeAgence: string; cdcId?: string }
    moisKey = body.moisKey
    codeAgence = body.codeAgence
    filterCdcId = body.cdcId
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
  }

  if (!moisKey || !codeAgence) {
    return NextResponse.json({ error: "moisKey et codeAgence requis" }, { status: 400 })
  }

  const apiKey = process.env.TRELLO_API_KEY
  const token = process.env.TRELLO_TOKEN
  if (!apiKey || !token) {
    return NextResponse.json({ error: "TRELLO_API_KEY ou TRELLO_TOKEN manquant" }, { status: 500 })
  }

  try {
  // Read workflow
  const workflowRef = adminDb.collection("preterme_workflows").doc(moisKey)
  const workflowSnap = await workflowRef.get()
  if (!workflowSnap.exists) return NextResponse.json({ error: "Workflow introuvable" }, { status: 404 })

  const workflow = workflowSnap.data() as WorkflowState
  const agence = workflow.agences?.[codeAgence]
  if (!agence) return NextResponse.json({ error: "Agence introuvable" }, { status: 404 })

  // Read CDC config
  const configSnap = await adminDb.collection("config").doc("trello").get()
  if (!configSnap.exists) return NextResponse.json({ error: "Config Trello introuvable" }, { status: 500 })

  const trelloConfig = configSnap.data() as { agencies: Agency[] }
  const agency = trelloConfig.agencies?.find(a => a.code === codeAgence)
  if (!agency) return NextResponse.json({ error: `Agence ${codeAgence} absente de la config Trello` }, { status: 404 })

  const retenus = agence.clients.filter(c => c.retenu)
  const routed = routeClientsTocdcs(
    retenus.map(c => ({
      nomClient: c.nomClient,
      numeroContrat: c.numeroContrat,
      classificationFinale: c.classificationFinale,
      gerant: c.gerant,
    })),
    agency
  )

  // Filtrer sur un CDC spécifique si demandé
  const toDispatch = filterCdcId ? routed.filter(rc => rc.cdcId === filterCdcId) : routed

  // Dispatch cards
  const dispatchedAt = new Date().toISOString()
  const ctx: DispatchContext = {
    moisLabel: workflow.moisLabel,
    seuilMajo: agence.seuilMajo,
    seuilEtp: agence.seuilEtp,
    dispatchedAt,
  }

  let cartesCreees = 0
  let erreurs = 0
  const updatedClientsMap = new Map<string, Partial<ClientImporte>>()

  await Promise.allSettled(
    toDispatch.map(async rc => {
      if (rc.erreur || !rc.trelloListId) {
        updatedClientsMap.set(rc.numeroContrat, { dispatchStatut: "erreur", dispatchErreur: rc.erreur ?? "ListId manquant" })
        erreurs++
        return
      }

      const original = retenus.find(c => c.numeroContrat === rc.numeroContrat)
      if (!original) return

      try {
        const card = await createOrUpdateCard(original, rc.trelloListId, apiKey, token, 2, ctx)
        updatedClientsMap.set(rc.numeroContrat, {
          trelloCardId: card.id,
          dispatchStatut: "ok",
          dispatchErreur: null, // null et non undefined — Firestore n'accepte pas undefined
        })
        cartesCreees++
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur Trello"
        updatedClientsMap.set(rc.numeroContrat, { dispatchStatut: "erreur", dispatchErreur: msg })
        erreurs++
      }
    })
  )

  // Update clients in workflow
  const updatedClients: ClientImporte[] = agence.clients.map(c => {
    const update = updatedClientsMap.get(c.numeroContrat)
    if (!update) return c
    return { ...c, ...update }
  })

  // Build snapshots per CDC
  const cdcMap = new Map<string, { cdc: { id: string; firstName: string; letters: string[] }; clients: typeof routed }>()
  for (const rc of routed) {
    if (!rc.cdcId || !rc.cdcPrenom) continue
    if (!cdcMap.has(rc.cdcId)) {
      const cdcObj = agency.cdc.find(c => c.id === rc.cdcId)
      if (!cdcObj) continue
      cdcMap.set(rc.cdcId, { cdc: cdcObj, clients: [] })
    }
    cdcMap.get(rc.cdcId)!.clients.push(rc)
  }

  const snapshotBatch = adminDb.batch()

  for (const [cdcId, { cdc, clients: cdcClients }] of cdcMap.entries()) {
    const particuliersCount = cdcClients.filter(c => c.classification === "particulier").length
    const entreprisesCount = cdcClients.filter(c => c.classification === "entreprise").length
    const cartesCount = cdcClients.filter(c => updatedClientsMap.get(c.numeroContrat)?.dispatchStatut === "ok").length

    const snapshot: SnapshotCdc = {
      moisKey,
      snapshotAt: dispatchedAt,
      cdcId,
      cdcPrenom: cdc.firstName,
      codeAgence,
      lettresAttribuees: cdc.letters,
      clientsTotal: cdcClients.length,
      particuliers: particuliersCount,
      entreprises: entreprisesCount,
      cartesCreees: cartesCount,
    }

    const snapRef = adminDb.collection("preterme_snapshots").doc(`${moisKey}_${cdcId}`)
    snapshotBatch.set(snapRef, snapshot)
  }

  await snapshotBatch.commit()

  // Statut agence calculé sur l'ensemble des clients (pas seulement ce CDC)
  const allRetenus = updatedClients.filter(c => c.retenu)
  const allProcessed = allRetenus.every(c => c.dispatchStatut !== "en_attente")
  const hasAnyError = allRetenus.some(c => c.dispatchStatut === "erreur")
  const agenceDispatchStatut = !allProcessed ? "en_attente" : hasAnyError ? "erreur" : "ok"

  // Dot-notation pour éviter les écrasements si 2 CDC dispatchent en parallèle
  await workflowRef.update({
    [`agences.${codeAgence}.clients`]: updatedClients,
    [`agences.${codeAgence}.dispatchStatut`]: agenceDispatchStatut,
  })

  return NextResponse.json({ cartesCreees, erreurs, total: retenus.length })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur interne"
    console.error("[dispatch] erreur non gérée :", e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
