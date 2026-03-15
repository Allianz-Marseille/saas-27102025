"use client"

import { useEffect, useState } from "react"
import { Wallet } from "lucide-react"
import { getEngagementsByCollaborateur } from "@/lib/firebase/bs-engagements"
import type { BsEngagement } from "@/types/bs"
import { currentMoisKey, isEngagementActif, TYPE_ENGAGEMENT_LABELS } from "@/types/bs"

interface Props {
  collaborateurId: string
  onManage: () => void
}

export function EngagementBadge({ collaborateurId, onManage }: Props) {
  const [engagements, setEngagements] = useState<BsEngagement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getEngagementsByCollaborateur(collaborateurId)
      .then((list) => { if (!cancelled) setEngagements(list) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [collaborateurId])

  const moisKey = currentMoisKey()
  const actifs = engagements.filter((e) => isEngagementActif(e, moisKey))

  if (loading) return null

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-1">
        {actifs.length === 0 ? (
          <span className="text-[11px] text-muted-foreground/50">Aucun engagement actif</span>
        ) : (
          actifs.map((e) => (
            <span
              key={e.id}
              className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
            >
              {TYPE_ENGAGEMENT_LABELS[e.type]} {e.montantMensuel}€/m
            </span>
          ))
        )}
      </div>
      <button
        onClick={onManage}
        className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline flex items-center gap-1"
      >
        <Wallet className="w-3 h-3" />
        Gérer
      </button>
    </div>
  )
}
