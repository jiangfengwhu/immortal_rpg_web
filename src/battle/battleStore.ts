import { create } from 'zustand'

import { useGameSessionStore } from '../game/gameSessionStore'
import { interruptActiveHarvest } from '../game/harvest/interruptHarvest'
import { AutoBattler } from './autoBattler'
import { buildEnemyBattleUnit } from './buildEnemyBattleUnit'
import { buildPlayerBattleUnit } from './buildPlayerBattleUnit'
import { ENEMY_BATTLE_UNIT, PLAYER_BATTLE_UNIT } from './battle.constants'
import type { ResolvedUnitProfile } from './resolveBattleAnimation'
import type {
  BattleActionKind,
  BattleEvent,
  BattlePhase,
  BattleSide,
  BattleUnitConfig,
} from './battle.types'

export type UnitWorldPosition = {
  x: number
  y: number
  headY: number
}

export type HitEffectSignal = {
  id: number
  actor: BattleSide
  target: BattleSide
  kind: BattleActionKind
}

export type DamagePopup = {
  id: number
  target: BattleSide
  damage: number
  kind: BattleActionKind
}

let damagePopupId = 0

type BattleStore = {
  phase: BattlePhase
  battleGeneration: number
  playerHp: number
  enemyHp: number
  playerMaxHp: number
  enemyMaxHp: number
  turn: number
  damagePopups: DamagePopup[]
  winner: BattleSide | null
  playerAnimation: string
  enemyAnimation: string
  playerUnit: BattleUnitConfig
  enemyUnit: BattleUnitConfig
  unitProfiles: Partial<Record<BattleSide, ResolvedUnitProfile>>
  unitsReady: Record<BattleSide, boolean>
  loadError: string | null
  unitDeath: UnitDeathSignal | null
  hitEffect: HitEffectSignal | null
  unitWorldPosition: Partial<Record<BattleSide, UnitWorldPosition>>
  sim: AutoBattler
  arenaSize: { width: number; height: number }
  rewardSyncing: boolean
  rewardSettled: boolean
  setArenaSize: (width: number, height: number) => void
  entranceComplete: Record<BattleSide, boolean>
  markEntranceComplete: (side: BattleSide) => void
  syncPlayerUnit: () => void
  startBattle: () => void
  resetBattleArena: () => void
  applySnapshot: () => void
  setPhase: (phase: BattlePhase) => void
  setUnitAnimation: (side: BattleSide, animation: string) => void
  setUnitProfile: (side: BattleSide, profile: ResolvedUnitProfile) => void
  triggerUnitDeath: (payload: Omit<UnitDeathSignal, 'id'>) => void
  triggerHitEffect: (payload: Omit<HitEffectSignal, 'id'>) => void
  pushDamagePopup: (payload: Omit<DamagePopup, 'id'>) => void
  setUnitWorldPosition: (side: BattleSide, x: number, y: number, headY: number) => void
  setLoadError: (message: string | null) => void
  syncBattleReward: () => Promise<void>
}

export type UnitDeathSignal = {
  id: number
  side: BattleSide
  mode: 'animation' | 'flyout'
}

let unitDeathId = 0
let hitEffectId = 0

function resolveEnemyUnit(): BattleUnitConfig {
  const session = useGameSessionStore.getState()
  const opponent = session.playerState?.opponent ?? null
  const opponentName = session.lastOpponentName ?? session.playerState?.opponentName
  return buildEnemyBattleUnit(opponent, opponentName)
}

function resolvePlayerUnit(): BattleUnitConfig {
  const state = useGameSessionStore.getState().playerState
  if (!state) return PLAYER_BATTLE_UNIT
  return buildPlayerBattleUnit({
    name: state.player.name,
    class: state.player.class,
    stats: state.player.stats,
    equipped: state.equipped,
  })
}

export const useBattleStore = create<BattleStore>((set, get) => {
  const buildBeginBattleState = () => {
    const state = get()
    const playerUnit = resolvePlayerUnit()
    const enemyUnit = resolveEnemyUnit()
    const { unitProfiles, battleGeneration } = state
    const playerIdle = unitProfiles.player?.animations.idle ?? playerUnit.animations.idle
    const enemyIdle = unitProfiles.enemy?.animations.idle ?? enemyUnit.animations.idle
    const sim = new AutoBattler(playerUnit, enemyUnit)

    return {
      phase: 'fighting' as const,
      battleGeneration: battleGeneration + 1,
      playerUnit,
      enemyUnit,
      sim,
      playerHp: playerUnit.maxHp,
      enemyHp: enemyUnit.maxHp,
      playerMaxHp: playerUnit.maxHp,
      enemyMaxHp: enemyUnit.maxHp,
      turn: 0,
      damagePopups: [],
      winner: null,
      playerAnimation: playerIdle,
      enemyAnimation: enemyIdle,
      unitDeath: null,
      hitEffect: null,
      unitWorldPosition: {},
      entranceComplete: { player: true, enemy: true },
      unitsReady: { player: false, enemy: false },
      unitProfiles: {},
      loadError: null,
      rewardSyncing: false,
      rewardSettled: false,
    }
  }

  return {
  phase: 'ready',
  battleGeneration: 0,
  playerHp: PLAYER_BATTLE_UNIT.maxHp,
  enemyHp: ENEMY_BATTLE_UNIT.maxHp,
  playerMaxHp: PLAYER_BATTLE_UNIT.maxHp,
  enemyMaxHp: ENEMY_BATTLE_UNIT.maxHp,
  turn: 0,
  damagePopups: [],
  winner: null,
  playerAnimation: PLAYER_BATTLE_UNIT.animations.idle,
  enemyAnimation: ENEMY_BATTLE_UNIT.animations.idle,
  playerUnit: PLAYER_BATTLE_UNIT,
  enemyUnit: ENEMY_BATTLE_UNIT,
  unitProfiles: {},
  unitsReady: { player: false, enemy: false },
  loadError: null,
  unitDeath: null,
  hitEffect: null,
  unitWorldPosition: {},
  entranceComplete: { player: false, enemy: false },
  arenaSize: { width: window.innerWidth, height: window.innerHeight },
  rewardSyncing: false,
  rewardSettled: false,
  sim: new AutoBattler(PLAYER_BATTLE_UNIT, ENEMY_BATTLE_UNIT),

  syncPlayerUnit: () => {
    const playerUnit = resolvePlayerUnit()
    const enemyUnit = resolveEnemyUnit()
    set({
      playerUnit,
      enemyUnit,
      playerHp: playerUnit.maxHp,
      playerMaxHp: playerUnit.maxHp,
      enemyHp: enemyUnit.maxHp,
      enemyMaxHp: enemyUnit.maxHp,
      sim: new AutoBattler(playerUnit, enemyUnit),
    })
  },

  startBattle: () => {
    void interruptActiveHarvest('battle')
    set(buildBeginBattleState())
  },

  resetBattleArena: () => {
    const playerUnit = resolvePlayerUnit()
    const enemyUnit = resolveEnemyUnit()
    const { unitProfiles } = get()
    const playerIdle = unitProfiles.player?.animations.idle ?? playerUnit.animations.idle
    const enemyIdle = unitProfiles.enemy?.animations.idle ?? enemyUnit.animations.idle

    set({
      phase: 'ready',
      winner: null,
      turn: 0,
      damagePopups: [],
      playerUnit,
      enemyUnit,
      playerHp: playerUnit.maxHp,
      enemyHp: enemyUnit.maxHp,
      playerMaxHp: playerUnit.maxHp,
      enemyMaxHp: enemyUnit.maxHp,
      playerAnimation: playerIdle,
      enemyAnimation: enemyIdle,
      unitDeath: null,
      hitEffect: null,
      unitWorldPosition: {},
      entranceComplete: { player: false, enemy: false },
      rewardSyncing: false,
      rewardSettled: false,
      sim: new AutoBattler(playerUnit, enemyUnit),
    })
  },

  markEntranceComplete: (side) =>
    set((state) => {
      const entranceComplete = { ...state.entranceComplete, [side]: true }
      if (state.phase === 'entering' && entranceComplete.player && entranceComplete.enemy) {
        return {
          entranceComplete,
          phase: 'fighting',
        }
      }
      return { entranceComplete }
    }),

  applySnapshot: () => {
    const snapshot = get().sim.getSnapshot()
    set({
      playerHp: snapshot.playerHp,
      enemyHp: snapshot.enemyHp,
      turn: snapshot.turn,
      winner: snapshot.winner,
    })
  },

  setPhase: (phase) => set({ phase }),

  setUnitAnimation: (side, animation) => {
    if (side === 'player') {
      set({ playerAnimation: animation })
      return
    }
    set({ enemyAnimation: animation })
  },

  setUnitProfile: (side, profile) =>
    set((state) => ({
      unitProfiles: { ...state.unitProfiles, [side]: profile },
      unitsReady: { ...state.unitsReady, [side]: true },
      playerAnimation: side === 'player' ? profile.animations.idle : state.playerAnimation,
      enemyAnimation: side === 'enemy' ? profile.animations.idle : state.enemyAnimation,
    })),

  triggerUnitDeath: (payload) => {
    unitDeathId += 1
    set({ unitDeath: { ...payload, id: unitDeathId } })
  },

  triggerHitEffect: (payload) => {
    hitEffectId += 1
    set({ hitEffect: { ...payload, id: hitEffectId } })
  },

  pushDamagePopup: (payload) => {
    damagePopupId += 1
    set((state) => ({
      damagePopups: [...state.damagePopups, { ...payload, id: damagePopupId }],
    }))
  },

  setUnitWorldPosition: (side, x, y, headY) =>
    set((state) => {
      const current = state.unitWorldPosition[side]
      if (
        current &&
        Math.abs(current.x - x) < 0.5 &&
        Math.abs(current.y - y) < 0.5 &&
        Math.abs(current.headY - headY) < 0.5
      ) {
        return state
      }
      return {
        unitWorldPosition: { ...state.unitWorldPosition, [side]: { x, y, headY } },
      }
    }),

  setLoadError: (message) => set({ loadError: message }),

  setArenaSize: (width, height) => set({ arenaSize: { width, height } }),

  syncBattleReward: async () => {
    const { winner, rewardSyncing, rewardSettled } = get()
    if (rewardSyncing || rewardSettled || winner !== 'player') return

    set({ rewardSyncing: true })
    try {
      await useGameSessionStore.getState().claimBattleReward()
      get().syncPlayerUnit()
      set({ rewardSettled: true })
    } finally {
      set({ rewardSyncing: false })
    }
  },
  }
})

export function getBattleUnitConfig(side: BattleSide) {
  const state = useBattleStore.getState()
  return side === 'player' ? state.playerUnit : state.enemyUnit
}

export function getOpponentSide(side: BattleSide): BattleSide {
  return side === 'player' ? 'enemy' : 'player'
}

export type { BattleEvent }
