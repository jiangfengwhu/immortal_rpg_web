import type { Equipment, EquipmentStatBonuses, EquippedSummary } from './equipment.types'
import { normalizeEquipmentSlot } from './equipment.types'

/** 汇总装备加成，与 server battle_resolver.buildPlayerStats 对齐 */
export function sumEquipmentBonuses(equipped: EquippedSummary): EquipmentStatBonuses {
  const bonuses: EquipmentStatBonuses = {
    hp: 0,
    attack: 0,
    defense: 0,
    spiritPower: 0,
    speed: 0,
    sealRate: 0,
    sealResist: 0,
  }

  const items = [
    equipped.weapon,
    equipped.top,
    equipped.bottom,
    equipped.shoes,
    equipped.ring,
    equipped.necklace,
    equipped.bracer,
    equipped.hat,
    equipped.belt,
  ]
  for (const item of items) {
    if (!item) continue
    applyItemBonuses(bonuses, item)
  }
  return bonuses
}

function applyItemBonuses(bonuses: EquipmentStatBonuses, item: Equipment) {
  bonuses.attack += item.attackBonus ?? 0
  bonuses.defense += item.defenseBonus ?? 0
  bonuses.speed += item.speedBonus ?? 0

  for (const affix of item.affixes ?? []) {
    if (!affix.key) continue
    const value = affix.numericValue ?? 0
    if (value === 0) continue
    switch (affix.key) {
      case 'hp':
        bonuses.hp += value
        break
      case 'attack':
        bonuses.attack += value
        break
      case 'defense':
        bonuses.defense += value
        break
      case 'spiritPower':
      case 'skillPower':
        bonuses.spiritPower += value
        break
      case 'speed':
        bonuses.speed += value
        break
      case 'sealRate':
        bonuses.sealRate += value
        break
      case 'sealResist':
        bonuses.sealResist += value
        break
    }
  }
}

export function buildEquippedSummary(inventory: Equipment[]): EquippedSummary {
  const summary: EquippedSummary = {}
  for (const item of inventory) {
    if (!item.equipped) continue
    const slot = normalizeEquipmentSlot(item.slot)
    if (!slot) continue
    summary[slot] = item
  }
  return summary
}

export function canEquipItem(item: Equipment) {
  return item.status === 'ready' || item.status === 'identified'
}

export { needsIdentify } from './equipmentDisplay'

export function slotLabelForItem(item: Equipment) {
  const slot = normalizeEquipmentSlot(item.slot)
  if (!slot) return '未知'
  return slot
}
