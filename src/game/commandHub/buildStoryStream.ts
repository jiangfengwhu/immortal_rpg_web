import type { NarrativeBeat } from '../quest/story.types'
import { mergeChronicleEntries } from './mergeChronicleEntries'

export type StoryStreamLine = {
  id: string
  text: string
  speaker?: string
  mood?: string
  fresh?: boolean
  emphasis?: boolean
}

type BuildStoryStreamInput = {
  mapPhase?: string
  chronicle: NarrativeBeat[]
  pending: NarrativeBeat[]
  questNarrative?: string
  objectives: string[]
  storyBattleReady: boolean
  opponent?: string
}

function normalizeText(text: string): string {
  return text.replace(/\s/g, '')
}

function isTextCovered(existing: string[], candidate: string): boolean {
  const candidateNorm = normalizeText(candidate)
  if (!candidateNorm) return true
  return existing.some((line) => {
    const lineNorm = normalizeText(line)
    if (!lineNorm) return false
    return lineNorm.includes(candidateNorm) || candidateNorm.includes(lineNorm)
  })
}

function stripPhasePrefix(text: string, phase?: string): string {
  if (!phase) return text
  const prefix = `${phase} · `
  return text.startsWith(prefix) ? text.slice(prefix.length).trim() : text
}

function splitNarrativeParagraphs(narrative: string, phase?: string): string[] {
  return narrative
    .split('\n\n')
    .map((part) => stripPhasePrefix(part.trim(), phase))
    .filter(Boolean)
}

/** 将纪事、当下境遇与行动提示合并为一条连贯剧情流。 */
export function buildStoryStream(input: BuildStoryStreamInput): StoryStreamLine[] {
  const { entries, pendingIds } = mergeChronicleEntries(input.chronicle, input.pending)
  const knownTexts: string[] = []
  const lines: StoryStreamLine[] = []

  const pushLine = (line: StoryStreamLine) => {
    if (!line.text || isTextCovered(knownTexts, line.text)) return
    knownTexts.push(line.text)
    lines.push(line)
  }

  for (const beat of entries) {
    pushLine({
      id: beat.id,
      text: beat.text,
      speaker: beat.speaker,
      mood: beat.mood,
      fresh: pendingIds.has(beat.id),
    })
  }

  if (input.questNarrative) {
    for (const [index, paragraph] of splitNarrativeParagraphs(input.questNarrative, input.mapPhase).entries()) {
      pushLine({
        id: `ctx_${index}`,
        text: paragraph,
      })
    }
  }

  if (input.storyBattleReady && input.opponent) {
    const threat = `${input.opponent}正在不远处虎视眈眈。`
    if (!isTextCovered(knownTexts, threat)) {
      pushLine({ id: 'ctx_threat', text: threat, mood: 'danger' })
    }
  }

  const focus = input.objectives[0]?.trim()
  if (focus) {
    pushLine({
      id: 'focus',
      text: focus,
      emphasis: true,
    })
  }

  return lines
}
