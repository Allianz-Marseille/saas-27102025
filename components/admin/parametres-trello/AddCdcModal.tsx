'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Link, Loader2, RefreshCw } from 'lucide-react'
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

const LIST_SLOTS = [
  { key: 'processM3',    label: 'Process M+3',   keywords: ['m+3', 'm3', 'process'] },
  { key: 'pretermeAuto', label: 'Préterme AUTO',  keywords: ['auto'] },
  { key: 'pretermeIrd',  label: 'Préterme IRD',   keywords: ['ird', 'iard'] },
] as const

function extractBoardId(input: string): string {
  const match = input.match(/trello\.com\/b\/([A-Za-z0-9]+)/)
  return match ? match[1] : input.trim()
}

function autoMatch(lists: { id: string; name: string }[]): typeof EMPTY_LISTS {
  const result = { ...EMPTY_LISTS }
  for (const slot of LIST_SLOTS) {
    const found = lists.find(l =>
      slot.keywords.some(kw => l.name.toLowerCase().includes(kw))
    )
    if (found) result[slot.key] = found.id
  }
  return result
}

export function AddCdcModal({ open, agency, initial, cdcIndex = 0, onClose, onSubmit }: Props) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [boardUrl, setBoardUrl] = useState(initial?.boardId ? `https://trello.com/b/${initial.boardId}` : '')
  const [letters, setLetters] = useState<string[]>(initial?.letters ?? [])
  const [lists, setLists] = useState(initial?.lists ?? EMPTY_LISTS)

  // Trello fetch state
  const [fetchedLists, setFetchedLists] = useState<{ id: string; name: string }[]>([])
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')

  const boardId = extractBoardId(boardUrl)
  const isBoardIdExtracted = boardUrl.includes('trello.com') && !!boardId

  useEffect(() => {
    if (open) {
      setFirstName(initial?.firstName ?? '')
      setBoardUrl(initial?.boardId ? `https://trello.com/b/${initial.boardId}` : '')
      setLetters(initial?.letters ?? [])
      setLists(initial?.lists ?? EMPTY_LISTS)
      setFetchedLists([])
      setFetchError('')
    }
  }, [open, initial])

  async function fetchLists() {
    if (!boardId) return
    setFetching(true)
    setFetchError('')
    try {
      const res = await fetch(`/api/admin/trello/lists?boardId=${boardId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      setFetchedLists(data.lists)
      setLists(autoMatch(data.lists))
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setFetching(false)
    }
  }

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
    onSubmit({ firstName: capitalizeFirst(firstName.trim()), boardId, letters, lists })
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
              {/* Prénom */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Prénom CDC</label>
                <input
                  value={firstName}
                  onChange={e => setFirstName(capitalizeFirst(e.target.value))}
                  placeholder="ex: Corentin"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* URL Trello → Board ID auto */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">URL du tableau Trello</label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    value={boardUrl}
                    onChange={e => setBoardUrl(e.target.value)}
                    placeholder="https://trello.com/b/nfhDBmQg/corentin"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                {boardUrl && (
                  <p className="mt-1.5 text-xs font-mono">
                    {isBoardIdExtracted
                      ? <span className="text-green-400">Board ID extrait : <span className="text-white">{boardId}</span></span>
                      : <span className="text-slate-400">Board ID : <span className="text-white">{boardId}</span></span>
                    }
                  </p>
                )}
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400">List IDs Trello</label>
                  {boardId && (
                    <button
                      type="button"
                      onClick={fetchLists}
                      disabled={fetching}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors"
                    >
                      {fetching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      {fetching ? 'Chargement…' : 'Récupérer les colonnes'}
                    </button>
                  )}
                </div>

                {fetchError && (
                  <p className="text-xs text-red-400">{fetchError}</p>
                )}

                {/* Dropdowns si colonnes récupérées, sinon inputs manuels */}
                <div className="grid grid-cols-3 gap-2">
                  {LIST_SLOTS.map(({ key, label }) => (
                    <div key={key}>
                      <p className="text-[10px] text-slate-500 mb-1">{label}</p>
                      {fetchedLists.length > 0 ? (
                        <select
                          value={lists[key]}
                          onChange={e => setLists(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="">— choisir —</option>
                          {fetchedLists.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={lists[key]}
                          onChange={e => setLists(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder="List ID"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
                        />
                      )}
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
