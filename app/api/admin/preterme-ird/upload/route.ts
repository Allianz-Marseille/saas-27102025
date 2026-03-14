/**
 * POST /api/admin/preterme-ird/upload
 * Importe un fichier Excel IARD et initialise l'agence dans le workflow.
 * Règle de rétention : tauxVariation >= seuilMajo OU etp >= seuilEtp (règle OU)
 */
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/utils/auth-utils"
import { parsePretermeIrdExcel, detectAgenceFromFilename } from "@/lib/utils/preterme-ird-parser"
import { adminDb } from "@/lib/firebase/admin-config"
import type { ClientIrdImporte, WorkflowIrdState } from "@/types/preterme-ird"

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

  const buffer = Buffer.from(await file.arrayBuffer())
  let parseResult
  try {
    parseResult = await parsePretermeIrdExcel(buffer, file.name)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur parsing Excel IARD"
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  const parsedRows = parseResult.rows
  const clientsTotal = parsedRows.length

  // Mapping parser → ClientIrdImporte avec règle de rétention OU
  const clients: ClientIrdImporte[] = parsedRows.map(pc => ({
    nomClient: pc.nomClient,
    numeroContrat: pc.numeroContrat,
    branche: pc.brancheContrat,
    echeancePrincipale: pc.echeancePrincipale,
    codeProduit: pc.codeProduit,
    modeReglement: pc.modeReglement,
    codeFractionnement: pc.codeFractionnement,
    primePrecedente: pc.primeTTCAnnuellePrecedente ?? 0,
    primeActualisee: pc.primeTTCAnnuelleActualisee ?? 0,
    tauxVariation: pc.tauxVariation ?? 0,
    surveillancePortefeuille: pc.surveillancePortefeuille,
    tauxAugmentationIndice: pc.tauxAugmentationIndice,
    formule: pc.formule,
    packs: pc.packs || null,
    codeGestionCentrale: pc.codeGestionCentrale ? Number(pc.codeGestionCentrale) || null : null,
    tauxModulationCommission: Number(pc.tauxModulationCommission) || 0,
    dateEffetDernierAvenant: pc.dateDernierAvenant,
    avantageClient: pc.avantageClient,
    etp: pc.etp ?? 0,
    // Règle OU : retenu si variation OU etp dépasse le seuil
    retenu: (pc.tauxVariation ?? 0) >= DEFAULT_SEUIL_MAJO || (pc.etp ?? 0) >= DEFAULT_SEUIL_ETP,
    classificationIA: null,
    classificationFinale: null,
    corrigeParUtilisateur: false,
    gerant: null,
    trelloCardId: null,
    dispatchStatut: "en_attente",
    dispatchErreur: null,
  }))

  const clientsRetenus = clients.filter(c => c.retenu).length

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

  const workflowRef = adminDb.collection("preterme_ird_workflows").doc(moisKey)
  const workflowSnap = await workflowRef.get()

  if (!workflowSnap.exists) {
    return NextResponse.json({ error: "Workflow IARD introuvable — confirmez d'abord le mois" }, { status: 404 })
  }

  const existing = workflowSnap.data() as WorkflowIrdState
  const updatedAgences = { ...(existing.agences ?? {}), [detectedAgence]: agenceData }
  const updatePayload: Record<string, unknown> = { agences: updatedAgences }

  // Réimport : remettre à l'étape 2 si on était plus loin
  if ((existing.etapeActive ?? 1) > 2) {
    updatePayload.etapeActive = 2
  }

  await workflowRef.update(updatePayload)

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
