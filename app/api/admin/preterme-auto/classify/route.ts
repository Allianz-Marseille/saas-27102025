/**
 * POST /api/admin/preterme-auto/classify
 * Lance la classification Gemini pour les clients retenus d'une agence.
 */
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/utils/auth-utils"
import { adminDb } from "@/lib/firebase/admin-config"
import { classifyClientsWithGemini } from "@/lib/services/preterme-gemini"
import type { WorkflowState, ClientImporte } from "@/types/preterme"

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req)
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { moisKey, codeAgence } = await req.json() as { moisKey: string; codeAgence: string }

  if (!moisKey || !codeAgence) {
    return NextResponse.json({ error: "moisKey et codeAgence requis" }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY non configurée" }, { status: 500 })
  }

  const ref = adminDb.collection("preterme_workflows").doc(moisKey)
  const snap = await ref.get()
  if (!snap.exists) return NextResponse.json({ error: "Workflow introuvable" }, { status: 404 })

  const workflow = snap.data() as WorkflowState
  const agence = workflow.agences?.[codeAgence]
  if (!agence) return NextResponse.json({ error: "Agence introuvable" }, { status: 404 })

  const retenus = agence.clients.filter(c => c.retenu)
  if (retenus.length === 0) {
    return NextResponse.json({ error: "Aucun client retenu à classifier" }, { status: 400 })
  }

  const input = retenus.map(c => ({ numeroContrat: c.numeroContrat, nomClient: c.nomClient }))
  const results = await classifyClientsWithGemini(input, apiKey)

  const classifMap = new Map(results.map(r => [r.numeroContrat, r.classification]))

  const updatedClients: ClientImporte[] = agence.clients.map(c => {
    if (!c.retenu) return c
    const classif = classifMap.get(c.numeroContrat) ?? "particulier"
    return {
      ...c,
      classificationIA: classif,
      classificationFinale: classif,
    }
  })

  const updatedAgences = {
    ...workflow.agences,
    [codeAgence]: {
      ...agence,
      etape3Statut: "analysé",
      clients: updatedClients,
    },
  }

  await ref.update({ agences: updatedAgences })

  const particuliers = updatedClients.filter(c => c.retenu && c.classificationFinale === "particulier").length
  const entreprises = updatedClients.filter(c => c.retenu && c.classificationFinale === "entreprise").length

  return NextResponse.json({ particuliers, entreprises, total: retenus.length })
}
