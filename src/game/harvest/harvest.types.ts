export type HarvestLootItem = {
  name: string
  count: number
}

export type HarvestFloatPayload = {
  feature: string
  items: HarvestLootItem[]
}

export const HARVEST_FLOAT_MS = 3200
