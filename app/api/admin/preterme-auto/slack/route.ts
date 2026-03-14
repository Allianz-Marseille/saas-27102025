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

const SLACK_CHANNEL_ID = "C0ALGU83Z6H"

function buildSlackMessage(workflow: WorkflowState, agencies: Agency[]): string {
  const agenceCodes = Object.keys(workflow.agences)
  let grandTotalClients = 0
  let grandTotalRetenus = 0
  let grandTotalCartes = 0
  let grandTotalErreurs = 0

  const agenceBlocks = agenceCodes.map(code => {
    const a = workflow.agences[code]
    const retenus = a.clients.filter(c => c.retenu)
    const particuliers = retenus.filter(c => c.classificationFinale === "particulier").length
    const entreprises = retenus.filter(c => c.classificationFinale === "entreprise").length
    const cartes = retenus.filter(c => c.dispatchStatut === "ok").length
    const erreurs = retenus.filter(c => c.dispatchStatut === "erreur").length

    grandTotalClients += a.clientsTotal
    grandTotalRetenus += retenus.length
    grandTotalCartes += cartes
    grandTotalErreurs += erreurs

    // Routing per CDC depuis la config Trello
    const agency = agencies.find(ag => ag.code === code)
    const cdcLines: string[] = []

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

      // Grouper par CDC
      const cdcMap = new Map<string, { prenom: string; letters: string[]; total: number; ok: number; err: number }>()
      for (const rc of routed) {
        const key = rc.cdcId ?? `__missing_${rc.premiereLettre}__`
        if (!cdcMap.has(key)) {
          cdcMap.set(key, {
            prenom: rc.cdcPrenom ?? `Lettre "${rc.premiereLettre}" non couverte`,
            letters: agency.cdc.find(c => c.id === rc.cdcId)?.letters ?? [],
            total: 0, ok: 0, err: 0,
          })
        }
        const entry = cdcMap.get(key)!
        entry.total++
        const client = retenus.find(c => c.numeroContrat === rc.numeroContrat)
        if (client?.dispatchStatut === "ok") entry.ok++
        else if (client?.dispatchStatut === "erreur") entry.err++
      }

      for (const [, { prenom, letters, total, ok, err }] of [...cdcMap.entries()].sort((a, b) => b[1].total - a[1].total)) {
        const letStr = letters.slice(0, 13).join(" ") + (letters.length > 13 ? " …" : "")
        const status = err > 0 ? ` _(⚠️ ${err} err)_` : " ✅"
        cdcLines.push(`     › *${prenom}* [${letStr}] — ${ok}/${total} carte${total > 1 ? "s" : ""}${status}`)
      }
    }

    const errLabel = erreurs > 0 ? `  ⚠️ ${erreurs} erreur${erreurs > 1 ? "s" : ""}` : " ✅"
    return [
      `*🏢 AGENCE ${code}*`,
      `     • Contrats importés (fichier ${workflow.moisLabel}) : ${a.clientsTotal}`,
      `     • Retenus (critères)  : ${retenus.length}  _(majo ≥ ${a.seuilMajo} % | ETP ≥ ${a.seuilEtp.toFixed(2)})_`,
      `     • Particuliers : ${particuliers}   Entreprises : ${entreprises}`,
      `     • Cartes Trello créées : ${cartes}${errLabel}`,
      ...(cdcLines.length > 0 ? ["", "     Détail par CDC :"] : []),
      ...cdcLines,
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
    "─────────────────────────────────",
    `*📊 TOTAL CONSOLIDÉ — ${agenceCodes.length} agences*`,
    `• Contrats importés : ${grandTotalClients}`,
    `• Retenus      : ${grandTotalRetenus}`,
    `• Cartes créées: ${grandTotalCartes}${grandTotalErreurs > 0 ? `   ⚠️ Erreurs : ${grandTotalErreurs}` : "   ✅"}`,
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
