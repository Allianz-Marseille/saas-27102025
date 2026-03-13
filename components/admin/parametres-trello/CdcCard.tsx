'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { CDC, Agency } from '@/lib/trello-config/types'
import { CDC_AVATAR_COLORS, ALPHABET } from '@/lib/trello-config/constants'
import { getLetterOwner } from '@/lib/trello-config/validators'
import { AddCdcModal } from './AddCdcModal'

interface Props {
  cdc: CDC
  cdcIndex: number
  agency: Agency
  onUpdate: (data: Omit<CDC, 'id'>) => void
  onDelete: () => void
}

export function CdcCard({ cdc, cdcIndex, agency, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const colors = CDC_AVATAR_COLORS[cdcIndex % CDC_AVATAR_COLORS.length]

  const letterRange =
    cdc.letters.length === 0
      ? 'Aucune lettre'
      : `${cdc.letters[0]} – ${cdc.letters[cdc.letters.length - 1]}`

  return (
    <>
      <motion.div
        layout
        className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-full border flex items-center justify-center text-sm font-semibold ${colors.bg} ${colors.text} ${colors.border}`}>
              {cdc.firstName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{cdc.firstName}</p>
              <p className="text-xs text-slate-400 font-mono">{letterRange} · board {cdc.boardId}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Grille alphabet mini (lecture seule) */}
        <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
          {ALPHABET.map(letter => {
            const isActive = cdc.letters.includes(letter)
            const owner = getLetterOwner(letter, agency, cdc.id)
            return (
              <div
                key={letter}
                title={owner ? `${owner.firstName}` : undefined}
                className={`
                  h-6 rounded text-[10px] font-mono font-semibold flex items-center justify-center
                  ${isActive ? `${CDC_AVATAR_COLORS[cdcIndex % CDC_AVATAR_COLORS.length].bg} ${CDC_AVATAR_COLORS[cdcIndex % CDC_AVATAR_COLORS.length].text}` : ''}
                  ${owner && !isActive ? 'bg-slate-700/40 text-slate-600' : ''}
                  ${!isActive && !owner ? 'bg-slate-700/30 text-slate-500' : ''}
                `}
              >
                {letter}
              </div>
            )
          })}
        </div>

        {/* List IDs */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { key: 'processM3', label: 'M+3' },
            { key: 'pretermeAuto', label: 'AUTO' },
            { key: 'pretermeIrd', label: 'IRD' },
          ].map(({ key, label }) => (
            <div key={key} className="bg-slate-900/60 rounded-lg px-2 py-1.5">
              <p className="text-[10px] text-slate-500">{label}</p>
              <p className="text-xs font-mono text-slate-300 truncate">
                {cdc.lists[key as keyof typeof cdc.lists] || <span className="text-slate-600">—</span>}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      <AddCdcModal
        open={editing}
        agency={agency}
        initial={cdc}
        cdcIndex={cdcIndex}
        onClose={() => setEditing(false)}
        onSubmit={data => { onUpdate(data); setEditing(false) }}
      />
    </>
  )
}
