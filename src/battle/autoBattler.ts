import { ACTION_GAUGE_THRESHOLD } from './battle.constants'
import {
  createOpeningGauge,
  pickBattleAction,
  resolveBattleDamage,
  resolveSkillCooldown,
} from './battleDamage'
import type { BattleEvent, BattleSide, BattleSnapshot, BattleUnitConfig } from './battle.types'

type UnitRuntime = {
  hp: number
  gauge: number
  skillCooldown: number
}

type AutoBattlerState = {
  player: UnitRuntime
  enemy: UnitRuntime
  turn: number
  log: string[]
  winner: BattleSide | null
  finished: boolean
}

function createRuntime(maxHp: number, side: BattleSide): UnitRuntime {
  return {
    hp: maxHp,
    gauge: createOpeningGauge(side),
    skillCooldown: 0,
  }
}

export class AutoBattler {
  private state: AutoBattlerState
  private playerConfig: BattleUnitConfig
  private enemyConfig: BattleUnitConfig

  constructor(playerConfig: BattleUnitConfig, enemyConfig: BattleUnitConfig) {
    this.playerConfig = playerConfig
    this.enemyConfig = enemyConfig
    this.state = this.createInitialState()
  }

  reset() {
    this.state = this.createInitialState()
  }

  getSnapshot(): BattleSnapshot {
    return {
      playerHp: this.state.player.hp,
      enemyHp: this.state.enemy.hp,
      turn: this.state.turn,
      log: [...this.state.log],
      winner: this.state.winner,
    }
  }

  isFinished() {
    return this.state.finished
  }

  advanceRound(): BattleEvent[] {
    if (this.state.finished) {
      return []
    }

    this.state.player.gauge += this.playerConfig.speed
    this.state.enemy.gauge += this.enemyConfig.speed

    if (this.state.player.skillCooldown > 0) {
      this.state.player.skillCooldown -= 1
    }
    if (this.state.enemy.skillCooldown > 0) {
      this.state.enemy.skillCooldown -= 1
    }

    const events: BattleEvent[] = []
    let safety = 0

    while (!this.state.finished && safety < 4) {
      safety += 1
      const actor = this.pickActor()
      if (!actor) break
      events.push(...this.executeAction(actor))
      if (this.state.finished) break
    }

    return events
  }

  private createInitialState(): AutoBattlerState {
    return {
      player: createRuntime(this.playerConfig.maxHp, 'player'),
      enemy: createRuntime(this.enemyConfig.maxHp, 'enemy'),
      turn: 0,
      log: [],
      winner: null,
      finished: false,
    }
  }

  private pickActor(): BattleSide | null {
    const playerReady = this.state.player.gauge >= ACTION_GAUGE_THRESHOLD
    const enemyReady = this.state.enemy.gauge >= ACTION_GAUGE_THRESHOLD
    if (!playerReady && !enemyReady) return null
    if (playerReady && enemyReady) {
      return this.state.player.gauge >= this.state.enemy.gauge ? 'player' : 'enemy'
    }
    return playerReady ? 'player' : 'enemy'
  }

  private executeAction(actor: BattleSide): BattleEvent[] {
    const actorRuntime = actor === 'player' ? this.state.player : this.state.enemy
    const targetRuntime = actor === 'player' ? this.state.enemy : this.state.player
    const actorConfig = actor === 'player' ? this.playerConfig : this.enemyConfig
    const targetConfig = actor === 'player' ? this.enemyConfig : this.playerConfig
    const target: BattleSide = actor === 'player' ? 'enemy' : 'player'

    actorRuntime.gauge -= ACTION_GAUGE_THRESHOLD
    this.state.turn += 1

    const kind = pickBattleAction(actorRuntime, actorConfig.combatStyle)
    const { damage } = resolveBattleDamage(kind, actorConfig, targetConfig)

    const cooldown = resolveSkillCooldown(kind, actorConfig.skillCooldown)
    if (cooldown > 0) {
      actorRuntime.skillCooldown = cooldown
    }

    targetRuntime.hp = Math.max(0, targetRuntime.hp - damage)

    const events: BattleEvent[] = [
      { type: 'ACTION', actor, kind },
      { type: 'HIT', target, damage, remainingHp: targetRuntime.hp },
    ]

    if (targetRuntime.hp <= 0) {
      events.push({ type: 'DEATH', side: target })
      this.state.finished = true
      this.state.winner = actor
      events.push({ type: 'VICTORY', winner: actor })
    }

    return events
  }
}
