import { NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { verifyAdmin } from "@/lib/utils/auth-utils"
import { adminDb } from "@/lib/firebase/admin-config"
import type { BsDeclaration, SalarieDeclaration } from "@/types/bs"
import type { Collaborateur } from "@/types/collaborateur"
import { moisKeyToLabel } from "@/types/bs"

/**
 * GET /api/admin/bs/export?moisKey=YYYY-MM
 * Génère et renvoie un fichier .xlsx du récapitulatif BS
 */
export async function GET(req: NextRequest) {
  try {
    await verifyAdmin(req)
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const moisKey = req.nextUrl.searchParams.get("moisKey")
  if (!moisKey || !/^\d{4}-\d{2}$/.test(moisKey)) {
    return NextResponse.json({ error: "moisKey invalide (format YYYY-MM)" }, { status: 400 })
  }

  const snap = await adminDb.collection("bs_declarations").doc(moisKey).get()
  if (!snap.exists) {
    return NextResponse.json({ error: "Déclaration introuvable" }, { status: 404 })
  }

  const declaration = snap.data() as BsDeclaration

  const collabSnap = await adminDb.collection("collaborateurs").get()
  const collaborateurs: Collaborateur[] = collabSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      firstName: data.firstName as string,
      pole: data.pole as Collaborateur["pole"],
      contrat: (data.contrat ?? "cdi") as Collaborateur["contrat"],
      joursTravail: (data.joursTravail as Collaborateur["joursTravail"]) ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })

  const collabs = collaborateurs
    .filter((c) => c.id in declaration.salaries)
    .sort((a, b) => a.firstName.localeCompare(b.firstName))

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "SaaS Allianz Nogaro"
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(`BS ${moisKeyToLabel(moisKey)}`)

  // ── Style helpers ────────────────────────────────────────────────────────────
  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E1B2E" },
  }
  const sectionFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2A2640" },
  }
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFE2E8F0" }, size: 11 }
  const sectionFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FF9B87F5" }, size: 10 }
  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FF3A3660" } },
    left: { style: "thin", color: { argb: "FF3A3660" } },
    bottom: { style: "thin", color: { argb: "FF3A3660" } },
    right: { style: "thin", color: { argb: "FF3A3660" } },
  }

  // ── En-tête colonnes ─────────────────────────────────────────────────────────
  const headerRow = sheet.addRow(["Élément", ...collabs.map((c) => c.firstName)])
  headerRow.font = headerFont
  headerRow.fill = headerFill
  headerRow.height = 22
  headerRow.eachCell((cell) => { cell.border = borderThin; cell.alignment = { horizontal: "center", vertical: "middle" } })
  headerRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" }

  // ── Largeurs colonnes ────────────────────────────────────────────────────────
  sheet.getColumn(1).width = 28
  collabs.forEach((_, i) => { sheet.getColumn(i + 2).width = 16 })

  // ── Helper : ligne de section ─────────────────────────────────────────────
  function addSectionRow(label: string) {
    const row = sheet.addRow([label])
    row.font = sectionFont
    row.fill = sectionFill
    row.height = 18
    row.eachCell((cell) => { cell.border = borderThin })
    sheet.mergeCells(row.number, 1, row.number, collabs.length + 1)
  }

  // ── Helper : ligne de données ─────────────────────────────────────────────
  function addDataRow(label: string, values: (string | number | undefined)[]) {
    const row = sheet.addRow([label, ...values])
    row.height = 16
    row.eachCell((cell) => {
      cell.border = borderThin
      cell.alignment = { horizontal: "center", vertical: "middle" }
    })
    row.getCell(1).alignment = { horizontal: "left", vertical: "middle" }
  }

  type NumKey = keyof Pick<SalarieDeclaration,
    "garantieVariable" | "primeFormation" | "commissions" | "boostGoogle" |
    "primeMacron" | "primeNoel" | "avance" | "avanceFrais" | "frais" | "heuresSup">

  function numRow(label: string, key: NumKey) {
    const values = collabs.map((c) => {
      const v = declaration.salaries[c.id]?.[key]
      return v !== undefined ? v : undefined
    })
    if (values.some((v) => v !== undefined)) addDataRow(label, values.map((v) => v !== undefined ? `${v}` : "—"))
  }

  // ── Engagements ──────────────────────────────────────────────────────────────
  addSectionRow("ENGAGEMENTS")
  numRow("Garantie variable", "garantieVariable")
  numRow("Prime formation", "primeFormation")

  // ── Éléments variables ───────────────────────────────────────────────────────
  addSectionRow("ÉLÉMENTS VARIABLES")
  numRow("Commissions", "commissions")
  numRow("Boost Google", "boostGoogle")
  numRow("Prime Macron", "primeMacron")
  numRow("Prime de Noël", "primeNoel")
  numRow("Avance", "avance")
  numRow("Avance sur frais", "avanceFrais")
  numRow("Notes de frais", "frais")
  numRow("Heures sup", "heuresSup")

  const regulValues = collabs.map((c) => declaration.salaries[c.id]?.regul)
  if (regulValues.some(Boolean)) {
    addDataRow("Régularisation", regulValues.map((v) => v ?? "—"))
  }

  // ── Absences ─────────────────────────────────────────────────────────────────
  addSectionRow("CP / MALADIE / ÉCOLE")

  const allWeeksAbsences = new Set<number>()
  collabs.forEach((c) => {
    declaration.salaries[c.id]?.absences?.forEach((a) => allWeeksAbsences.add(a.semaine))
  })
  const sortedAbsWeeks = Array.from(allWeeksAbsences).sort((a, b) => a - b)

  for (const semaine of sortedAbsWeeks) {
    addDataRow(
      `Semaine ${semaine}`,
      collabs.map((c) => {
        const absWeek = declaration.salaries[c.id]?.absences?.find((a) => a.semaine === semaine)
        return absWeek ? absWeek.evenements.join(", ") : "—"
      }),
    )
  }

  // ── Tickets restaurants ──────────────────────────────────────────────────────
  addSectionRow("TICKETS RESTAURANTS")

  const allWeeksTR = new Set<number>()
  collabs.forEach((c) => {
    declaration.salaries[c.id]?.ticketsRestaurants?.forEach((tr) => allWeeksTR.add(tr.semaine))
  })
  const sortedTRWeeks = Array.from(allWeeksTR).sort((a, b) => a - b)

  for (const semaine of sortedTRWeeks) {
    addDataRow(
      `Semaine ${semaine}`,
      collabs.map((c) => {
        const trWeek = declaration.salaries[c.id]?.ticketsRestaurants?.find((tr) => tr.semaine === semaine)
        return trWeek !== undefined ? String(trWeek.nb) : "—"
      }),
    )
  }

  // ── Génération buffer ────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bs_${moisKey}.xlsx"`,
    },
  })
}
