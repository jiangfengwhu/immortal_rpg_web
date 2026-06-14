import { useApp } from '@pixi/react'
import { useEffect, useRef } from 'react'
import { Assets } from 'pixi.js'
import 'pixi-spine'
import { Spine } from 'pixi-spine'

import {
  BOSS_ANIMATION,
  BOSS_ONCE_ANIMATIONS,
  BOSS_SPINE_ASSET,
  BOSS_WORLD_ANCHOR,
} from '../game/boss.constants'
import { useBossStore } from '../game/bossStore'
import { queueDisposeSpine, isSpineAlive } from '../game/spineLifecycle'

type BossCharacterProps = {
  worldWidth: number
  worldHeight: number
}

function getBossAnchor(worldWidth: number, worldHeight: number) {
  return {
    x: worldWidth * BOSS_WORLD_ANCHOR.xRatio,
    y: worldHeight * BOSS_WORLD_ANCHOR.yRatio,
  }
}

export function BossCharacter({ worldWidth, worldHeight }: BossCharacterProps) {
  const app = useApp()
  const currentAnimation = useBossStore((state) => state.currentAnimation)
  const setAvailableAnimations = useBossStore((state) => state.setAvailableAnimations)
  const setCurrentAnimation = useBossStore((state) => state.setCurrentAnimation)
  const setBossPosition = useBossStore((state) => state.setPosition)
  const spineRef = useRef<Spine | null>(null)
  const readyRef = useRef(false)
  const lastAppliedRef = useRef<string | null>(null)

  const applyAnimation = (spine: Spine, animationName: string) => {
    if (!spine.spineData.findAnimation(animationName)) {
      return
    }

    const loop = !BOSS_ONCE_ANIMATIONS.has(animationName)
    const track = spine.state.setAnimation(0, animationName, loop)

    if (!loop && track) {
      track.listener = {
        complete: () => {
          if (!isSpineAlive(spine)) {
            return
          }
          lastAppliedRef.current = BOSS_ANIMATION.idle
          spine.state.setAnimation(0, BOSS_ANIMATION.idle, true)
          setCurrentAnimation(BOSS_ANIMATION.idle)
        },
      }
    }

    lastAppliedRef.current = animationName
  }

  useEffect(() => {
    let mounted = true
    let spine: Spine | null = null

    const loadSpine = async () => {
      await Assets.load(BOSS_SPINE_ASSET.skeleton)

      if (!mounted) {
        return
      }

      const resource = Assets.get(BOSS_SPINE_ASSET.skeleton)
      spine = new Spine(resource.spineData)
      spine.scale.set(-BOSS_SPINE_ASSET.scale, BOSS_SPINE_ASSET.scale)
      spine.zIndex = 9
      const anchor = getBossAnchor(worldWidth, worldHeight)
      spine.x = anchor.x
      spine.y = anchor.y
      setBossPosition(anchor.x, anchor.y)

      const animationNames = spine.spineData.animations.map((animation) => animation.name)
      setAvailableAnimations(animationNames)

      app.stage.sortableChildren = true
      app.stage.addChild(spine)
      spineRef.current = spine
      readyRef.current = true
      lastAppliedRef.current = BOSS_ANIMATION.idle
      applyAnimation(spine, BOSS_ANIMATION.idle)
      setCurrentAnimation(BOSS_ANIMATION.idle)
    }

    void loadSpine()

    return () => {
      mounted = false
      readyRef.current = false
      lastAppliedRef.current = null

      if (spine) {
        queueDisposeSpine(spine)
      }

      spineRef.current = null
    }
  }, [app, setAvailableAnimations, setBossPosition, setCurrentAnimation, worldHeight, worldWidth])

  useEffect(() => {
    const spine = spineRef.current
    if (!spine) {
      return
    }

    const anchor = getBossAnchor(worldWidth, worldHeight)
    spine.x = anchor.x
    spine.y = anchor.y
    setBossPosition(anchor.x, anchor.y)
  }, [setBossPosition, worldHeight, worldWidth])

  useEffect(() => {
    const spine = spineRef.current
    if (!spine || !readyRef.current) {
      return
    }

    if (lastAppliedRef.current === currentAnimation) {
      return
    }

    applyAnimation(spine, currentAnimation)
  }, [currentAnimation])

  return null
}
