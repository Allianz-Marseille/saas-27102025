/**
 * POST /api/admin/preterme-ird/recalc
 * Recalcule les clients retenus avec de nouveaux seuils et met à jour Firestore.
 * Règle OU : client retenu si tauxVariation >= seuilMajo OU etp >= seuilEtp
 */
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/utils/auth-utils"
import { adminDb } from "@/lib/firebase/admin-config"
import type { WorkflowIrdState, ClientIrdImporte } from "@/types/preterme-ird"

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

  const ref = adminDb.collection("preterme_ird_workflows").doc(moisKey)
  const snap = await ref.get()
  if (!snap.exists) return NextResponse.json({ error: "Workflow IARD introuvable" }, { status: 404 })

  const workflow = snap.data() as WorkflowIrdState
  const agence = workflow.agences?.[codeAgence]
  if (!agence) return NextResponse.json({ error: "Agence introuvable" }, { status: 404 })

  const updatedClients: ClientIrdImporte[] = agence.clients.map(c => ({
    ...c,
    retenu: c.tauxVariation >= seuilMajo || c.etp >= seuilEtp,
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
