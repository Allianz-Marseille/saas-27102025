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
  const etpOk = ctx ? client.etp >= ctx.seuilEtp : null

  // Niveau d'alerte basé sur les dépassements
  const nbAlertes = (majoOk ? 1 : 0) + (etpOk ? 1 : 0)
  const niveauAlerte = nbAlertes === 2 ? "🔴 DOUBLE ALERTE" : nbAlertes === 1 ? "🟠 ALERTE" : "🟡 SURVEILLANCE"

  let classifLabel = "—"
  if (client.classificationFinale === "particulier") {
    classifLabel = client.corrigeParUtilisateur ? "👤 Particulier *(corrigé manuellement)*" : "👤 Particulier *(détection IA)*"
  } else if (client.classificationFinale === "entreprise") {
    classifLabel = client.corrigeParUtilisateur ? "🏢 Entreprise *(corrigée manuellement)*" : "🏢 Entreprise *(détection IA)*"
  }

  const lines: (string | null)[] = [
    `## ${niveauAlerte} — Préterme Auto ${ctx?.moisLabel ?? ""}`,
    "",
    `> 🤖 Carte générée automatiquement le **${dateStr} à ${timeStr}**.`,
    "> Ce client a été identifié par le système comme nécessitant un suivi proactif avant son échéance.",
    "",
    "---",
    "",
    "## 🎯 Pourquoi ce client est dans votre tableau ?",
    "",
    ctx
      ? `- 📈 **Majoration tarifaire :** +${client.tauxVariation.toFixed(2)} % ${majoOk ? `→ dépasse le seuil de ${ctx.seuilMajo} % ✅` : `→ en dessous du seuil de ${ctx.seuilMajo} % —`}`
      : `- 📈 **Majoration tarifaire :** +${client.tauxVariation.toFixed(2)} %`,
    ctx
      ? `- 📊 **Évolution tarif prédictif (ETP) :** ${client.etp.toFixed(2)} ${etpOk ? `→ dépasse le seuil de ${ctx.seuilEtp} ✅` : `→ en dessous du seuil de ${ctx.seuilEtp} —`}`
      : `- 📊 **Évolution tarif prédictif (ETP) :** ${client.etp.toFixed(2)}`,
    "",
    `- 🏷️ **Profil détecté :** ${classifLabel}`,
    (client.classificationFinale === "entreprise" && client.gerant)
      ? `- 👔 **Interlocuteur / Gérant :** ${client.gerant}`
      : null,
    "",
    "---",
    "",
    "## 📋 Fiche contrat",
    "",
    `- 🔢 **N° contrat :** \`${client.numeroContrat}\``,
    `- 🚗 **Code produit :** ${client.codeProduit}`,
    `- 📦 **Formule :** ${client.formule}`,
    `- 🔄 **Fractionnement :** ${client.codeFractionnement}`,
    `- 💳 **Mode de règlement :** ${client.modeReglement}`,
    `- 📝 **Dernier avenant :** ${formatDate(client.dateEffetDernierAvenant)}`,
    `- 📅 **Échéance principale :** ${formatDate(client.echeancePrincipale)}`,
    "",
    "---",
    "",
    "## 💶 Situation tarifaire",
    "",
    `- Prime N-1           : ${formatEuro(client.primePrecedente)}`,
    `- Prime actualisée    : ${formatEuro(client.primeActualisee)}`,
    `- ⚠️ Variation        : **+${client.tauxVariation.toFixed(2)} %**`,
    `- ETP                 : ${client.etp.toFixed(2)}`,
    "",
    "---",
    "",
    "## 🚨 Sinistralité (N-3)",
    "",
    `- Nb sinistres     : ${client.nbSinistres === 0 ? "✅ Aucun" : `⚠️ ${client.nbSinistres}`}`,
    `- Coefficient B/M  : ${client.bonusMalus.toFixed(2)}`,
    `- Surveillance PF  : ${client.surveillancePortefeuille || "—"}`,
    `- Avantage client  : ${client.avantageClient || "—"}`,
    "",
    "---",
    "",
    "## 📞 Suivi relationnel — Actions CDC",
    "",
    "### 📬 Tentatives de contact",
    "- [ ] 📞 1er appel — *date :* ___________",
    "- [ ] ✅ Client joint",
    "- [ ] 📱 SMS de relance envoyé — *date :* ___________",
    "- [ ] 📧 Mail de relance envoyé — *date :* ___________",
    "- [ ] 🎙️ Message vocal laissé — *date :* ___________",
    "- [ ] 🔁 Rappel client reçu — *date :* ___________",
    "",
    "### 🤝 Entretien",
    "- [ ] 📅 Entretien planifié — *date/heure :* ___________",
    "- [ ] ✅ Entretien réalisé",
    "- [ ] 📝 Compte-rendu rédigé",
    "",
    "### 🏁 Résultat final",
    "- [ ] 🟢 **Fidélisé** — contrat maintenu",
    "- [ ] 🔴 **Résilié** — départ client",
    "- [ ] ⚫ **Sans suite** — client injoignable après plusieurs tentatives",
    "- [ ] 🟡 **En attente** — suivi en cours",
    "",
    "---",
    "",
    "> 💡 **Conseil :** utilisez les **Commentaires** de cette carte pour noter chaque échange",
    "> *(date, canal utilisé, contenu de l'échange, suite donnée, prochain rendez-vous…)*",
  ]

  return lines.filter((l): l is string => l !== null).join("\n")
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
  retries = 2,
  ctx?: DispatchContext
): Promise<TrelloCard> {
  const name = buildCardTitle(client)
  const desc = buildCardDescription(client, ctx)

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
    return createOrUpdateCard(client, listId, apiKey, token, retries - 1, ctx)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Trello API ${res.status}: ${text}`)
  }

  const card = await res.json()
  return { id: card.id, name: card.name, url: card.shortUrl ?? "" }
}
