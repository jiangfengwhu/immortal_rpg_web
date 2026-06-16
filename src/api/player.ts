import type { AllocateStatsRequest, PlayerClass } from '../game/character/character.types'
import type { Equipment, EquippedSummary } from '../game/equipment/equipment.types'
import type { QuestGuide } from '../game/quest/quest.types'
import type { StoryState } from '../game/quest/story.types'
import { PlayerNotFoundError } from './player.errors'

export type PlayerFullState = {
  player: {
    id: string
    name: string
    class: PlayerClass
    level: number
    exp: number
    gold: number
    realm: string
    stageIndex: number
    stageCleared: boolean
    battlesWon: number
    potentialPoints: number
    primary: {
      constitution: number
      strength: number
      magic: number
      charm: number
      agility: number
    }
    stats: {
      maxHp: number
      stamina: number
      mp: number
      attack: number
      defense: number
      spiritPower: number
      speed: number
      sealRate: number
      sealResist: number
    }
    magicResist: {
      immortal: number
      ghost: number
      demon: number
      wisdom: number
      mind: number
    }
  }
  quest: QuestGuide
  storyState: StoryState
  storyLog: unknown[]
  inventory: Equipment[]
  equipped: EquippedSummary
}

export type BattleResult = {
  won: boolean
  expGained: number
  goldGained: number
  dropId?: string
  dropSource?: 'library' | 'ai' | string
  dropName?: string
  dropSlot?: string
  dropRarity?: string
  chestType?: string
  newLevel?: number
  leveledUp?: boolean
  realmUp?: boolean
  bossName: string
  stageName: string
}

type ApiError = { error?: string }

export async function createPlayer(playerId: string, playerName: string, playerClass: PlayerClass) {
  const response = await fetch('/api/player/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, playerName, class: playerClass }),
  })
  const data = (await response.json()) as PlayerFullState & ApiError
  if (!response.ok) {
    throw new Error(data.error ?? `创角失败 (${response.status})`)
  }
  return data
}

export async function fetchPlayer(playerId: string) {
  const response = await fetch(`/api/player/${encodeURIComponent(playerId)}`)
  if (response.status === 404) {
    throw new PlayerNotFoundError()
  }
  const data = (await response.json()) as PlayerFullState & ApiError
  if (!response.ok) {
    throw new Error(data.error ?? `读取角色失败 (${response.status})`)
  }
  return data
}

export async function allocateStats(payload: AllocateStatsRequest) {
  const response = await fetch('/api/player/allocate-stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = (await response.json()) as PlayerFullState & ApiError
  if (!response.ok) {
    throw new Error(data.error ?? `加点失败 (${response.status})`)
  }
  return data
}

export async function autoAllocateStats(playerId: string) {
  const response = await fetch('/api/player/auto-allocate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId }),
  })
  const data = (await response.json()) as PlayerFullState & ApiError
  if (!response.ok) {
    throw new Error(data.error ?? `一键加点失败 (${response.status})`)
  }
  return data
}

export type AdvanceJourneyResult = {
  player: PlayerFullState['player']
  newQuest: QuestGuide
  leveledUp?: boolean
  realmUp?: boolean
  maxStage?: boolean
}

export async function startBattle(playerId: string) {
  const response = await fetch('/api/battle/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId }),
  })
  const data = (await response.json()) as BattleResult & ApiError
  if (!response.ok) {
    throw new Error(data.error ?? `战斗结算失败 (${response.status})`)
  }
  return data
}

export async function advanceQuest(playerId: string) {
  const response = await fetch('/api/quest/advance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId }),
  })
  const data = (await response.json()) as AdvanceJourneyResult & ApiError
  if (!response.ok) {
    throw new Error(data.error ?? `启程失败 (${response.status})`)
  }
  return data
}
