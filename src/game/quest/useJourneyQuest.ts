import { useCallback, useEffect, useState } from 'react'

import { postQuestEvent } from '../../api/quest'
import { useGameSessionStore } from '../gameSessionStore'
import type { NarrativeBeat, StoryChoice } from './story.types'
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

  const [narratives, setNarratives] = useState<NarrativeBeat[]>([])
  const [choices, setChoices] = useState<StoryChoice[]>([])
  const [interactions, setInteractions] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const player = playerState?.player
  const storyState = playerState?.storyState
  const quest = playerState?.quest
  const storyActive = player && quest ? isQingshiStory(player, quest) : false

  useEffect(() => {
    if (!player || !storyActive) return
    if (storyState?.questStatuses?.QS_WAKE !== 'hidden') return
    if (player.battlesWon > 0) return

    void (async () => {
      const result = await postQuestEvent({ playerId: player.id, type: 'first_enter' })
      await applyStoryEvent(result)
      setNarratives(result.narratives ?? [])
      setInteractions(result.interactions ?? [])
    })()
  }, [player, storyActive, storyState?.questStatuses?.QS_WAKE, applyStoryEvent])

  const runEvent = useCallback(
    async (payload: Parameters<typeof postQuestEvent>[0]) => {
      if (!player) return
      setBusy(true)
      try {
        const result = await postQuestEvent(payload)
        await applyStoryEvent(result)
        setNarratives(result.narratives?.length ? result.narratives : [])
        setChoices(result.choices ?? [])
        setInteractions(result.interactions ?? [])
      } finally {
        setBusy(false)
      }
    },
    [applyStoryEvent, player],
  )

  const dismissNarratives = useCallback(() => {
    if (!player) return
    setNarratives([])
    void runEvent({ playerId: player.id, type: 'dismiss_narratives' })
  }, [player, runEvent])

  const onInteraction = useCallback(
    (key: string) => {
      if (!player) return
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
    [player, runEvent],
  )

  const pendingStory =
    storyActive &&
    (narratives.length > 0 || choices.length > 0 || interactions.length > 0)

  return {
    player,
    quest,
    storyState,
    storyActive,
    narratives,
    choices,
    interactions,
    busy,
    pendingStory,
    runEvent,
    dismissNarratives,
    onInteraction,
  }
}
