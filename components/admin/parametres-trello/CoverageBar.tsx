'use client'

import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { CoverageStatus } from '@/lib/trello-config/types'

interface Props {
  status: CoverageStatus
}

export function CoverageBar({ status }: Props) {
  const pct = (status.covered / 26) * 100
  const isOk = status.isComplete

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isOk ? 'bg-emerald-500' : 'bg-amber-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className={`flex items-center gap-1 text-xs font-mono font-semibold whitespace-nowrap ${isOk ? 'text-emerald-400' : 'text-amber-400'}`}>
        {isOk ? (
          <CheckCircle className="h-3.5 w-3.5" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5" />
        )}
        {status.covered}/26
        {!isOk && status.missing.length > 0 && (
          <span className="text-slate-500 font-normal ml-1">
            · manque {status.missing.join(' ')}
          </span>
        )}
      </div>
    </div>
  )
}
