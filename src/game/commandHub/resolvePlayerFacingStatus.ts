import type { NarrativeBeat } from '../quest/story.types'
import { PLAYER_COPY } from '../ui/playerCopy'
import type { CommandHubStatus } from './commandHub.types'

type ResolvePlayerFacingInput = {
  mapPhase: string
  mapName: string
  questTitle: string
  questSummary?: string
  questNarrative?: string
  objectives: string[]
  narratives: NarrativeBeat[]
  storyBattleReady: boolean
  opponent?: string
  dangerMood: boolean
}

function sceneAlreadyMentions(scene: string, hint: string): boolean {
  const normalized = scene.replace(/\s/g, '')
  return normalized.includes(hint.replace(/\s/g, ''))
}

/** 从玩家视角提炼当下可见的状态文案，不暴露任务面板式元信息。 */
export function resolvePlayerFacingStatus(input: ResolvePlayerFacingInput): CommandHubStatus {
  const liveNarrative = input.narratives.at(-1)?.text

  let sceneText =
    liveNarrative ??
    input.questNarrative?.trim() ??
    input.questSummary?.trim() ??
    input.objectives[0] ??
    PLAYER_COPY.commandHubIdleScene

  if (input.storyBattleReady && input.opponent && !sceneText.includes(input.opponent)) {
    sceneText = `${sceneText} ${input.opponent}正在不远处虎视眈眈。`
  }

  const focusHint =
    !liveNarrative && input.objectives[0] && !sceneAlreadyMentions(sceneText, input.objectives[0])
      ? input.objectives[0]
      : undefined

  return {
    eyebrow: input.mapPhase,
    title: input.questTitle,
    location: input.mapName,
    sceneText,
    focusHint,
    dangerMood: input.dangerMood,
  }
}
