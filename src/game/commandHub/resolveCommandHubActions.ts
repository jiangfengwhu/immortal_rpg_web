import type { StoryChoice } from '../quest/story.types'
import { AFK_FEATURE_LABELS } from '../quest/story.constants'
import { STORY_INTERACTION_LABELS } from '../quest/qingshi.locations'
import { PLAYER_COPY } from '../ui/playerCopy'
import type { CommandHubAction } from './commandHub.types'

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
}

export function resolveCommandHubActions(input: ResolveCommandHubInput): CommandHubAction[] {
  const actions: CommandHubAction[] = []

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
    actions.push({
      id: `interaction_${key}`,
      kind: 'story_interaction',
      label: STORY_INTERACTION_LABELS[key] ?? key,
      disabled: input.busy,
      variant: key === 'fight_boar' ? 'battle' : 'explore',
      interactionKey: key,
      guide: key === 'fight_boar' ? input.battleGuide : undefined,
      onboardingTarget: key === 'fight_boar' ? 'battle-start' : undefined,
      hint: key === 'fight_boar' ? input.opponent : undefined,
    })
  }

  const hasFightInteraction = input.interactions.includes('fight_boar')
  const showBattle =
    !hasFightInteraction &&
    input.phase === 'ready' &&
    (!input.storyActive || input.storyBattleReady)

  if (showBattle) {
    actions.push({
      id: 'battle',
      kind: 'battle',
      label: PLAYER_COPY.battleStart,
      hint: input.opponent,
      variant: 'battle',
      guide: input.battleGuide,
      onboardingTarget: 'battle-start',
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
