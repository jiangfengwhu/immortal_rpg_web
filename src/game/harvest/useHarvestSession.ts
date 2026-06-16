import { useEffect, useRef } from 'react'

import { useBattleStore } from '../../battle/battleStore'
import { useGameSessionStore } from '../gameSessionStore'
import { useInfoFeedStore } from '../infoFeed/infoFeedStore'
import { hasHarvestTotals } from '../harvest/harvestLoot'
import { resolveActiveAfkFeature } from './harvest.constants'
import { findActiveHarvestEntry } from './harvestSession'
import { isHarvestLoopRunning, stopHarvestLoop } from './harvestLoop'

function settleOrphanHarvestSession() {
  const infoFeed = useInfoFeedStore.getState()
  const active = findActiveHarvestEntry(infoFeed.entries)
  if (!active) return

  const totals = active.harvestTotals ?? {}
  if (hasHarvestTotals(totals)) {
    infoFeed.finalizeHarvestSession('stopped')
    return
  }
  infoFeed.cancelActiveHarvestSession()
}

/** 恢复服务端已开始的循环采药会话，并在角色切换时清理。 */
export function useHarvestSession(
  playerId: string | undefined,
  storyFlags: Record<string, string> | undefined,
  afkFeatures: string[],
) {
  const resumeAfkGatherLoop = useGameSessionStore((state) => state.resumeAfkGatherLoop)
  const ensureActiveHarvestSession = useInfoFeedStore((state) => state.ensureActiveHarvestSession)
  const lastPlayerRef = useRef<string | null>(null)

  useEffect(() => {
    if (!playerId) return

    if (lastPlayerRef.current && lastPlayerRef.current !== playerId) {
      settleOrphanHarvestSession()
    }
    lastPlayerRef.current = playerId

    const battlePhase = useBattleStore.getState().phase
    if (battlePhase !== 'ready') {
      stopHarvestLoop()
      return
    }

    const activeFeature = resolveActiveAfkFeature(storyFlags, afkFeatures)
    if (!activeFeature) {
      if (!isHarvestLoopRunning()) {
        settleOrphanHarvestSession()
      }
      return
    }

    ensureActiveHarvestSession()
    if (!isHarvestLoopRunning()) {
      resumeAfkGatherLoop(activeFeature)
    }
  }, [playerId, storyFlags, afkFeatures, resumeAfkGatherLoop, ensureActiveHarvestSession])
}
