import type { StoryChoice, ActiveAdventureState } from '../quest/story.types'
import { AFK_FEATURE_LABELS } from '../quest/story.constants'
import { STORY_INTERACTION_LABELS } from '../quest/qingshi.locations'
import { PLAYER_COPY } from '../ui/playerCopy'
import type { CommandHubAction } from './commandHub.types'

/** 按钮文案已含对手名时，不再重复显示 hint */
function opponentHint(label: string, opponent: string): string | undefined {
  const foe = opponent.trim()
  if (!foe || label.includes(foe)) return undefined
  return foe
}

type ResolveCommandHubInput = {
  questTitle: string
  objectives: string[]
  opponent: string
  choices: StoryChoice[]
  interactions: string[]
  afkFeatures: string[]
  activeAfkFeature?: string | null
  busy: boolean
  storyActive: boolean
  storyBattleReady: boolean
  phase: string
  canStartBattle: boolean
  battleGuide: boolean
  activeAdventure?: ActiveAdventureState | null
}

export function resolveCommandHubActions(input: ResolveCommandHubInput): CommandHubAction[] {
  const actions: CommandHubAction[] = []

  if (input.activeAdventure) {
    for (const choice of input.activeAdventure.choices) {
      actions.push({
        id: `adv_choice_${choice.id}`,
        kind: 'adventure_choice',
        label: choice.label,
        hint: choice.hint,
        disabled: input.busy,
        variant: 'choice',
        choiceId: choice.id,
      })
    }
    return actions
  }

  for (const choice of input.choices) {
    actions.push({
      id: `choice_${choice.id}`,
      kind: 'story_choice',
      label: choice.label,
      hint: choice.hint,
      disabled: input.busy,
      variant: 'choice',
      choiceId: choice.id,
    })
  }
  if (actions.length > 0) return actions

  for (const key of input.interactions) {
    const isFight = key.startsWith('fight_')
    actions.push({
      id: `interaction_${key}`,
      kind: 'story_interaction',
      label: STORY_INTERACTION_LABELS[key] ?? key,
      disabled: input.busy,
      variant: isFight ? 'battle' : 'explore',
      interactionKey: key,
      guide: isFight ? input.battleGuide : undefined,
      onboardingTarget: isFight ? 'battle-start' : undefined,
      hint: isFight
        ? opponentHint(STORY_INTERACTION_LABELS[key] ?? key, input.opponent)
        : undefined,
    })
  }

  const hasFightInteraction = input.interactions.some((k) => k.startsWith('fight_'))
  const showBattle =
    !hasFightInteraction &&
    input.phase === 'ready' &&
    (!input.storyActive || input.storyBattleReady)

  if (showBattle) {
    actions.push({
      id: 'battle',
      kind: 'battle',
      label: PLAYER_COPY.battleStart,
      hint: opponentHint(PLAYER_COPY.battleStart, input.opponent),
      variant: 'battle',
      guide: input.battleGuide,
      onboardingTarget: 'battle-start',
    })
  }

  if (input.phase === 'ready' && !input.activeAfkFeature && !hasFightInteraction) {
    actions.push({
      id: 'wild_battle',
      kind: 'wild_battle',
      label: '寻敌除妖',
      hint: '野外历练',
      variant: 'explore',
    })
  }

  for (const feature of input.afkFeatures) {
    if (feature === input.activeAfkFeature) continue
    const label = AFK_FEATURE_LABELS[feature]
    if (!label) continue
    actions.push({
      id: `afk_${feature}`,
      kind: 'afk_claim',
      label,
      disabled: input.busy || input.phase !== 'ready',
      variant: 'utility',
      afkFeature: feature,
    })
  }

  return actions
}
