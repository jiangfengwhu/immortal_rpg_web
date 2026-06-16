/** 服务端下发的当前敌手战斗面板（与 Boss 表同步） */
export type OpponentCombat = {
  id: string
  name: string
  spinePath?: string
  scale?: number
  maxHp: number
  attack: number
  defense: number
  spiritPower: number
  speed: number
  skillCooldown?: number
  combatStyle?: 'hero' | 'brute'
}
