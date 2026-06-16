import type { BattleResult } from '../../api/player'
import type { Equipment, EquipmentRarity, EquipmentSlot } from '../equipment/equipment.types'

export type LootFloatPayload = {
  dropId: string
  name: string
  source?: string
  slot?: EquipmentSlot
  rarity?: EquipmentRarity
  item?: Equipment
}

export function buildLootFloat(result: BattleResult, inventory: Equipment[]): LootFloatPayload | null {
  if (!result.dropId) return null

  const item = inventory.find((entry) => entry.id === result.dropId)

  return {
    dropId: result.dropId,
    name: item?.name ?? result.dropName ?? '灵宝',
    source: result.dropSource,
    slot: item?.slot ?? (result.dropSlot as EquipmentSlot | undefined),
    rarity: item?.rarity ?? (result.dropRarity as EquipmentRarity | undefined),
    item,
  }
}
