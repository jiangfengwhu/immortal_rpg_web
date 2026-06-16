export const STORY_QUEST_IDS = {
  new01: 'QS_NEW_01',
  new02: 'QS_NEW_02',
  new03: 'QS_NEW_03',
  new04: 'QS_NEW_04',
  
  lx01: 'LX_NEW_01',
  lx02: 'LX_NEW_02',
  lx03: 'LX_NEW_03',
  lx04: 'LX_NEW_04',
  
  pa01: 'PA_NEW_01',
  pa02: 'PA_NEW_02',
  pa03: 'PA_NEW_03',
  pa04: 'PA_NEW_04',
} as const

export const STORY_ITEM_IDS = {
  witheredHerb: 'ITEM_WITHERED_HERB',
  corruptedStone: 'ITEM_CORRUPTED_STONE',
  breathingBook: 'ITEM_BREATHING_BASIC',
  bronzeToken: 'ITEM_BRONZE_TOKEN',
  
  wildGinseng: 'ITEM_WILD_GINSENG',
  cauldronShard: 'ITEM_BRONZE_CAULDRON_SHARD',
  swordsmanBlade: 'ITEM_SWORDSMAN_BLADE',
  medicinalHerb: 'ITEM_MEDICINAL_HERB',
  
  ironOre: 'ITEM_IRON_ORE',
  secretLetter: 'ITEM_SECRET_LETTER_SHARD',
} as const

export const STORY_ITEM_LABELS: Record<string, string> = {
  [STORY_ITEM_IDS.witheredHerb]: '被啃剩的枯萎灵草',
  [STORY_ITEM_IDS.corruptedStone]: '煞气辣条碎屑',
  [STORY_ITEM_IDS.breathingBook]: '《摸鱼吐纳指南》',
  [STORY_ITEM_IDS.bronzeToken]: '青铜特工木令',
  
  [STORY_ITEM_IDS.wildGinseng]: '防脱发生发野山参',
  [STORY_ITEM_IDS.cauldronShard]: '保温杯古鼎碎片',
  [STORY_ITEM_IDS.swordsmanBlade]: '涂了反光漆的宝刀',
  [STORY_ITEM_IDS.medicinalHerb]: '过期解药',
  
  [STORY_ITEM_IDS.ironOre]: '搬砖玄铁矿石',
  [STORY_ITEM_IDS.secretLetter]: '红莲催单密信',
}

export const STORY_FEATURE_KEYS = {
  afkHerb: 'AFK_HERB_FIELD',
  afkBamboo: 'AFK_BAMBOO_HUNT',
  worldMap: 'WORLD_MAP',
  titleNovice: 'TITLE_NOVICE',
} as const

export const AFK_FEATURE_LABELS: Record<string, string> = {
  [STORY_FEATURE_KEYS.afkHerb]: '药田摸鱼',
  [STORY_FEATURE_KEYS.afkBamboo]: '竹林打柴',
}

export const STORY_FLAG_KEYS = {
  awaitingBridgeChoice: 'awaiting_bridge_choice',
  awaitingLuoxiaChoice: 'awaiting_luoxia_choice',
  awaitingPinganChoice: 'awaiting_pingan_choice',
} as const

export const BRIDGE_CHOICES = [
  { id: 'benevolent', label: '帮他拔罐敷草药', hint: '（仁善）送你摸鱼指南与信物' },
  { id: 'greedy', label: '摸走他的乾坤袋', hint: '（贪婪）得金币，但会被他师门拉黑' },
  { id: 'cautious', label: '大喊城管来了并溜走', hint: '（谨慎）顺手捡走他掉落的残破功法' },
] as const

export const LUOXIA_CHOICES = [
  { id: 'save_swordsman', label: '喂他吃防脱发山参', hint: '（仁善）赠送天工开物残页' },
  { id: 'rob_swordsman', label: '趁他忘词顺走他的刀', hint: '（贪婪）得金钱与反光漆宝刀' },
  { id: 'watch_swordsman', label: '在一旁嗑瓜子看戏', hint: '（中庸）磨练吃瓜心志' },
] as const

export const PINGAN_CHOICES = [
  { id: 'mercy_blood_hand', label: '剪断他的网线', hint: '（仁善）让他无法上网作恶' },
  { id: 'employ_blood_hand', label: '逼他签996工作合同', hint: '（霸道）成为你的终身打工仔' },
  { id: 'kill_blood_hand', label: '物理超度大反派', hint: '（决绝）彻底解决网线危机' },
] as const

export const QUEST_ORDERS: Record<number, readonly string[]> = {
  0: [
    STORY_QUEST_IDS.new01,
    STORY_QUEST_IDS.new02,
    STORY_QUEST_IDS.new03,
    STORY_QUEST_IDS.new04,
  ],
  1: [
    STORY_QUEST_IDS.lx01,
    STORY_QUEST_IDS.lx02,
    STORY_QUEST_IDS.lx03,
    STORY_QUEST_IDS.lx04,
  ],
  2: [
    STORY_QUEST_IDS.pa01,
    STORY_QUEST_IDS.pa02,
    STORY_QUEST_IDS.pa03,
    STORY_QUEST_IDS.pa04,
  ],
}

export function pickActiveQuestId(
  questStatuses: Record<string, string> | undefined,
  stageIndex: number,
): string {
  const order = QUEST_ORDERS[stageIndex] || QUEST_ORDERS[0]
  for (const id of order) {
    const status = questStatuses?.[id]
    if (status && status !== 'finished') {
      return id
    }
  }
  return order[0]
}
