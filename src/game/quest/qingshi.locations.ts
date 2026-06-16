export const QINGSHI_LOCATIONS = {
  yard: 'MAP_01_YARD',
  herbField: 'MAP_01_HERB_FIELD',
  bamboo: 'MAP_01_BAMBOO',
  bambooDeep: 'MAP_01_BAMBOO_DEEP',
  stoneBridge: 'MAP_01_STONE_BRIDGE',
  shrine: 'MAP_01_SHRINE',
} as const

export const STORY_INTERACTION_LABELS: Record<string, string> = {
  go_yard: '出屋看看',
  talk_grandpa: '与爷爷说话',
  go_herb_field: '去村东药田',
  go_bamboo: '往后山竹林',
  go_bamboo_deep: '深入竹林',
  go_stone_bridge: '前往石桥',
  fight_boar: '迎战变异野猪',
  prepare_departure: '整理行装',
}
