import { Stage } from '@pixi/react'
import { useEffect, useState } from 'react'

import { BossCharacter } from './BossCharacter'
import { PlayerCharacter } from './PlayerCharacter'
import { SpineDisposalFlush } from './SpineDisposalFlush'
import { WorldBackground } from './WorldBackground'

export function GameScene() {
  const [viewport, setViewport] = useState(getViewportSize)

  useEffect(() => {
    const onResize = () => setViewport(getViewportSize())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <Stage
      width={viewport.width}
      height={viewport.height}
      options={{
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      }}
    >
      <WorldBackground width={viewport.width} height={viewport.height} />
      <SpineDisposalFlush />
      <BossCharacter worldWidth={viewport.width} worldHeight={viewport.height} />
      <PlayerCharacter worldWidth={viewport.width} worldHeight={viewport.height} />
    </Stage>
  )
}

function getViewportSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}
