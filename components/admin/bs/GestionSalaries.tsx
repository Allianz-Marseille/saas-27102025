"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCollaborateurs,
  createCollaborateur,
  updateCollaborateur,
  deleteCollaborateur,
} from "@/lib/firebase/collaborateurs";
import type { Collaborateur, CollaborateurInput, JourTravail, Pole, Contrat } from "@/types/collaborateur";
import {
  POLE_LABELS,
  CONTRAT_LABELS,
  JOURS_LABELS,
  JOURS_ORDER,
  JOURS_PAR_SEMAINE_OPTIONS,
} from "@/types/collaborateur";

const POLE_COLORS: Record<Pole, string> = {
  sante_ind: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  sante_coll: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  commercial: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  sinistre: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const POLE_KPI_COLORS: Record<Pole, { bg: string; text: string; border: string }> = {
  sante_ind:  { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  sante_coll: { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/20"    },
  commercial: { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/20"  },
  sinistre:   { bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/20"  },
};

function etpOf(c: Collaborateur): number {
  return c.contrat === "alternant" ? 0.5 : c.joursParSemaine / 5;
}

function computeEtp(list: Collaborateur[]) {
  const global = list.reduce((sum, c) => sum + etpOf(c), 0);
  const parPole = (Object.keys(POLE_LABELS) as Pole[]).map((pole) => ({
    pole,
    etp: list.filter((c) => c.pole === pole).reduce((sum, c) => sum + etpOf(c), 0),
    count: list.filter((c) => c.pole === pole).length,
  }));
  return { global, parPole };
}

const defaultForm: CollaborateurInput = {
  firstName: "",
  pole: "commercial",
  contrat: "cdi",
  joursParSemaine: 5,
  joursTravail: ["L", "M", "Me", "J", "V"],
};

export function GestionSalaries() {
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Collaborateur | null>(null);
  const [form, setForm] = useState<CollaborateurInput>(defaultForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Collaborateur | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [avecAgent, setAvecAgent] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setCollaborateurs(await getCollaborateurs());
    } catch {
      toast.error("Erreur lors du chargement des collaborateurs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(c: Collaborateur) {
    setEditing(c);
    setForm({ firstName: c.firstName, pole: c.pole, contrat: c.contrat, joursParSemaine: c.joursParSemaine, joursTravail: [...c.joursTravail] });
    setDialogOpen(true);
  }

  function toggleJour(jour: JourTravail) {
    setForm((f) => ({
      ...f,
      joursTravail: f.joursTravail.includes(jour)
        ? f.joursTravail.filter((j) => j !== jour)
        : [...f.joursTravail, jour],
    }));
  }

  async function handleSave() {
    if (!form.firstName.trim()) { toast.error("Le prénom est requis"); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateCollaborateur(editing.id, form);
        toast.success("Collaborateur mis à jour");
      } else {
        await createCollaborateur(form);
        toast.success("Collaborateur ajouté");
      }
      setDialogOpen(false);
      await load();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCollaborateur(deleteTarget.id);
      toast.success("Collaborateur supprimé");
      setDeleteTarget(null);
      await load();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  }

  const { global: etpBase, parPole } = computeEtp(collaborateurs);
  const etpGlobal = etpBase + (avecAgent ? 2 : 0);

  return (
    <div className="space-y-6">
      {/* KPIs ETP */}
      {!loading && (
        <div className="space-y-3">
          {/* Toggle agent */}
          <div className="flex justify-end">
            <button
              onClick={() => setAvecAgent((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                avecAgent
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                  : "bg-muted text-muted-foreground border-transparent hover:border-border"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${avecAgent ? "bg-amber-400" : "bg-muted-foreground/40"}`} />
              {avecAgent ? "Avec agent (+2 ETP)" : "Sans agent"}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Global */}
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-1 col-span-2 sm:col-span-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">ETP Global</p>
            <p className="text-2xl font-bold">{etpGlobal.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">{collaborateurs.length} salarié{collaborateurs.length !== 1 ? "s" : ""}{avecAgent ? " + agent" : ""}</p>
          </div>
          {/* Par pôle */}
          {parPole.map(({ pole, etp, count }) => {
            const c = POLE_KPI_COLORS[pole];
            return (
              <div key={pole} className={`rounded-xl border ${c.border} ${c.bg} p-4 flex flex-col gap-1`}>
                <p className={`text-xs uppercase tracking-wide font-medium ${c.text}`}>{POLE_LABELS[pole]}</p>
                <p className={`text-2xl font-bold ${c.text}`}>{etp.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">{count} salarié{count !== 1 ? "s" : ""}</p>
              </div>
            );
          })}
        </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {collaborateurs.length} collaborateur{collaborateurs.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-16">Chargement…</div>
      ) : collaborateurs.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">
          Aucun collaborateur. Cliquez sur Ajouter pour commencer.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collaborateurs.map((c) => (
            <div key={c.id} className="rounded-xl border bg-card p-4 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-base">{c.firstName}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${POLE_COLORS[c.pole]}`}>
                      {POLE_LABELS[c.pole]}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium border bg-muted text-muted-foreground border-border">
                      {CONTRAT_LABELS[c.contrat]}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(c)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide font-medium">J/sem</span>
                    <span className="font-semibold text-foreground">
                      {JOURS_PAR_SEMAINE_OPTIONS.find((o) => o.value === c.joursParSemaine)?.label ?? c.joursParSemaine}
                    </span>
                  </div>
                  <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded font-semibold text-foreground">
                    {etpOf(c).toFixed(1)} ETP
                  </span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {JOURS_ORDER.map((j) => (
                    <span key={j} className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${c.joursTravail.includes(j) ? "bg-violet-500/15 text-violet-400" : "bg-muted text-muted-foreground/40"}`}>
                      {j}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Créer / Éditer */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le collaborateur" : "Nouveau collaborateur"}</DialogTitle>
            <DialogDescription>
              {editing ? `Modification de ${editing.firstName}` : "Renseignez les informations du collaborateur."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Prénom</Label>
              <Input placeholder="Prénom" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && handleSave()} />
            </div>
            <div className="space-y-1.5">
              <Label>Pôle</Label>
              <Select value={form.pole} onValueChange={(v) => setForm((f) => ({ ...f, pole: v as Pole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(POLE_LABELS) as Pole[]).map((p) => (
                    <SelectItem key={p} value={p}>{POLE_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contrat</Label>
              <Select value={form.contrat} onValueChange={(v) => setForm((f) => ({ ...f, contrat: v as Contrat }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CONTRAT_LABELS) as Contrat[]).map((c) => (
                    <SelectItem key={c} value={c}>{CONTRAT_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Jours / semaine</Label>
              <Select value={String(form.joursParSemaine)} onValueChange={(v) => setForm((f) => ({ ...f, joursParSemaine: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOURS_PAR_SEMAINE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Jours de travail</Label>
              <div className="flex gap-2 flex-wrap">
                {JOURS_ORDER.map((j) => {
                  const active = form.joursTravail.includes(j);
                  return (
                    <button key={j} type="button" onClick={() => toggleJour(j)} className={`px-3 py-1.5 rounded-lg text-sm font-mono font-semibold border transition-colors ${active ? "bg-violet-500/20 text-violet-400 border-violet-500/40" : "bg-muted text-muted-foreground border-transparent hover:border-border"}`}>
                      {j}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {JOURS_ORDER.filter((j) => form.joursTravail.includes(j)).map((j) => JOURS_LABELS[j]).join(", ") || "Aucun jour sélectionné"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Enregistrement…" : editing ? "Mettre à jour" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {deleteTarget?.firstName} ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
