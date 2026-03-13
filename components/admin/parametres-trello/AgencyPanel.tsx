'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Building2 } from 'lucide-react'
import { Agency, CDC } from '@/lib/trello-config/types'
import { getCoverageStatus, canDeleteCdc } from '@/lib/trello-config/validators'
import { CoverageBar } from './CoverageBar'
import { CdcCard } from './CdcCard'
import { AddCdcModal } from './AddCdcModal'

interface Props {
  agency: Agency | null
  onAddCdc: (agencyId: string, data: Omit<CDC, 'id'>) => void
  onUpdateCdc: (agencyId: string, cdcId: string, data: Partial<CDC>) => void
  onDeleteCdc: (agencyId: string, cdcId: string) => void
}

export function AgencyPanel({ agency, onAddCdc, onUpdateCdc, onDeleteCdc }: Props) {
  const [addOpen, setAddOpen] = useState(false)

  if (!agency) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sélectionnez une agence</p>
        </div>
      </div>
    )
  }

  const coverage = getCoverageStatus(agency)

  function handleDelete(cdcId: string) {
    if (!canDeleteCdc(cdcId, agency!)) {
      alert('Impossible de supprimer ce CDC : des lettres resteraient non couvertes.')
      return
    }
    onDeleteCdc(agency!.id, cdcId)
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            <span className="font-mono text-blue-400">{agency.code}</span>
            {' '}
            {agency.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{agency.cdc.length} CDC configuré{agency.cdc.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter un CDC
        </button>
      </div>

      {/* Coverage bar */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
        <p className="text-xs text-slate-400 mb-2">Couverture alphabet</p>
        <CoverageBar status={coverage} />
      </div>

      {/* CDC cards */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {agency.cdc.map((cdc, idx) => (
            <motion.div
              key={cdc.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.08, duration: 0.2 }}
            >
              <CdcCard
                cdc={cdc}
                cdcIndex={idx}
                agency={agency}
                onUpdate={data => onUpdateCdc(agency.id, cdc.id, data)}
                onDelete={() => handleDelete(cdc.id)}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {agency.cdc.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-12 border border-dashed border-slate-700 rounded-xl">
          <p className="text-sm text-slate-500">Aucun CDC — cliquez sur "Ajouter un CDC"</p>
        </div>
      )}

      <AddCdcModal
        open={addOpen}
        agency={agency}
        cdcIndex={agency.cdc.length}
        onClose={() => setAddOpen(false)}
        onSubmit={data => { onAddCdc(agency.id, data); setAddOpen(false) }}
      />
    </div>
  )
}
