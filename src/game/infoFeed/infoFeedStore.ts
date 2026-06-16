import { create } from 'zustand'

import { narrativeBeatToTimelineEntry } from './buildInfoFeed'
import type { TimelineFeedEntry } from './infoFeed.types'
import {
  buildHarvestResultText,
  formatActiveHarvestTip,
  type HarvestFinalizeReason,
} from '../harvest/harvestCopy'
import { findActiveHarvestEntry } from '../harvest/harvestSession'
import {
  hasHarvestTotals,
  mergeHarvestLoot,
  type HarvestLootTotals,
} from '../harvest/harvestLoot'
import type { HarvestLootItem } from '../harvest/harvest.types'
import type { NarrativeBeat } from '../quest/story.types'

const STORAGE_PREFIX = 'unboxing:info-feed:'
const HARVEST_SESSION_SUFFIX = ':harvest-session'

function storageKey(playerId: string) {
  return `${STORAGE_PREFIX}${playerId}`
}

function harvestSessionKey(playerId: string) {
  return `${STORAGE_PREFIX}${playerId}${HARVEST_SESSION_SUFFIX}`
}

function readStored(playerId: string): TimelineFeedEntry[] {
  try {
    const raw = sessionStorage.getItem(storageKey(playerId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as TimelineFeedEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readLegacyHarvestTotals(playerId: string): HarvestLootTotals {
  try {
    const raw = sessionStorage.getItem(harvestSessionKey(playerId))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as HarvestLootTotals | string[]
    if (Array.isArray(parsed)) return {}
    if (parsed && typeof parsed === 'object') return parsed
    return {}
  } catch {
    return {}
  }
}

function writeStored(playerId: string, entries: TimelineFeedEntry[]) {
  sessionStorage.setItem(storageKey(playerId), JSON.stringify(entries))
}

function clearLegacyHarvestTotals(playerId: string) {
  sessionStorage.removeItem(harvestSessionKey(playerId))
}

const TRANSIENT_ACTIVITY = /^(正在.*(采药|历练)|采集尚在进行)/

function stripTransientActivities(entries: TimelineFeedEntry[]): TimelineFeedEntry[] {
  return entries.filter(
    (entry) =>
      !(
        (entry.kind === 'status' || entry.kind === 'result') &&
        TRANSIENT_ACTIVITY.test(entry.text)
      ),
  )
}

function migrateLegacyHarvestTotals(
  entries: TimelineFeedEntry[],
  legacyTotals: HarvestLootTotals,
  nextSeqFn: () => number,
): TimelineFeedEntry[] {
  if (!hasHarvestTotals(legacyTotals)) return entries
  if (entries.some((entry) => entry.kind === 'harvest')) return entries
  return [
    ...entries,
    {
      id: `harvest_legacy_${Date.now()}`,
      kind: 'harvest',
      text: buildHarvestResultText(legacyTotals, 'stopped'),
      harvestTotals: legacyTotals,
      active: false,
      seq: nextSeqFn(),
    },
  ]
}

let seqCounter = 0

function bumpSeqCounter(entries: TimelineFeedEntry[]) {
  seqCounter = entries.reduce((max, entry) => Math.max(max, entry.seq), 0)
}

function nextSeq() {
  seqCounter += 1
  return seqCounter
}

function mergeChronicleIntoTimeline(
  entries: TimelineFeedEntry[],
  chronicle: NarrativeBeat[],
  pending: NarrativeBeat[],
): TimelineFeedEntry[] {
  const knownBeatIds = new Set(
    entries.map((entry) => entry.beatId).filter((id): id is string => Boolean(id)),
  )
  const pendingIds = new Set(pending.map((beat) => beat.id))

  const missing: NarrativeBeat[] = []
  for (const beat of [...chronicle, ...pending]) {
    if (!beat.id || knownBeatIds.has(beat.id)) continue
    knownBeatIds.add(beat.id)
    missing.push(beat)
  }

  let next = entries.map((entry) => ({
    ...entry,
    fresh: entry.beatId ? pendingIds.has(entry.beatId) : entry.fresh,
  }))

  if (missing.length === 0) return next

  const actionSeqs = next.filter((entry) => entry.kind === 'action').map((entry) => entry.seq)
  const firstActionSeq = actionSeqs.length > 0 ? Math.min(...actionSeqs) : null
  let assignSeq =
    firstActionSeq !== null ? firstActionSeq - missing.length : seqCounter + 1

  const additions = missing.map((beat) =>
    narrativeBeatToTimelineEntry(beat, assignSeq++, pendingIds.has(beat.id)),
  )
  next = [...additions, ...next].sort((a, b) => a.seq - b.seq)
  bumpSeqCounter(next)
  return next
}

type InfoFeedStore = {
  playerId: string | null
  entries: TimelineFeedEntry[]
  bindPlayer: (playerId: string) => void
  clearPlayer: () => void
  syncChronicle: (chronicle: NarrativeBeat[], pending: NarrativeBeat[]) => void
  appendStoryBeats: (beats: NarrativeBeat[], fresh?: boolean) => void
  pushAction: (text: string) => string
  pushStatus: (text: string) => string
  pushResult: (text: string, tone?: 'success' | 'warn') => void
  settleStatus: (statusId: string, resultText: string, tone?: 'success' | 'warn') => void
  ensureActiveHarvestSession: () => void
  mergeHarvestLoot: (loot: HarvestLootItem[]) => void
  finalizeHarvestSession: (reason: HarvestFinalizeReason) => void
  cancelActiveHarvestSession: () => void
}

export const useInfoFeedStore = create<InfoFeedStore>((set, get) => ({
  playerId: null,
  entries: [],

  bindPlayer: (playerId) => {
    const raw = readStored(playerId)
    const stored = stripTransientActivities(raw)
    bumpSeqCounter(stored)
    const legacyTotals = readLegacyHarvestTotals(playerId)
    const migrated = migrateLegacyHarvestTotals(stored, legacyTotals, nextSeq)
    if (hasHarvestTotals(legacyTotals)) {
      clearLegacyHarvestTotals(playerId)
    }
    set({
      playerId,
      entries: migrated,
    })
    if (migrated.length !== raw.length || hasHarvestTotals(legacyTotals)) {
      writeStored(playerId, migrated)
    }
  },

  clearPlayer: () => {
    set({ playerId: null, entries: [] })
  },

  syncChronicle: (chronicle, pending) => {
    const { playerId, entries } = get()
    if (!playerId) return
    const next = mergeChronicleIntoTimeline(entries, chronicle, pending)
    writeStored(playerId, next)
    set({ entries: next })
  },

  appendStoryBeats: (beats, fresh = true) => {
    const { playerId, entries } = get()
    if (!playerId || beats.length === 0) return
    const knownBeatIds = new Set(
      entries.map((entry) => entry.beatId).filter((id): id is string => Boolean(id)),
    )
    const additions: TimelineFeedEntry[] = []
    for (const beat of beats) {
      if (!beat.id || !beat.text.trim() || knownBeatIds.has(beat.id)) continue
      knownBeatIds.add(beat.id)
      additions.push(narrativeBeatToTimelineEntry(beat, nextSeq(), fresh))
    }
    if (additions.length === 0) return
    const next = [...entries, ...additions]
    writeStored(playerId, next)
    set({ entries: next })
  },

  pushAction: (text) => {
    const { playerId, entries } = get()
    if (!playerId || !text.trim()) return ''
    const id = `act_${Date.now()}_${seqCounter}`
    const entry: TimelineFeedEntry = {
      id,
      kind: 'action',
      text: text.trim(),
      seq: nextSeq(),
    }
    const next = [...entries, entry]
    writeStored(playerId, next)
    set({ entries: next })
    return id
  },

  pushStatus: (text) => {
    const { playerId, entries } = get()
    if (!playerId || !text.trim()) return ''
    const id = `st_${Date.now()}_${seqCounter}`
    const entry: TimelineFeedEntry = {
      id,
      kind: 'status',
      text: text.trim(),
      active: true,
      seq: nextSeq(),
    }
    const next = [...entries, entry]
    writeStored(playerId, next)
    set({ entries: next })
    return id
  },

  pushResult: (text, tone = 'success') => {
    const { playerId, entries } = get()
    if (!playerId || !text.trim()) return
    const entry: TimelineFeedEntry = {
      id: `res_${Date.now()}_${seqCounter}`,
      kind: 'result',
      text: text.trim(),
      tone,
      seq: nextSeq(),
    }
    const next = [...entries, entry]
    writeStored(playerId, next)
    set({ entries: next })
  },

  settleStatus: (statusId, resultText, tone = 'success') => {
    const { playerId, entries } = get()
    if (!playerId) return
    const next: TimelineFeedEntry[] = []
    for (const entry of entries) {
      if (entry.id === statusId) {
        next.push({ ...entry, active: false })
        continue
      }
      next.push(entry)
    }
    if (resultText.trim()) {
      next.push({
        id: `res_${Date.now()}_${seqCounter}`,
        kind: 'result',
        text: resultText.trim(),
        tone,
        seq: nextSeq(),
      })
    }
    writeStored(playerId, next)
    set({ entries: next })
  },

  ensureActiveHarvestSession: () => {
    const { playerId, entries } = get()
    if (!playerId || findActiveHarvestEntry(entries)) return

    const entry: TimelineFeedEntry = {
      id: `harvest_${Date.now()}_${seqCounter}`,
      kind: 'harvest',
      text: formatActiveHarvestTip({}),
      harvestTotals: {},
      active: true,
      seq: nextSeq(),
    }
    const next = [...entries, entry]
    writeStored(playerId, next)
    set({ entries: next })
  },

  cancelActiveHarvestSession: () => {
    const { playerId, entries } = get()
    if (!playerId) return
    const active = findActiveHarvestEntry(entries)
    if (!active) return
    const next = entries.filter((entry) => entry.id !== active.id)
    writeStored(playerId, next)
    set({ entries: next })
  },

  mergeHarvestLoot: (loot) => {
    const { playerId, entries } = get()
    if (!playerId || loot.length === 0) return
    const active = findActiveHarvestEntry(entries)
    if (!active) return

    const totals = mergeHarvestLoot(active.harvestTotals ?? {}, loot)
    const next = entries.map((entry) =>
      entry.id === active.id
        ? {
            ...entry,
            harvestTotals: totals,
            text: formatActiveHarvestTip(totals),
          }
        : entry,
    )
    writeStored(playerId, next)
    set({ entries: next })
  },

  finalizeHarvestSession: (reason) => {
    const { playerId, entries } = get()
    if (!playerId) return
    const active = findActiveHarvestEntry(entries)
    if (!active) return

    const totals = active.harvestTotals ?? {}
    const next = entries.map((entry) =>
      entry.id === active.id
        ? {
            ...entry,
            active: false,
            harvestTotals: totals,
            text: buildHarvestResultText(totals, reason),
          }
        : entry,
    )
    writeStored(playerId, next)
    set({ entries: next })
  },
}))
