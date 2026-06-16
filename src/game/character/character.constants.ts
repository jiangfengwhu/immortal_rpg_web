import type { MagicSchool, PlayerClass, PrimaryAttributes } from './character.types'

/** 梦想世界属性换算系数 — 与 server/internal/model/character_stats.const.go 同步 */
export const STAT_COEFFICIENTS = {
  constitution: { hp: 8, speed: 0.1 },
  strength: { stamina: 1, spiritPower: 0.4, speed: 0.1, attack: 0.6 },
  magic: { mp: 1, spiritPower: 0.6, speed: 0.1 },
  charm: { speed: 0.1, defense: 0.4, spiritPower: 0.15, sealRate: 0.3, sealResist: 0.3 },
  agility: { speed: 0.8 },
  level: {
    hp: 5,
    stamina: 2,
    mp: 2,
    attack: 1,
    defense: 0.5,
    spiritPower: 1,
    speed: 0.3,
    magicResist: 0.2,
  },
  attackToMagicDamageRatio: 1 / 3,
  potentialPointsPerLevel: 3,
} as const

export const PLAYER_CLASS_LABELS: Record<PlayerClass, string> = {
  warrior: '战士',
  mage: '法师',
  warlock: '术士',
}

export const REALM_LABELS: Record<string, string> = {
  mortal: '凡人',
  hero: '大侠',
  cultivator: '修仙',
  ascension: '飞升',
}

export const PRIMARY_ATTR_LABELS: Record<keyof PrimaryAttributes, string> = {
  constitution: '体质',
  strength: '力量',
  magic: '魔力',
  charm: '魅力',
  agility: '敏捷',
}

export const DERIVED_STAT_LABELS = {
  maxHp: '气血',
  stamina: '力道',
  mp: '魔法',
  attack: '攻击',
  defense: '防御',
  spiritPower: '灵力',
  speed: '速度',
  sealRate: '封印',
  sealResist: '抗封',
} as const

export const MAGIC_SCHOOL_LABELS: Record<MagicSchool, string> = {
  immortal: '仙术',
  ghost: '鬼术',
  demon: '妖术',
  wisdom: '智术',
  mind: '念术',
}

/** 各流派初始天赋分配 */
export const DEFAULT_PRIMARY_BY_CLASS: Record<PlayerClass, PrimaryAttributes> = {
  warrior: { constitution: 12, strength: 14, magic: 6, charm: 6, agility: 10 },
  mage: { constitution: 10, strength: 6, magic: 14, charm: 8, agility: 10 },
  warlock: { constitution: 10, strength: 6, magic: 8, charm: 14, agility: 10 },
}

/** 推荐加点说明 */
export const CLASS_BUILD_TIPS: Record<PlayerClass, string> = {
  warrior: '推荐 4力1敏 或 3力2敏，追求物理输出与出手速度',
  mage: '推荐 5魔 或 3魔2魅，灵力决定法术伤害',
  warlock: '推荐 3魅2敏 或 2魅3敏，魅力影响封印与防御',
}

/** 天赋属性说明 (梦想世界官方描述) */
export const PRIMARY_ATTR_DESCRIPTIONS: Record<keyof PrimaryAttributes, string> = {
  constitution: '决定气血上限',
  strength: '提高物理攻击、力道上限，增加些许灵力与速度',
  magic: '提高法术攻击、魔法上限，增加灵力与些许速度',
  charm: '提高封印/抗封、回复效果，增加些许防御、速度与法伤',
  agility: '主要提高速度，影响出手顺序',
}
