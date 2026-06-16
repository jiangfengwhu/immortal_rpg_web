import type { QuestEventResponse } from '../game/quest/story.types'

type QuestEventPayload = {
  playerId: string
  type: string
  location?: string
  npcId?: string
  choiceId?: string
  entityId?: string
}

export async function postQuestEvent(payload: QuestEventPayload): Promise<QuestEventResponse> {
  const response = await fetch('/api/quest/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = (await response.json()) as QuestEventResponse & { error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? `剧情事件失败 (${response.status})`)
  }
  return data
}
