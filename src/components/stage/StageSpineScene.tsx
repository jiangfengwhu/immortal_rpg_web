import { Stage } from '@pixi/react'

import { STAGE_BOAR_DISPLAY, STAGE_PLAYER_DISPLAY } from '../../battle/stageDisplay.constants'
import { SpineDisposalFlush } from '../SpineDisposalFlush'
import { StageDisplayActor } from './StageDisplayActor'

type StageSpineSceneProps = {
  width: number
  height: number
  showBoar?: boolean
}

export function StageSpineScene({ width, height, showBoar = false }: StageSpineSceneProps) {
  if (width < 1 || height < 1) return null

  return (
    <Stage
      width={width}
      height={height}
      options={{
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      }}
    >
      <SpineDisposalFlush />
      <StageDisplayActor
        config={STAGE_PLAYER_DISPLAY}
        worldWidth={width}
        worldHeight={height}
      />
      {showBoar && (
        <StageDisplayActor config={STAGE_BOAR_DISPLAY} worldWidth={width} worldHeight={height} />
      )}
    </Stage>
  )
}
