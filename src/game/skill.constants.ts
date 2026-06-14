export const FIRE_SKILL = {
  skeleton: '/skills/fire/20041.json',
  animation: 'animation',
  scale: 0.65,
  // 相对 Boss 锚点（脚下）的微调
  offsetX: 0,
  offsetY: 0,
  clipEnd: 0.52,
  spawnDelayRatio: 0,
} as const

export const PLAYER_ONCE_ANIMATIONS = new Set<string>(['skill1', 'death'])
