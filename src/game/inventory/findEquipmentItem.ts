import type { Equipment, EquippedSummary } from '../equipment/equipment.types'

export function findEquipmentItem(
  inventory: Equipment[],
  equipped: EquippedSummary,
  itemId: string,
): Equipment | undefined {
  const fromBag = inventory.find((item) => item.id === itemId)
  if (fromBag) return fromBag

  for (const item of Object.values(equipped)) {
    if (item?.id === itemId) return item
  }
  return undefined
}
