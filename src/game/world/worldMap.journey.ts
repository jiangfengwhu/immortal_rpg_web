import type { WorldMapChapter } from './worldMap.catalog'
import { globalStageIndex } from './resolveWorldMap'

export type MapChapterStatus = 'locked' | 'current' | 'cleared'

export function resolveChapterStatus(
  chapter: WorldMapChapter,
  realm: string,
  stageIndex: number,
  stageCleared: boolean,
): MapChapterStatus {
  const global = globalStageIndex(realm, stageIndex)
  if (global > chapter.globalStageTo) return 'cleared'
  if (global < chapter.globalStageFrom) return 'locked'
  return stageCleared && global === chapter.globalStageTo ? 'cleared' : 'current'
}

export function stageDotsInChapter(chapter: WorldMapChapter) {
  const count = chapter.globalStageTo - chapter.globalStageFrom + 1
  return Array.from({ length: count }, (_, offset) => chapter.globalStageFrom + offset)
}

export function dotStatus(globalStage: number, playerGlobal: number, stageCleared: boolean) {
  if (globalStage < playerGlobal) return 'done' as const
  if (globalStage > playerGlobal) return 'pending' as const
  return stageCleared ? ('ready' as const) : ('active' as const)
}
