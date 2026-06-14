import { useApp } from '@pixi/react'
import { useEffect, useRef } from 'react'
import 'pixi-spine'
import { Spine } from 'pixi-spine'

import { BATTLE_HIT_EFFECT, PLAYER_BATTLE_UNIT } from '../../battle/battle.constants'
import { useBattleStore } from '../../battle/battleStore'
import { loadSpineAsset } from '../../game/loadSpineAsset'
import { isSpineAlive, queueDisposeSpine } from '../../game/spineLifecycle'

function resolveHitEffectPosition(
  worldWidth: number,
  worldHeight: number,
  actor: { x: number; y: number } | undefined,
  target: { x: number; y: number } | undefined,
) {
  if (actor && target) {
    return {
      x: actor.x * 0.42 + target.x * 0.58,
      y: (actor.y + target.y) * 0.5 - worldHeight * 0.02,
    }
  }

  return {
    x: worldWidth * 0.5,
    y: worldHeight * PLAYER_BATTLE_UNIT.yRatio - worldHeight * 0.04,
  }
}

type BattleHitEffectProps = {
  worldWidth: number
  worldHeight: number
}

export function BattleHitEffect({ worldWidth, worldHeight }: BattleHitEffectProps) {
  const app = useApp()
  const hitEffect = useBattleStore((state) => state.hitEffect)
  const spineDataRef = useRef<Spine['spineData'] | null>(null)
  const activeSpineRef = useRef<Spine | null>(null)
  const lastEffectIdRef = useRef(0)

  useEffect(() => {
    let mounted = true

    void loadSpineAsset(BATTLE_HIT_EFFECT.skeleton)
      .then((resource) => {
        if (!mounted || !resource?.spineData) {
          return
        }

        spineDataRef.current = resource.spineData
      })
      .catch((error: unknown) => {
        console.warn('[BattleHitEffect] 加载失败', error)
      })

    return () => {
      mounted = false
      spineDataRef.current = null

      if (activeSpineRef.current) {
        queueDisposeSpine(activeSpineRef.current)
        activeSpineRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!hitEffect || hitEffect.id === lastEffectIdRef.current) {
      return
    }

    lastEffectIdRef.current = hitEffect.id

    const spineData = spineDataRef.current
    if (!spineData) {
      return
    }

    if (activeSpineRef.current && isSpineAlive(activeSpineRef.current)) {
      queueDisposeSpine(activeSpineRef.current)
      activeSpineRef.current = null
    }

    const animationName = BATTLE_HIT_EFFECT.animations[hitEffect.kind]
    if (!spineData.findAnimation(animationName)) {
      return
    }

    const { unitWorldPosition } = useBattleStore.getState()
    const position = resolveHitEffectPosition(
      worldWidth,
      worldHeight,
      unitWorldPosition[hitEffect.actor],
      unitWorldPosition[hitEffect.target],
    )

    const spine = new Spine(spineData)
    spine.zIndex = BATTLE_HIT_EFFECT.zIndex
    spine.scale.set(BATTLE_HIT_EFFECT.scale)
    spine.x = position.x
    spine.y = position.y

    const track = spine.state.setAnimation(0, animationName, false)
    track.listener = {
      complete: () => {
        if (activeSpineRef.current === spine) {
          activeSpineRef.current = null
        }

        queueDisposeSpine(spine)
      },
    }

    app.stage.sortableChildren = true
    app.stage.addChild(spine)
    activeSpineRef.current = spine
  }, [app, hitEffect, worldHeight, worldWidth])

  return null
}
