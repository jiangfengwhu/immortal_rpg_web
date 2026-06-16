/** 梦想世界人物属性 — 与后端 model/character_stats 对齐 */

export type PlayerClass = 'warrior' | 'mage' | 'warlock'

export type MagicSchool = 'immortal' | 'ghost' | 'demon' | 'wisdom' | 'mind'

/** 天赋属性 (五项可分配) */
export type PrimaryAttributes = {
  constitution: number // 体质
  strength: number // 力量
  magic: number // 魔力
  charm: number // 魅力
  agility: number // 敏捷
}

/** 基本属性 (由天赋换算) */
export type DerivedStats = {
  maxHp: number // 气血
  stamina: number // 力道
  mp: number // 魔法
  attack: number // 物理攻击
  defense: number // 物理防御
  spiritPower: number // 灵力
  speed: number // 速度
  sealRate: number // 封印率 %
  sealResist: number // 抗封 %
}

/** 五系法术抗性 */
export type MagicResistance = {
  immortal: number // 仙术
  ghost: number // 鬼术
  demon: number // 妖术
  wisdom: number // 智术
  mind: number // 念术
}

export type PlayerCharacter = {
  id: string
  name: string
  class: PlayerClass
  level: number
  potentialPoints: number
  primary: PrimaryAttributes
  stats: DerivedStats
  magicResist: MagicResistance
}

export type AllocateStatsRequest = {
  playerId: string
  constitution?: number
  strength?: number
  magic?: number
  charm?: number
  agility?: number
}
