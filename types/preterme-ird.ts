// Types du workflow Préterme IARD (Incendie, Risques Divers)
// Miroir de types/preterme.ts adapté pour la branche IRD :
// - 19 colonnes Excel (pas nbSinistres / bonusMalus, ajoute tauxAugmentationIndice)
// - Règle de rétention : ETP OU tauxVariation (vs ET pour Auto)
// - seuilEtp stocké en décimal (1.20) — comparaison directe sans /100

export type AgenceCode = "H91358" | "H92083"
export type ClassificationClient = "particulier" | "entreprise"
export type DispatchStatut = "en_attente" | "ok" | "erreur"

export type ClientIrdImporte = {
  // ── Données Excel (19 colonnes IARD) ──
  nomClient: string
  numeroContrat: string               // clé de déduplication
  branche: string                     // valeur : "I.R.D"
  echeancePrincipale: string
  codeProduit: string | number
  modeReglement: string
  codeFractionnement: string
  primePrecedente: number             // primeTTCAnnuellePrecedente normalisé
  primeActualisee: number             // primeTTCAnnuelleActualisee normalisé
  tauxVariation: number
  surveillancePortefeuille: string
  tauxAugmentationIndice: number | null  // IARD uniquement — absent en Auto
  formule: string | number
  packs: string | null
  codeGestionCentrale: number | null
  tauxModulationCommission: number
  dateEffetDernierAvenant: string
  avantageClient: number | string
  etp: number                         // décimal : 1.20 = 20% — PAS de nbSinistres / bonusMalus

  // ── Calculé / assigné ──
  retenu: boolean
  classificationIA: ClassificationClient | null
  classificationFinale: ClassificationClient | null
  corrigeParUtilisateur: boolean
  gerant: string | null
  trelloCardId: string | null
  dispatchStatut: DispatchStatut
  dispatchErreur?: string | null      // null et non undefined (Firestore Admin SDK rejette undefined)
}

export type AgenceIrdState = {
  fichierNom: string
  clientsTotal: number
  seuilMajo: number                   // % — ex: 15
  seuilEtp: number                    // décimal — ex: 1.20 (comparaison directe)
  clientsRetenus: number
  etape2Statut: "en_attente" | "importé" | "bloqué"
  etape3Statut: "en_attente" | "analysé" | "bloqué"
  etape4Statut: "en_attente" | "complet" | "bloqué"
  dispatchStatut: "en_attente" | "ok" | "erreur"
  clients: ClientIrdImporte[]
}

export type WorkflowIrdState = {
  moisKey: string                     // "2026-04"
  moisLabel: string                   // "Avril 2026"
  confirmeAt: string                  // ISO
  etapeActive: 1 | 2 | 3 | 4 | 5 | 6
  statut: "en_cours" | "terminé"
  agences: Record<string, AgenceIrdState>  // clés : "H91358", "H92083"
  slackEnvoye?: boolean
}

export type SnapshotIrdCdc = {
  moisKey: string
  snapshotAt: string                  // ISO
  cdcId: string
  cdcPrenom: string                   // copie figée au moment du dispatch
  codeAgence: string
  lettresAttribuees: string[]         // copie figée au moment du dispatch
  clientsTotal: number
  particuliers: number
  entreprises: number
  cartesCreees: number
}
