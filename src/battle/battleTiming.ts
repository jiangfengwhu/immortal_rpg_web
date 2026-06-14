export const ENTRANCE_DURATION_MS = 1400

export const FLYOUT_DURATION_MS = 900

export const COMBAT_ADVANCE_MS = 260

export const COMBAT_RETURN_MS = 320

export const BATTLE_TIMING = {
  attackGapMs: 520,
  skillExtraMs: 280,
  hitDelayMs: 320,
  deathHoldMs: 1200,
  flyoutMs: FLYOUT_DURATION_MS,
  /** 普攻命中点：占动作总时长的比例 */
  attackStrikeRatio: 0.36,
  /** 技能命中点：占动作总时长的比例 */
  skillStrikeRatio: 0.44,
  attackStrikeMinMs: 200,
  skillStrikeMinMs: 280,
  /** 命中后至少留出的收招时间 */
  actionTailMs: 120,
} as const

export function getActionDurationMs(
  kind: 'attack' | 'skill',
  durationSec: number,
  hasSkillAnimation: boolean,
) {
  const baseMs = Math.max(durationSec * 1000, kind === 'skill' ? 720 : 480)

  if (kind === 'skill') {
    return baseMs + (hasSkillAnimation ? BATTLE_TIMING.skillExtraMs : 0)
  }

  return Math.max(baseMs, BATTLE_TIMING.attackGapMs)
}

/** 攻击动画播放到该时刻触发被击（早于收招） */
export function getStrikeDelayMs(
  kind: 'attack' | 'skill',
  durationSec: number,
  hasSkillAnimation: boolean,
) {
  const actionMs = getActionDurationMs(kind, durationSec, hasSkillAnimation)
  const ratio =
    kind === 'skill' ? BATTLE_TIMING.skillStrikeRatio : BATTLE_TIMING.attackStrikeRatio
  const minMs =
    kind === 'skill' ? BATTLE_TIMING.skillStrikeMinMs : BATTLE_TIMING.attackStrikeMinMs
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
