"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Lock, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getEngagementsByCollaborateur,
  createEngagement,
  cloturerEngagement,
  deleteEngagement,
} from "@/lib/firebase/bs-engagements"
import type { BsEngagement, BsEngagementInput, TypeEngagement } from "@/types/bs"
import { addMoisKey, currentMoisKey, TYPE_ENGAGEMENT_LABELS, moisKeyToLabel } from "@/types/bs"

interface Props {
  collaborateurId: string
  firstName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const defaultForm: BsEngagementInput = {
  collaborateurId: "",
  type: "garantie_variable",
  montantMensuel: 0,
  moisDebut: currentMoisKey(),
  nbMois: 12,
  clos: false,
}

export function EngagementDialog({ collaborateurId, firstName, open, onOpenChange }: Props) {
  const [engagements, setEngagements] = useState<BsEngagement[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<BsEngagementInput>({ ...defaultForm, collaborateurId })
  const [saving, setSaving] = useState(false)
  const [clotureTarget, setClotureTarget] = useState<BsEngagement | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BsEngagement | null>(null)

  async function load() {
    setLoading(true)
    try {
      setEngagements(await getEngagementsByCollaborateur(collaborateurId))
    } catch {
      toast.error("Erreur lors du chargement des engagements")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      load()
      setShowForm(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, collaborateurId])

  function openForm() {
    setForm({ ...defaultForm, collaborateurId })
    setShowForm(true)
  }

  async function handleCreate() {
    if (!form.moisDebut || !/^\d{4}-\d{2}$/.test(form.moisDebut)) {
      toast.error("Format du mois de début invalide (YYYY-MM)")
      return
    }
    if (form.montantMensuel <= 0) {
      toast.error("Le montant doit être supérieur à 0")
      return
    }
    if (form.nbMois < 1) {
      toast.error("La durée doit être au moins 1 mois")
      return
    }
    setSaving(true)
    try {
      await createEngagement(form)
      toast.success("Engagement créé")
      setShowForm(false)
      await load()
    } catch {
      toast.error("Erreur lors de la création")
    } finally {
      setSaving(false)
    }
  }

  async function handleCloturer() {
    if (!clotureTarget) return
    try {
      await cloturerEngagement(clotureTarget.id)
      toast.success("Engagement clôturé")
      setClotureTarget(null)
      await load()
    } catch {
      toast.error("Erreur lors de la clôture")
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteEngagement(deleteTarget.id)
      toast.success("Engagement supprimé")
      setDeleteTarget(null)
      await load()
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  const moisFin = form.nbMois > 0 && form.moisDebut
    ? addMoisKey(form.moisDebut, form.nbMois - 1)
    : null

  const actifs = engagements.filter((e) => !e.clos)
  const clos = engagements.filter((e) => e.clos)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Engagements — {firstName}</DialogTitle>
            <DialogDescription>
              Garanties variables et primes de formation récurrentes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Chargement…</p>
            ) : (
              <>
                {/* Engagements actifs */}
                {actifs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Actifs</p>
                    {actifs.map((e) => (
                      <div key={e.id} className="flex items-center justify-between rounded-lg border bg-card p-3 gap-2">
                        <div>
                          <p className="text-sm font-medium">{TYPE_ENGAGEMENT_LABELS[e.type]}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.montantMensuel}€/mois · {moisKeyToLabel(e.moisDebut)} → {moisKeyToLabel(e.moisFin)} ({e.nbMois} mois)
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-500 hover:text-amber-400" onClick={() => setClotureTarget(e)}>
                            <Lock className="w-3 h-3 mr-1" />Clôturer
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(e)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Engagements clos */}
                {clos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Clôturés</p>
                    {clos.map((e) => (
                      <div key={e.id} className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 gap-2 opacity-60">
                        <div>
                          <p className="text-sm font-medium line-through">{TYPE_ENGAGEMENT_LABELS[e.type]}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.montantMensuel}€/mois · {moisKeyToLabel(e.moisDebut)} → {moisKeyToLabel(e.moisFin)}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(e)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {engagements.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun engagement enregistré.</p>
                )}

                {/* Formulaire ajout */}
                {showForm && (
                  <div className="rounded-lg border bg-card p-4 space-y-3">
                    <p className="text-sm font-medium">Nouvel engagement</p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Type</Label>
                      <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as TypeEngagement }))}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(TYPE_ENGAGEMENT_LABELS) as TypeEngagement[]).map((t) => (
                            <SelectItem key={t} value={t}>{TYPE_ENGAGEMENT_LABELS[t]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Montant mensuel (€)</Label>
                        <Input
                          type="number"
                          min={0}
                          className="h-8 text-sm"
                          value={form.montantMensuel || ""}
                          onChange={(e) => setForm((f) => ({ ...f, montantMensuel: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Durée (mois)</Label>
                        <Input
                          type="number"
                          min={1}
                          className="h-8 text-sm"
                          value={form.nbMois || ""}
                          onChange={(e) => setForm((f) => ({ ...f, nbMois: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Mois de début (YYYY-MM)</Label>
                      <Input
                        className="h-8 text-sm font-mono"
                        placeholder="2026-01"
                        value={form.moisDebut}
                        onChange={(e) => setForm((f) => ({ ...f, moisDebut: e.target.value }))}
                      />
                      {moisFin && (
                        <p className="text-xs text-muted-foreground">
                          Fin prévue : {moisKeyToLabel(moisFin)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
                      <Button size="sm" onClick={handleCreate} disabled={saving}>
                        {saving ? "Enregistrement…" : "Créer"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            {!showForm && (
              <Button variant="outline" size="sm" onClick={openForm} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Ajouter un engagement
              </Button>
            )}
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog clôture */}
      <AlertDialog open={!!clotureTarget} onOpenChange={(o) => !o && setClotureTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clôturer cet engagement ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;engagement ne sera plus pris en compte dans les prochaines déclarations. Cette action peut être annulée en supprimant et recréant l&apos;engagement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloturer} className="bg-amber-600 hover:bg-amber-700">
              Clôturer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog suppression */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet engagement ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
