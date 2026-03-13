/**
 * POST /api/admin/preterme-auto/recalc
 * Recalcule les clients retenus avec de nouveaux seuils et met à jour Firestore.
 */
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/utils/auth-utils"
import { adminDb } from "@/lib/firebase/admin-config"
import type { WorkflowState, ClientImporte } from "@/types/preterme"

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req)
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json() as {
    moisKey: string
    codeAgence: string
    seuilMajo: number
    seuilEtp: number
  }
  const { moisKey, codeAgence, seuilMajo, seuilEtp } = body

  if (!moisKey || !codeAgence) {
    return NextResponse.json({ error: "moisKey et codeAgence requis" }, { status: 400 })
  }

  const ref = adminDb.collection("preterme_workflows").doc(moisKey)
  const snap = await ref.get()
  if (!snap.exists) return NextResponse.json({ error: "Workflow introuvable" }, { status: 404 })

  const workflow = snap.data() as WorkflowState
  const agence = workflow.agences?.[codeAgence]
  if (!agence) return NextResponse.json({ error: "Agence introuvable" }, { status: 404 })

  const updatedClients: ClientImporte[] = agence.clients.map(c => ({
    ...c,
    retenu: c.tauxVariation >= seuilMajo && c.etp >= seuilEtp,
  }))

  const clientsRetenus = updatedClients.filter(c => c.retenu).length

  const updatedAgences = {
    ...workflow.agences,
    [codeAgence]: {
      ...agence,
      seuilMajo,
      seuilEtp,
      clientsRetenus,
      clients: updatedClients,
    },
  }

  await ref.update({ agences: updatedAgences })

  return NextResponse.json({ clientsRetenus, clientsExclus: agence.clientsTotal - clientsRetenus })
}
