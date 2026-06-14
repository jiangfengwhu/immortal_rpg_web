import type { BattleUnitConfig } from './battle.types'

export const ACTION_GAUGE_THRESHOLD = 100

export const ANIMATION_FALLBACKS = {
  idle: ['holdon', 'idle', 'stand', 'standby', 'standby_loop', 'stand2'],
  run: ['move', 'run', 'walk', 'autorush'],
  attack: ['att', 'attack', 'atk', 'hit', 'skill1'],
  skill: ['skill', 'ultimateskill', 'skill1', 'skill2', 'att'],
  hit: ['behit', 'hit', 'hurt', 'damage', 'behurt'],
  death: ['death', 'die', 'dead'],
} as const

/** 交战站位时向画面中心额外靠拢，占角色宽度的比例（spawn 站位用） */
export const FIGHT_INWARD_NUDGE = 0.42

/** 交战时两角色前沿之间的间距，占屏宽比例 */
export const COMBAT_CENTER_GAP_RATIO = 0.018

export const BATTLE_HIT_EFFECT = {
  skeleton: '/放置觉醒spine/seffect/seffect_100110111/seffect_100110111.json',
  scale: 0.28,
  zIndex: 20,
  animations: {
    attack: 'animation_0',
    skill: 'animation_1',
  },
} as const

export const PLAYER_BATTLE_UNIT: BattleUnitConfig = {
  side: 'player',
  id: 'sanim_1001',
  label: '仙灵·1001',
  skeleton: '/放置觉醒spine/sanim/sanim_1001/sanim_1001.json',
  scale: 0.54,
  fitHeightWeight: 0.46,
  spawnXRatio: 0.06,
  xRatio: 0.46,
  yRatio: 0.76,
  faceDirection: 1,
  combatAdvanceRatio: 0.03,
  maxHp: 1200,
  attack: 95,
  skillPower: 150,
  speed: 22,
  skillCooldown: 3,
  animations: {
    idle: 'holdon',
    run: 'move',
    attack: 'att',
    skill: 'skill',
    hit: 'behit',
    death: 'death',
  },
}

export const ENEMY_BATTLE_UNIT: BattleUnitConfig = {
  side: 'enemy',
  id: 'H30001',
  label: '洪荒·H30001',
  skeleton: '/洪荒仙灵录/H30001/H30001.skel',
  scale: 0.34,
  fitHeightWeight: 0.36,
  spawnXRatio: 0.94,
  xRatio: 0.54,
  yRatio: 0.76,
  faceDirection: -1,
  combatAdvanceRatio: 0.025,
  maxHp: 980,
  attack: 88,
  skillPower: 132,
  speed: 18,
  skillCooldown: 3,
  animations: {
    idle: 'idle',
    run: 'run',
    attack: 'att',
    skill: 'skill',
    hit: 'behit',
    death: 'death',
  },
}
