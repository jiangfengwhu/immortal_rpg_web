import type { Equipment, EquippedSummary } from '../game/equipment/equipment.types'
import type { PlayerFullState } from './player'
import type { InventoryPage } from './inventory.types'
import { INVENTORY_FETCH_LIMIT } from '../game/equipment/equipment.constants'

export type { Equipment, EquippedSummary, InventoryPage }

export async function equipItem(playerId: string, equipmentId: string) {
  const response = await fetch(`/api/equipment/${encodeURIComponent(equipmentId)}/equip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, equipmentId }),
  })
  const data = (await response.json()) as PlayerFullState & { error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? `穿戴失败 (${response.status})`)
  }
  return data
}

export async function identifyItem(equipmentId: string, playerId: string) {
  const response = await fetch(`/api/equipment/${encodeURIComponent(equipmentId)}/identify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId }),
  })
  const data = (await response.json()) as PlayerFullState & { error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? `鉴定失败 (${response.status})`)
  }
  return data
}

export async function fetchInventoryPage(
  playerId: string,
  offset = 0,
  limit = INVENTORY_FETCH_LIMIT,
) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  })
  const response = await fetch(`/api/inventory/${encodeURIComponent(playerId)}?${params}`)
  const data = (await response.json()) as InventoryPage & { error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? `读取背包失败 (${response.status})`)
  }
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    hasMore: data.hasMore ?? false,
  }
}
