import type { EvenementParse } from "./bs-gemini"
import type { Collaborateur } from "@/types/collaborateur"
import type { AbsenceSemaine } from "@/types/bs"

/** Normalise un prénom : minuscules, sans accents, trim */
export function normalizePrenom(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-']/g, " ")
    .trim()
}

/** Calcule le numéro de semaine ISO (1-53) pour une date YYYY-MM-DD */
export function getISOWeek(dateStr: string): number {
  const date = new Date(dateStr)
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/** Formate un événement parsé en label lisible : "CP", "CP ½J", "Maladie", "École" */
function formatEvenementLabel(evt: EvenementParse): string {
  const labels: Record<string, string> = {
    cp: "CP",
    malade: "Maladie",
    ecole: "École",
    ignore: "Autre",
  }
  const base = labels[evt.type] ?? "Autre"
  return evt.demiJournee ? `${base} ½J` : base
}

/** Groupe les événements d'un collaborateur par semaine ISO */
export function groupAbsencesParSemaine(events: EvenementParse[]): AbsenceSemaine[] {
  const byWeek = new Map<number, string[]>()

  for (const evt of events) {
    if (evt.type === "ignore") continue

    // La date peut être "YYYY-MM-DD" ou "YYYY-MM-DD/YYYY-MM-DD" (plage)
    const parts = evt.date.split("/")
    const dates: string[] = []

    if (parts.length === 2) {
      // Plage de dates : énumérer chaque jour
      const start = new Date(parts[0])
      const end = new Date(parts[1])
      const cur = new Date(start)
      while (cur <= end) {
        dates.push(cur.toISOString().split("T")[0])
        cur.setDate(cur.getDate() + 1)
      }
    } else {
      dates.push(parts[0])
    }

    const label = formatEvenementLabel(evt)
    for (const d of dates) {
      const week = getISOWeek(d)
      const existing = byWeek.get(week) ?? []
      existing.push(label)
      byWeek.set(week, existing)
    }
  }

  return Array.from(byWeek.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([semaine, evenements]) => ({ semaine, evenements }))
}

export interface MatchResult {
  matched: Map<string, EvenementParse[]>  // collaborateurId → events
  prenomsSansMatch: string[]
}

/**
 * Mappe les événements parsés vers les collaborateurs par normalisation du prénom.
 * Retourne also les prénoms non matchés.
 */
export function matchEvenements(
  parsed: EvenementParse[],
  collaborateurs: Collaborateur[]
): MatchResult {
  const normMap = new Map<string, string>() // prenom normalisé → collaborateurId
  for (const c of collaborateurs) {
    normMap.set(normalizePrenom(c.firstName), c.id)
  }

  const matched = new Map<string, EvenementParse[]>()
  const unmatchedPrenoms = new Set<string>()

  for (const evt of parsed) {
    if (evt.type === "ignore") continue
    const norm = normalizePrenom(evt.prenom)
    const collabId = normMap.get(norm)
    if (collabId) {
      const existing = matched.get(collabId) ?? []
      existing.push(evt)
      matched.set(collabId, existing)
    } else if (evt.prenom.trim()) {
      unmatchedPrenoms.add(evt.prenom)
    }
  }

  return {
    matched,
    prenomsSansMatch: Array.from(unmatchedPrenoms).sort(),
  }
}
