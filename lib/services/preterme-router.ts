import type { Agency, CDC } from "@/lib/trello-config/types"

export function extractFirstLetter(nomClient: string): string {
  return nomClient
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()[0] ?? ""
}

export function findCdcForLetter(
  letter: string,
  cdcs: CDC[]
): CDC | null {
  return cdcs.find(cdc => cdc.letters.includes(letter)) ?? null
}

export type RoutedClient = {
  numeroContrat: string
  nomClient: string
  premiereLettre: string
  cdcId: string | null
  cdcPrenom: string | null
  boardId: string | null
  trelloListId: string | null
  classification: "particulier" | "entreprise"
  gerant: string | null
  erreur: string | null
}

export function routeClientsTocdcs(
  clients: Array<{
    nomClient: string
    numeroContrat: string
    classificationFinale: "particulier" | "entreprise" | null
    gerant: string | null
  }>,
  agency: Agency
): RoutedClient[] {
  return clients.map(client => {
    const letter = extractFirstLetter(client.nomClient)
    const cdc = findCdcForLetter(letter, agency.cdc)

    const classification = client.classificationFinale ?? "particulier"

    if (!cdc) {
      return {
        numeroContrat: client.numeroContrat,
        nomClient: client.nomClient,
        premiereLettre: letter,
        cdcId: null,
        cdcPrenom: null,
        boardId: null,
        trelloListId: null,
        classification,
        gerant: client.gerant,
        erreur: `Lettre "${letter}" non couverte dans la config`,
      }
    }

    if (!cdc.boardId || !cdc.lists?.pretermeAuto) {
      return {
        numeroContrat: client.numeroContrat,
        nomClient: client.nomClient,
        premiereLettre: letter,
        cdcId: cdc.id,
        cdcPrenom: cdc.firstName,
        boardId: cdc.boardId ?? null,
        trelloListId: cdc.lists?.pretermeAuto ?? null,
        classification,
        gerant: client.gerant,
        erreur: `Trello non configuré pour ${cdc.firstName}`,
      }
    }

    return {
      numeroContrat: client.numeroContrat,
      nomClient: client.nomClient,
      premiereLettre: letter,
      cdcId: cdc.id,
      cdcPrenom: cdc.firstName,
      boardId: cdc.boardId,
      trelloListId: cdc.lists.pretermeAuto,
      classification,
      gerant: client.gerant,
      erreur: null,
    }
  })
}
