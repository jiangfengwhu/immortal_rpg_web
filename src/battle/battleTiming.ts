import type { BattleActionKind } from './battle.types'

export const ENTRANCE_DURATION_MS = 1400

export const FLYOUT_DURATION_MS = 900

export const COMBAT_ADVANCE_MS = 260

export const COMBAT_RETURN_MS = 320

export const BATTLE_TIMING = {
  attackGapMs: 520,
  skillExtraMs: 280,
  ultimateExtraMs: 420,
  hitDelayMs: 300,
  deathHoldMs: 1200,
  flyoutMs: FLYOUT_DURATION_MS,
  attackStrikeRatio: 0.36,
  skillStrikeRatio: 0.44,
  ultimateStrikeRatio: 0.48,
  attackStrikeMinMs: 200,
  skillStrikeMinMs: 280,
  ultimateStrikeMinMs: 340,
  actionTailMs: 120,
} as const

function resolveActionExtras(kind: BattleActionKind, hasSkillAnimation: boolean) {
  if (kind === 'ultimate') {
    return BATTLE_TIMING.ultimateExtraMs
  }
  if (kind === 'skill') {
    return hasSkillAnimation ? BATTLE_TIMING.skillExtraMs : 0
  }
  return 0
}

function resolveBaseDurationMs(kind: BattleActionKind, durationSec: number) {
  if (kind === 'ultimate') return Math.max(durationSec * 1000, 920)
  if (kind === 'skill') return Math.max(durationSec * 1000, 720)
  return Math.max(durationSec * 1000, 480)
}

export function getActionDurationMs(
  kind: BattleActionKind,
  durationSec: number,
  hasSkillAnimation: boolean,
) {
  const baseMs = resolveBaseDurationMs(kind, durationSec)
  const extraMs = resolveActionExtras(kind, hasSkillAnimation)

  if (kind === 'attack') {
    return Math.max(baseMs, BATTLE_TIMING.attackGapMs)
  }

  return baseMs + extraMs
}

export function getStrikeDelayMs(
  kind: BattleActionKind,
  durationSec: number,
  hasSkillAnimation: boolean,
) {
  const actionMs = getActionDurationMs(kind, durationSec, hasSkillAnimation)
  const ratio =
    kind === 'ultimate'
      ? BATTLE_TIMING.ultimateStrikeRatio
      : kind === 'skill'
        ? BATTLE_TIMING.skillStrikeRatio
        : BATTLE_TIMING.attackStrikeRatio
  const minMs =
    kind === 'ultimate'
      ? BATTLE_TIMING.ultimateStrikeMinMs
      : kind === 'skill'
        ? BATTLE_TIMING.skillStrikeMinMs
        : BATTLE_TIMING.attackStrikeMinMs
  const fromAdvance = COMBAT_ADVANCE_MS * 0.72
  const maxMs = Math.max(minMs, actionMs - BATTLE_TIMING.actionTailMs)

  return Math.round(Math.min(Math.max(actionMs * ratio, fromAdvance, minMs), maxMs))
}

export function getDeathDurationMs(hasDeathAnimation: boolean, deathDurationSec: number) {
  if (!hasDeathAnimation) {
    return BATTLE_TIMING.flyoutMs
  }

  return Math.max(deathDurationSec * 1000, BATTLE_TIMING.deathHoldMs)
}
