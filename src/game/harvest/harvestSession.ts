import type { TimelineFeedEntry } from '../infoFeed/infoFeed.types'

/** 当前进行中的采药会话（时间轴内最后一条 active harvest） */
export function findActiveHarvestEntry(
  entries: TimelineFeedEntry[],
): TimelineFeedEntry | undefined {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index]
    if (entry.kind === 'harvest' && entry.active) return entry
  }
  return undefined
}

export function isHarvestActive(entries: TimelineFeedEntry[]): boolean {
  return Boolean(findActiveHarvestEntry(entries))
}
