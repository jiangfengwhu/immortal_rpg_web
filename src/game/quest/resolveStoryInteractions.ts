import {
  BRIDGE_CHOICES,
  pickActiveQingshiQuestId,
  STORY_FLAG_KEYS,
  STORY_ITEM_IDS,
  STORY_QUEST_IDS,
} from './story.constants'
import type { StoryChoice, StoryState } from './story.types'

type StoryPlayer = {
  realm: string
  stageIndex?: number
}

export function resolvePendingStoryChoices(story: StoryState | undefined): StoryChoice[] {
  if (story?.storyFlags?.[STORY_FLAG_KEYS.awaitingBridgeChoice] === '1') {
    return BRIDGE_CHOICES.map((choice) => ({ ...choice }))
  }
  return []
}

export function resolveStoryInteractions(
  player: StoryPlayer,
  story: StoryState | undefined,
): string[] {
  if (player.realm !== 'mortal' || (player.stageIndex ?? 0) > 3 || !story) {
    return []
  }

  const questStatuses = story.questStatuses ?? {}
  const activeQuestId = story.activeQuestId || pickActiveQingshiQuestId(questStatuses)
  const activeStatus = questStatuses[activeQuestId]
  const out: string[] = []

  switch (activeQuestId) {
    case STORY_QUEST_IDS.wake:
      if (activeStatus === 'active') out.push('go_yard')
      break
    case STORY_QUEST_IDS.yard:
      if (activeStatus === 'active') {
        out.push('talk_grandpa', 'go_herb_field', 'go_bamboo')
      }
      break
    case STORY_QUEST_IDS.boar:
      if (activeStatus === 'available') out.push('go_bamboo_deep')
      if (activeStatus === 'active') out.push('fight_boar')
      break
    case STORY_QUEST_IDS.bridge:
      if (
        story.storyItems?.includes(STORY_ITEM_IDS.corruptedStone) &&
        story.storyFlags?.[STORY_FLAG_KEYS.awaitingBridgeChoice] !== '1' &&
        (activeStatus === 'available' || activeStatus === 'active')
      ) {
        out.push('go_stone_bridge')
      }
      break
    case STORY_QUEST_IDS.depart:
      if (activeStatus === 'active') out.push('prepare_departure')
      break
    default:
      break
  }

  return out
}

export function isStoryBattleReady(story: StoryState | undefined): boolean {
  return story?.questStatuses?.[STORY_QUEST_IDS.boar] === 'active'
}

export function resolveAfkFeatures(story: StoryState | undefined): string[] {
  const features = story?.unlockedFeatures ?? []
  return features.filter((f) => f === 'AFK_HERB_FIELD' || f === 'AFK_BAMBOO_HUNT')
}
