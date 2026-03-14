/**
 * POST /api/admin/preterme-auto/slack
 * Envoie le rapport de synthèse sur Slack.
 */
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/utils/auth-utils"
import { adminDb } from "@/lib/firebase/admin-config"
import { routeClientsTocdcs } from "@/lib/services/preterme-router"
import type { WorkflowState } from "@/types/preterme"
import type { Agency } from "@/lib/trello-config/types"

const DEFAULT_CHANNEL_ID = "CE58HNVF0"

function buildSlackMessage(workflow: WorkflowState, agencies: Agency[]): string {
  const agenceCodes = Object.keys(workflow.agences)

  // Passe 1 — totaux globaux
  let grandTotalClients = 0
  let grandTotalRetenus = 0
  let grandTotalCartes = 0
  let grandTotalErreurs = 0
  for (const code of agenceCodes) {
    const a = workflow.agences[code]
    const retenus = a.clients.filter(c => c.retenu)
    grandTotalClients += a.clientsTotal
    grandTotalRetenus += retenus.length
    grandTotalCartes += retenus.filter(c => c.dispatchStatut === "ok").length
    grandTotalErreurs += retenus.filter(c => c.dispatchStatut === "erreur").length
  }

  // Passe 2 — blocs par agence
  const agenceBlocks = agenceCodes.map(code => {
    const a = workflow.agences[code]
    const retenus = a.clients.filter(c => c.retenu)
    const erreurs = retenus.filter(c => c.dispatchStatut === "erreur").length
    const pct = grandTotalClients > 0 ? Math.round(retenus.length / grandTotalClients * 100) : 0

    const agency = agencies.find(ag => ag.code === code)
    let cdcLine = ""

    if (agency) {
      const routed = routeClientsTocdcs(
        retenus.map(c => ({
          nomClient: c.nomClient,
          numeroContrat: c.numeroContrat,
          classificationFinale: c.classificationFinale,
          gerant: c.gerant,
        })),
        agency
      )

      const cdcMap = new Map<string, { prenom: string; total: number; err: number }>()
      for (const rc of routed) {
        const key = rc.cdcId ?? `__missing_${rc.premiereLettre}__`
        if (!cdcMap.has(key)) {
          cdcMap.set(key, { prenom: rc.cdcPrenom ?? `?${rc.premiereLettre}`, total: 0, err: 0 })
        }
        const entry = cdcMap.get(key)!
        entry.total++
        const client = retenus.find(c => c.numeroContrat === rc.numeroContrat)
        if (client?.dispatchStatut === "erreur") entry.err++
      }

      const parts = [...cdcMap.entries()]
        .sort((a, b) => b[1].total - a[1].total)
        .map(([, { prenom, total, err }]) =>
          err > 0 ? `${prenom}: ${total} _(⚠️ ${err} err)_` : `${prenom}: ${total}`
        )

      if (parts.length > 0) cdcLine = parts.join(" — ")
    }

    const agenceHeader = erreurs > 0
      ? `🏢 *${code}* — ${retenus.length} retenus (${pct}% / ${grandTotalClients}) ⚠️`
      : `🏢 *${code}* — ${retenus.length} retenus (${pct}% / ${grandTotalClients})`

    return [
      agenceHeader,
      ...(cdcLine ? [cdcLine] : []),
    ].join("\n")
  })

  const date = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  })

  const divider = "━━━━━━━━━━━━━━━━━━━"
  const cartesLabel = grandTotalErreurs > 0
    ? `${grandTotalCartes}/${grandTotalRetenus} ⚠️`
    : `${grandTotalCartes}/${grandTotalRetenus} ✅`

  return [
    `🚗 *Préterme Auto — ${workflow.moisLabel}*`,
    `_Traitement du ${date} · ${agenceCodes.length} agences_`,
    "",
    `📊 Nbre de contrats dans le préterme : *${grandTotalClients}*`,
    `✅ Nbre retenu : *${grandTotalRetenus}*`,
    `🃏 Nbre de cartes Trello : *${cartesLabel}*`,
    "",
    divider,
    "",
    agenceBlocks.join("\n\n"),
  ].join("\n")
}

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
      adminDb.collection("preterme_workflows").doc(moisKey).get(),
      adminDb.collection("config").doc("trello").get(),
    ])

    if (!workflowSnap.exists) return NextResponse.json({ error: "Workflow introuvable" }, { status: 404 })
    const workflow = workflowSnap.data() as WorkflowState
    const agencies: Agency[] = trelloSnap.exists ? (trelloSnap.data() as { agencies: Agency[] }).agencies ?? [] : []

    const text = buildSlackMessage(workflow, agencies)

    const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ channel: targetChannel, text, mrkdwn: true }),
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
