import { ENEMY_BATTLE_UNIT } from './battle.constants'
import type { OpponentCombat } from './opponent.types'
import type { BattleUnitConfig } from './battle.types'
import { PLAYER_COPY } from '../game/ui/playerCopy'

function resolveCombatStyle(opponent: OpponentCombat): BattleUnitConfig['combatStyle'] {
  if (opponent.combatStyle === 'hero' || opponent.combatStyle === 'brute') {
    return opponent.combatStyle
  }
  return 'brute'
}

export function buildEnemyBattleUnit(
  opponent?: OpponentCombat | null,
  fallbackName?: string | null,
): BattleUnitConfig {
  const label = opponent?.name?.trim() || fallbackName?.trim() || PLAYER_COPY.opponentFallback

  if (!opponent) {
    return {
      ...ENEMY_BATTLE_UNIT,
      label,
    }
  }

  return {
    ...ENEMY_BATTLE_UNIT,
    id: opponent.id || ENEMY_BATTLE_UNIT.id,
    label,
    skeleton: opponent.spinePath || ENEMY_BATTLE_UNIT.skeleton,
    scale: opponent.scale ?? ENEMY_BATTLE_UNIT.scale,
    maxHp: Math.max(1, opponent.maxHp),
    attack: Math.max(1, opponent.attack),
    defense: Math.max(0, opponent.defense),
    spiritPower: Math.max(1, opponent.spiritPower),
    speed: Math.max(1, opponent.speed),
    skillCooldown: opponent.skillCooldown ?? ENEMY_BATTLE_UNIT.skillCooldown,
    combatStyle: resolveCombatStyle(opponent),
  }
}
