export interface TrelloLists {
  processM3: string
  pretermeAuto: string
  pretermeIrd: string
}

export interface CDC {
  id: string
  firstName: string
  letters: string[]
  boardId: string
  lists: TrelloLists
}

export interface Agency {
  id: string
  code: string
  name: string
  cdc: CDC[]
}

export interface TrelloConfig {
  agencies: Agency[]
}

export interface CoverageStatus {
  covered: number
  total: 26
  missing: string[]
  isComplete: boolean
  hasDuplicate: boolean
}
