import type { EvenementParse } from "./bs-gemini"
import type { Collaborateur } from "@/types/collaborateur"
import type { AbsenceSemaine, TicketRestaurantSemaine } from "@/types/bs"
import type { JourTravail } from "@/types/collaborateur"

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

/** Mapping JourTravail → numéro JS (0=dim, 1=lun, …) */
const JOUR_TO_JS: Record<JourTravail, number> = {
  L: 1, M: 2, Me: 3, J: 4, V: 5, S: 6,
}

/**
 * Calcule les tickets restaurants par semaine ISO pour un collaborateur.
 * - Base : jours travaillés du collaborateur dans la semaine (tombant dans le mois)
 * - -1 par journée d'absence complète (CP, maladie, école) sur un jour travaillé
 * - Les demi-journées n'ont pas d'impact
 */
export function computeTicketsRestaurants(
  moisKey: string,
  joursTravail: JourTravail[],
  events: EvenementParse[],
): TicketRestaurantSemaine[] {
  const [year, month] = moisKey.split("-").map(Number)
  const workDayNums = new Set(joursTravail.map((j) => JOUR_TO_JS[j]))

  // Recense toutes les dates travaillées du mois avec leur semaine ISO
  const daysInMonth = new Date(year, month, 0).getDate()
  const workDateToWeek = new Map<string, number>()

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    if (workDayNums.has(date.getDay())) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      workDateToWeek.set(dateStr, getISOWeek(dateStr))
    }
  }

  // Initialise le compteur TR par semaine
  const trByWeek = new Map<number, number>()
  for (const week of workDateToWeek.values()) {
    trByWeek.set(week, (trByWeek.get(week) ?? 0) + 1)
  }

  // Soustrait les absences journée complète (pas demiJournee) sur les jours travaillés
  for (const evt of events) {
    if (evt.type === "ignore" || evt.demiJournee) continue

    const parts = evt.date.split("/")
    const dates: string[] = []

    if (parts.length === 2) {
      const cur = new Date(parts[0])
      const end = new Date(parts[1])
      while (cur <= end) {
        dates.push(cur.toISOString().split("T")[0])
        cur.setDate(cur.getDate() + 1)
      }
    } else {
      dates.push(parts[0])
    }

    for (const dateStr of dates) {
      const week = workDateToWeek.get(dateStr)
      if (week !== undefined) {
        trByWeek.set(week, Math.max(0, (trByWeek.get(week) ?? 0) - 1))
      }
    }
  }

  return Array.from(trByWeek.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([semaine, nb]) => ({ semaine, nb }))
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
