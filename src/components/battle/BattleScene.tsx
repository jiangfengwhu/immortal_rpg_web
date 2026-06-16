import { Stage } from '@pixi/react'
import { useEffect } from 'react'

import { ENEMY_BATTLE_UNIT, PLAYER_BATTLE_UNIT } from '../../battle/battle.constants'
import { useBattleStore } from '../../battle/battleStore'
import { SpineDisposalFlush } from '../SpineDisposalFlush'
import { WorldBackground } from '../WorldBackground'
import { BattleDirector } from './BattleDirector'
import { BattleHitEffect } from './BattleHitEffect'
import { BattleUnitActor } from './BattleUnitActor'

type BattleSceneProps = {
  width: number
  height: number
  mapBackdrop?: boolean
}

export function BattleScene({ width, height, mapBackdrop = false }: BattleSceneProps) {
  const playerAnimation = useBattleStore((state) => state.playerAnimation)
  const enemyAnimation = useBattleStore((state) => state.enemyAnimation)
  const setUnitProfile = useBattleStore((state) => state.setUnitProfile)
  const setLoadError = useBattleStore((state) => state.setLoadError)
  const setArenaSize = useBattleStore((state) => state.setArenaSize)

  useEffect(() => {
    if (width < 1 || height < 1) return
    setArenaSize(width, height)
  }, [height, setArenaSize, width])

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
      <WorldBackground width={width} height={height} transparent={mapBackdrop} />
      <SpineDisposalFlush />
      <BattleDirector />
      <BattleHitEffect worldWidth={width} worldHeight={height} />
      <BattleUnitActor
        config={PLAYER_BATTLE_UNIT}
        animationName={playerAnimation}
        worldWidth={width}
        worldHeight={height}
        onReady={({ profile }) => {
          setUnitProfile('player', profile)
          setLoadError(null)
        }}
        onError={(message) => setLoadError(message)}
      />
      <BattleUnitActor
        config={ENEMY_BATTLE_UNIT}
        animationName={enemyAnimation}
        worldWidth={width}
        worldHeight={height}
        onReady={({ profile }) => setUnitProfile('enemy', profile)}
        onError={(message) => setLoadError(message)}
      />
    </Stage>
  )
}
