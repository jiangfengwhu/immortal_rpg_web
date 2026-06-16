import { useEffect, useState } from 'react'

import { useBattleStore, type DamagePopup } from '../../battle/battleStore'

const DAMAGE_POPUP_MS = 900

type VisiblePopup = DamagePopup & { visible: boolean }

export function BattleDamageNumbers() {
  const damagePopups = useBattleStore((state) => state.damagePopups)
  const unitWorldPosition = useBattleStore((state) => state.unitWorldPosition)
  const arenaSize = useBattleStore((state) => state.arenaSize)
  const [visiblePopups, setVisiblePopups] = useState<VisiblePopup[]>([])

  useEffect(() => {
    if (damagePopups.length === 0) return

    const latest = damagePopups[damagePopups.length - 1]
    setVisiblePopups((current) => [...current, { ...latest, visible: true }])

    const fadeTimer = window.setTimeout(() => {
      setVisiblePopups((current) =>
        current.map((entry) => (entry.id === latest.id ? { ...entry, visible: false } : entry)),
      )
    }, DAMAGE_POPUP_MS - 180)

    const removeTimer = window.setTimeout(() => {
      setVisiblePopups((current) => current.filter((entry) => entry.id !== latest.id))
    }, DAMAGE_POPUP_MS)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(removeTimer)
    }
  }, [damagePopups])

  if (visiblePopups.length === 0) return null

  const { width, height } = arenaSize

  return (
    <div className="battle-damage-layer" aria-hidden>
      {visiblePopups.map((popup) => {
        const position = unitWorldPosition[popup.target]
        const left = position && width > 0 ? (position.x / width) * 100 : popup.target === 'player' ? 28 : 72
        const top = position && height > 0 ? (position.headY / height) * 100 - 4 : 30

        return (
          <span
            key={popup.id}
            className={`battle-damage battle-damage--${popup.target}${
              popup.kind === 'skill' ? ' battle-damage--skill' : ''
            }${popup.visible ? '' : ' battle-damage--fade'}`}
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            -{popup.damage}
          </span>
        )
      })}
    </div>
  )
}
