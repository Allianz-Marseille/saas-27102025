export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export const CDC_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-cyan-500',
] as const

export const CDC_AVATAR_COLORS = [
  { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/40' },
  { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40' },
] as const

export const CDC_LETTER_COLORS = [
  'bg-blue-500 text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-white',
  'bg-violet-500 text-white',
  'bg-rose-500 text-white',
  'bg-cyan-500 text-white',
] as const

export const FIRESTORE_DOC_PATH = 'config/trello'
