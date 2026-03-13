'use client'

import { motion } from 'framer-motion'
import { ALPHABET, CDC_LETTER_COLORS } from '@/lib/trello-config/constants'
import { Agency } from '@/lib/trello-config/types'
import { getLetterOwner } from '@/lib/trello-config/validators'

interface Props {
  agency: Agency
  activeCdcId: string
  activeCdcIndex: number
  selectedLetters: string[]
  onToggle: (letter: string) => void
}

export function AlphabetGrid({ agency, activeCdcId, activeCdcIndex, selectedLetters, onToggle }: Props) {
  const activeColor = CDC_LETTER_COLORS[activeCdcIndex % CDC_LETTER_COLORS.length]

  return (
    <div className="grid grid-cols-13 gap-1" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
      {ALPHABET.map(letter => {
        const isActive = selectedLetters.includes(letter)
        const owner = getLetterOwner(letter, agency, activeCdcId)
        const isTaken = !!owner

        return (
          <motion.button
            key={letter}
            type="button"
            whileHover={!isTaken ? { scale: 1.15 } : {}}
            whileTap={!isTaken ? { scale: 0.85 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={() => !isTaken && onToggle(letter)}
            disabled={isTaken}
            title={isTaken ? `Attribué à ${owner?.firstName}` : undefined}
            className={`
              h-7 w-full rounded text-xs font-mono font-semibold transition-colors
              ${isActive ? activeColor : ''}
              ${isTaken && !isActive ? 'bg-slate-700/40 text-slate-500 cursor-not-allowed opacity-50' : ''}
              ${!isActive && !isTaken ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : ''}
            `}
          >
            {letter}
          </motion.button>
        )
      })}
    </div>
  )
}
