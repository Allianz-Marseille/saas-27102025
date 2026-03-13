import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/utils/auth-utils"
import { parsePretermeExcel, detectAgenceFromFilename } from "@/lib/utils/preterme-parser"
import { adminDb } from "@/lib/firebase/admin-config"
import type { ClientImporte, WorkflowState } from "@/types/preterme"

const DEFAULT_SEUIL_MAJO = 15
const DEFAULT_SEUIL_ETP = 1.2

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req)
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "FormData invalide" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  const moisKey = formData.get("moisKey") as string | null
  const codeAgence = formData.get("codeAgence") as string | null

  if (!file || !moisKey) {
    return NextResponse.json({ error: "Paramètres manquants : file, moisKey" }, { status: 400 })
  }

  const detectedAgence = codeAgence ?? detectAgenceFromFilename(file.name)
  if (!detectedAgence) {
    return NextResponse.json({ error: "Code agence introuvable dans le nom du fichier" }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  let parsedClients
  try {
    parsedClients = await parsePretermeExcel(buffer)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur parsing Excel"
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  const clientsTotal = parsedClients.length

  // Build ClientImporte array with default classification/dispatch state
  const clients: ClientImporte[] = parsedClients.map(pc => ({
    ...pc,
    retenu: pc.tauxVariation >= DEFAULT_SEUIL_MAJO && pc.etp >= DEFAULT_SEUIL_ETP,
    classificationIA: null,
    classificationFinale: null,
    corrigeParUtilisateur: false,
    gerant: null,
    trelloCardId: null,
    dispatchStatut: "en_attente",
  }))

  const clientsRetenus = clients.filter(c => c.retenu).length

  // Read or initialize workflow
  const workflowRef = adminDb.collection("preterme_workflows").doc(moisKey)
  const workflowSnap = await workflowRef.get()

  const agenceData = {
    fichierNom: file.name,
    clientsTotal,
    seuilMajo: DEFAULT_SEUIL_MAJO,
    seuilEtp: DEFAULT_SEUIL_ETP,
    clientsRetenus,
    etape2Statut: "importé",
    etape3Statut: "en_attente",
    etape4Statut: "en_attente",
    dispatchStatut: "en_attente",
    clients,
  }

  if (workflowSnap.exists) {
    const existing = workflowSnap.data() as WorkflowState
    const updatedAgences = { ...(existing.agences ?? {}), [detectedAgence]: agenceData }
    await workflowRef.update({ agences: updatedAgences })
  } else {
    return NextResponse.json({ error: "Workflow introuvable — confirmez d'abord le mois" }, { status: 404 })
  }

  return NextResponse.json({
    codeAgence: detectedAgence,
    fichierNom: file.name,
    clientsTotal,
    clientsRetenus,
    clientsExclus: clientsTotal - clientsRetenus,
    seuilMajo: DEFAULT_SEUIL_MAJO,
    seuilEtp: DEFAULT_SEUIL_ETP,
  })
}
