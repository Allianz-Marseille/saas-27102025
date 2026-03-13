/**
 * POST /api/admin/preterme-auto/slack
 * Envoie le rapport de synthèse sur Slack.
 */
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/utils/auth-utils"
import { adminDb } from "@/lib/firebase/admin-config"
import type { WorkflowState } from "@/types/preterme"

const SLACK_CHANNEL_ID = "CE58HNVF0"

function buildSlackMessage(workflow: WorkflowState): string {
  const agenceCodes = Object.keys(workflow.agences)
  let totalRetenus = 0
  let totalCartes = 0
  let totalErreurs = 0

  const agenceLines = agenceCodes.map(code => {
    const a = workflow.agences[code]
    const retenus = a.clients.filter(c => c.retenu)
    const particuliers = retenus.filter(c => c.classificationFinale === "particulier").length
    const entreprises = retenus.filter(c => c.classificationFinale === "entreprise").length
    const cartes = retenus.filter(c => c.dispatchStatut === "ok").length
    const erreurs = retenus.filter(c => c.dispatchStatut === "erreur").length

    totalRetenus += retenus.length
    totalCartes += cartes
    totalErreurs += erreurs

    return [
      `*AGENCE ${code}*`,
      `• Clients total        : ${a.clientsTotal}`,
      `• Clients retenus      : ${retenus.length}  (majo ≥ ${a.seuilMajo} % | ETP ≥ ${a.seuilEtp.toFixed(2)})`,
      `• Particuliers         : ${particuliers}`,
      `• Entreprises          : ${entreprises}`,
      `• Cartes Trello créées : ${cartes}`,
      erreurs > 0 ? `• Erreurs dispatch     : ${erreurs}` : null,
    ].filter(Boolean).join("\n")
  })

  return [
    `📋 *Préterme Auto — ${workflow.moisLabel}*`,
    "",
    "Traitement terminé. Voici la synthèse :",
    "",
    agenceLines.join("\n\n"),
    "",
    `*TOTAL — ${agenceCodes.length} agences*`,
    `• Clients retenus      : ${totalRetenus}`,
    `• Cartes créées        : ${totalCartes}`,
    `• Erreurs dispatch     : ${totalErreurs}`,
  ].join("\n")
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req)
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { moisKey } = await req.json() as { moisKey: string }
  if (!moisKey) return NextResponse.json({ error: "moisKey requis" }, { status: 400 })

  const token = process.env.SLACK_BOT_TOKEN
  if (!token) return NextResponse.json({ error: "SLACK_BOT_TOKEN non configuré" }, { status: 500 })

  const snap = await adminDb.collection("preterme_workflows").doc(moisKey).get()
  if (!snap.exists) return NextResponse.json({ error: "Workflow introuvable" }, { status: 404 })

  const workflow = snap.data() as WorkflowState
  const text = buildSlackMessage(workflow)

  const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ channel: SLACK_CHANNEL_ID, text }),
  })

  const slackData = await slackRes.json()
  if (!slackData.ok) {
    return NextResponse.json({ error: slackData.error ?? "Erreur Slack" }, { status: 400 })
  }

  await adminDb.collection("preterme_workflows").doc(moisKey).update({
    slackEnvoye: true,
    statut: "terminé",
  })

  return NextResponse.json({ ok: true })
}
