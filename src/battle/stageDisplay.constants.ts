import type { BattleUnitConfig } from './battle.types'
import { ENEMY_BATTLE_UNIT, PLAYER_BATTLE_UNIT, STAGE_FOOT_Y_RATIO } from './battle.constants'

/** 非战斗 stage 区角色展示（脚底锚点对齐地面） */
export const STAGE_PLAYER_DISPLAY: BattleUnitConfig = {
  ...PLAYER_BATTLE_UNIT,
  xRatio: 0.36,
  yRatio: STAGE_FOOT_Y_RATIO,
}

export const STAGE_BOAR_DISPLAY: BattleUnitConfig = {
  ...ENEMY_BATTLE_UNIT,
  xRatio: 0.64,
  yRatio: STAGE_FOOT_Y_RATIO,
}
