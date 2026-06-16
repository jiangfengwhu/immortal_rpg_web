import { useApp } from '@pixi/react'
import { useEffect, useRef } from 'react'
import 'pixi-spine'
import { Spine } from 'pixi-spine'

import type { BattleUnitConfig } from '../../battle/battle.types'
import { resolveUnitProfile } from '../../battle/resolveBattleAnimation'
import { loadSpineAsset } from '../../game/loadSpineAsset'
import {
  applySpineIdlePose,
  computeSpineFitScale,
  measureSpineFootBounds,
  placeSpineAtFoot,
} from '../../game/spineStageLayout'
import { isSpineAlive, queueDisposeSpine } from '../../game/spineLifecycle'

type StageDisplayActorProps = {
  config: BattleUnitConfig
  worldWidth: number
  worldHeight: number
}

function layoutStageActor(spine: Spine, config: BattleUnitConfig, worldWidth: number, worldHeight: number) {
  applySpineIdlePose(spine, config.animations.idle)
  const bounds = measureSpineFootBounds(spine)
  const finalScale = computeSpineFitScale(bounds, worldHeight, config.fitHeightWeight, config.scale)
  const scaleX = finalScale * config.faceDirection
  const footX = worldWidth * config.xRatio
  const footY = worldHeight * config.yRatio
  placeSpineAtFoot(spine, footX, footY, scaleX, finalScale)
}

export function StageDisplayActor({ config, worldWidth, worldHeight }: StageDisplayActorProps) {
  const app = useApp()
  const spineRef = useRef<Spine | null>(null)

  useEffect(() => {
    let mounted = true
    let spine: Spine | null = null

    const loadSpine = async () => {
      const resource = await loadSpineAsset(config.skeleton)
      if (!mounted || !resource?.spineData) return

      spine = new Spine(resource.spineData)
      spine.zIndex = config.side === 'player' ? 10 : 9

      const profile = resolveUnitProfile(resource.spineData, config.animations)
      const idle = profile.animations.idle
      if (spine.spineData.findAnimation(idle)) {
        spine.state.setAnimation(0, idle, true)
      }

      layoutStageActor(spine, config, worldWidth, worldHeight)

      app.stage.sortableChildren = true
      app.stage.addChild(spine)
      spineRef.current = spine
    }

    void loadSpine()

    return () => {
      mounted = false
      spineRef.current = null
      if (spine && isSpineAlive(spine)) {
        queueDisposeSpine(spine)
      }
    }
  }, [app, config, worldHeight, worldWidth])

  useEffect(() => {
    const spine = spineRef.current
    if (!spine || !isSpineAlive(spine)) return
    layoutStageActor(spine, config, worldWidth, worldHeight)
  }, [config, worldHeight, worldWidth])

  return null
}
