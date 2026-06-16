export type CommandHubActionKind =
  | 'story_choice'
  | 'story_interaction'
  | 'battle'
  | 'afk_claim'

export type CommandHubActionVariant = 'primary' | 'choice' | 'explore' | 'battle' | 'utility'

export type CommandHubAction = {
  id: string
  kind: CommandHubActionKind
  label: string
  hint?: string
  disabled?: boolean
  variant: CommandHubActionVariant
  guide?: boolean
  onboardingTarget?: string
  choiceId?: string
  interactionKey?: string
  afkFeature?: string
}

export type CommandHubStatus = {
  eyebrow: string
  title: string
  location?: string
  sceneText: string
  focusHint?: string
  dangerMood?: boolean
}
