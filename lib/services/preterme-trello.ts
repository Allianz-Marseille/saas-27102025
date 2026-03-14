import type { ClientImporte } from "@/types/preterme"

function formatDate(iso: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function formatEuro(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
}

/** Convertit l'échéance en due date Trello (ISO, midi UTC pour éviter les décalages de fuseau). */
function buildDueDate(echeance: string): string | undefined {
  if (!echeance) return undefined
  const d = new Date(echeance)
  if (isNaN(d.getTime())) return undefined
  d.setUTCHours(12, 0, 0, 0)
  return d.toISOString()
}

export type DispatchContext = {
  moisLabel: string
  seuilMajo: number
  seuilEtp: number
  dispatchedAt: string // ISO
}

export function buildCardTitle(client: ClientImporte): string {
  return `[AUTO] ${client.nomClient} — Échéance ${formatDate(client.echeancePrincipale)}`
}

export function buildCardDescription(client: ClientImporte, ctx?: DispatchContext): string {
  const now = ctx?.dispatchedAt ? new Date(ctx.dispatchedAt) : new Date()
  const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  const majoOk = ctx ? client.tauxVariation >= ctx.seuilMajo : null
  const etpOk  = ctx ? client.etp >= ctx.seuilEtp : null
  const nbAlertes = (majoOk ? 1 : 0) + (etpOk ? 1 : 0)
  const niveauAlerte = nbAlertes === 2 ? "🔴 DOUBLE ALERTE" : nbAlertes === 1 ? "🟠 ALERTE" : "🟡 SURVEILLANCE"

  let classifLabel = "—"
  if (client.classificationFinale === "particulier") {
    classifLabel = client.corrigeParUtilisateur ? "👤 Particulier (corrigé manuellement)" : "👤 Particulier (détection IA)"
  } else if (client.classificationFinale === "entreprise") {
    classifLabel = client.corrigeParUtilisateur ? "🏢 Entreprise (corrigée manuellement)" : "🏢 Entreprise (détection IA)"
  }

  const lines: (string | null)[] = [
    `## ${niveauAlerte} — Préterme Auto ${ctx?.moisLabel ?? ""}`,
    "",
    `🤖 Carte générée le ${dateStr} à ${timeStr} — suivi proactif avant échéance du ${formatDate(client.echeancePrincipale)}.`,
    "",
    "---",
    "",
    "## 🎯 Pourquoi ce client ?",
    "",
    ctx
      ? `- 📈 Majoration tarifaire : +${client.tauxVariation.toFixed(2)} % ${majoOk ? `→ dépasse le seuil de ${ctx.seuilMajo} % ✅` : `→ sous le seuil de ${ctx.seuilMajo} % —`}`
      : `- 📈 Majoration tarifaire : +${client.tauxVariation.toFixed(2)} %`,
    ctx
      ? `- 📊 ETP : ${client.etp.toFixed(2)} ${etpOk ? `→ dépasse le seuil de ${ctx.seuilEtp} ✅` : `→ sous le seuil de ${ctx.seuilEtp} —`}`
      : `- 📊 ETP : ${client.etp.toFixed(2)}`,
    "",
    `- 🏷️ Profil : ${classifLabel}`,
    (client.classificationFinale === "entreprise" && client.gerant)
      ? `- 👔 Interlocuteur / Gérant : ${client.gerant}`
      : null,
    "",
    "---",
    "",
    "## 📋 Fiche contrat",
    "",
    `- 🔢 N° contrat      : ${client.numeroContrat}`,
    `- 🚗 Code produit    : ${client.codeProduit}`,
    `- 📦 Formule         : ${client.formule || "—"}`,
    `- 🔄 Fractionnement  : ${client.codeFractionnement || "—"}`,
    `- 💳 Règlement       : ${client.modeReglement || "—"}`,
    `- 📝 Dernier avenant : ${formatDate(client.dateEffetDernierAvenant)}`,
    `- 📅 Échéance        : ${formatDate(client.echeancePrincipale)}`,
    "",
    "---",
    "",
    "## 💶 Situation tarifaire",
    "",
    `- Prime N-1          : ${formatEuro(client.primePrecedente)}`,
    `- Prime actualisée   : ${formatEuro(client.primeActualisee)}`,
    `- ⚠️ Variation       : +${client.tauxVariation.toFixed(2)} %`,
    `- ETP                : ${client.etp.toFixed(2)}`,
    "",
    "---",
    "",
    "## 🚨 Sinistralité (N-3)",
    "",
    `- Nb sinistres    : ${client.nbSinistres === 0 ? "✅ Aucun" : `⚠️ ${client.nbSinistres}`}`,
    `- Bonus/Malus     : ${client.bonusMalus.toFixed(2)}`,
    `- Surveillance PF : ${client.surveillancePortefeuille || "—"}`,
    `- Avantage client : ${client.avantageClient || "—"}`,
    "",
    "---",
    "",
    "💡 Utilisez les checklists ci-dessous pour suivre vos actions, et les Commentaires pour noter chaque échange (date, canal, contenu, suite donnée).",
  ]

  return lines.filter((l): l is string => l !== null).join("\n")
}

// ─── Checklists Trello (créées uniquement à la première création de carte) ─────

const TRELLO_CHECKLISTS: { name: string; items: string[] }[] = [
  {
    name: "📬 Tentatives de contact",
    items: [
      "📞 1er appel tenté — date : ___________",
      "✅ Client joint",
      "📱 SMS de relance — date : ___________",
      "📧 Mail de relance — date : ___________",
      "🎙️ Message vocal laissé — date : ___________",
      "🔁 Rappel client reçu — date : ___________",
    ],
  },
  {
    name: "🤝 Entretien",
    items: [
      "📅 Entretien planifié — date/heure : ___________",
      "✅ Entretien réalisé",
      "📝 Compte-rendu rédigé",
    ],
  },
  {
    name: "🏁 Résultat final",
    items: [
      "🟢 Fidélisé — contrat maintenu",
      "🔴 Résilié — départ client",
      "⚫ Sans suite — client injoignable",
      "🟡 En attente — suivi en cours",
    ],
  },
]

async function createCardChecklists(cardId: string, apiKey: string, token: string): Promise<void> {
  for (const cl of TRELLO_CHECKLISTS) {
    try {
      const res = await fetch(
        `https://api.trello.com/1/checklists?key=${apiKey}&token=${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idCard: cardId, name: cl.name }),
        }
      )
      if (!res.ok) continue
      const { id: clId } = await res.json() as { id: string }
      for (const item of cl.items) {
        await fetch(
          `https://api.trello.com/1/checklists/${clId}/checkItems?key=${apiKey}&token=${token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: item, checked: false }),
          }
        )
      }
    } catch {
      // Non-bloquant : la carte est créée même si les checklists échouent
    }
  }
}

// ─── Création / mise à jour de carte ──────────────────────────────────────────

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

type TrelloCard = { id: string; name: string; url: string }

export async function createOrUpdateCard(
  client: ClientImporte,
  listId: string,
  apiKey: string,
  token: string,
  retries = 2,
  ctx?: DispatchContext
): Promise<TrelloCard> {
  const name = buildCardTitle(client)
  const desc = buildCardDescription(client, ctx)

  // ── Mise à jour d'une carte existante (pas de recréation des checklists) ──
  if (client.trelloCardId) {
    const res = await fetch(
      `https://api.trello.com/1/cards/${client.trelloCardId}?key=${apiKey}&token=${token}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, desc }),
      }
    )
    if (res.status === 429 && retries > 0) {
      await sleep(1500)
      return createOrUpdateCard(client, listId, apiKey, token, retries - 1, ctx)
    }
    const card = await res.json() as TrelloCard & { shortUrl?: string }
    return { id: card.id, name: card.name, url: card.shortUrl ?? "" }
  }

  // ── Création d'une nouvelle carte ──
  const due = buildDueDate(client.echeancePrincipale)
  const res = await fetch(
    `https://api.trello.com/1/cards?key=${apiKey}&token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, desc, idList: listId, pos: "bottom", ...(due ? { due } : {}) }),
    }
  )

  if (res.status === 429 && retries > 0) {
    await sleep(1500)
    return createOrUpdateCard(client, listId, apiKey, token, retries - 1, ctx)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Trello API ${res.status}: ${text}`)
  }

  const card = await res.json() as TrelloCard & { shortUrl?: string }

  // Checklists créées après la carte (non-bloquant)
  await createCardChecklists(card.id, apiKey, token)

  return { id: card.id, name: card.name, url: card.shortUrl ?? "" }
}
