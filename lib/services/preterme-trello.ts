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

export function buildCardTitle(client: ClientImporte): string {
  return `[AUTO] ${client.nomClient} — Échéance ${formatDate(client.echeancePrincipale)}`
}

export function buildCardDescription(client: ClientImporte): string {
  const lines = [
    "## Contrat",
    `- N° de contrat     : ${client.numeroContrat}`,
    `- Code produit      : ${client.codeProduit}`,
    `- Formule           : ${client.formule}`,
    `- Fractionnement    : ${client.codeFractionnement}`,
    `- Mode de règlement : ${client.modeReglement}`,
    "",
    "## Tarif",
    `- Prime précédente  : ${formatEuro(client.primePrecedente)}`,
    `- Prime actualisée  : ${formatEuro(client.primeActualisee)}`,
    `- Majoration        : +${client.tauxVariation.toFixed(2)} %`,
    `- ETP               : ${client.etp.toFixed(2)}`,
    "",
    "## Sinistralité",
    `- Nb sinistres      : ${client.nbSinistres}`,
    `- Bonus/Malus       : ${client.bonusMalus.toFixed(2)}`,
    "",
    "## Client",
    `- Type              : ${client.classificationFinale === "entreprise" ? "Entreprise" : "Particulier"}`,
    `- Surveillance      : ${client.surveillancePortefeuille}`,
    `- Avantage client   : ${client.avantageClient}`,
    `- Dernier avenant   : ${formatDate(client.dateEffetDernierAvenant)}`,
  ]

  if (client.classificationFinale === "entreprise" && client.gerant) {
    lines.push("", "## Entreprise")
    lines.push(`- Gérant            : ${client.gerant}`)
  }

  return lines.join("\n")
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

type TrelloCard = { id: string; name: string; url: string }

export async function createOrUpdateCard(
  client: ClientImporte,
  listId: string,
  apiKey: string,
  token: string,
  retries = 2
): Promise<TrelloCard> {
  const name = buildCardTitle(client)
  const desc = buildCardDescription(client)

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
      return createOrUpdateCard(client, listId, apiKey, token, retries - 1)
    }
    const card = await res.json()
    return { id: card.id, name: card.name, url: card.shortUrl ?? "" }
  }

  const res = await fetch(
    `https://api.trello.com/1/cards?key=${apiKey}&token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, desc, idList: listId, pos: "bottom" }),
    }
  )

  if (res.status === 429 && retries > 0) {
    await sleep(1500)
    return createOrUpdateCard(client, listId, apiKey, token, retries - 1)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Trello API ${res.status}: ${text}`)
  }

  const card = await res.json()
  return { id: card.id, name: card.name, url: card.shortUrl ?? "" }
}
