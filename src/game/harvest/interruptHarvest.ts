import { STORY_FEATURE_KEYS } from '../quest/story.constants'
import { useGameSessionStore } from '../gameSessionStore'
import { useInfoFeedStore } from '../infoFeed/infoFeedStore'
import { hasHarvestTotals } from '../harvest/harvestLoot'
import { resolveActiveAfkFeature } from './harvest.constants'
import type { HarvestFinalizeReason } from './harvestCopy'
import { findActiveHarvestEntry } from './harvestSession'
import { stopHarvestLoop } from './harvestLoop'

const KNOWN_AFK_FEATURES = [STORY_FEATURE_KEYS.afkHerb, STORY_FEATURE_KEYS.afkBamboo]

/** 因其他任务（如战斗）打断采药：停服务端会话并归档本次收获。 */
export async function interruptActiveHarvest(reason: HarvestFinalizeReason) {
  stopHarvestLoop()

  const infoFeed = useInfoFeedStore.getState()
  const activeEntry = findActiveHarvestEntry(infoFeed.entries)
  const playerState = useGameSessionStore.getState().playerState
  const storyFlags = playerState?.storyState?.storyFlags
  const activeFeature = resolveActiveAfkFeature(storyFlags, KNOWN_AFK_FEATURES)

  if (!activeEntry && !activeFeature) return

  if (activeFeature) {
    await useGameSessionStore.getState().stopAfkGather(activeFeature)
  }

  const totals = activeEntry?.harvestTotals ?? {}
  if (hasHarvestTotals(totals)) {
    infoFeed.finalizeHarvestSession(reason)
    return
  }
  infoFeed.cancelActiveHarvestSession()
}
