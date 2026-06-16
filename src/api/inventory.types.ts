import type { Equipment } from '../game/equipment/equipment.types'

export type InventoryPage = {
  items: Equipment[]
  total: number
  hasMore: boolean
}
