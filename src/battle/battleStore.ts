import { create } from 'zustand'

import { useGameSessionStore } from '../game/gameSessionStore'
import { interruptActiveHarvest } from '../game/harvest/interruptHarvest'
import { AutoBattler } from './autoBattler'
import { buildEnemyBattleUnit } from './buildEnemyBattleUnit'
import { buildPlayerBattleUnit } from './buildPlayerBattleUnit'
import { ENEMY_BATTLE_UNIT, PLAYER_BATTLE_UNIT } from './battle.constants'
import type { BattlePhase, BattleSide, BattleUnitConfig } from './battle.types'

const UNITS_READY = { player: true, enemy: true } as const

type BattleStore = {
  phase: BattlePhase
  battleGeneration: number
  playerHp: number
  enemyHp: number
  playerMaxHp: number
  enemyMaxHp: number
  turn: number
  winner: BattleSide | null
  playerUnit: BattleUnitConfig
  enemyUnit: BattleUnitConfig
  unitsReady: Record<BattleSide, boolean>
  loadError: string | null
  sim: AutoBattler
  rewardSyncing: boolean
  rewardSettled: boolean
  syncPlayerUnit: () => void
  startBattle: () => void
  resetBattleArena: () => void
  applySnapshot: () => void
  setPhase: (phase: BattlePhase) => void
  setLoadError: (message: string | null) => void
  syncBattleReward: () => Promise<void>
}

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

function buildArenaState(battleGeneration: number) {
  const playerUnit = resolvePlayerUnit()
  const enemyUnit = resolveEnemyUnit()
  const sim = new AutoBattler(playerUnit, enemyUnit)

  return {
    phase: 'entering' as const,
    battleGeneration: battleGeneration + 1,
    playerUnit,
    enemyUnit,
    sim,
    playerHp: playerUnit.maxHp,
    enemyHp: enemyUnit.maxHp,
    playerMaxHp: playerUnit.maxHp,
    enemyMaxHp: enemyUnit.maxHp,
    turn: 0,
    winner: null,
    unitsReady: UNITS_READY,
    loadError: null,
    rewardSyncing: false,
    rewardSettled: false,
  }
}

export const useBattleStore = create<BattleStore>((set, get) => ({
  phase: 'ready',
  battleGeneration: 0,
  playerHp: PLAYER_BATTLE_UNIT.maxHp,
  enemyHp: ENEMY_BATTLE_UNIT.maxHp,
  playerMaxHp: PLAYER_BATTLE_UNIT.maxHp,
  enemyMaxHp: ENEMY_BATTLE_UNIT.maxHp,
  turn: 0,
  winner: null,
  playerUnit: PLAYER_BATTLE_UNIT,
  enemyUnit: ENEMY_BATTLE_UNIT,
  unitsReady: UNITS_READY,
  loadError: null,
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
      unitsReady: UNITS_READY,
    })
  },

  startBattle: () => {
    void interruptActiveHarvest('battle')
    set(buildArenaState(get().battleGeneration))
  },

  resetBattleArena: () => {
    const playerUnit = resolvePlayerUnit()
    const enemyUnit = resolveEnemyUnit()

    set({
      phase: 'ready',
      winner: null,
      turn: 0,
      playerUnit,
      enemyUnit,
      playerHp: playerUnit.maxHp,
      enemyHp: enemyUnit.maxHp,
      playerMaxHp: playerUnit.maxHp,
      enemyMaxHp: enemyUnit.maxHp,
      unitsReady: UNITS_READY,
      rewardSyncing: false,
      rewardSettled: false,
      sim: new AutoBattler(playerUnit, enemyUnit),
    })
  },

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

  setLoadError: (message) => set({ loadError: message }),

  syncBattleReward: async () => {
    const { winner, rewardSyncing, rewardSettled } = get()
    if (rewardSyncing || rewardSettled || winner !== 'player') return

    set({ rewardSyncing: true })
    try {
      await useGameSessionStore.getState().claimBattleReward()
      get().syncPlayerUnit()
      get().resetBattleArena()
      set({ rewardSettled: true })
    } finally {
      set({ rewardSyncing: false })
    }
  },
}))
