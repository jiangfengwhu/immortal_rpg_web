import { PLAYER_BATTLE_UNIT } from './battle.constants'
import type { BattleUnitConfig } from './battle.types'
import { PLAYER_CLASS_LABELS } from '../game/character/character.constants'
import type { PlayerClass } from '../game/character/character.types'
import { sumEquipmentBonuses } from '../game/equipment/computeEquipmentBonuses'
import type { EquippedSummary } from '../game/equipment/equipment.types'

type PlayerBattleSource = {
  name: string
  class: PlayerClass
  stats: {
    maxHp: number
    attack: number
    defense: number
    spiritPower: number
    speed: number
    sealRate: number
    sealResist: number
  }
  equipped?: EquippedSummary
}

/** 后端面板属性 + 装备加成 → 战斗单位数值 */
export function buildPlayerBattleUnit(player: PlayerBattleSource): BattleUnitConfig {
  const classLabel = PLAYER_CLASS_LABELS[player.class]
  const eq = sumEquipmentBonuses(player.equipped ?? {})

  return {
    ...PLAYER_BATTLE_UNIT,
    label: `${classLabel}·${player.name}`,
    maxHp: Math.max(1, player.stats.maxHp + eq.hp),
    attack: Math.max(1, player.stats.attack + eq.attack),
    defense: Math.max(0, player.stats.defense + eq.defense),
    spiritPower: Math.max(1, player.stats.spiritPower + eq.spiritPower),
    speed: Math.max(1, player.stats.speed + eq.speed),
    useMagicDamage: player.class === 'mage' || player.class === 'warlock',
  }
}
