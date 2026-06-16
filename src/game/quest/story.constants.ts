export const STORY_QUEST_IDS = {
  wake: 'QS_WAKE',
  yard: 'QS_YARD',
  boar: 'QS_BOAR',
  bridge: 'QS_BRIDGE',
  depart: 'QS_DEPART',
} as const

export const STORY_ITEM_IDS = {
  corruptedStone: 'ITEM_CORRUPTED_STONE',
  breathingBook: 'ITEM_BREATHING_BASIC',
  bronzeToken: 'ITEM_BRONZE_TOKEN',
} as const

export const STORY_ITEM_LABELS: Record<string, string> = {
  [STORY_ITEM_IDS.corruptedStone]: '染血灵石残片',
  [STORY_ITEM_IDS.breathingBook]: '《吐纳基础》',
  [STORY_ITEM_IDS.bronzeToken]: '青铜令牌',
}

export const STORY_FEATURE_KEYS = {
  afkHerb: 'AFK_HERB_FIELD',
  afkBamboo: 'AFK_BAMBOO_HUNT',
  worldMap: 'WORLD_MAP',
  titleNovice: 'TITLE_NOVICE',
} as const

export const AFK_FEATURE_LABELS: Record<string, string> = {
  [STORY_FEATURE_KEYS.afkHerb]: '药田采集',
  [STORY_FEATURE_KEYS.afkBamboo]: '竹林历练',
}

export const STORY_FLAG_KEYS = {
  awaitingBridgeChoice: 'awaiting_bridge_choice',
} as const

export const BRIDGE_CHOICES = [
  { id: 'benevolent', label: '以药草敷伤', hint: '仁善' },
  { id: 'greedy', label: '搜刮财物', hint: '贪婪' },
  { id: 'cautious', label: '回村报信', hint: '谨慎' },
] as const

const QINGSHI_QUEST_ORDER = [
  STORY_QUEST_IDS.wake,
  STORY_QUEST_IDS.yard,
  STORY_QUEST_IDS.boar,
  STORY_QUEST_IDS.bridge,
  STORY_QUEST_IDS.depart,
] as const

export function pickActiveQingshiQuestId(
  questStatuses: Record<string, string> | undefined,
): string {
  for (const id of QINGSHI_QUEST_ORDER) {
    const status = questStatuses?.[id]
    if (status === 'active' || status === 'available') return id
  }
  return STORY_QUEST_IDS.wake
}
