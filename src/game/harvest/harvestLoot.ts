import type { HarvestLootItem } from './harvest.types'

export type HarvestLootTotals = Record<string, number>

export function mergeHarvestLoot(
  totals: HarvestLootTotals,
  loot: HarvestLootItem[],
): HarvestLootTotals {
  if (loot.length === 0) return totals
  const next = { ...totals }
  for (const item of loot) {
    if (!item.name || item.count < 1) continue
    next[item.name] = (next[item.name] ?? 0) + item.count
  }
  return next
}

export function hasHarvestTotals(totals: HarvestLootTotals): boolean {
  return Object.values(totals).some((count) => count > 0)
}
