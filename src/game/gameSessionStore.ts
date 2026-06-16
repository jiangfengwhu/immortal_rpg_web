import { create } from 'zustand'

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

function opponentNameFromResult(result: BattleResult) {
  return result.bossName?.trim() || null
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
  toggleSettings: () => void
  toggleMapTravel: () => void
  toggleJourneyModal: () => void
  advanceJourney: () => Promise<boolean>
  beginOnboardingIfNeeded: () => void
  nextOnboardingStep: () => void
  finishOnboarding: () => void
  syncInventoryItems: (items: Equipment[]) => void
  applyStoryEvent: (result: import('./quest/story.types').QuestEventResponse) => Promise<void>
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
      set({ status: 'ready', playerState, errorMessage: '' })
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
    set({ playerState })
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
        lastOpponentName: opponentNameFromResult(result) ?? get().lastOpponentName,
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
      settingsOpen: false,
      mapTravelOpen: false,
      journeyModalOpen: false,
      onboardingStep: null,
    })
  },
}))
