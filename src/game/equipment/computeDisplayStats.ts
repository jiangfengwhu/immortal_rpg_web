import type { PlayerFullState } from '../../api/player'
import { sumEquipmentBonuses } from './computeEquipmentBonuses'
import type { Equipment, EquippedSummary } from './equipment.types'
import { normalizeEquipmentSlot } from './equipment.types'

export type DisplayStats = {
  maxHp: number
  attack: number
  defense: number
  spiritPower: number
  speed: number
  sealRate: number
  sealResist: number
}

const DISPLAY_STAT_KEYS = [
  'maxHp',
  'attack',
  'defense',
  'spiritPower',
  'speed',
  'sealRate',
  'sealResist',
] as const satisfies ReadonlyArray<keyof DisplayStats>

export { DISPLAY_STAT_KEYS }

export function computeDisplayStats(
  player: PlayerFullState['player'],
  equipped: EquippedSummary,
): DisplayStats {
  const eq = sumEquipmentBonuses(equipped)
  return {
    maxHp: player.stats.maxHp + eq.hp,
    attack: player.stats.attack + eq.attack,
    defense: player.stats.defense + eq.defense,
    spiritPower: player.stats.spiritPower + eq.spiritPower,
    speed: player.stats.speed + eq.speed,
    sealRate: player.stats.sealRate + eq.sealRate,
    sealResist: player.stats.sealResist + eq.sealResist,
  }
}

export function projectEquippedWithItem(equipped: EquippedSummary, item: Equipment): EquippedSummary {
  const slot = normalizeEquipmentSlot(item.slot)
  if (!slot) return equipped
  return { ...equipped, [slot]: item }
}

export function projectUnequipItem(equipped: EquippedSummary, item: Equipment): EquippedSummary {
  const slot = normalizeEquipmentSlot(item.slot)
  if (!slot) return equipped
  const next = { ...equipped }
  delete next[slot]
  return next
}

export function projectStatsForSelectedItem(
  player: PlayerFullState['player'],
  equipped: EquippedSummary,
  item: Equipment,
): DisplayStats {
  const projected = item.equipped
    ? projectUnequipItem(equipped, item)
    : projectEquippedWithItem(equipped, item)
  return computeDisplayStats(player, projected)
}
