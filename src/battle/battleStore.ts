import { create } from 'zustand'

import { AutoBattler } from './autoBattler'
import { ENEMY_BATTLE_UNIT, PLAYER_BATTLE_UNIT } from './battle.constants'
import type { ResolvedUnitProfile } from './resolveBattleAnimation'
import type { BattleActionKind, BattleEvent, BattlePhase, BattleSide } from './battle.types'

export type UnitWorldPosition = {
  x: number
  y: number
}

export type HitEffectSignal = {
  id: number
  actor: BattleSide
  target: BattleSide
  kind: BattleActionKind
}

type BattleStore = {
  phase: BattlePhase
  battleGeneration: number
  playerHp: number
  enemyHp: number
  turn: number
  log: string[]
  winner: BattleSide | null
  playerAnimation: string
  enemyAnimation: string
  unitProfiles: Partial<Record<BattleSide, ResolvedUnitProfile>>
  unitsReady: Record<BattleSide, boolean>
  loadError: string | null
  unitDeath: UnitDeathSignal | null
  hitEffect: HitEffectSignal | null
  unitWorldPosition: Partial<Record<BattleSide, UnitWorldPosition>>
  sim: AutoBattler
  arenaSize: { width: number; height: number }
  setArenaSize: (width: number, height: number) => void
  entranceComplete: Record<BattleSide, boolean>
  markEntranceComplete: (side: BattleSide) => void
  startBattle: () => void
  applySnapshot: () => void
  setPhase: (phase: BattlePhase) => void
  setUnitAnimation: (side: BattleSide, animation: string) => void
  setUnitProfile: (side: BattleSide, profile: ResolvedUnitProfile) => void
  triggerUnitDeath: (payload: Omit<UnitDeathSignal, 'id'>) => void
  triggerHitEffect: (payload: Omit<HitEffectSignal, 'id'>) => void
  setUnitWorldPosition: (side: BattleSide, x: number, y: number) => void
  setLoadError: (message: string | null) => void
}

export type UnitDeathSignal = {
  id: number
  side: BattleSide
  mode: 'animation' | 'flyout'
}

let unitDeathId = 0
let hitEffectId = 0

export const useBattleStore = create<BattleStore>((set, get) => ({
  phase: 'ready',
  battleGeneration: 0,
  playerHp: PLAYER_BATTLE_UNIT.maxHp,
  enemyHp: ENEMY_BATTLE_UNIT.maxHp,
  turn: 0,
  log: [],
  winner: null,
  playerAnimation: PLAYER_BATTLE_UNIT.animations.idle,
  enemyAnimation: ENEMY_BATTLE_UNIT.animations.idle,
  unitProfiles: {},
  unitsReady: { player: false, enemy: false },
  loadError: null,
  unitDeath: null,
  hitEffect: null,
  unitWorldPosition: {},
  entranceComplete: { player: false, enemy: false },
  arenaSize: { width: window.innerWidth, height: window.innerHeight },
  sim: new AutoBattler(),

  startBattle: () => {
    const { unitProfiles, battleGeneration } = get()
    const playerIdle = unitProfiles.player?.animations.idle ?? PLAYER_BATTLE_UNIT.animations.idle
    const enemyIdle = unitProfiles.enemy?.animations.idle ?? ENEMY_BATTLE_UNIT.animations.idle
    const sim = new AutoBattler()

    set({
      phase: 'entering',
      battleGeneration: battleGeneration + 1,
      sim,
      playerHp: PLAYER_BATTLE_UNIT.maxHp,
      enemyHp: ENEMY_BATTLE_UNIT.maxHp,
      turn: 0,
      log: ['双方入场！'],
      winner: null,
      playerAnimation: playerIdle,
      enemyAnimation: enemyIdle,
      unitDeath: null,
      hitEffect: null,
      unitWorldPosition: {},
      entranceComplete: { player: false, enemy: false },
    })
  },

  markEntranceComplete: (side) =>
    set((state) => {
      const entranceComplete = {
        ...state.entranceComplete,
        [side]: true,
      }

      if (
        state.phase === 'entering' &&
        entranceComplete.player &&
        entranceComplete.enemy
      ) {
        return {
          entranceComplete,
          phase: 'fighting',
          log: ['战斗开始！双方自动交锋。', ...state.log].slice(0, 8),
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
      log: snapshot.log,
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
      unitProfiles: {
        ...state.unitProfiles,
        [side]: profile,
      },
      unitsReady: {
        ...state.unitsReady,
        [side]: true,
      },
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

  setUnitWorldPosition: (side, x, y) =>
    set((state) => {
      const current = state.unitWorldPosition[side]
      if (current && Math.abs(current.x - x) < 0.5 && Math.abs(current.y - y) < 0.5) {
        return state
      }

      return {
        unitWorldPosition: {
          ...state.unitWorldPosition,
          [side]: { x, y },
        },
      }
    }),

  setLoadError: (message) => set({ loadError: message }),

  setArenaSize: (width, height) => set({ arenaSize: { width, height } }),
}))

export function getBattleUnitConfig(side: BattleSide) {
  return side === 'player' ? PLAYER_BATTLE_UNIT : ENEMY_BATTLE_UNIT
}

export function getOpponentSide(side: BattleSide): BattleSide {
  return side === 'player' ? 'enemy' : 'player'
}

export type { BattleEvent }
