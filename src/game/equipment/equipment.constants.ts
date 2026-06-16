import type { EquipmentRarity, EquipmentSlot } from './equipment.types'

export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon: '武器',
  top: '上衣',
  bottom: '下装',
  shoes: '鞋子',
  ring: '戒指',
  necklace: '项链',
  bracer: '护腕',
  hat: '帽子',
  belt: '腰带',
  material: '材料',
}

/** 背包面板展示顺序（与用户设定一致） */
export const EQUIPMENT_SLOT_ORDER: EquipmentSlot[] = [
  'weapon',
  'top',
  'bottom',
  'shoes',
  'ring',
  'necklace',
  'bracer',
  'hat',
  'belt',
]

/** 纸娃娃网格区域名 — 与 global.css `.inventory-equip-grid` 的 grid-template-areas 对应；裤/履在 feet 行内并排 */
export const EQUIPMENT_SLOT_GRID_AREA: Record<EquipmentSlot, string> = {
  hat: 'hat',
  weapon: 'weapon',
  necklace: 'necklace',
  bracer: 'bracer',
  ring: 'ring',
  belt: 'belt',
  top: 'top',
  bottom: 'feet',
  shoes: 'feet',
}

export const RARITY_LABELS: Record<EquipmentRarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
  mythic: '神话',
}

export const RARITY_COLORS: Record<EquipmentRarity, string> = {
  common: '#888888',
  rare: '#4488ff',
  epic: '#aa44ff',
  legendary: '#ff8800',
  mythic: '#ff2244',
}

export const INVENTORY_GRID_COLUMNS = 5

/** 背包 UI 每次展开的格子行数（5 列 × 6 行） */
export const INVENTORY_UI_SLOT_BATCH = 30

/** 背包首次展示的格子数 */
export const INVENTORY_UI_INITIAL_SLOTS = 30

/** 每次从服务端拉取的装备数量（尽可能多） */
export const INVENTORY_FETCH_LIMIT = 100

/** 部位占位字形（纯 CSS 展示，无图片） */
export const SLOT_GLYPH: Record<EquipmentSlot, string> = {
  weapon: '剑',
  top: '衣',
  bottom: '裤',
  shoes: '履',
  ring: '戒',
  necklace: '佩',
  bracer: '腕',
  hat: '冠',
  belt: '带',
  material: '草',
}
