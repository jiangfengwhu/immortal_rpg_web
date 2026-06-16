import { ACTION_GAUGE_THRESHOLD } from './battle.constants'
import type { BattleActionKind, BattleUnitConfig } from './battle.types'

const HERO_MULTIPLIERS: Record<BattleActionKind, number> = {
  attack: 1,
  skill: 1.45,
  ultimate: 2.1,
}

const BRUTE_MULTIPLIERS: Record<BattleActionKind, number> = {
  attack: 1,
  skill: 1.18,
  ultimate: 1.18,
}

const ULTIMATE_COOLDOWN_EXTRA = 2
const CRIT_CHANCE = 0.14
const CRIT_MULTIPLIER = 1.55
const VARIANCE_MIN = 0.9
const VARIANCE_MAX = 1.1
const PLAYER_OPENING_GAUGE_RATIO = 0.92
const ENEMY_OPENING_GAUGE_RATIO = 0.72

export type DamageResolution = {
  damage: number
  crit: boolean
}

/** 与后端 battle_resolver 一致：100 / (100 + 防御) */
function mitigatedDamage(raw: number, defense: number): number {
  const mitigation = 100 / (100 + Math.max(0, defense))
  return raw * mitigation
}

function resolveMultipliers(style: BattleUnitConfig['combatStyle']) {
  return style === 'brute' ? BRUTE_MULTIPLIERS : HERO_MULTIPLIERS
}

function resolveAttackPower(
  kind: BattleActionKind,
  attacker: BattleUnitConfig,
): number {
  const multiplier = resolveMultipliers(attacker.combatStyle)[kind]
  if (kind === 'skill' || kind === 'ultimate') {
    if (attacker.useMagicDamage) {
      return attacker.spiritPower * multiplier
    }
    return attacker.attack * multiplier
  }
  return attacker.attack
}

/** 攻防面板 + 技能倍率 + 防御减免 + 波动 + 暴击 */
export function resolveBattleDamage(
  kind: BattleActionKind,
  attacker: BattleUnitConfig,
  defender: BattleUnitConfig,
): DamageResolution {
  let raw = resolveAttackPower(kind, attacker)
  raw = mitigatedDamage(raw, defender.defense)

  const variance = VARIANCE_MIN + Math.random() * (VARIANCE_MAX - VARIANCE_MIN)
  raw *= variance

  const crit = Math.random() < CRIT_CHANCE
  if (crit) {
    raw *= CRIT_MULTIPLIER
  }

  return {
    damage: Math.max(1, Math.round(raw)),
    crit,
  }
}

export function pickBattleAction(
  unit: { skillCooldown: number },
  style: BattleUnitConfig['combatStyle'] = 'hero',
): BattleActionKind {
  if (unit.skillCooldown <= 0) {
    if (style === 'brute') {
      if (Math.random() < 0.1) return 'skill'
      return 'attack'
    }

    const roll = Math.random()
    if (roll < 0.12) return 'ultimate'
    if (roll < 0.38) return 'skill'
  }
  return 'attack'
}

export function resolveSkillCooldown(kind: BattleActionKind, baseCooldown: number): number {
  if (kind === 'ultimate') return baseCooldown + ULTIMATE_COOLDOWN_EXTRA
  if (kind === 'skill') return baseCooldown
  return 0
}

export function createOpeningGauge(side: 'player' | 'enemy'): number {
  const ratio = side === 'player' ? PLAYER_OPENING_GAUGE_RATIO : ENEMY_OPENING_GAUGE_RATIO
  return Math.round(ACTION_GAUGE_THRESHOLD * ratio)
}
