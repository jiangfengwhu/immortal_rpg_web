import { WORLD_MAP_CATALOG, MAP_ASSET_BASE, type WorldMapChapter } from './worldMap.catalog'

const REALM_STAGE_BASE: Record<string, number> = {
  mortal: 0,
  hero: 16,
  cultivator: 32,
  ascension: 48,
}

export function globalStageIndex(realm: string, stageIndex: number) {
  const base = REALM_STAGE_BASE[realm] ?? 0
  const index = base + stageIndex
  if (index < 0) return 0
  if (index > 63) return 63
  return index
}

export function resolveWorldMap(realm: string, stageIndex: number): WorldMapChapter {
  const global = globalStageIndex(realm, stageIndex)
  const chapter =
    WORLD_MAP_CATALOG.find(
      (entry) => global >= entry.globalStageFrom && global <= entry.globalStageTo,
    ) ?? WORLD_MAP_CATALOG[0]
  return chapter
}

export function resolveChapterImageUrl(chapter: { imageAsset?: string }) {
  if (!chapter.imageAsset) return null
  const segments = chapter.imageAsset.split('/').map((part) => encodeURIComponent(part))
  return `${MAP_ASSET_BASE}/${segments.join('/')}`
}

export function resolveWorldMapImageUrl(realm: string, stageIndex: number) {
  const chapter = resolveWorldMap(realm, stageIndex)
  return resolveChapterImageUrl(chapter)
}
