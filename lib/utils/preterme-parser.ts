import ExcelJS from "exceljs"

export type ParsedClient = {
  nomClient: string
  numeroContrat: string
  branche: string
  echeancePrincipale: string
  codeProduit: string | number
  modeReglement: string
  codeFractionnement: string
  primePrecedente: number
  primeActualisee: number
  tauxVariation: number
  surveillancePortefeuille: string
  avantageClient: number | string
  formule: string | number
  packs: string | null
  nbSinistres: number
  bonusMalus: number
  etp: number
  codeGestionCentrale: number | null
  tauxModulationCommission: number
  dateEffetDernierAvenant: string
}

function cellToString(cell: ExcelJS.Cell): string {
  const v = cell.value
  if (v === null || v === undefined) return ""
  if (typeof v === "object" && "text" in v) return String((v as { text: string }).text)
  if (v instanceof Date) return v.toISOString().split("T")[0]
  return String(v).trim()
}

function cellToNumber(cell: ExcelJS.Cell): number {
  const v = cell.value
  if (v === null || v === undefined) return 0
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

function cellToDate(cell: ExcelJS.Cell): string {
  const v = cell.value
  if (!v) return ""
  if (v instanceof Date) return v.toISOString().split("T")[0]
  return String(v).trim()
}

export function detectAgenceFromFilename(filename: string): string | null {
  const match = filename.match(/H\d{5}/)
  return match ? match[0] : null
}

export async function parsePretermeExcel(buffer: ArrayBuffer | Buffer): Promise<ParsedClient[]> {
  const workbook = new ExcelJS.Workbook()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(buffer as any)

  const sheet = workbook.getWorksheet("Feuil1") ?? workbook.worksheets[0]
  if (!sheet) throw new Error("Feuille Excel introuvable")

  const clients: ParsedClient[] = []

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return

    const g = (col: number) => row.getCell(col)

    const nomClient = cellToString(g(1))
    const numeroContrat = cellToString(g(2))
    if (!nomClient || !numeroContrat) return

    const codeProduitStr = cellToString(g(5))
    const codeProduitNum = cellToNumber(g(5))
    const formuleStr = cellToString(g(13))
    const formuleNum = cellToNumber(g(13))
    const avantageNum = cellToNumber(g(12))
    const avantageStr = cellToString(g(12))

    clients.push({
      nomClient,
      numeroContrat,
      branche: cellToString(g(3)),
      echeancePrincipale: cellToDate(g(4)),
      codeProduit: codeProduitStr || codeProduitNum,
      modeReglement: cellToString(g(6)),
      codeFractionnement: cellToString(g(7)),
      primePrecedente: cellToNumber(g(8)),
      primeActualisee: cellToNumber(g(9)),
      tauxVariation: cellToNumber(g(10)),
      surveillancePortefeuille: cellToString(g(11)),
      avantageClient: avantageNum || avantageStr,
      formule: formuleStr || formuleNum,
      packs: cellToString(g(14)) || null,
      nbSinistres: cellToNumber(g(15)),
      bonusMalus: cellToNumber(g(16)),
      etp: cellToNumber(g(17)),
      codeGestionCentrale: cellToNumber(g(18)) || null,
      tauxModulationCommission: cellToNumber(g(19)),
      dateEffetDernierAvenant: cellToDate(g(20)),
    })
  })

  return clients
}
