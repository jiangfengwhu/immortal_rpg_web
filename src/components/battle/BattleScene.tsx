import { Stage } from '@pixi/react'
import { useEffect, useState } from 'react'

import { ENEMY_BATTLE_UNIT, PLAYER_BATTLE_UNIT } from '../../battle/battle.constants'
import { useBattleStore } from '../../battle/battleStore'
import { SpineDisposalFlush } from '../SpineDisposalFlush'
import { WorldBackground } from '../WorldBackground'
import { BattleDirector } from './BattleDirector'
import { BattleHitEffect } from './BattleHitEffect'
import { BattleUnitActor } from './BattleUnitActor'

export function BattleScene() {
  const [viewport, setViewport] = useState(getViewportSize)
  const playerAnimation = useBattleStore((state) => state.playerAnimation)
  const enemyAnimation = useBattleStore((state) => state.enemyAnimation)
  const setUnitProfile = useBattleStore((state) => state.setUnitProfile)
  const setLoadError = useBattleStore((state) => state.setLoadError)
  const setArenaSize = useBattleStore((state) => state.setArenaSize)

  useEffect(() => {
    const onResize = () => {
      const nextViewport = getViewportSize()
      setViewport(nextViewport)
      setArenaSize(nextViewport.width, nextViewport.height)
    }

    setArenaSize(viewport.width, viewport.height)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [setArenaSize, viewport.height, viewport.width])

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
      <BattleDirector />
      <BattleHitEffect worldWidth={viewport.width} worldHeight={viewport.height} />
      <BattleUnitActor
        config={PLAYER_BATTLE_UNIT}
        animationName={playerAnimation}
        worldWidth={viewport.width}
        worldHeight={viewport.height}
        onReady={({ profile }) => {
          setUnitProfile('player', profile)
          setLoadError(null)
        }}
        onError={(message) => setLoadError(message)}
      />
      <BattleUnitActor
        config={ENEMY_BATTLE_UNIT}
        animationName={enemyAnimation}
        worldWidth={viewport.width}
        worldHeight={viewport.height}
        onReady={({ profile }) => setUnitProfile('enemy', profile)}
        onError={(message) => setLoadError(message)}
      />
    </Stage>
  )
}

function getViewportSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}
