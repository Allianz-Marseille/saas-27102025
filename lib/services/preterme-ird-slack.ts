/**
 * Construction du message Slack pour la synthèse Préterme IARD.
 * Format texte brut mrkdwn — identique à Auto avec icône 🛡️ et label IARD.
 * Deux passes : totaux globaux d'abord, puis blocs par agence (pour les pourcentages).
 */

import { routeClientsTocdcs } from "@/lib/services/preterme-router"
import type { WorkflowIrdState } from "@/types/preterme-ird"
import type { Agency } from "@/lib/trello-config/types"

export function buildIrdSlackMessage(workflow: WorkflowIrdState, agencies: Agency[]): string {
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
    `🛡️ *Préterme IARD — ${workflow.moisLabel}*`,
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
