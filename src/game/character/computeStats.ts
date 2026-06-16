import {
  STAT_COEFFICIENTS,
  DEFAULT_PRIMARY_BY_CLASS,
} from './character.constants'
import type {
  DerivedStats,
  MagicResistance,
  PlayerClass,
  PrimaryAttributes,
} from './character.types'

/** 客户端演算基本属性 (与后端 ComputeDerivedStats 公式一致) */
export function computeDerivedStats(
  primary: PrimaryAttributes,
  level: number,
): DerivedStats {
  const { constitution: con, strength: str, magic: mag, charm, agility: agi } = primary
  const lv = level
  const c = STAT_COEFFICIENTS

  const maxHp = Math.round(con * c.constitution.hp + lv * c.level.hp)
  const stamina = Math.round(str * c.strength.stamina + lv * c.level.stamina)
  const mp = Math.round(mag * c.magic.mp + lv * c.level.mp)
  const attack = Math.round(str * c.strength.attack + lv * c.level.attack)
  const defense = Math.round(charm * c.charm.defense + lv * c.level.defense)
  const spiritPower = Math.round(
    str * c.strength.spiritPower +
      mag * c.magic.spiritPower +
      charm * c.charm.spiritPower +
      lv * c.level.spiritPower,
  )
  const speed = Math.round(
    con * c.constitution.speed +
      str * c.strength.speed +
      mag * c.magic.speed +
      charm * c.charm.speed +
      agi * c.agility.speed +
      lv * c.level.speed,
  )

  return {
    maxHp,
    stamina,
    mp,
    attack,
    defense,
    spiritPower,
    speed,
    sealRate: Math.min(80, charm * c.charm.sealRate),
    sealResist: Math.min(80, charm * c.charm.sealResist),
  }
}

export function computeMagicResistance(level: number): MagicResistance {
  const base = level * STAT_COEFFICIENTS.level.magicResist
  return { immortal: base, ghost: base, demon: base, wisdom: base, mind: base }
}

export function defaultPrimaryForClass(playerClass: PlayerClass): PrimaryAttributes {
  return { ...DEFAULT_PRIMARY_BY_CLASS[playerClass] }
}
