export type ClassificationClient = "particulier" | "entreprise"
export type DispatchStatut = "en_attente" | "ok" | "erreur"

export type ClientImporte = {
  // Données Excel
  nomClient: string
  numeroContrat: string
  branche: string
  echeancePrincipale: string
  codeProduit: string | number
  modeReglement: string
  codeFractionnement: string
  primePrecedente: number
  primeActualisee: number
  tauxVariation: number
  surveillancePortefeuille: string
  avantageClient: number | string
  formule: string | number
  packs: string | null
  nbSinistres: number
  bonusMalus: number
  etp: number
  codeGestionCentrale: number | null
  tauxModulationCommission: number
  dateEffetDernierAvenant: string

  // Calculé / assigné
  retenu: boolean
  classificationIA: ClassificationClient | null
  classificationFinale: ClassificationClient | null
  corrigeParUtilisateur: boolean
  gerant: string | null
  trelloCardId: string | null
  dispatchStatut: DispatchStatut
  dispatchErreur?: string | null
}

export type AgenceStatut2 = "en_attente" | "importé" | "bloqué"
export type AgenceStatut3 = "en_attente" | "analysé" | "bloqué"
export type AgenceStatut4 = "en_attente" | "complet" | "bloqué"
export type AgenceStatut5 = "en_attente" | "ok" | "erreur"

export type AgenceState = {
  fichierNom: string
  clientsTotal: number
  seuilMajo: number
  seuilEtp: number
  clientsRetenus: number
  etape2Statut: AgenceStatut2
  etape3Statut: AgenceStatut3
  etape4Statut: AgenceStatut4
  dispatchStatut: AgenceStatut5
  clients: ClientImporte[]
}

export type WorkflowState = {
  moisKey: string
  moisLabel: string
  confirmeAt: string
  etapeActive: 1 | 2 | 3 | 4 | 5 | 6
  statut: "en_cours" | "terminé"
  agences: Record<string, AgenceState>
  slackEnvoye?: boolean
}

export type SnapshotCdc = {
  moisKey: string
  snapshotAt: string
  cdcId: string
  cdcPrenom: string
  codeAgence: string
  lettresAttribuees: string[]
  clientsTotal: number
  particuliers: number
  entreprises: number
  cartesCreees: number
}
