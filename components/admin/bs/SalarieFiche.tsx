"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateDeclarationSalarie } from "@/lib/firebase/bs-declarations"
import type { Collaborateur } from "@/types/collaborateur"
import type { SalarieDeclaration } from "@/types/bs"

interface Props {
  collaborateur: Collaborateur
  data: SalarieDeclaration
  moisKey: string
  estClos: boolean
  onUpdate: (fields: Partial<SalarieDeclaration>) => void
}

type ChampManuel = keyof Pick<
  SalarieDeclaration,
  "commissions" | "boostGoogle" | "primeMacron" | "primeNoel" | "avance" | "avanceFrais" | "frais" | "heuresSup" | "regul"
>

const CHAMPS_MANUELS: { key: ChampManuel; label: string; type: "number" | "text" }[] = [
  { key: "commissions", label: "Commissions (€)", type: "number" },
  { key: "boostGoogle", label: "Boost Google (€)", type: "number" },
  { key: "primeMacron", label: "Prime Macron (€)", type: "number" },
  { key: "primeNoel", label: "Prime de Noël (€)", type: "number" },
  { key: "avance", label: "Avance (€)", type: "number" },
  { key: "avanceFrais", label: "Avance sur frais (€)", type: "number" },
  { key: "frais", label: "Notes de frais (€)", type: "number" },
  { key: "heuresSup", label: "Heures sup", type: "number" },
  { key: "regul", label: "Régularisation (texte libre)", type: "text" },
]

export function SalarieFiche({ collaborateur, data, moisKey, estClos, onUpdate }: Props) {
  const [local, setLocal] = useState<Partial<SalarieDeclaration>>({})
  const [saving, setSaving] = useState(false)

  const dirty = Object.keys(local).length > 0

  function handleChange(key: ChampManuel, value: string) {
    const parsed = key === "regul" ? value : (value === "" ? undefined : parseFloat(value))
    setLocal((prev) => ({ ...prev, [key]: parsed }))
  }

  function getValue(key: ChampManuel): string {
    const v = key in local ? local[key] : data[key]
    if (v === undefined || v === null) return ""
    return String(v)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateDeclarationSalarie(moisKey, collaborateur.id, local)
      onUpdate(local)
      setLocal({})
      toast.success("Enregistré")
    } catch {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Absences */}
      <section>
        <h4 className="text-sm font-semibold mb-2">Absences</h4>
        {data.absences.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune absence détectée.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Semaine</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Événements</th>
                </tr>
              </thead>
              <tbody>
                {data.absences.map((a) => (
                  <tr key={a.semaine} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">S{a.semaine}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {a.evenements.map((ev, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Variables auto */}
      {(data.garantieVariable !== undefined || data.primeFormation !== undefined) && (
        <section>
          <h4 className="text-sm font-semibold mb-2">Engagements actifs (auto)</h4>
          <div className="flex gap-3 flex-wrap">
            {data.garantieVariable !== undefined && (
              <div className="rounded-lg border bg-amber-500/5 border-amber-500/20 px-3 py-2">
                <p className="text-xs text-muted-foreground">Garantie variable</p>
                <p className="font-semibold text-amber-400">{data.garantieVariable}€</p>
              </div>
            )}
            {data.primeFormation !== undefined && (
              <div className="rounded-lg border bg-amber-500/5 border-amber-500/20 px-3 py-2">
                <p className="text-xs text-muted-foreground">Prime formation</p>
                <p className="font-semibold text-amber-400">{data.primeFormation}€</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Champs manuels */}
      <section>
        <h4 className="text-sm font-semibold mb-3">Éléments variables</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CHAMPS_MANUELS.map(({ key, label, type }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <Input
                type={type}
                className="h-8 text-sm"
                value={getValue(key)}
                disabled={estClos}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder="—"
              />
            </div>
          ))}
        </div>
      </section>

      {!estClos && dirty && (
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-3.5 h-3.5" />
          {saving ? "Enregistrement…" : "Enregistrer les modifications"}
        </Button>
      )}
    </div>
  )
}
