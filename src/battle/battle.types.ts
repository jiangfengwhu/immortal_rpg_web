export type BattleSide = 'player' | 'enemy'

export type BattlePhase = 'ready' | 'entering' | 'fighting' | 'ended'

export type BattleActionKind = 'attack' | 'skill' | 'ultimate'

export type UnitAnimationSet = {
  idle: string
  run: string
  attack: string
  skill: string
  ultimate: string
  hit: string
  death: string
}

export type BattleUnitConfig = {
  side: BattleSide
  id: string
  label: string
  skeleton: string
  scale: number
  /** 适配目标高度占屏高比例，各角色可单独调大小 */
  fitHeightWeight: number
  /** 进场起点（屏幕左右外侧） */
  spawnXRatio: number
  /** 交战站位（spawn 模式 fallback） */
  xRatio: number
  yRatio: number
  /** scale.x 符号，左侧角色镜像后为 1 */
  faceDirection: 1 | -1
  /** 普攻/技能时向对手方向突进，占屏宽比例 */
  combatAdvanceRatio: number
  maxHp: number
  attack: number
  defense: number
  spiritPower: number
  speed: number
  skillCooldown: number
  /** 法术流派：技能伤害走灵力公式 */
  useMagicDamage?: boolean
  /** 怪物少用技能/大招，避免前期碾压玩家 */
  combatStyle?: 'hero' | 'brute'
  animations: UnitAnimationSet
}

export type BattleEvent =
  | { type: 'ACTION'; actor: BattleSide; kind: BattleActionKind }
  | { type: 'HIT'; target: BattleSide; damage: number; remainingHp: number }
  | { type: 'DEATH'; side: BattleSide }
  | { type: 'VICTORY'; winner: BattleSide }

export type BattleSnapshot = {
  playerHp: number
  enemyHp: number
  turn: number
  log: string[]
  winner: BattleSide | null
}
