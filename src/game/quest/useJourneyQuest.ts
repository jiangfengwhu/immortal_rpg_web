import { useCallback, useEffect, useRef, useState } from 'react'

import { postQuestEvent } from '../../api/quest'
import { useBattleStore } from '../../battle/battleStore'
import { useGameSessionStore } from '../gameSessionStore'
import { useInfoFeedStore } from '../infoFeed/infoFeedStore'
import {
  resolveAfkFeatures,
  resolvePendingStoryChoices,
  resolveStoryInteractions,
  isStoryBattleReady,
} from './resolveStoryInteractions'
import type { StoryChoice } from './story.types'

export function isQingshiStory(
  player: { realm: string; stageIndex?: number },
  quest?: { mapPhaseName?: string },
) {
  // We cover Stage 0, 1, 2 for the story quest lines in mortal realm
  return player.realm === 'mortal' && (player.stageIndex ?? 0) <= 2
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
    interactions.some((k) => k.startsWith('fight_'))

  useEffect(() => {
    if (!player || !storyActive || !storyState) return
    setInteractions(resolveStoryInteractions(player, storyState))
    setChoices(resolvePendingStoryChoices(storyState, player.stageIndex ?? 0))
  }, [player, storyActive, storyState])

  useEffect(() => {
    pendingNarrativesAckRef.current = false
  }, [player?.id])

  useEffect(() => {
    if (!storyState?.pendingNarratives?.length) {
      pendingNarrativesAckRef.current = false
    }
  }, [storyState?.pendingNarratives?.length])

  const dismissNarratives = useCallback(async () => {
    if (!player || !storyState?.pendingNarratives?.length) return
    useInfoFeedStore.getState().appendStoryBeats(storyState.pendingNarratives)
    const result = await postQuestEvent({ playerId: player.id, type: 'dismiss_narratives' })
    await applyStoryEvent(result)
  }, [player, storyState?.pendingNarratives, applyStoryEvent])

  // 处理首次进入任务事件
  useEffect(() => {
    if (!player || !storyActive) return
    const stageKey = `first_enter_done_${player.stageIndex ?? 0}`
    if (storyState?.storyFlags?.[stageKey] === '1') return
    if (player.battlesWon > 0) return

    void (async () => {
      const result = await postQuestEvent({ playerId: player.id, type: 'first_enter' })
      await applyStoryEvent(result)
      setInteractions(result.interactions ?? resolveStoryInteractions(player, result.storyState))
      setChoices(result.choices ?? resolvePendingStoryChoices(result.storyState, player.stageIndex ?? 0))
    })()
  }, [player, storyActive, storyState?.storyFlags, applyStoryEvent])

  const runEvent = useCallback(
    async (payload: Parameters<typeof postQuestEvent>[0]) => {
      if (!player) return
      setBusy(true)
      try {
        const result = await postQuestEvent(payload)
        await applyStoryEvent(result)
        setChoices(result.choices ?? resolvePendingStoryChoices(result.storyState, player.stageIndex ?? 0))
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
      if (key.startsWith('fight_')) {
        startBattle()
        return
      }
      switch (key) {
        // --- Stage 0: 青石村 ---
        case 'go_yard':
          void runEvent({ playerId: player.id, type: 'enter_location', location: 'MAP_01_YARD' })
          break
        case 'talk_grandpa':
          void runEvent({ playerId: player.id, type: 'interact_npc', npcId: 'NPC_GRANDPA' })
          break
        case 'go_herb_field':
          void runEvent({ playerId: player.id, type: 'enter_location', location: 'MAP_01_HERB_FIELD' })
          break
        case 'go_bamboo':
          void runEvent({ playerId: player.id, type: 'enter_location', location: 'MAP_01_BAMBOO' })
          break
        case 'go_stone_bridge':
          void runEvent({ playerId: player.id, type: 'enter_location', location: 'MAP_01_STONE_BRIDGE' })
          break
        case 'gather_withered_herb':
          void runEvent({ playerId: player.id, type: 'gather_item', itemId: 'ITEM_WITHERED_HERB' })
          break
        case 'gather_corrupted_stone':
          void runEvent({ playerId: player.id, type: 'gather_item', itemId: 'ITEM_CORRUPTED_STONE' })
          break
        case 'prepare_departure':
          void runEvent({ playerId: player.id, type: 'prepare_departure' })
          break

        // --- Stage 1: 落霞山 ---
        case 'go_luoxia_path':
          void runEvent({ playerId: player.id, type: 'enter_location', location: 'MAP_02_PATH' })
          break
        case 'go_beast_den':
          void runEvent({ playerId: player.id, type: 'enter_location', location: 'MAP_02_BEAST_DEN' })
          break
        case 'go_luoxia_waterfall':
          void runEvent({ playerId: player.id, type: 'enter_location', location: 'MAP_02_WATERFALL' })
          break
        case 'go_luoxia_outpost':
          void runEvent({ playerId: player.id, type: 'enter_location', location: 'MAP_02_OUTPOST' })
          break
        case 'gather_wild_ginseng':
          void runEvent({ playerId: player.id, type: 'gather_item', itemId: 'ITEM_WILD_GINSENG' })
          break
        case 'gather_cauldron_shard':
          void runEvent({ playerId: player.id, type: 'gather_item', itemId: 'ITEM_BRONZE_CAULDRON_SHARD' })
          break
        case 'talk_outpost_guard':
          void runEvent({ playerId: player.id, type: 'interact_npc', npcId: 'NPC_LUOXIA_OUTPOST' })
          break
        case 'prepare_pingan':
          void runEvent({ playerId: player.id, type: 'prepare_departure' })
          break

        // --- Stage 2: 平安镇 ---
        case 'go_pingan_inn':
          void runEvent({ playerId: player.id, type: 'enter_location', location: 'MAP_03_INN' })
          break
        case 'go_pingan_forge':
          void runEvent({ playerId: player.id, type: 'enter_location', location: 'MAP_03_FORGE' })
          break
        case 'go_pingan_wharf':
          void runEvent({ playerId: player.id, type: 'enter_location', location: 'MAP_03_WHARF' })
          break
        case 'go_abandoned_warehouse':
          void runEvent({ playerId: player.id, type: 'enter_location', location: 'MAP_03_ABANDONED_WAREHOUSE' })
          break
        case 'talk_inn_keeper':
          void runEvent({ playerId: player.id, type: 'interact_npc', npcId: 'NPC_INN_KEEPER' })
          break
        case 'talk_forge_master':
          void runEvent({ playerId: player.id, type: 'interact_npc', npcId: 'NPC_FORGE_MASTER' })
          break
        case 'gather_iron_ore':
          void runEvent({ playerId: player.id, type: 'gather_item', itemId: 'ITEM_IRON_ORE' })
          break
        case 'gather_secret_letter':
          void runEvent({ playerId: player.id, type: 'gather_item', itemId: 'ITEM_SECRET_LETTER_SHARD' })
          break
        default:
          break
      }
    },
    [player, runEvent, startBattle],
  )

  const storyBattleReady = player ? isStoryBattleReady(player, storyState) : false
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
    pendingNarratives: storyState?.pendingNarratives ?? [],
    dismissNarratives,
  }
}
