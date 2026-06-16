/** 药田循环采集间隔（与后端 afkTickIntervalSec 对齐） */
export const HERB_GATHER_INTERVAL_MS = 5_000

export const AFK_ACTIVE_FLAG_PREFIX = 'afk_active_'

export function afkActiveFlagKey(feature: string) {
  return `${AFK_ACTIVE_FLAG_PREFIX}${feature}`
}

export function isAfkFeatureActive(
  storyFlags: Record<string, string> | undefined,
  feature: string,
): boolean {
  return storyFlags?.[afkActiveFlagKey(feature)] === '1'
}

export function resolveActiveAfkFeature(
  storyFlags: Record<string, string> | undefined,
  features: string[],
): string | null {
  for (const feature of features) {
    if (isAfkFeatureActive(storyFlags, feature)) return feature
  }
  return null
}
