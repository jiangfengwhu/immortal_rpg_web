export type StoryQuestStatus = 'hidden' | 'available' | 'active' | 'completed'

export type NarrativeBeat = {
  id: string
  speaker?: string
  text: string
  mood?: string
}

export type StoryChoice = {
  id: string
  label: string
  hint?: string
}

export type ActiveAdventureState = {
  adventureId: string
  title: string
  description: string
  choices: StoryChoice[]
  triggerTime: number
}

export type BountyQuestState = {
  id: string
  title: string
  description: string
  targetType: 'kill' | 'gather'
  targetId: string
  required: number
  current: number
  expReward: number
  goldReward: number
  status: 'available' | 'active' | 'completed' | 'claimed'
}

export type StoryState = {
  activeQuestId?: string
  questStatuses?: Record<string, StoryQuestStatus>
  storyFlags?: Record<string, string>
  storyItems?: string[]
  unlockedFeatures?: string[]
  pendingNarratives?: NarrativeBeat[]
  storyChronicle?: NarrativeBeat[]
  activeAdventure?: ActiveAdventureState | null
  bounties?: BountyQuestState[]
}

export type QuestEventResponse = {
  storyState: StoryState
  quest: import('./quest.types').QuestGuide
  narratives?: NarrativeBeat[]
  choices?: StoryChoice[]
  interactions?: string[]
}
