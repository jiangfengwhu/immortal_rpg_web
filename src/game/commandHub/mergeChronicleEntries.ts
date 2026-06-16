import type { NarrativeBeat } from '../quest/story.types'

/** 合并剧情纪事，按时间顺序去重。pending 条目标记为未读。 */
export function mergeChronicleEntries(
  chronicle: NarrativeBeat[],
  pending: NarrativeBeat[],
): { entries: NarrativeBeat[]; pendingIds: Set<string> } {
  const pendingIds = new Set(pending.map((beat) => beat.id))
  const seen = new Set<string>()
  const entries: NarrativeBeat[] = []

  for (const beat of chronicle) {
    if (!beat.id || seen.has(beat.id) || pendingIds.has(beat.id)) continue
    seen.add(beat.id)
    entries.push(beat)
  }

  for (const beat of pending) {
    if (!beat.id || seen.has(beat.id)) continue
    seen.add(beat.id)
    entries.push(beat)
  }

  return { entries, pendingIds }
}
