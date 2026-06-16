import { useEffect } from 'react'

import { useGameSessionStore } from '../game/gameSessionStore'
import { HARVEST_FLOAT_MS } from '../game/harvest/harvest.types'

export function StageHarvestFloat() {
  const harvestFloat = useGameSessionStore((state) => state.harvestFloat)
  const clearHarvestFloat = useGameSessionStore((state) => state.clearHarvestFloat)

  useEffect(() => {
    if (!harvestFloat) return
    const timer = window.setTimeout(() => clearHarvestFloat(), HARVEST_FLOAT_MS)
    return () => window.clearTimeout(timer)
  }, [harvestFloat, clearHarvestFloat])

  if (!harvestFloat || harvestFloat.items.length === 0) return null

  return (
    <div className="stage-harvest" aria-live="polite">
      <p className="stage-harvest__title">采药入篓</p>
      <ul className="stage-harvest__list">
        {harvestFloat.items.map((item, index) => (
          <li
            key={`${item.name}-${index}`}
            className="stage-harvest__item"
            style={{ animationDelay: `${index * 0.12}s` }}
          >
            <span className="stage-harvest__glyph" aria-hidden>
              草
            </span>
            <span className="stage-harvest__name">{item.name}</span>
            {item.count > 1 && <span className="stage-harvest__count">×{item.count}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
