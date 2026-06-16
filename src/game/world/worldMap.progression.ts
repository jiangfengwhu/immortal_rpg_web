import { WORLD_MAP_CATALOG } from './worldMap.catalog'
import { globalStageIndex } from './resolveWorldMap'

export function isSectRecruitmentUnlocked(realm: string, stageIndex: number) {
  const playerGlobal = globalStageIndex(realm, stageIndex)
  const taixuChapter = WORLD_MAP_CATALOG.find((entry) => entry.id === 'map_taixu_sect')
  if (!taixuChapter) return false
  return playerGlobal >= taixuChapter.globalStageFrom
}
