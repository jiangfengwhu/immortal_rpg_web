import type { NarrativeBeat } from '../quest/story.types'
import { formatActiveHarvestTip } from '../harvest/harvestCopy'
import type { InfoFeedItem } from './infoFeed.types'
import type { TimelineFeedEntry } from './infoFeed.types'

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

function isActionableObjective(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  return !/^已/.test(trimmed)
}

function collapseKey(item: InfoFeedItem): string {
  if (item.active) return `${item.id}:active`
  if (item.kind === 'dialogue') {
    return `dialogue:${item.speaker ?? ''}:${normalizeText(item.text)}`
  }
  if (item.kind === 'harvest') {
    return `harvest:${normalizeText(item.text)}`
  }
  return `${item.kind}:${item.tone ?? ''}:${normalizeText(item.text)}`
}

function canCollapseAdjacent(a: InfoFeedItem, b: InfoFeedItem): boolean {
  if (a.active || b.active) return false
  if (a.kind !== b.kind) return false
  return collapseKey(a) === collapseKey(b)
}

/** 相邻且文案完全一致的信息合并为一条，附 ×N。 */
export function collapseAdjacentFeedItems(items: InfoFeedItem[]): InfoFeedItem[] {
  const collapsed: InfoFeedItem[] = []
  for (const item of items) {
    const last = collapsed[collapsed.length - 1]
    if (last && canCollapseAdjacent(last, item)) {
      last.repeatCount = (last.repeatCount ?? 1) + 1
      continue
    }
    collapsed.push({ ...item, repeatCount: 1 })
  }
  return collapsed
}

function timelineToItem(entry: TimelineFeedEntry): InfoFeedItem {
  if (entry.kind === 'harvest') {
    const totals = entry.harvestTotals ?? {}
    return {
      id: entry.id,
      kind: 'harvest',
      text: entry.active ? formatActiveHarvestTip(totals) : entry.text,
      active: entry.active,
      harvestTotals: totals,
      stoppable: entry.active,
    }
  }
  return {
    id: entry.id,
    kind: entry.kind,
    text: entry.text,
    speaker: entry.speaker,
    mood: entry.mood,
    tone: entry.tone,
    fresh: entry.fresh,
    active: entry.active,
  }
}

type BuildInfoFeedInput = {
  timeline: TimelineFeedEntry[]
  objectives?: string[]
}

/** 按时间顺序构建信息流；剧情与玩家行为已在 timeline 中交错排列。 */
export function buildInfoFeed(input: BuildInfoFeedInput): InfoFeedItem[] {
  const sorted = [...input.timeline].sort((a, b) => a.seq - b.seq)
  const knownTexts = sorted.map((entry) => entry.text)
  const items: InfoFeedItem[] = sorted.map(timelineToItem)

  const focus = input.objectives?.find(isActionableObjective)?.trim()
  if (focus && !isTextCovered(knownTexts, focus)) {
    items.push({ id: 'focus_live', kind: 'focus', text: focus })
  }

  const activeStatuses = items.filter((item) => item.kind === 'status' && item.active)
  const rest = items.filter((item) => !(item.kind === 'status' && item.active))
  return collapseAdjacentFeedItems([...rest, ...activeStatuses])
}

export function narrativeBeatToTimelineEntry(
  beat: NarrativeBeat,
  seq: number,
  fresh = false,
): TimelineFeedEntry {
  return {
    id: `beat_${beat.id}`,
    beatId: beat.id,
    kind: beat.speaker ? 'dialogue' : 'narrative',
    text: beat.text,
    speaker: beat.speaker,
    mood: beat.mood,
    fresh,
    seq,
  }
}
