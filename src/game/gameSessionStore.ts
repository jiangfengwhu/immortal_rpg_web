import { create } from 'zustand'

import { startAfkSession, stopAfkSession, tickAfkSession, type AfkTickOutcome } from '../api/afk'
import { equipItem, identifyItem } from '../api/equipment'
import {
  advanceQuest,
  allocateStats,
  autoAllocateStats,
  createPlayer,
  fetchPlayer,
  startBattle,
  type BattleResult,
  type PlayerFullState,
} from '../api/player'
import type { PlayerClass, PrimaryAttributes } from './character/character.types'
import type { Equipment } from './equipment/equipment.types'
import { createPlayerId, SESSION_STORAGE_KEY } from './session.const'
import { clearAllLocalGameProgress } from './session.storage'
import { isPlayerNotFoundError } from '../api/player.errors'
import { isOnboardingDone, markOnboardingDone } from './onboarding/onboarding.storage'
import { toPlayerErrorMessage } from './ui/playerError'
import { PLAYER_COPY } from './ui/playerCopy'
import { useBattleStore } from '../battle/battleStore'
import { buildLootFloat, type LootFloatPayload } from './loot/lootFloat'
import type { HarvestFloatPayload } from './harvest/harvest.types'
import { startHarvestLoop, stopHarvestLoop } from './harvest/harvestLoop'
import { STORY_FEATURE_KEYS } from './quest/story.constants'
import { useInfoFeedStore } from './infoFeed/infoFeedStore'
import type { AfkTickResponse } from '../api/afk'

function opponentNameFromState(state: PlayerFullState | null, fallback: string | null) {
  return state?.opponentName?.trim() || fallback
}

export type SessionStatus = 'idle' | 'loading' | 'needs_create' | 'ready' | 'error'

type GameSessionStore = {
  status: SessionStatus
  playerState: PlayerFullState | null
  lastBattleResult: BattleResult | null
  lastOpponentName: string | null
  errorMessage: string
  isSaving: boolean
  inventoryOpen: boolean
  inventoryUnread: boolean
  lootFloat: LootFloatPayload | null
  harvestFloat: HarvestFloatPayload | null
  afkTickInFlight: boolean
  settingsOpen: boolean
  mapTravelOpen: boolean
  journeyModalOpen: boolean
  onboardingStep: number | null
  initSession: () => Promise<void>
  refreshPlayer: () => Promise<void>
  createCharacter: (name: string, playerClass: PlayerClass) => Promise<void>
  allocatePoint: (attr: keyof PrimaryAttributes) => Promise<void>
  autoAllocate: () => Promise<void>
  claimBattleReward: () => Promise<BattleResult | null>
  toggleInventory: () => void
  clearLootFloat: () => void
  clearHarvestFloat: () => void
  toggleSettings: () => void
  toggleMapTravel: () => void
  toggleJourneyModal: () => void
  advanceJourney: () => Promise<boolean>
  beginOnboardingIfNeeded: () => void
  nextOnboardingStep: () => void
  finishOnboarding: () => void
  syncInventoryItems: (items: Equipment[]) => void
  applyStoryEvent: (result: import('./quest/story.types').QuestEventResponse) => Promise<void>
  startAfkGather: (feature: string) => Promise<AfkTickOutcome>
  stopAfkGather: (feature: string) => Promise<AfkTickOutcome>
  tickAfkGather: (feature: string) => Promise<AfkTickOutcome>
  resumeAfkGatherLoop: (feature: string) => void
  equipItemById: (itemId: string) => Promise<void>
  identifyItemById: (itemId: string) => Promise<void>
  clearSession: () => void
}

function readStoredPlayerId() {
  return localStorage.getItem(SESSION_STORAGE_KEY)
}

function persistPlayerId(playerId: string) {
  localStorage.setItem(SESSION_STORAGE_KEY, playerId)
}

function applyAfkTickResponse(
  feature: string,
  response: AfkTickResponse,
  get: () => GameSessionStore,
  set: (partial: Partial<GameSessionStore>) => void,
) {
  const claim = response.claim
  const loot = claim?.loot
  const harvestFloat =
    feature === STORY_FEATURE_KEYS.afkHerb && loot && loot.length > 0
      ? { feature, items: loot.map((item) => ({ name: item.name, count: item.count })) }
      : null

  if (response.player) {
    set({
      playerState: response.player,
      lastOpponentName: opponentNameFromState(response.player, get().lastOpponentName),
      inventoryUnread: Boolean(loot?.length) || get().inventoryUnread,
      harvestFloat: harvestFloat ?? get().harvestFloat,
    })
  } else if (harvestFloat) {
    set({ harvestFloat, inventoryUnread: true })
  }

  return {
    narrative: claim?.narrative ?? '',
    loot,
  }
}

export const useGameSessionStore = create<GameSessionStore>((set, get) => ({
  status: 'idle',
  playerState: null,
  lastBattleResult: null,
  lastOpponentName: null,
  errorMessage: '',
  isSaving: false,
  inventoryOpen: false,
  inventoryUnread: false,
  lootFloat: null,
  harvestFloat: null,
  afkTickInFlight: false,
  settingsOpen: false,
  mapTravelOpen: false,
  journeyModalOpen: false,
  onboardingStep: null,

  initSession: async () => {
    set({ status: 'loading', errorMessage: '' })
    const storedId = readStoredPlayerId()
    if (!storedId) {
      set({ status: 'needs_create' })
      return
    }
    try {
      const playerState = await fetchPlayer(storedId)
      set({
        status: 'ready',
        playerState,
        errorMessage: '',
        lastOpponentName: opponentNameFromState(playerState, null),
      })
      get().beginOnboardingIfNeeded()
    } catch (error) {
      if (isPlayerNotFoundError(error)) {
        clearAllLocalGameProgress()
        set({ status: 'needs_create', errorMessage: '' })
        return
      }
      set({
        status: 'error',
        errorMessage: toPlayerErrorMessage(error, PLAYER_COPY.connectionFailed),
      })
    }
  },

  refreshPlayer: async () => {
    const playerId = get().playerState?.player.id ?? readStoredPlayerId()
    if (!playerId) return
    const playerState = await fetchPlayer(playerId)
    set({
      playerState,
      lastOpponentName: opponentNameFromState(playerState, get().lastOpponentName),
    })
  },

  createCharacter: async (name, playerClass) => {
    set({ status: 'loading', errorMessage: '' })
    const playerId = createPlayerId()
    try {
      const playerState = await createPlayer(playerId, name, playerClass)
      persistPlayerId(playerId)
      set({
        status: 'ready',
        playerState,
        lastBattleResult: null,
        lastOpponentName: null,
        inventoryOpen: false,
        inventoryUnread: false,
        lootFloat: null,
        settingsOpen: false,
        mapTravelOpen: false,
        journeyModalOpen: false,
        onboardingStep: 0,
      })
    } catch (error) {
      set({
        status: 'needs_create',
        errorMessage: error instanceof Error ? error.message : '创角失败',
      })
    }
  },

  allocatePoint: async (attr) => {
    const { playerState, isSaving } = get()
    if (!playerState || isSaving || playerState.player.potentialPoints < 1) return

    set({ isSaving: true, errorMessage: '' })
    try {
      const nextState = await allocateStats({
        playerId: playerState.player.id,
        constitution: 0,
        strength: 0,
        magic: 0,
        charm: 0,
        agility: 0,
        [attr]: 1,
      })
      set({ playerState: nextState })
    } catch (error) {
      set({ errorMessage: error instanceof Error ? error.message : '加点失败' })
    } finally {
      set({ isSaving: false })
    }
  },

  autoAllocate: async () => {
    const { playerState, isSaving } = get()
    if (!playerState || isSaving || playerState.player.potentialPoints < 1) return

    set({ isSaving: true, errorMessage: '' })
    try {
      const nextState = await autoAllocateStats(playerState.player.id)
      set({ playerState: nextState })
    } catch (error) {
      set({ errorMessage: error instanceof Error ? error.message : '加点失败' })
    } finally {
      set({ isSaving: false })
    }
  },

  claimBattleReward: async () => {
    const { playerState } = get()
    if (!playerState) return null

    set({ isSaving: true, errorMessage: '' })
    try {
      const result = await startBattle(playerState.player.id)
      const nextState = await fetchPlayer(playerState.player.id)
      const lootFloat = result.dropId ? buildLootFloat(result, nextState.inventory) : null
      set({
        playerState: nextState,
        lastBattleResult: result,
        lastOpponentName: result.bossName?.trim() || opponentNameFromState(nextState, get().lastOpponentName),
        ...(lootFloat ? { inventoryUnread: true, lootFloat } : {}),
      })
      return result
    } catch (error) {
      set({ errorMessage: toPlayerErrorMessage(error, '战利未能清点，请稍后再试') })
      return null
    } finally {
      set({ isSaving: false })
    }
  },

  toggleInventory: () =>
    set((state) => ({
      inventoryOpen: !state.inventoryOpen,
      inventoryUnread: state.inventoryOpen ? state.inventoryUnread : false,
    })),

  clearLootFloat: () => set({ lootFloat: null }),

  clearHarvestFloat: () => set({ harvestFloat: null }),

  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),

  toggleMapTravel: () => set((state) => ({ mapTravelOpen: !state.mapTravelOpen })),

  toggleJourneyModal: () => set((state) => ({ journeyModalOpen: !state.journeyModalOpen })),

  advanceJourney: async () => {
    const { playerState, isSaving } = get()
    if (!playerState || isSaving || !playerState.player.stageCleared) return false

    set({ isSaving: true, errorMessage: '' })
    try {
      const result = await advanceQuest(playerState.player.id)
      const nextState = await fetchPlayer(playerState.player.id)
      set({
        playerState: nextState,
        mapTravelOpen: false,
        lastBattleResult: null,
      })
      if (get().onboardingStep === 3) {
        get().finishOnboarding()
      }
      if (result.maxStage) {
        set({ errorMessage: '' })
      }
      return true
    } catch (error) {
      set({ errorMessage: toPlayerErrorMessage(error, '启程失败，请稍后再试') })
      return false
    } finally {
      set({ isSaving: false })
    }
  },

  beginOnboardingIfNeeded: () => {
    const { playerState, onboardingStep } = get()
    if (!playerState || onboardingStep !== null) return
    const { id, stageIndex, battlesWon } = playerState.player
    if (isOnboardingDone(id)) return
    if (stageIndex === 0 && battlesWon === 0) {
      set({ onboardingStep: 0 })
    }
  },

  nextOnboardingStep: () => {
    set((state) => {
      if (state.onboardingStep === null) return state
      const next = state.onboardingStep + 1
      if (next >= 4) {
        const playerId = state.playerState?.player.id
        if (playerId) markOnboardingDone(playerId)
        return { onboardingStep: null }
      }
      return { onboardingStep: next }
    })
  },

  finishOnboarding: () => {
    const playerId = get().playerState?.player.id
    if (playerId) markOnboardingDone(playerId)
    set({ onboardingStep: null, mapTravelOpen: false })
  },

  syncInventoryItems: (items) => {
    const { playerState } = get()
    if (!playerState) return
    set({ playerState: { ...playerState, inventory: items } })
  },

  applyStoryEvent: async (result) => {
    const playerId = get().playerState?.player.id
    if (!playerId) return
    const nextState = await fetchPlayer(playerId)
    set({
      playerState: {
        ...nextState,
        quest: result.quest,
        storyState: result.storyState,
      },
      lastOpponentName: opponentNameFromState(nextState, get().lastOpponentName),
    })
  },

  clearHarvestFloat: () => set({ harvestFloat: null }),

  tickAfkGather: async (feature) => {
    const { playerState, afkTickInFlight } = get()
    if (!playerState || afkTickInFlight) {
      return { ok: false, message: '请稍后再试' }
    }

    set({ afkTickInFlight: true })
    try {
      const response = await tickAfkSession({ playerId: playerState.player.id, feature })
      if (response.skipped) {
        return { ok: true, skipped: true }
      }
      const { narrative, loot } = applyAfkTickResponse(feature, response, get, set)
      return { ok: true, narrative, loot }
    } catch (error) {
      return {
        ok: false,
        message: toPlayerErrorMessage(error, '采集失败，请稍后再试'),
      }
    } finally {
      set({ afkTickInFlight: false })
    }
  },

  startAfkGather: async (feature) => {
    const { playerState } = get()
    if (!playerState) {
      return { ok: false, message: '请稍后再试' }
    }

    try {
      const response = await startAfkSession({ playerId: playerState.player.id, feature })
      const { narrative, loot } = applyAfkTickResponse(feature, response, get, set)
      const infoFeed = useInfoFeedStore.getState()
      infoFeed.ensureActiveHarvestSession()
      if (loot?.length) infoFeed.mergeHarvestLoot(loot)
      get().resumeAfkGatherLoop(feature)
      return { ok: true, narrative, loot }
    } catch (error) {
      return {
        ok: false,
        message: toPlayerErrorMessage(error, '无法开始采药'),
      }
    }
  },

  stopAfkGather: async (feature) => {
    const { playerState } = get()
    stopHarvestLoop()
    if (!playerState) {
      return { ok: true, narrative: '已停下采药。' }
    }

    try {
      const response = await stopAfkSession({ playerId: playerState.player.id, feature })
      if (response.player) {
        set({
          playerState: response.player,
          lastOpponentName: opponentNameFromState(response.player, get().lastOpponentName),
        })
      }
      return { ok: true, narrative: '已停下采药。' }
    } catch (error) {
      return {
        ok: false,
        message: toPlayerErrorMessage(error, '停止采药失败'),
      }
    }
  },

  resumeAfkGatherLoop: (feature) => {
    stopHarvestLoop()
    startHarvestLoop(() => {
      void get().tickAfkGather(feature).then((outcome) => {
        if (!outcome.ok || outcome.skipped || !outcome.loot?.length) return
        useInfoFeedStore.getState().mergeHarvestLoot(outcome.loot)
      })
    })
  },

  equipItemById: async (itemId) => {
    const { playerState, isSaving } = get()
    if (!playerState || isSaving) return

    set({ isSaving: true, errorMessage: '' })
    try {
      const nextState = await equipItem(playerState.player.id, itemId)
      set({ playerState: nextState })
    } catch (error) {
      set({ errorMessage: error instanceof Error ? error.message : '穿戴失败' })
    } finally {
      set({ isSaving: false })
    }
  },

  identifyItemById: async (itemId) => {
    const { playerState, isSaving } = get()
    if (!playerState || isSaving) return

    set({ isSaving: true, errorMessage: '' })
    try {
      const nextState = await identifyItem(itemId, playerState.player.id)
      set({ playerState: nextState })
    } catch (error) {
      set({ errorMessage: error instanceof Error ? error.message : '鉴定失败' })
    } finally {
      set({ isSaving: false })
    }
  },

  clearSession: () => {
    stopHarvestLoop()
    clearAllLocalGameProgress()
    useBattleStore.getState().resetBattleArena()
    set({
      status: 'needs_create',
      playerState: null,
      lastBattleResult: null,
      lastOpponentName: null,
      errorMessage: '',
      inventoryOpen: false,
      inventoryUnread: false,
      lootFloat: null,
      harvestFloat: null,
      afkTickInFlight: false,
      settingsOpen: false,
      mapTravelOpen: false,
      journeyModalOpen: false,
      onboardingStep: null,
    })
  },
}))
