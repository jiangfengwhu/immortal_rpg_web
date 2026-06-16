import { useCallback, useEffect, useRef, useState } from 'react'

import { postQuestEvent } from '../../api/quest'
import { useBattleStore } from '../../battle/battleStore'
import { useGameSessionStore } from '../gameSessionStore'
import { useInfoFeedStore } from '../infoFeed/infoFeedStore'
import {
  resolveAfkFeatures,
  resolvePendingStoryChoices,
  resolveStoryInteractions,
} from './resolveStoryInteractions'
import type { StoryChoice } from './story.types'
import { QINGSHI_LOCATIONS } from './qingshi.locations'

export function isQingshiStory(
  player: { realm: string; stageIndex?: number },
  quest?: { mapPhaseName?: string },
) {
  return player.realm === 'mortal' && (player.stageIndex ?? 0) <= 3 && quest?.mapPhaseName === '凡尘涟漪'
}

export function useJourneyQuest() {
  const playerState = useGameSessionStore((state) => state.playerState)
  const applyStoryEvent = useGameSessionStore((state) => state.applyStoryEvent)
  const startBattle = useBattleStore((state) => state.startBattle)

  const [choices, setChoices] = useState<StoryChoice[]>([])
  const [interactions, setInteractions] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const pendingNarrativesAckRef = useRef(false)

  const player = playerState?.player
  const storyState = playerState?.storyState
  const quest = playerState?.quest
  const storyActive = player && quest ? isQingshiStory(player, quest) : false
  const afkFeatures = storyActive ? resolveAfkFeatures(storyState) : []
  const dangerMood =
    storyState?.pendingNarratives?.some((beat) => beat.mood === 'danger') ||
    storyState?.storyChronicle?.at(-1)?.mood === 'danger' ||
    interactions.includes('fight_boar')

  useEffect(() => {
    if (!player || !storyActive || !storyState) return
    setInteractions(resolveStoryInteractions(player, storyState))
    setChoices(resolvePendingStoryChoices(storyState))
  }, [player, storyActive, storyState])

  useEffect(() => {
    pendingNarrativesAckRef.current = false
  }, [player?.id])

  useEffect(() => {
    if (!player || !storyActive || !storyState?.pendingNarratives?.length) return
    if (pendingNarrativesAckRef.current) return
    pendingNarrativesAckRef.current = true

    useInfoFeedStore.getState().appendStoryBeats(storyState.pendingNarratives)
    void postQuestEvent({ playerId: player.id, type: 'dismiss_narratives' }).then((result) => {
      void applyStoryEvent(result)
    })
  }, [player, storyActive, storyState?.pendingNarratives, applyStoryEvent])

  useEffect(() => {
    if (!player || !storyActive) return
    if (storyState?.questStatuses?.QS_WAKE !== 'hidden') return
    if (player.battlesWon > 0) return

    void (async () => {
      const result = await postQuestEvent({ playerId: player.id, type: 'first_enter' })
      useInfoFeedStore.getState().appendStoryBeats(result.narratives ?? [])
      await applyStoryEvent(result)
      setInteractions(result.interactions ?? resolveStoryInteractions(player, result.storyState))
      setChoices(result.choices ?? resolvePendingStoryChoices(result.storyState))
    })()
  }, [player, storyActive, storyState?.questStatuses?.QS_WAKE, applyStoryEvent])

  const runEvent = useCallback(
    async (payload: Parameters<typeof postQuestEvent>[0]) => {
      if (!player) return
      setBusy(true)
      try {
        const result = await postQuestEvent(payload)
        useInfoFeedStore.getState().appendStoryBeats(result.narratives ?? [])
        await applyStoryEvent(result)
        setChoices(result.choices ?? resolvePendingStoryChoices(result.storyState))
        setInteractions(
          result.interactions ?? resolveStoryInteractions(player, result.storyState),
        )
      } finally {
        setBusy(false)
      }
    },
    [applyStoryEvent, player],
  )

  const onInteraction = useCallback(
    (key: string) => {
      if (!player) return
      if (key === 'fight_boar') {
        startBattle()
        return
      }
      switch (key) {
        case 'go_yard':
          void runEvent({ playerId: player.id, type: 'enter_location', location: QINGSHI_LOCATIONS.yard })
          break
        case 'talk_grandpa':
          void runEvent({ playerId: player.id, type: 'interact_npc', npcId: 'NPC_GRANDPA' })
          break
        case 'go_herb_field':
          void runEvent({ playerId: player.id, type: 'enter_location', location: QINGSHI_LOCATIONS.herbField })
          break
        case 'go_bamboo':
          void runEvent({ playerId: player.id, type: 'enter_location', location: QINGSHI_LOCATIONS.bamboo })
          break
        case 'go_bamboo_deep':
          void runEvent({ playerId: player.id, type: 'enter_location', location: QINGSHI_LOCATIONS.bambooDeep })
          break
        case 'go_stone_bridge':
          void runEvent({ playerId: player.id, type: 'enter_location', location: QINGSHI_LOCATIONS.stoneBridge })
          break
        case 'prepare_departure':
          void runEvent({ playerId: player.id, type: 'prepare_departure' })
          break
        default:
          break
      }
    },
    [player, runEvent, startBattle],
  )

  const pendingStory = storyActive && (choices.length > 0 || interactions.length > 0)

  return {
    player,
    quest,
    storyState,
    storyActive,
    choices,
    interactions,
    afkFeatures,
    dangerMood,
    busy,
    pendingStory,
    runEvent,
    onInteraction,
  }
}
