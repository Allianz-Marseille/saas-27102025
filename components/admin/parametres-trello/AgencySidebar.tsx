'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Agency } from '@/lib/trello-config/types'
import { AddAgencyModal } from './AddAgencyModal'

interface Props {
  agencies: Agency[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: (data: { code: string; name: string }) => void
  onUpdate: (id: string, data: { code: string; name: string }) => void
  onDelete: (id: string) => void
}

export function AgencySidebar({ agencies, selectedId, onSelect, onAdd, onUpdate, onDelete }: Props) {
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Agency | null>(null)

  return (
    <>
      <div className="w-56 shrink-0 flex flex-col gap-1">
        {agencies.map(agency => (
          <div
            key={agency.id}
            className={`
              group relative flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition-colors
              ${selectedId === agency.id
                ? 'bg-blue-600/20 border-r-2 border-blue-500 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }
            `}
            onClick={() => onSelect(agency.id)}
          >
            <div className="min-w-0">
              <p className="text-xs font-mono font-semibold truncate">
                <span className="text-blue-400">{agency.code}</span>
                {' '}
                <span className={selectedId === agency.id ? 'text-white' : 'text-slate-300'}>{agency.name}</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{agency.cdc.length} CDC</p>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              <button
                onClick={e => { e.stopPropagation(); setEditTarget(agency) }}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(agency.id) }}
                className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}

        <motion.button
          onClick={() => setAddOpen(true)}
          whileHover={{ scale: 1.02 }}
          className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 px-3 py-2 text-xs text-slate-500 hover:border-blue-500 hover:text-blue-400 transition-colors"
        >
          <motion.span
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="inline-flex"
          >
            <Plus className="h-3.5 w-3.5" />
          </motion.span>
          Ajouter une agence
        </motion.button>
      </div>

      <AddAgencyModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={onAdd}
      />
      <AddAgencyModal
        open={!!editTarget}
        initial={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
        onSubmit={data => {
          if (editTarget) onUpdate(editTarget.id, data)
          setEditTarget(null)
        }}
      />
    </>
  )
}
