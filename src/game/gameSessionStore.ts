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
import {
  startWildBattle,
  resolveAdventure,
  refreshBounties,
  acceptBounty,
  claimBounty,
  hatchPet,
  mutatePet,
  activatePet,
} from '../api/wild'
import type { PlayerClass, PrimaryAttributes } from './character/character.types'
import type { Equipment } from './equipment/equipment.types'
import { createPlayerId, SESSION_STORAGE_KEY } from './session.const'
import { clearAllLocalGameProgress } from './session.storage'
import { isPlayerNotFoundError } from '../api/player.errors'
import { isOnboardingDone, markOnboardingDone } from './onboarding/onboarding.storage'
import { toPlayerErrorMessage } from './ui/playerError'
import { PLAYER_COPY } from './ui/playerCopy'
import { useBattleStore } from '../battle/battleStore'
import { startHarvestLoop, stopHarvestLoop } from './harvest/harvestLoop'
import { useInfoFeedStore } from './infoFeed/infoFeedStore'
import type { AfkTickResponse } from '../api/afk'
import { REALM_LABELS } from './character/character.constants'

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
  adrenalineEvent: {
    type: 'loot' | 'pet' | 'skill' | 'mutate'
    title: string
    subtitle: string
    name: string
    rarity?: string
    skills?: string[]
    narrative?: string
  } | null
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
  runWildBattle: () => Promise<void>
  resolveActiveAdventure: (choiceId: string) => Promise<void>
  refreshPlayerBounties: () => Promise<void>
  acceptPlayerBounty: (bountyId: string) => Promise<void>
  claimPlayerBounty: (bountyId: string) => Promise<void>
  hatchPlayerPet: () => Promise<any>
  mutatePlayerPet: (petId: string) => Promise<any>
  activatePlayerPet: (petId: string) => Promise<void>
  setAdrenalineEvent: (event: GameSessionStore['adrenalineEvent']) => void
  clearAdrenalineEvent: () => void
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
  const oldLevel = get().playerState?.player.level
  const claim = response.claim
  const loot = claim?.loot

  if (response.player) {
    const nextLevel = response.player.player.level
    if (oldLevel && nextLevel > oldLevel) {
      const realm = response.player.player.realm
      const realmLabel = realm ? (REALM_LABELS[realm] ?? realm) : ''
      const text = `境界精进！你已突破至 Lv. ${nextLevel} · ${realmLabel}！`
      useInfoFeedStore.getState().pushResult(text, 'success')
    }
    set({
      playerState: response.player,
      lastOpponentName: opponentNameFromState(response.player, get().lastOpponentName),
    })
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
  adrenalineEvent: null,
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

      if (result.leveledUp) {
        const realm = nextState.player.realm
        const realmLabel = realm ? (REALM_LABELS[realm] ?? realm) : ''
        const text = `境界精进！你已突破至 Lv. ${nextState.player.level} · ${realmLabel}！`
        useInfoFeedStore.getState().pushResult(text, 'success')
      }

      if (result.newSpell) {
        set({
          adrenalineEvent: {
            type: 'skill',
            title: '【 顿 悟 绝 学 ！】',
            subtitle: '虚空震动，福至心灵！',
            name: result.newSpell,
            rarity: 'legendary',
            narrative: `你与「${result.bossName}」激战，交锋之中偶然窥得天机，顿悟了盖世绝学：《${result.newSpell}》！`,
          }
        })
      } else if (result.dropId && ['epic', 'legendary', 'mythic'].includes(result.dropRarity || '')) {
        set({
          adrenalineEvent: {
            type: 'loot',
            title: `【 极 品 装备 掉 落 ！】`,
            subtitle: result.dropRarity === 'mythic' ? '天地变色，神兵出世！' : result.dropRarity === 'legendary' ? '金光万丈，仙器降临！' : '紫气东来，宝光内敛！',
            name: result.dropName || '稀有神兵',
            rarity: result.dropRarity,
            narrative: `击败「${result.bossName}」后，竟从其身上震落了极品装备：【${result.dropName}】！`,
          }
        })
      }

      set({
        playerState: nextState,
        lastBattleResult: result,
        lastOpponentName: result.bossName?.trim() || opponentNameFromState(nextState, get().lastOpponentName),
      })
      useInfoFeedStore.getState().syncChronicle(
        nextState.storyState?.storyChronicle ?? [],
        nextState.storyState?.pendingNarratives ?? [],
      )
      return result
    } catch (error) {
      set({ errorMessage: toPlayerErrorMessage(error, '战利未能清点，请稍后再试') })
      return null
    } finally {
      set({ isSaving: false })
    }
  },

  setAdrenalineEvent: (event) => set({ adrenalineEvent: event }),

  clearAdrenalineEvent: () => set({ adrenalineEvent: null }),

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

      if (result.leveledUp || nextState.player.level > playerState.player.level) {
        const realm = nextState.player.realm
        const realmLabel = realm ? (REALM_LABELS[realm] ?? realm) : ''
        const text = `境界精进！你已突破至 Lv. ${nextState.player.level} · ${realmLabel}！`
        useInfoFeedStore.getState().pushResult(text, 'success')
      }

      if (result.newSpell) {
        set({
          adrenalineEvent: {
            type: 'skill',
            title: '【 顿 悟 绝 学 ！】',
            subtitle: '虚空震动，福至心灵！',
            name: result.newSpell,
            rarity: 'legendary',
            narrative: `你在晋升启程之时，突然心有所感，当场顿悟了盖世绝学：《${result.newSpell}》！`,
          }
        })
      }

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
    // 引导已删除，不启用 Onboarding
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
    const oldLevel = get().playerState?.player.level
    const nextState = await fetchPlayer(playerId)
    const nextLevel = nextState.player.level
    if (oldLevel && nextLevel > oldLevel) {
      const realm = nextState.player.realm
      const realmLabel = realm ? (REALM_LABELS[realm] ?? realm) : ''
      const text = `境界精进！你已突破至 Lv. ${nextLevel} · ${realmLabel}！`
      useInfoFeedStore.getState().pushResult(text, 'success')
    }
    set({
      playerState: {
        ...nextState,
        quest: result.quest,
        storyState: result.storyState,
      },
      lastOpponentName: opponentNameFromState(nextState, get().lastOpponentName),
    })
  },

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
        message: toPlayerErrorMessage(error, '无法开始采集'),
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

  runWildBattle: async () => {
    const { playerState, isSaving } = get()
    if (!playerState || isSaving) return

    set({ isSaving: true, errorMessage: '' })
    try {
      const response = await startWildBattle(playerState.player.id)
      const result = response.result
      const nextState = response.player

      if (result.leveledUp) {
        const realm = nextState.player.realm
        const realmLabel = realm ? (REALM_LABELS[realm] ?? realm) : ''
        const text = `境界精进！你已突破至 Lv. ${nextState.player.level} · ${realmLabel}！`
        useInfoFeedStore.getState().pushResult(text, 'success')
      }

      if (result.newSpell) {
        set({
          adrenalineEvent: {
            type: 'skill',
            title: '【 顿 悟 绝 学 ！】',
            subtitle: '虚空震动，福至心灵！',
            name: result.newSpell,
            rarity: 'legendary',
            narrative: `你在野外与「${result.bossName}」交战切磋，突然灵光一闪，顿悟了盖世绝学：《${result.newSpell}》！`,
          }
        })
      } else if (result.dropId && ['epic', 'legendary', 'mythic'].includes(result.dropRarity || '')) {
        set({
          adrenalineEvent: {
            type: 'loot',
            title: `【 极 品 装备 掉 落 ！】`,
            subtitle: result.dropRarity === 'mythic' ? '天地变色，神兵出世！' : result.dropRarity === 'legendary' ? '金光万丈，仙器降临！' : '紫气东来，宝光内敛！',
            name: result.dropName || '稀有神兵',
            rarity: result.dropRarity,
            narrative: `在林野中击败「${result.bossName}」后，竟从其巢穴寻得了极品装备：【${result.dropName}】！`,
          }
        })
      }

      set({
        playerState: nextState,
        lastBattleResult: result,
        lastOpponentName: result.bossName?.trim(),
      })

      useInfoFeedStore.getState().syncChronicle(
        nextState.storyState?.storyChronicle ?? [],
        nextState.storyState?.pendingNarratives ?? [],
      )

      const battleStore = useBattleStore.getState()
      battleStore.resetBattleArena()
      battleStore.startBattle()
      // Mark as reward settled so client won't try to sync battle start rewards again
      useBattleStore.setState({ rewardSettled: true })
    } catch (error) {
      set({ errorMessage: toPlayerErrorMessage(error, '寻找野外对手失败') })
    } finally {
      set({ isSaving: false })
    }
  },

  resolveActiveAdventure: async (choiceId) => {
    const { playerState, isSaving } = get()
    if (!playerState || isSaving) return

    set({ isSaving: true, errorMessage: '' })
    try {
      const nextState = await resolveAdventure(playerState.player.id, choiceId)
      set({ playerState: nextState })
      useInfoFeedStore.getState().syncChronicle(
        nextState.storyState?.storyChronicle ?? [],
        nextState.storyState?.pendingNarratives ?? [],
      )
    } catch (error) {
      set({ errorMessage: toPlayerErrorMessage(error, '决策奇遇失败') })
    } finally {
      set({ isSaving: false })
    }
  },

  refreshPlayerBounties: async () => {
    const { playerState, isSaving } = get()
    if (!playerState || isSaving) return

    set({ isSaving: true, errorMessage: '' })
    try {
      const nextState = await refreshBounties(playerState.player.id)
      set({ playerState: nextState })
    } catch (error) {
      set({ errorMessage: toPlayerErrorMessage(error, '刷新悬赏失败') })
    } finally {
      set({ isSaving: false })
    }
  },

  acceptPlayerBounty: async (bountyId) => {
    const { playerState, isSaving } = get()
    if (!playerState || isSaving) return

    set({ isSaving: true, errorMessage: '' })
    try {
      const nextState = await acceptBounty(playerState.player.id, bountyId)
      set({ playerState: nextState })
    } catch (error) {
      set({ errorMessage: toPlayerErrorMessage(error, '接取悬赏失败') })
    } finally {
      set({ isSaving: false })
    }
  },

  claimPlayerBounty: async (bountyId) => {
    const { playerState, isSaving } = get()
    if (!playerState || isSaving) return

    set({ isSaving: true, errorMessage: '' })
    try {
      const nextState = await claimBounty(playerState.player.id, bountyId)
      set({ playerState: nextState })
      useInfoFeedStore.getState().syncChronicle(
        nextState.storyState?.storyChronicle ?? [],
        nextState.storyState?.pendingNarratives ?? [],
      )
    } catch (error) {
      set({ errorMessage: toPlayerErrorMessage(error, '交付悬赏失败') })
    } finally {
      set({ isSaving: false })
    }
  },

  hatchPlayerPet: async () => {
    const { playerState, isSaving } = get()
    if (!playerState || isSaving) return null

    set({ isSaving: true, errorMessage: '' })
    try {
      const data = await hatchPet(playerState.player.id)
      const rarityLabels: Record<string, string> = {
        divine: '绝世神宠',
        mutated: '变异灵宠',
        rare: '极珍灵宠',
        strange: '极奇灵宠',
      }
      const subtitleLabels: Record<string, string> = {
        divine: '天降祥瑞，七彩神光！',
        mutated: '雷劫洗礼，造化变异！',
        rare: '山泽灵秀，珍禽异兽！',
        strange: '行迹诡秘，奇趣横生！',
      }
      set({
        playerState: data.fullState,
        adrenalineEvent: {
          type: 'pet',
          title: `【 ${rarityLabels[data.newPet.rarity] || '奇妙灵宠'} 降 世 ！】`,
          subtitle: subtitleLabels[data.newPet.rarity] || '天生异象，造化灵动！',
          name: data.newPet.name,
          rarity: data.newPet.rarity,
          skills: data.newPet.skills,
          narrative: `🎉 恭喜！你孵化出了一只${rarityLabels[data.newPet.rarity] || '奇妙灵宠'}「${data.newPet.name}」，其福缘深厚，当场顿悟技能：《${data.newPet.skills.join('》、《')}》！`
        }
      })
      useInfoFeedStore.getState().syncChronicle(
        data.fullState.storyState?.storyChronicle ?? [],
        data.fullState.storyState?.pendingNarratives ?? [],
      )
      return data.newPet
    } catch (error) {
      set({ errorMessage: toPlayerErrorMessage(error, '孵化灵宠失败') })
      return null
    } finally {
      set({ isSaving: false })
    }
  },

  mutatePlayerPet: async (petId) => {
    const { playerState, isSaving } = get()
    if (!playerState || isSaving) return null

    set({ isSaving: true, errorMessage: '' })
    try {
      const data = await mutatePet(playerState.player.id, petId)
      set({ playerState: data.fullState })
      if (data.mutateSuccess) {
        set({
          adrenalineEvent: {
            type: 'mutate',
            title: '【 灵 宠 逆 天 变 异 ！】',
            subtitle: '九重雷劫，脱胎换骨！',
            name: data.pet.name,
            rarity: data.pet.rarity,
            skills: data.pet.skills,
            narrative: data.narrative,
          }
        })
      }
      useInfoFeedStore.getState().syncChronicle(
        data.fullState.storyState?.storyChronicle ?? [],
        data.fullState.storyState?.pendingNarratives ?? [],
      )
      return data
    } catch (error) {
      set({ errorMessage: toPlayerErrorMessage(error, '变异进化失败') })
      return null
    } finally {
      set({ isSaving: false })
    }
  },

  activatePlayerPet: async (petId) => {
    const { playerState, isSaving } = get()
    if (!playerState || isSaving) return

    set({ isSaving: true, errorMessage: '' })
    try {
      const nextState = await activatePet(playerState.player.id, petId)
      set({ playerState: nextState })
    } catch (error) {
      set({ errorMessage: toPlayerErrorMessage(error, '激活出战失败') })
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
      afkTickInFlight: false,
      settingsOpen: false,
      mapTravelOpen: false,
      journeyModalOpen: false,
      onboardingStep: null,
    })
  },
}))
