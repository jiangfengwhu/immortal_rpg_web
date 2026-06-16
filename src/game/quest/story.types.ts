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

export type StoryState = {
  activeQuestId?: string
  questStatuses?: Record<string, StoryQuestStatus>
  storyFlags?: Record<string, string>
  storyItems?: string[]
  unlockedFeatures?: string[]
  pendingNarratives?: NarrativeBeat[]
  storyChronicle?: NarrativeBeat[]
}

export type QuestEventResponse = {
  storyState: StoryState
  quest: import('./quest.types').QuestGuide
  narratives?: NarrativeBeat[]
  choices?: StoryChoice[]
  interactions?: string[]
}
