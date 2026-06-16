import type { Equipment } from './equipment.types'

/** 鉴定前隐藏词缀与详细数值 */
export function isEquipmentRevealed(item: Equipment) {
  return item.status === 'identified'
}

export function needsIdentify(item: Equipment) {
  return item.status === 'ready'
}

export type EquipmentBaseStats = {
  attack: number
  defense: number
  speed: number
}

export function equipmentBaseStats(item: Equipment): EquipmentBaseStats {
  return {
    attack: item.attackBonus ?? 0,
    defense: item.defenseBonus ?? 0,
    speed: item.speedBonus ?? 0,
  }
}

export function hasBaseStats(stats: EquipmentBaseStats) {
  return stats.attack > 0 || stats.defense > 0 || stats.speed > 0
}

export function formatBaseStatLine(stats: EquipmentBaseStats) {
  const parts: string[] = []
  if (stats.attack > 0) parts.push(`攻击 +${stats.attack}`)
  if (stats.defense > 0) parts.push(`防御 +${stats.defense}`)
  if (stats.speed > 0) parts.push(`速度 +${stats.speed}`)
  return parts.join(' · ')
}
