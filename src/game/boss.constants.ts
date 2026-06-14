import { wuxiaQPlayerAsset } from './wuxiaQ.constants'

export const BOSS_SPINE_ASSET = {
  skeleton: wuxiaQPlayerAsset('Boss_long', 'Boss_long.skel'),
  scale: 0.42,
} as const

export const BOSS_WORLD_ANCHOR = {
  xRatio: 0.72,
  yRatio: 0.72,
} as const

export const BOSS_ANIMATION = {
  appear: 'appear',
  idle: 'idle',
  idleZhanshi: 'idle_zhanshi',
  skill1: 'skill1',
  skill2: 'skill2',
  skill3: 'skill3',
} as const

export const BOSS_ANIMATION_ORDER = [
  BOSS_ANIMATION.appear,
  BOSS_ANIMATION.idle,
  BOSS_ANIMATION.idleZhanshi,
  BOSS_ANIMATION.skill1,
  BOSS_ANIMATION.skill2,
  BOSS_ANIMATION.skill3,
] as const

export const BOSS_ANIMATION_LABELS: Record<string, string> = {
  [BOSS_ANIMATION.appear]: '登场',
  [BOSS_ANIMATION.idle]: '待机',
  [BOSS_ANIMATION.idleZhanshi]: '战姿',
  [BOSS_ANIMATION.skill1]: '技能一',
  [BOSS_ANIMATION.skill2]: '技能二',
  [BOSS_ANIMATION.skill3]: '技能三',
}

export const BOSS_ONCE_ANIMATIONS = new Set<string>([
  BOSS_ANIMATION.appear,
  BOSS_ANIMATION.skill1,
  BOSS_ANIMATION.skill2,
  BOSS_ANIMATION.skill3,
])
