"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Circle, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { getDeclaration } from "@/lib/firebase/bs-declarations"
import { buildAuthenticatedJsonHeaders } from "@/lib/firebase/api-auth"
import { SalarieFiche } from "./SalarieFiche"
import { TableauRecap } from "./TableauRecap"
import type { BsDeclaration } from "@/types/bs"
import { moisKeyToLabel, addMoisKey, currentMoisKey } from "@/types/bs"
import type { Collaborateur } from "@/types/collaborateur"

interface Props {
  collaborateurs: Collaborateur[]
}

const STATUT_CONFIG = {
  vide: { label: "Vide", icon: Circle, className: "text-muted-foreground" },
  en_cours: { label: "En cours", icon: Clock, className: "text-amber-400" },
  clos: { label: "Clôturé", icon: CheckCircle2, className: "text-emerald-400" },
}

export function DeclarationNav({ collaborateurs }: Props) {
  // Default : mois précédent
  const [moisKey, setMoisKey] = useState(() => addMoisKey(currentMoisKey(), -1))
  const [declaration, setDeclaration] = useState<BsDeclaration | null>(null)
  const [loading, setLoading] = useState(true)
  const [preparing, setPreparing] = useState(false)
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null)
  const [showRecap, setShowRecap] = useState(false)
  const [showClotureDialog, setShowClotureDialog] = useState(false)
  const [cloturing, setCloturing] = useState(false)

  async function loadDeclaration(key: string) {
    setLoading(true)
    setDeclaration(null)
    setSelectedCollabId(null)
    setShowRecap(false)
    try {
      const decl = await getDeclaration(key)
      setDeclaration(decl)
    } catch {
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeclaration(moisKey)
  }, [moisKey])

  function navigate(delta: number) {
    setMoisKey((k) => addMoisKey(k, delta))
  }

  async function handlePreparer() {
    setPreparing(true)
    try {
      const headers = await buildAuthenticatedJsonHeaders()
      const res = await fetch("/api/admin/bs/preparer", {
        method: "POST",
        headers,
        body: JSON.stringify({ moisKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur")
      toast.success(`BS préparé — ${data.nbCollaborateurs} collaborateurs, ${data.nbEvenementsTraites} absences`)
      await loadDeclaration(moisKey)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue"
      toast.error(msg)
    } finally {
      setPreparing(false)
    }
  }

  async function handleCloturer() {
    setCloturing(true)
    try {
      const headers = await buildAuthenticatedJsonHeaders()
      const res = await fetch("/api/admin/bs/cloturer", {
        method: "POST",
        headers,
        body: JSON.stringify({ moisKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur")
      toast.success("Déclaration clôturée")
      setShowClotureDialog(false)
      await loadDeclaration(moisKey)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue"
      toast.error(msg)
    } finally {
      setCloturing(false)
    }
  }

  const statut = declaration?.statut ?? "vide"
  const statutConfig = STATUT_CONFIG[statut]
  const StatutIcon = statutConfig.icon
  const estClos = statut === "clos"

  // Collaborateurs ayant une fiche dans la déclaration, triés par prénom
  const collabsAvecFiche = collaborateurs
    .filter((c) => declaration?.salaries[c.id] !== undefined)
    .sort((a, b) => a.firstName.localeCompare(b.firstName))

  const selectedCollab = collabsAvecFiche.find((c) => c.id === selectedCollabId) ?? null

  return (
    <div className="space-y-4">
      {/* Barre de navigation */}
      <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center min-w-32">
            <p className="font-semibold">{moisKeyToLabel(moisKey)}</p>
            <div className={`flex items-center justify-center gap-1 text-xs ${statutConfig.className}`}>
              <StatutIcon className="w-3 h-3" />
              {statutConfig.label}
            </div>
          </div>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {(statut === "en_cours" || statut === "clos") && (
            <Button variant="outline" size="sm" onClick={() => setShowRecap((v) => !v)}>
              {showRecap ? "Masquer le récap" : "Récapitulatif"}
            </Button>
          )}
          {statut === "en_cours" && (
            <>
              <Button variant="outline" size="sm" onClick={handlePreparer} disabled={preparing}>
                {preparing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {preparing ? "Préparation…" : "Re-préparer"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                onClick={() => setShowClotureDialog(true)}
              >
                Clôturer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Alerte prénoms sans match */}
      {declaration?.prenomsSansMatch && declaration.prenomsSansMatch.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Prénoms non reconnus dans le calendrier</p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              {declaration.prenomsSansMatch.join(", ")}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Chargement…
        </div>
      ) : statut === "vide" ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-4">
          <Circle className="w-10 h-10 mx-auto text-muted-foreground/30" />
          <div>
            <p className="font-medium">Aucune déclaration pour {moisKeyToLabel(moisKey)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur &quot;Préparer&quot; pour récupérer les absences depuis Google Calendar et pré-remplir les engagements.
            </p>
          </div>
          <Button onClick={handlePreparer} disabled={preparing} className="gap-2">
            {preparing && <Loader2 className="w-4 h-4 animate-spin" />}
            {preparing ? "Préparation en cours…" : `Préparer le BS de ${moisKeyToLabel(moisKey)}`}
          </Button>
        </div>
      ) : showRecap && declaration ? (
        <TableauRecap declaration={declaration} collaborateurs={collaborateurs} />
      ) : (
        <div className="flex gap-4 min-h-64">
          {/* Liste collaborateurs */}
          <div className="w-48 shrink-0 space-y-1">
            {collabsAvecFiche.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedCollabId(c.id); setShowRecap(false) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCollabId === c.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.firstName}
              </button>
            ))}
          </div>

          {/* Fiche salarié */}
          <div className="flex-1 rounded-xl border bg-card p-5">
            {selectedCollab && declaration ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{selectedCollab.firstName}</h3>
                  {estClos && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Clôturé
                    </span>
                  )}
                </div>
                <SalarieFiche
                  collaborateur={selectedCollab}
                  data={declaration.salaries[selectedCollab.id]}
                  moisKey={moisKey}
                  estClos={estClos}
                  onUpdate={(fields) => {
                    setDeclaration((prev) => {
                      if (!prev) return prev
                      return {
                        ...prev,
                        salaries: {
                          ...prev.salaries,
                          [selectedCollab.id]: { ...prev.salaries[selectedCollab.id], ...fields },
                        },
                      }
                    })
                  }}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                Sélectionnez un collaborateur à gauche
              </div>
            )}
          </div>
        </div>
      )}

      {/* AlertDialog clôture */}
      <AlertDialog open={showClotureDialog} onOpenChange={setShowClotureDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clôturer {moisKeyToLabel(moisKey)} ?</AlertDialogTitle>
            <AlertDialogDescription>
              La déclaration passera en lecture seule. Elle ne pourra plus être modifiée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloturer}
              disabled={cloturing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {cloturing ? "Clôture…" : "Clôturer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
