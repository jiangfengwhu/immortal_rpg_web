export type EquipmentStatus = 'generating' | 'ready' | 'identified'

export type EquipmentRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

/** 装备部位 — 与后端 model.EquipmentSlot 对齐 */
export type EquipmentSlot =
  | 'weapon'   // 武器
  | 'top'      // 上衣
  | 'bottom'   // 下装
  | 'shoes'    // 鞋子
  | 'ring'     // 戒指
  | 'necklace' // 项链
  | 'bracer'   // 护腕
  | 'hat'      // 帽子
  | 'belt'     // 腰带

export type EquipmentAffix = {
  label: string
  key?: string
  value: string
  numericValue?: number
  isEpic?: boolean
}

export type Equipment = {
  id: string
  playerId: string
  status: EquipmentStatus
  name?: string
  rarity?: EquipmentRarity
  slot?: EquipmentSlot
  lore?: string
  affixes?: EquipmentAffix[]
  iconBase64?: string
  equipped: boolean
  attackBonus: number
  defenseBonus: number
  speedBonus: number
  critBonus?: number
  bossName?: string
  chestType?: string
}

export type EquippedSummary = {
  weapon?: Equipment
  top?: Equipment
  bottom?: Equipment
  shoes?: Equipment
  ring?: Equipment
  necklace?: Equipment
  bracer?: Equipment
  hat?: Equipment
  belt?: Equipment
}

export type EquipmentStatBonuses = {
  hp: number
  attack: number
  defense: number
  spiritPower: number
  speed: number
  sealRate: number
  sealResist: number
}

/** 兼容旧存档部位名 */
export function normalizeEquipmentSlot(slot?: string): EquipmentSlot | undefined {
  if (!slot) return undefined
  switch (slot) {
    case 'armor':
      return 'top'
    case 'relic':
      return 'ring'
    case 'boots':
      return 'shoes'
    case 'helm':
      return 'hat'
    default:
      return slot as EquipmentSlot
  }
}
