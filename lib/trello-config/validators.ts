import { Agency, CDC, CoverageStatus } from './types'
import { ALPHABET } from './constants'

export function getCoverageStatus(agency: Agency): CoverageStatus {
  const coveredLetters = agency.cdc.flatMap(cdc => cdc.letters)
  const missing = ALPHABET.filter(l => !coveredLetters.includes(l))
  const hasDuplicate = coveredLetters.length !== new Set(coveredLetters).size

  return {
    covered: ALPHABET.filter(l => coveredLetters.includes(l)).length,
    total: 26,
    missing,
    isComplete: missing.length === 0 && !hasDuplicate,
    hasDuplicate,
  }
}

export function routeClient(lastName: string, agency: Agency): CDC | null {
  const firstLetter = lastName.charAt(0).toUpperCase()
  return agency.cdc.find(cdc => cdc.letters.includes(firstLetter)) ?? null
}

export function getLetterOwner(letter: string, agency: Agency, excludeCdcId?: string): CDC | null {
  return agency.cdc.find(
    cdc => cdc.letters.includes(letter) && cdc.id !== excludeCdcId
  ) ?? null
}

export function canDeleteCdc(cdcId: string, agency: Agency): boolean {
  const remaining = agency.cdc.filter(c => c.id !== cdcId)
  if (remaining.length === 0) return true
  const covered = remaining.flatMap(c => c.letters)
  return ALPHABET.every(l => covered.includes(l))
}
