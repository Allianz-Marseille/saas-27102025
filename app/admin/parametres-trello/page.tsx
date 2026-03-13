'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Settings2, Loader2 } from 'lucide-react'
import { useTrelloConfig } from '@/lib/trello-config/hooks'
import { AgencySidebar } from '@/components/admin/parametres-trello/AgencySidebar'
import { AgencyPanel } from '@/components/admin/parametres-trello/AgencyPanel'

export default function ParametresTrelloPage() {
  const { agencies, loading, addAgency, updateAgency, deleteAgency, addCdc, updateCdc, deleteCdc } = useTrelloConfig()
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null)

  const selectedAgency = agencies.find(a => a.id === selectedAgencyId) ?? null

  // Auto-select first agency when loaded
  if (!loading && agencies.length > 0 && !selectedAgencyId) {
    setSelectedAgencyId(agencies[0].id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      {/* Header page */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-blue-600/20 flex items-center justify-center">
          <Settings2 className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Paramètres Trello</h1>
          <p className="text-xs text-slate-400">Configuration des agences, CDC et colonnes Trello</p>
        </div>
      </div>

      {/* Split panel */}
      <div className="flex gap-6 items-start">
        <AgencySidebar
          agencies={agencies}
          selectedId={selectedAgencyId}
          onSelect={setSelectedAgencyId}
          onAdd={addAgency}
          onUpdate={(id, data) => updateAgency(id, data)}
          onDelete={deleteAgency}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedAgencyId ?? 'empty'}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-w-0"
          >
            <AgencyPanel
              agency={selectedAgency}
              onAddCdc={addCdc}
              onUpdateCdc={(agencyId, cdcId, data) => updateCdc(agencyId, cdcId, data)}
              onDeleteCdc={deleteCdc}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
