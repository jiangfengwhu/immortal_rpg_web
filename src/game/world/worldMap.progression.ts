import type { WorldMapChapter } from './worldMap.catalog'
import { WORLD_MAP_CATALOG } from './worldMap.catalog'
import { globalStageIndex } from './resolveWorldMap'

export type JourneyChapterStatus = 'cleared' | 'current'

export type JourneyChapterItem = {
  kind: 'chapter'
  chapter: WorldMapChapter
  status: JourneyChapterStatus
}

export type JourneyTeaserItem = {
  kind: 'teaser'
}

export type JourneyMapItem = JourneyChapterItem | JourneyTeaserItem

/** 渐进披露：仅展示已踏足之地 + 至多一处「前路迷雾」预告 */
export function listJourneyMapItems(realm: string, stageIndex: number, stageCleared: boolean): JourneyMapItem[] {
  const playerGlobal = globalStageIndex(realm, stageIndex)
  const items: JourneyMapItem[] = []

  for (let index = 0; index < WORLD_MAP_CATALOG.length; index += 1) {
    const chapter = WORLD_MAP_CATALOG[index]

    if (playerGlobal < chapter.globalStageFrom) {
      const prev = WORLD_MAP_CATALOG[index - 1]
      if (prev && stageCleared && playerGlobal === prev.globalStageTo) {
        items.push({ kind: 'teaser' })
      }
      break
    }

    const status: JourneyChapterStatus =
      playerGlobal > chapter.globalStageTo ? 'cleared' : 'current'
    items.push({ kind: 'chapter', chapter, status })

    const atChapterEnd = playerGlobal === chapter.globalStageTo
    if (status === 'current' && stageCleared && atChapterEnd) {
      const hasNext = index + 1 < WORLD_MAP_CATALOG.length
      if (hasNext) {
        items.push({ kind: 'teaser' })
      }
      break
    }
  }

  return items
}

export function isSectRecruitmentUnlocked(realm: string, stageIndex: number) {
  const playerGlobal = globalStageIndex(realm, stageIndex)
  const taixuChapter = WORLD_MAP_CATALOG.find((entry) => entry.id === 'map_taixu_sect')
  if (!taixuChapter) return false
  return playerGlobal >= taixuChapter.globalStageFrom
}
