export type QuestStatus = 'active' | 'completed'

export type QuestReward = {
  exp: number
  gold: number
  chestType?: string
}

export type QuestGuide = {
  id: string
  title: string
  summary: string
  objectives: string[]
  narrative?: string
  status: QuestStatus
  realm: string
  stageIndex: number
  mapName?: string
  mapPhaseName?: string
  mapKeywords?: string[]
  rewards?: QuestReward
}
