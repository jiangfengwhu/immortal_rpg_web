import { ACTION_GAUGE_THRESHOLD, ENEMY_BATTLE_UNIT, PLAYER_BATTLE_UNIT } from './battle.constants'
import type { BattleActionKind, BattleEvent, BattleSide, BattleSnapshot } from './battle.types'

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

function createRuntime(maxHp: number): UnitRuntime {
  return {
    hp: maxHp,
    gauge: 0,
    skillCooldown: 0,
  }
}

function pickAction(unit: UnitRuntime): BattleActionKind {
  if (unit.skillCooldown <= 0 && Math.random() < 0.38) {
    return 'skill'
  }

  return 'attack'
}

function getDamage(kind: BattleActionKind, attack: number, skillPower: number) {
  const base = kind === 'skill' ? skillPower : attack
  const variance = 0.88 + Math.random() * 0.24
  return Math.max(1, Math.round(base * variance))
}

export class AutoBattler {
  private state: AutoBattlerState

  constructor() {
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

    this.state.player.gauge += PLAYER_BATTLE_UNIT.speed
    this.state.enemy.gauge += ENEMY_BATTLE_UNIT.speed

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
      if (!actor) {
        break
      }

      const roundEvents = this.executeAction(actor)
      events.push(...roundEvents)

      if (this.state.finished) {
        break
      }
    }

    return events
  }

  private createInitialState(): AutoBattlerState {
    return {
      player: createRuntime(PLAYER_BATTLE_UNIT.maxHp),
      enemy: createRuntime(ENEMY_BATTLE_UNIT.maxHp),
      turn: 0,
      log: [],
      winner: null,
      finished: false,
    }
  }

  private pickActor(): BattleSide | null {
    const playerReady = this.state.player.gauge >= ACTION_GAUGE_THRESHOLD
    const enemyReady = this.state.enemy.gauge >= ACTION_GAUGE_THRESHOLD

    if (!playerReady && !enemyReady) {
      return null
    }

    if (playerReady && enemyReady) {
      return this.state.player.gauge >= this.state.enemy.gauge ? 'player' : 'enemy'
    }

    return playerReady ? 'player' : 'enemy'
  }

  private executeAction(actor: BattleSide): BattleEvent[] {
    const actorRuntime = actor === 'player' ? this.state.player : this.state.enemy
    const targetRuntime = actor === 'player' ? this.state.enemy : this.state.player
    const actorConfig = actor === 'player' ? PLAYER_BATTLE_UNIT : ENEMY_BATTLE_UNIT
    const targetConfig = actor === 'player' ? ENEMY_BATTLE_UNIT : PLAYER_BATTLE_UNIT
    const target: BattleSide = actor === 'player' ? 'enemy' : 'player'

    actorRuntime.gauge -= ACTION_GAUGE_THRESHOLD
    this.state.turn += 1

    const kind = pickAction(actorRuntime)
    const damage = getDamage(kind, actorConfig.attack, actorConfig.skillPower)

    if (kind === 'skill') {
      actorRuntime.skillCooldown = actorConfig.skillCooldown
    }

    targetRuntime.hp = Math.max(0, targetRuntime.hp - damage)

    const actionLabel = kind === 'skill' ? '施放技能' : '普通攻击'
    this.state.log.unshift(
      `第 ${this.state.turn} 回合 · ${actorConfig.label} ${actionLabel}，${targetConfig.label} 受到 ${damage} 点伤害`,
    )
    if (this.state.log.length > 8) {
      this.state.log.length = 8
    }

    const events: BattleEvent[] = [
      { type: 'ACTION', actor, kind },
      { type: 'HIT', target, damage, remainingHp: targetRuntime.hp },
    ]

    if (targetRuntime.hp <= 0) {
      events.push({ type: 'DEATH', side: target })
      this.state.finished = true
      this.state.winner = actor
      events.push({ type: 'VICTORY', winner: actor })
      this.state.log.unshift(`${actorConfig.label} 取得胜利！`)
    }

    return events
  }
}
