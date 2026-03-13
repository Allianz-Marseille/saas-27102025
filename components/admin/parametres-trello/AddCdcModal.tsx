'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { CDC, Agency } from '@/lib/trello-config/types'
import { AlphabetGrid } from './AlphabetGrid'
import { CDC_AVATAR_COLORS } from '@/lib/trello-config/constants'

interface Props {
  open: boolean
  agency: Agency
  initial?: CDC
  cdcIndex?: number
  onClose: () => void
  onSubmit: (data: Omit<CDC, 'id'>) => void
}

const EMPTY_LISTS = { processM3: '', pretermeAuto: '', pretermeIrd: '' }

export function AddCdcModal({ open, agency, initial, cdcIndex = 0, onClose, onSubmit }: Props) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [boardId, setBoardId] = useState(initial?.boardId ?? '')
  const [letters, setLetters] = useState<string[]>(initial?.letters ?? [])
  const [lists, setLists] = useState(initial?.lists ?? EMPTY_LISTS)

  useEffect(() => {
    if (open) {
      setFirstName(initial?.firstName ?? '')
      setBoardId(initial?.boardId ?? '')
      setLetters(initial?.letters ?? [])
      setLists(initial?.lists ?? EMPTY_LISTS)
    }
  }, [open, initial])

  function toggleLetter(letter: string) {
    setLetters(prev =>
      prev.includes(letter) ? prev.filter(l => l !== letter) : [...prev, letter].sort()
    )
  }

  function capitalizeFirst(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim()) return
    onSubmit({ firstName: capitalizeFirst(firstName.trim()), boardId: boardId.trim(), letters, lists })
    onClose()
  }

  const colorIdx = cdcIndex % CDC_AVATAR_COLORS.length

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">
                {initial ? 'Modifier le CDC' : 'Nouveau CDC'}
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Prénom + Board ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Prénom CDC</label>
                  <input
                    value={firstName}
                    onChange={e => setFirstName(capitalizeFirst(e.target.value))}
                    placeholder="ex: Corentin"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Board ID Trello</label>
                  <input
                    value={boardId}
                    onChange={e => setBoardId(e.target.value)}
                    placeholder="ex: 816"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Lettres */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-slate-400">Lettres attribuées</label>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${CDC_AVATAR_COLORS[colorIdx].bg} ${CDC_AVATAR_COLORS[colorIdx].text}`}>
                    {letters.length > 0 ? letters.join(' · ') : 'Aucune'}
                  </span>
                </div>
                <AlphabetGrid
                  agency={agency}
                  activeCdcId={initial?.id ?? '__new__'}
                  activeCdcIndex={cdcIndex}
                  selectedLetters={letters}
                  onToggle={toggleLetter}
                />
              </div>

              {/* List IDs */}
              <div className="space-y-2">
                <label className="block text-xs text-slate-400">List IDs Trello</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'processM3', label: 'Process M+3' },
                    { key: 'pretermeAuto', label: 'Préterme AUTO' },
                    { key: 'pretermeIrd', label: 'Préterme IRD' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <p className="text-[10px] text-slate-500 mb-1">{label}</p>
                      <input
                        value={lists[key as keyof typeof lists]}
                        onChange={e => setLists(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder="List ID"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!firstName.trim()}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {initial ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
