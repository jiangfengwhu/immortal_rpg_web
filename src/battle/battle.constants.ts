import type { BattleUnitConfig } from './battle.types'

export const ACTION_GAUGE_THRESHOLD = 100

export const ANIMATION_FALLBACKS = {
  idle: ['holdon', 'act_idle', 'idle', 'stand', 'standby', 'standby_loop', 'stand2'],
  run: ['move', 'act_run', 'run', 'walk', 'autorush'],
  attack: ['att', 'act_skill_01', 'attack', 'attack_1', 'atk', 'skill1'],
  skill: ['skill', 'act_skill_02', 'attack_2', 'skill1', 'skill2'],
  ultimate: ['ultimateskill', 'act_skill_02', 'skill', 'attack_2'],
  hit: ['behit', 'act_hit', 'hit', 'hurt', 'damage', 'behurt'],
  death: ['death', 'act_die', 'die', 'dead'],
} as const

/** 交战站位时向画面中心额外靠拢，占角色宽度的比例（spawn 站位用） */
export const FIGHT_INWARD_NUDGE = 0.42

/** 交战时两角色前沿之间的间距，占屏宽比例 */
export const COMBAT_CENTER_GAP_RATIO = 0.018

/** 脚底站位：玩家偏左、敌人偏右（相对屏宽） */
export const PLAYER_FIGHT_FOOT_X_RATIO = 0.34
export const ENEMY_FIGHT_FOOT_X_RATIO = 0.66
export const STAGE_FOOT_Y_RATIO = 0.88

export const BATTLE_HIT_EFFECT = {
  skeleton: '/放置觉醒spine/seffect/seffect_100110111/seffect_100110111.json',
  scale: 0.28,
  zIndex: 20,
  animations: {
    attack: 'animation_0',
    skill: 'animation_1',
    ultimate: 'animation_1',
  },
} as const

export const PLAYER_BATTLE_UNIT: BattleUnitConfig = {
  side: 'player',
  id: 'sanim_224041',
  label: '修真者',
  skeleton: '/放置觉醒spine/sanim/sanim_224041/sanim_224041.json',
  scale: 0.68,
  fitHeightWeight: 0.58,
  spawnXRatio: 0.12,
  xRatio: 0.34,
  yRatio: 0.88,
  faceDirection: 1,
  combatAdvanceRatio: 0.034,
  maxHp: 1200,
  attack: 95,
  defense: 3,
  spiritPower: 150,
  speed: 22,
  skillCooldown: 3,
  combatStyle: 'hero',
  animations: {
    idle: 'holdon',
    run: 'move',
    attack: 'att',
    skill: 'skill',
    ultimate: 'ultimateskill',
    hit: 'behit',
    death: 'death',
  },
}

export const ENEMY_BATTLE_UNIT: BattleUnitConfig = {
  side: 'enemy',
  id: 'mh_1107',
  label: '关外妖兽',
  skeleton: '/monsters/mh_1107/mh_1107.skel',
  scale: 0.74,
  fitHeightWeight: 0.55,
  spawnXRatio: 0.88,
  xRatio: 0.54,
  yRatio: 0.88,
  faceDirection: -1,
  combatAdvanceRatio: 0.03,
  maxHp: 95,
  attack: 16,
  defense: 6,
  spiritPower: 12,
  speed: 12,
  skillCooldown: 4,
  combatStyle: 'brute',
  animations: {
    idle: 'act_idle',
    run: 'act_run',
    attack: 'act_skill_01',
    skill: 'act_skill_02',
    ultimate: 'act_skill_02',
    hit: 'act_hit',
    death: 'act_die',
  },
}
