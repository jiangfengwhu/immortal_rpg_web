import {
  BRIDGE_CHOICES,
  LUOXIA_CHOICES,
  PINGAN_CHOICES,
  pickActiveQuestId,
  STORY_FLAG_KEYS,
  STORY_QUEST_IDS,
} from './story.constants'
import type { StoryChoice, StoryState } from './story.types'

type StoryPlayer = {
  realm: string
  stageIndex?: number
  level?: number
}

export function resolvePendingStoryChoices(
  story: StoryState | undefined,
  stageIndex: number,
): StoryChoice[] {
  if (!story) return []
  if (stageIndex === 0 && story.storyFlags?.[STORY_FLAG_KEYS.awaitingBridgeChoice] === '1') {
    return BRIDGE_CHOICES.map((choice) => ({ ...choice }))
  }
  if (stageIndex === 1 && story.storyFlags?.[STORY_FLAG_KEYS.awaitingLuoxiaChoice] === '1') {
    return LUOXIA_CHOICES.map((choice) => ({ ...choice }))
  }
  if (stageIndex === 2 && story.storyFlags?.[STORY_FLAG_KEYS.awaitingPinganChoice] === '1') {
    return PINGAN_CHOICES.map((choice) => ({ ...choice }))
  }
  return []
}

export function resolveStoryInteractions(
  player: StoryPlayer,
  story: StoryState | undefined,
): string[] {
  if (player.realm !== 'mortal' || !story) {
    return []
  }
  const stageIndex = player.stageIndex ?? 0
  if (stageIndex > 2) {
    return []
  }

  const questStatuses = story.questStatuses ?? {}
  const activeQuestId = pickActiveQuestId(questStatuses, stageIndex)
  const activeStatus = questStatuses[activeQuestId]
  const out: string[] = []

  if (activeStatus !== 'active') {
    return []
  }

  const progress = story.objectiveProgress?.[activeQuestId] ?? {}

  switch (stageIndex) {
    case 0: {
      const loc = story.storyFlags?.current_location ?? 'MAP_01_YARD'
      switch (activeQuestId) {
        case STORY_QUEST_IDS.new01:
          if (loc === 'MAP_01_HERB_FIELD') {
            const curr = progress['obj_1_2'] ?? 0
            if (curr < 3) out.push('gather_withered_herb')
            out.push('go_yard')
          } else {
            const currHerbs = progress['obj_1_2'] ?? 0
            if (currHerbs >= 3) out.push('talk_grandpa')
            else out.push('go_herb_field')
          }
          break
        case STORY_QUEST_IDS.new02:
          if (loc === 'MAP_01_BAMBOO') {
            const currKills = progress['obj_2_2'] ?? 0
            const hasStone = progress['obj_2_3'] ?? 0
            if (currKills < 3) out.push('fight_boar')
            else if (hasStone < 1) out.push('gather_corrupted_stone')
            else out.push('go_stone_bridge')
          } else {
            out.push('go_bamboo')
          }
          break
        case STORY_QUEST_IDS.new03:
          if (loc === 'MAP_01_STONE_BRIDGE') {
            if (story.storyFlags?.[STORY_FLAG_KEYS.awaitingBridgeChoice] !== '1') {
              out.push('go_yard')
            }
          } else {
            out.push('go_stone_bridge')
          }
          break
        case STORY_QUEST_IDS.new04: {
          const saidGoodbye = progress['obj_4_2'] ?? 0
          if (loc === 'MAP_01_YARD') {
            if (saidGoodbye < 1) {
              if ((player.level ?? 1) >= 3) out.push('talk_grandpa')
              else out.push('go_herb_field')
            } else {
              out.push('prepare_departure')
            }
          } else {
            out.push('go_yard')
          }
          break
        }
      }
      break
    }

    case 1: {
      const loc = story.storyFlags?.current_location ?? 'MAP_02_PATH'
      switch (activeQuestId) {
        case STORY_QUEST_IDS.lx01:
          if (loc === 'MAP_02_PATH') {
            const currKills = progress['obj_5_2'] ?? 0
            const currGinseng = progress['obj_5_3'] ?? 0
            if (currKills < 3) out.push('fight_wolf')
            else if (currGinseng < 2) out.push('gather_wild_ginseng')
            else out.push('go_beast_den')
          } else {
            out.push('go_luoxia_path')
          }
          break
        case STORY_QUEST_IDS.lx02:
          if (loc === 'MAP_02_BEAST_DEN') {
            const currKills = progress['obj_6_2'] ?? 0
            const hasShard = progress['obj_6_3'] ?? 0
            if (currKills < 1) out.push('fight_bear')
            else if (hasShard < 1) out.push('gather_cauldron_shard')
            else out.push('go_luoxia_waterfall')
          } else {
            out.push('go_beast_den')
          }
          break
        case STORY_QUEST_IDS.lx03:
          if (loc === 'MAP_02_WATERFALL') {
            if (story.storyFlags?.[STORY_FLAG_KEYS.awaitingLuoxiaChoice] !== '1') {
              out.push('go_luoxia_outpost')
            }
          } else {
            out.push('go_luoxia_waterfall')
          }
          break
        case STORY_QUEST_IDS.lx04: {
          const talkedGuard = progress['obj_8_2'] ?? 0
          if (loc === 'MAP_02_OUTPOST') {
            if (talkedGuard < 1) {
              out.push('talk_outpost_guard')
            } else {
              out.push('prepare_pingan')
            }
          } else {
            out.push('go_luoxia_outpost')
          }
          break
        }
      }
      break
    }

    case 2: {
      const loc = story.storyFlags?.current_location ?? 'MAP_03_INN'
      switch (activeQuestId) {
        case STORY_QUEST_IDS.pa01:
          if (loc === 'MAP_03_INN') {
            const talkedKeeper = progress['obj_9_2'] ?? 0
            const currKills = progress['obj_9_3'] ?? 0
            if (talkedKeeper < 1) out.push('talk_inn_keeper')
            else if (currKills < 3) out.push('fight_thug')
            else out.push('go_pingan_forge')
          } else {
            out.push('go_pingan_inn')
          }
          break
        case STORY_QUEST_IDS.pa02:
          if (loc === 'MAP_03_FORGE') {
            const talkedForge = progress['obj_10_2'] ?? 0
            const currOre = progress['obj_10_3'] ?? 0
            if (talkedForge < 1) out.push('talk_forge_master')
            else if (currOre < 3) out.push('gather_iron_ore')
            else out.push('go_pingan_wharf')
          } else {
            out.push('go_pingan_forge')
          }
          break
        case STORY_QUEST_IDS.pa03:
          if (loc === 'MAP_03_WHARF') {
            const currKills = progress['obj_11_2'] ?? 0
            const hasLetter = progress['obj_11_3'] ?? 0
            if (currKills < 3) out.push('fight_red_lotus_elite')
            else if (hasLetter < 1) out.push('gather_secret_letter')
            else out.push('go_abandoned_warehouse')
          } else {
            out.push('go_pingan_wharf')
          }
          break
        case STORY_QUEST_IDS.pa04:
          if (loc === 'MAP_03_ABANDONED_WAREHOUSE') {
            if (story.storyFlags?.[STORY_FLAG_KEYS.awaitingPinganChoice] !== '1') {
              out.push('prepare_departure')
            }
          } else {
            out.push('go_abandoned_warehouse')
          }
          break
      }
      break
    }
  }

  return out
}

export function isStoryBattleReady(
  player: StoryPlayer,
  story: StoryState | undefined,
): boolean {
  if (player.realm !== 'mortal' || !story?.questStatuses) return false
  const stageIndex = player.stageIndex ?? 0
  const activeQuestId = pickActiveQuestId(story.questStatuses, stageIndex)
  const loc = story.storyFlags?.current_location

  if (stageIndex === 0) {
    return (
      activeQuestId === STORY_QUEST_IDS.new02 &&
      loc === 'MAP_01_BAMBOO' &&
      (story.objectiveProgress?.[STORY_QUEST_IDS.new02]?.['obj_2_2'] ?? 0) < 3
    )
  }

  if (stageIndex === 1) {
    if (activeQuestId === STORY_QUEST_IDS.lx01) {
      return loc === 'MAP_02_PATH' && (story.objectiveProgress?.[STORY_QUEST_IDS.lx01]?.['obj_5_2'] ?? 0) < 3
    }
    if (activeQuestId === STORY_QUEST_IDS.lx02) {
      return loc === 'MAP_02_BEAST_DEN' && (story.objectiveProgress?.[STORY_QUEST_IDS.lx02]?.['obj_6_2'] ?? 0) < 1
    }
    if (activeQuestId === STORY_QUEST_IDS.lx03) {
      return loc === 'MAP_02_WATERFALL' && (story.objectiveProgress?.[STORY_QUEST_IDS.lx03]?.['obj_7_2'] ?? 0) < 1
    }
  }

  if (stageIndex === 2) {
    if (activeQuestId === STORY_QUEST_IDS.pa01) {
      return loc === 'MAP_03_INN' && (story.objectiveProgress?.[STORY_QUEST_IDS.pa01]?.['obj_9_3'] ?? 0) < 3
    }
    if (activeQuestId === STORY_QUEST_IDS.pa03) {
      return loc === 'MAP_03_WHARF' && (story.objectiveProgress?.[STORY_QUEST_IDS.pa03]?.['obj_11_2'] ?? 0) < 3
    }
    if (activeQuestId === STORY_QUEST_IDS.pa04) {
      return (
        loc === 'MAP_03_ABANDONED_WAREHOUSE' &&
        (story.objectiveProgress?.[STORY_QUEST_IDS.pa04]?.['obj_12_3'] ?? 0) < 1
      )
    }
  }

  return false
}

export function resolveAfkFeatures(story: StoryState | undefined): string[] {
  const features = story?.unlockedFeatures ?? []
  return features.filter((f) => f === 'AFK_HERB_FIELD' || f === 'AFK_BAMBOO_HUNT')
}
