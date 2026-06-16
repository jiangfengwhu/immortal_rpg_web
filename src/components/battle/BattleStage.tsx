import { useEffect, useRef, useState } from 'react'

import { useBattleStore } from '../../battle/battleStore'
import { useWorldMapBackground } from '../../game/world/useWorldMapBackground'
import { BattleDamageNumbers } from './BattleDamageNumbers'
import { BattleUnitMarkers } from './BattleUnitMarkers'
import { BattleLootToast } from './BattleLootToast'
import { BattleHud } from './BattleHud'
import { BattleScene } from './BattleScene'
import { StageMapView } from '../StageMapView'

const COMPACT_INITIAL_SIZE = { width: 640, height: 280 }

export function BattleStage() {
  const phase = useBattleStore((state) => state.phase)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(COMPACT_INITIAL_SIZE)
  const { imageUrl } = useWorldMapBackground()
  const showPerformance = phase !== 'ready'

  useEffect(() => {
    if (!showPerformance) return
    const element = viewportRef.current
    if (!element) return

    const updateSize = () => {
      const { width, height } = element.getBoundingClientRect()
      if (width < 1 || height < 1) return
      setSize({
        width: Math.floor(width),
        height: Math.floor(height),
      })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [showPerformance])

  return (
    <section
      className={`battle-stage battle-stage--compact${showPerformance ? ' battle-stage--live' : ''}`}
      aria-label="战斗演武场"
    >
      {showPerformance ? (
        <>
          <div className="battle-stage__map-layer" aria-hidden>
            {imageUrl ? (
              <div className="battle-stage__map-bg" style={{ backgroundImage: `url(${imageUrl})` }} />
            ) : (
              <div className="battle-stage__map-bg battle-stage__map-bg--fallback" />
            )}
            <div className="battle-stage__map-veil" />
          </div>
          <div ref={viewportRef} className="battle-stage__viewport">
            <BattleScene width={size.width} height={size.height} mapBackdrop={Boolean(imageUrl)} />
            <BattleUnitMarkers />
            <BattleDamageNumbers />
          </div>
          <BattleHud />
          <BattleLootToast />
        </>
      ) : (
        <StageMapView />
      )}
    </section>
  )
}
