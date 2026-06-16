import { useBattleStore } from '../../battle/battleStore'
import type { BattleSide } from '../../battle/battle.types'

type UnitHpBarProps = {
  side: BattleSide
  hp: number
  maxHp: number
}

function UnitHpBar({ side, hp, maxHp }: UnitHpBarProps) {
  const position = useBattleStore((state) => state.unitWorldPosition[side])
  const arenaSize = useBattleStore((state) => state.arenaSize)

  if (!position || arenaSize.width < 1 || arenaSize.height < 1) return null

  const ratio = Math.max(0, Math.min(1, hp / maxHp))
  const left = (position.x / arenaSize.width) * 100
  const top = (position.headY / arenaSize.height) * 100

  return (
    <div className="unit-hp" style={{ left: `${left}%`, top: `${top}%` }}>
      <div className={`unit-hp__track unit-hp__track--${side}`}>
        <div className={`unit-hp__fill unit-hp__fill--${side}`} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  )
}

type UnitNameplateProps = {
  side: BattleSide
  label: string
}

function UnitNameplate({ side, label }: UnitNameplateProps) {
  const position = useBattleStore((state) => state.unitWorldPosition[side])
  const arenaSize = useBattleStore((state) => state.arenaSize)

  if (!position || arenaSize.width < 1 || arenaSize.height < 1) return null

  const left = (position.x / arenaSize.width) * 100
  const top = (position.y / arenaSize.height) * 100

  return (
    <div className={`unit-name unit-name--${side}`} style={{ left: `${left}%`, top: `${top}%` }}>
      {label}
    </div>
  )
}

export function BattleUnitMarkers() {
  const playerHp = useBattleStore((state) => state.playerHp)
  const enemyHp = useBattleStore((state) => state.enemyHp)
  const playerMaxHp = useBattleStore((state) => state.playerMaxHp)
  const enemyMaxHp = useBattleStore((state) => state.enemyMaxHp)
  const playerUnit = useBattleStore((state) => state.playerUnit)
  const enemyUnit = useBattleStore((state) => state.enemyUnit)
  const phase = useBattleStore((state) => state.phase)

  if (phase === 'ready') return null

  return (
    <div className="battle-markers" aria-hidden>
      <UnitHpBar side="player" hp={playerHp} maxHp={playerMaxHp} />
      <UnitHpBar side="enemy" hp={enemyHp} maxHp={enemyMaxHp} />
      <UnitNameplate side="player" label={playerUnit.label} />
      <UnitNameplate side="enemy" label={enemyUnit.label} />
    </div>
  )
}
