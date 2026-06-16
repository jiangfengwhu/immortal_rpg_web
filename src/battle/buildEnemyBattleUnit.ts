import { ENEMY_BATTLE_UNIT } from './battle.constants'
import type { BattleUnitConfig } from './battle.types'
import { PLAYER_COPY } from '../game/ui/playerCopy'

export function buildEnemyBattleUnit(opponentName?: string | null): BattleUnitConfig {
  const label = opponentName?.trim() || PLAYER_COPY.opponentFallback
  return {
    ...ENEMY_BATTLE_UNIT,
    label,
  }
}
