// ─── Types engagements ────────────────────────────────────────────────────────

export type TypeEngagement = "garantie_variable" | "prime_formation"

export interface BsEngagement {
  id: string
  collaborateurId: string
  type: TypeEngagement
  montantMensuel: number
  moisDebut: string  // "YYYY-MM"
  moisFin: string    // "YYYY-MM" calculé = addMoisKey(moisDebut, nbMois - 1)
  nbMois: number
  clos: boolean
  createdAt: Date
}

export type BsEngagementInput = Omit<BsEngagement, "id" | "moisFin" | "createdAt">

export const TYPE_ENGAGEMENT_LABELS: Record<TypeEngagement, string> = {
  garantie_variable: "Garantie variable",
  prime_formation: "Prime formation",
}

// ─── Types déclarations ───────────────────────────────────────────────────────

export type StatutDeclaration = "vide" | "en_cours" | "clos"

export interface AbsenceSemaine {
  semaine: number
  evenements: string[]
}

export interface SalarieDeclaration {
  absences: AbsenceSemaine[]         // auto (depuis Calendar + Gemini)
  garantieVariable?: number          // auto (engagement actif)
  primeFormation?: number            // auto (engagement actif)
  commissions?: number               // manuel
  boostGoogle?: number               // manuel
  primeMacron?: number               // manuel
  primeNoel?: number                 // manuel
  avance?: number                    // manuel
  avanceFrais?: number               // manuel
  frais?: number                     // manuel
  heuresSup?: number                 // manuel
  regul?: string                     // manuel (texte libre)
}

export interface BsDeclaration {
  moisKey: string
  statut: StatutDeclaration
  salaries: Record<string, SalarieDeclaration>
  prenomsSansMatch: string[]
  closedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MOIS_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

/** "2026-01" → "Janvier 2026" */
export function moisKeyToLabel(moisKey: string): string {
  const [year, month] = moisKey.split("-").map(Number)
  return `${MOIS_LABELS[month - 1]} ${year}`
}

/** Ajoute n mois à un moisKey. addMoisKey("2026-01", 2) → "2026-03" */
export function addMoisKey(moisKey: string, n: number): string {
  const [year, month] = moisKey.split("-").map(Number)
  const date = new Date(year, month - 1 + n, 1)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

/** Retourne le moisKey du mois précédent */
export function moisPrecedent(moisKey: string): string {
  return addMoisKey(moisKey, -1)
}

/** Retourne le moisKey courant (format YYYY-MM) */
export function currentMoisKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

/** True si l'engagement est actif pour le mois donné */
export function isEngagementActif(eng: Pick<BsEngagement, "moisDebut" | "moisFin" | "clos">, moisKey: string): boolean {
  if (eng.clos) return false
  return eng.moisDebut <= moisKey && moisKey <= eng.moisFin
}
