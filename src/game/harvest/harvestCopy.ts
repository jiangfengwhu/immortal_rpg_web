import type { HarvestLootTotals } from './harvestLoot'

/** 收获列表展示分隔符 */
export const HARVEST_LOOT_SEPARATOR = '、'

export function formatHarvestLootList(totals: HarvestLootTotals): string {
  return Object.entries(totals)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => (count > 1 ? `${name}×${count}` : name))
    .join(HARVEST_LOOT_SEPARATOR)
}

/** 采药进行中：本次已采集提示 */
export function formatActiveHarvestTip(totals: HarvestLootTotals): string {
  const loot = formatHarvestLootList(totals)
  if (!loot) return '晨露未落篓，尚无草药'
  return `本次已采集 ${loot}`
}

/** 采药结束：本次收获总结 */
export function formatFinishedHarvestTip(totals: HarvestLootTotals): string {
  const loot = formatHarvestLootList(totals)
  if (!loot) return '本次采药空手而归'
  return `本次采药收获了 ${loot}`
}

/** 赴战中断采药 */
export function formatBattleInterruptedHarvest(totals: HarvestLootTotals): string {
  const loot = formatHarvestLootList(totals)
  if (!loot) return '赴战在即，采药不得不停'
  return `赴战中止采药 · 本次已采集 ${loot}`
}

export type HarvestFinalizeReason = 'stopped' | 'battle'

export function buildHarvestResultText(
  totals: HarvestLootTotals,
  reason: HarvestFinalizeReason,
): string {
  if (reason === 'battle') return formatBattleInterruptedHarvest(totals)
  return formatFinishedHarvestTip(totals)
}
