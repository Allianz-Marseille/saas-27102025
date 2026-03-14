/**
 * POST /api/admin/preterme-auto/slack
 * Envoie le rapport de synthèse sur Slack.
 */
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/utils/auth-utils"
import { adminDb } from "@/lib/firebase/admin-config"
import type { WorkflowState, SnapshotCdc } from "@/types/preterme"

const SLACK_CHANNEL_ID = "CE58HNVF0"

function buildSlackMessage(workflow: WorkflowState, snapshots: SnapshotCdc[]): string {
  const agenceCodes = Object.keys(workflow.agences)
  let totalRetenus = 0
  let totalCartes = 0
  let totalErreurs = 0

  const agenceBlocks = agenceCodes.map(code => {
    const a = workflow.agences[code]
    const retenus = a.clients.filter(c => c.retenu)
    const particuliers = retenus.filter(c => c.classificationFinale === "particulier").length
    const entreprises = retenus.filter(c => c.classificationFinale === "entreprise").length
    const cartes = retenus.filter(c => c.dispatchStatut === "ok").length
    const erreurs = retenus.filter(c => c.dispatchStatut === "erreur").length

    totalRetenus += retenus.length
    totalCartes += cartes
    totalErreurs += erreurs

    // Lignes par CDC pour cette agence, triées par volume décroissant
    const agenceSnaps = snapshots
      .filter(s => s.codeAgence === code)
      .sort((x, y) => y.clientsTotal - x.clientsTotal)

    const cdcLines = agenceSnaps.map(s => {
      const letters = s.lettresAttribuees.slice(0, 13).join(" ")
      const lettersStr = s.lettresAttribuees.length > 13 ? `${letters} …` : letters
      const errCount = s.clientsTotal - s.cartesCreees
      const statusStr = errCount > 0
        ? ` _(⚠️ ${errCount} erreur${errCount > 1 ? "s" : ""})_`
        : " ✅"
      return `     › *${s.cdcPrenom}* [${lettersStr}] — ${s.cartesCreees}/${s.clientsTotal} carte${s.clientsTotal > 1 ? "s" : ""}${statusStr}`
    })

    const errLabel = erreurs > 0 ? `  ⚠️ ${erreurs} erreur${erreurs > 1 ? "s" : ""}` : " ✅"
    return [
      `*🏢 AGENCE ${code}*  —  ${retenus.length} retenus  |  ${cartes} cartes créées${errLabel}`,
      `     👤 Particuliers : ${particuliers}   🏢 Entreprises : ${entreprises}`,
      ...(cdcLines.length > 0 ? cdcLines : ["     _(aucun CDC enregistré)_"]),
    ].join("\n")
  })

  const date = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  })

  return [
    `📋 *Préterme Auto — ${workflow.moisLabel}*`,
    `_Traitement terminé le ${date}_`,
    "",
    agenceBlocks.join("\n\n"),
    "",
    "─────────────────────────",
    `*📊 TOTAL — ${agenceCodes.length} agences*`,
    `• Retenus : ${totalRetenus}   |   Cartes créées : ${totalCartes}${totalErreurs > 0 ? `   |   ⚠️ Erreurs : ${totalErreurs}` : "   ✅"}`,
  ].join("\n")
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req)
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { moisKey } = await req.json() as { moisKey: string }
    if (!moisKey) return NextResponse.json({ error: "moisKey requis" }, { status: 400 })

    const token = process.env.SLACK_BOT_TOKEN
    if (!token) return NextResponse.json({ error: "SLACK_BOT_TOKEN non configuré" }, { status: 500 })

    const snap = await adminDb.collection("preterme_workflows").doc(moisKey).get()
    if (!snap.exists) return NextResponse.json({ error: "Workflow introuvable" }, { status: 404 })
    const workflow = snap.data() as WorkflowState

    // Charger les snapshots CDC pour ce mois
    const snapshotsSnap = await adminDb
      .collection("preterme_snapshots")
      .where("moisKey", "==", moisKey)
      .get()
    const snapshots = snapshotsSnap.docs.map(d => d.data() as SnapshotCdc)

    const text = buildSlackMessage(workflow, snapshots)

    const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channel: SLACK_CHANNEL_ID, text, mrkdwn: true }),
    })

    const slackData = await slackRes.json() as { ok: boolean; error?: string }
    if (!slackData.ok) {
      return NextResponse.json({ error: slackData.error ?? "Erreur Slack" }, { status: 400 })
    }

    await adminDb.collection("preterme_workflows").doc(moisKey).update({
      slackEnvoye: true,
      statut: "terminé",
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur interne"
    console.error("[slack] erreur non gérée :", e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
