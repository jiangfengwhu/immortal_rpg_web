import type { HarvestLootTotals } from '../harvest/harvestLoot'

export type InfoFeedKind =
  | 'narrative'
  | 'dialogue'
  | 'context'
  | 'focus'
  | 'action'
  | 'status'
  | 'result'
  | 'harvest'

export type InfoFeedItem = {
  id: string
  kind: InfoFeedKind
  text: string
  speaker?: string
  mood?: string
  tone?: 'success' | 'warn'
  fresh?: boolean
  active?: boolean
  stoppable?: boolean
  harvestTotals?: HarvestLootTotals
  /** 与上一条相邻且相同时的重复次数 */
  repeatCount?: number
}

/** 统一时间线条目（剧情纪事 + 玩家行为按 seq 交错） */
export type TimelineFeedEntry = {
  id: string
  beatId?: string
  kind: 'narrative' | 'dialogue' | 'action' | 'status' | 'result' | 'harvest'
  text: string
  speaker?: string
  mood?: string
  fresh?: boolean
  active?: boolean
  tone?: 'success' | 'warn'
  seq: number
  harvestTotals?: HarvestLootTotals
}

/** @deprecated 使用 TimelineFeedEntry */
export type ActivityFeedEntry = TimelineFeedEntry
