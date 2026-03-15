"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Copy, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BsDeclaration, SalarieDeclaration } from "@/types/bs"
import type { Collaborateur } from "@/types/collaborateur"

interface Props {
  declaration: BsDeclaration
  collaborateurs: Collaborateur[]
}

type LigneKey = keyof Pick<
  SalarieDeclaration,
  | "commissions"
  | "boostGoogle"
  | "primeMacron"
  | "primeNoel"
  | "avance"
  | "avanceFrais"
  | "frais"
  | "heuresSup"
  | "regul"
  | "garantieVariable"
  | "primeFormation"
>

const LIGNES: { key: LigneKey; label: string; occasionnel: boolean }[] = [
  { key: "garantieVariable", label: "Garantie variable", occasionnel: false },
  { key: "primeFormation", label: "Prime formation", occasionnel: false },
  { key: "commissions", label: "Commissions", occasionnel: true },
  { key: "boostGoogle", label: "Boost Google", occasionnel: true },
  { key: "primeMacron", label: "Prime Macron", occasionnel: true },
  { key: "primeNoel", label: "Prime de Noël", occasionnel: true },
  { key: "avance", label: "Avance", occasionnel: true },
  { key: "avanceFrais", label: "Avance sur frais", occasionnel: true },
  { key: "frais", label: "Notes de frais", occasionnel: true },
  { key: "heuresSup", label: "Heures sup", occasionnel: true },
  { key: "regul", label: "Régularisation", occasionnel: true },
]

/** Échappe une valeur CSV (gère les virgules et les guillemets) */
function escapeCSV(val: unknown): string {
  if (val === undefined || val === null) return ""
  const s = String(val)
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function TableauRecap({ declaration, collaborateurs }: Props) {
  const [copied, setCopied] = useState(false)

  // Collaborateurs présents dans la déclaration, triés par prénom
  const collabs = collaborateurs
    .filter((c) => c.id in declaration.salaries)
    .sort((a, b) => a.firstName.localeCompare(b.firstName))

  // Filtre les lignes occasionnelles : n'afficher que si au moins 1 collaborateur a une valeur
  const lignesVisibles = LIGNES.filter((l) => {
    if (!l.occasionnel) return true
    return collabs.some((c) => {
      const val = declaration.salaries[c.id]?.[l.key]
      return val !== undefined && val !== null && val !== ""
    })
  })

  function buildCSV(): string {
    const header = ["", ...collabs.map((c) => c.firstName)].map(escapeCSV).join(",")
    const rows = lignesVisibles.map((l) => {
      const cells = [l.label, ...collabs.map((c) => declaration.salaries[c.id]?.[l.key])]
      return cells.map(escapeCSV).join(",")
    })
    return [header, ...rows].join("\n")
  }

  function buildText(): string {
    const colWidth = 18
    const pad = (s: string, w: number) => s.padEnd(w)
    const header = pad("", colWidth) + collabs.map((c) => pad(c.firstName, colWidth)).join("")
    const rows = lignesVisibles.map((l) => {
      return (
        pad(l.label, colWidth) +
        collabs.map((c) => {
          const val = declaration.salaries[c.id]?.[l.key]
          return pad(val !== undefined && val !== null && val !== "" ? String(val) : "—", colWidth)
        }).join("")
      )
    })
    return [header, ...rows].join("\n")
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildText())
      setCopied(true)
      toast.success("Copié dans le presse-papiers")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Impossible de copier")
    }
  }

  function handleExportCSV() {
    const csv = buildCSV()
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bs_${declaration.moisKey}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Récapitulatif — {collabs.length} collaborateurs</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            <Copy className="w-3.5 h-3.5" />
            {copied ? "Copié !" : "Copier"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground sticky left-0 bg-muted/40 min-w-[160px]">
                Élément
              </th>
              {collabs.map((c) => (
                <th key={c.id} className="text-center px-3 py-2 text-xs font-medium text-muted-foreground min-w-[100px]">
                  {c.firstName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignesVisibles.map((l) => (
              <tr key={l.key} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2 font-medium text-xs sticky left-0 bg-background">
                  {l.label}
                </td>
                {collabs.map((c) => {
                  const val = declaration.salaries[c.id]?.[l.key]
                  const hasValue = val !== undefined && val !== null && val !== ""
                  return (
                    <td key={c.id} className="px-3 py-2 text-center text-xs">
                      {hasValue ? (
                        <span className={typeof val === "number" ? "font-mono font-semibold" : "text-muted-foreground"}>
                          {typeof val === "number" ? `${val}€` : String(val)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
