/**
 * POST /api/admin/preterme-ird/slack
 * Envoie le rapport IARD de synthèse sur Slack.
 */
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/utils/auth-utils"
import { adminDb } from "@/lib/firebase/admin-config"
import { buildIrdSlackMessage } from "@/lib/services/preterme-ird-slack"
import type { WorkflowIrdState } from "@/types/preterme-ird"
import type { Agency } from "@/lib/trello-config/types"

const DEFAULT_CHANNEL_ID = "CE58HNVF0"

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req)
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { moisKey, channelId } = await req.json() as { moisKey: string; channelId?: string }
    if (!moisKey) return NextResponse.json({ error: "moisKey requis" }, { status: 400 })
    const targetChannel = channelId ?? DEFAULT_CHANNEL_ID

    const token = process.env.SLACK_BOT_TOKEN
    if (!token) return NextResponse.json({ error: "SLACK_BOT_TOKEN non configuré" }, { status: 500 })

    const [workflowSnap, trelloSnap] = await Promise.all([
      adminDb.collection("preterme_ird_workflows").doc(moisKey).get(),
      adminDb.collection("config").doc("trello").get(),
    ])

    if (!workflowSnap.exists) return NextResponse.json({ error: "Workflow IARD introuvable" }, { status: 404 })
    const workflow = workflowSnap.data() as WorkflowIrdState
    const agencies: Agency[] = trelloSnap.exists ? (trelloSnap.data() as { agencies: Agency[] }).agencies ?? [] : []

    const text = buildIrdSlackMessage(workflow, agencies)

    const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ channel: targetChannel, text, mrkdwn: true }),
    })

    const slackData = await slackRes.json() as { ok: boolean; error?: string }
    if (!slackData.ok) {
      return NextResponse.json({ error: slackData.error ?? "Erreur Slack" }, { status: 400 })
    }

    await adminDb.collection("preterme_ird_workflows").doc(moisKey).update({
      slackEnvoye: true,
      statut: "terminé",
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur interne"
    console.error("[preterme-ird/slack] erreur non gérée :", e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
