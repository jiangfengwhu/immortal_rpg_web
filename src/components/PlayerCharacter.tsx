import { useApp, useTick } from '@pixi/react'
import { useEffect, useRef } from 'react'
import { Assets } from 'pixi.js'
import 'pixi-spine'
import { Spine } from 'pixi-spine'

import {
  PLAYER_ANIMATION,
  PLAYER_MOVE_SPEED,
  SPINE_ASSET,
  WORLD_PADDING,
} from '../game/constants'
import { useBossStore } from '../game/bossStore'
import { usePlayerStore } from '../game/playerStore'
import { PLAYER_ONCE_ANIMATIONS } from '../game/skill.constants'
import { isSpineAlive, queueDisposeSpine } from '../game/spineLifecycle'
import { preloadFireSkill, spawnFireSkill } from '../game/spawnFireSkill'
import { useKeyboardInput } from '../game/useKeyboardInput'

type PlayerCharacterProps = {
  worldWidth: number
  worldHeight: number
}

const PREVIEW_ANIMATION_KEYS: Record<string, string> = {
  '1': PLAYER_ANIMATION.idle,
  '2': PLAYER_ANIMATION.skill1,
  '3': PLAYER_ANIMATION.death,
}

export function PlayerCharacter({ worldWidth, worldHeight }: PlayerCharacterProps) {
  const app = useApp()
  const movementRef = useKeyboardInput()
  const setIsMoving = usePlayerStore((state) => state.setIsMoving)
  const setAvailableAnimations = usePlayerStore((state) => state.setAvailableAnimations)
  const setCurrentAnimation = usePlayerStore((state) => state.setCurrentAnimation)
  const spineRef = useRef<Spine | null>(null)
  const currentAnimationRef = useRef<string>(PLAYER_ANIMATION.idle)
  const positionRef = useRef({
    x: worldWidth * 0.28,
    y: worldHeight * 0.72,
  })
  const facingRef = useRef(-1)

  const playAnimation = (spine: Spine, animationName: string, loop?: boolean) => {
    if (!spine.spineData.findAnimation(animationName)) {
      return
    }

    const shouldLoop = loop ?? !PLAYER_ONCE_ANIMATIONS.has(animationName)
    const track = spine.state.setAnimation(0, animationName, shouldLoop)

    if (!shouldLoop && track) {
      track.listener = {
        complete: () => {
          if (!isSpineAlive(spine)) {
            return
          }
          playAnimation(spine, PLAYER_ANIMATION.idle, true)
        },
      }
    }

    if (animationName === PLAYER_ANIMATION.skill1) {
      const skillAnimation = spine.spineData.findAnimation(animationName)
      const bossPosition = useBossStore.getState().position
      if (skillAnimation) {
        spawnFireSkill(app, {
          x: bossPosition.x,
          y: bossPosition.y,
          skillDuration: skillAnimation.duration,
        })
      }
    }

    currentAnimationRef.current = animationName
    setCurrentAnimation(animationName)
  }

  useEffect(() => {
    void preloadFireSkill()
  }, [])

  useEffect(() => {
    let mounted = true
    let spine: Spine | null = null

    const loadSpine = async () => {
      await Assets.load(SPINE_ASSET.skeleton)

      if (!mounted) {
        return
      }

      const resource = Assets.get(SPINE_ASSET.skeleton)
      spine = new Spine(resource.spineData)
      spine.scale.set(Math.abs(SPINE_ASSET.scale) * facingRef.current, SPINE_ASSET.scale)
      spine.zIndex = 10
      spine.x = positionRef.current.x
      spine.y = positionRef.current.y

      const animationNames = spine.spineData.animations.map((animation) => animation.name)
      setAvailableAnimations(animationNames)
      playAnimation(spine, PLAYER_ANIMATION.idle, true)

      app.stage.sortableChildren = true
      app.stage.addChild(spine)
      spineRef.current = spine
    }

    void loadSpine()

    return () => {
      mounted = false

      if (spine) {
        queueDisposeSpine(spine)
      }

      spineRef.current = null
    }
  }, [app, setAvailableAnimations, setCurrentAnimation])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const animationName = PREVIEW_ANIMATION_KEYS[event.key]
      const spine = spineRef.current

      if (!animationName || !spine) {
        return
      }

      playAnimation(spine, animationName)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setCurrentAnimation])

  useTick(() => {
    const spine = spineRef.current
    if (!spine) {
      return
    }

    const movement = movementRef.current
    const isMoving = movement.x !== 0 || movement.y !== 0

    if (isMoving) {
      let deltaX = movement.x * PLAYER_MOVE_SPEED
      let deltaY = movement.y * PLAYER_MOVE_SPEED

      if (movement.x !== 0 && movement.y !== 0) {
        const scale = 1 / Math.sqrt(2)
        deltaX *= scale
        deltaY *= scale
      }

      positionRef.current.x = clamp(
        positionRef.current.x + deltaX,
        WORLD_PADDING,
        worldWidth * 0.5 - WORLD_PADDING,
      )
      positionRef.current.y = clamp(
        positionRef.current.y + deltaY,
        worldHeight * 0.45,
        worldHeight - WORLD_PADDING,
      )

      if (movement.x < 0) {
        facingRef.current = 1
      } else if (movement.x > 0) {
        facingRef.current = -1
      }

      if (currentAnimationRef.current !== PLAYER_ANIMATION.idle) {
        playAnimation(spine, PLAYER_ANIMATION.idle, true)
      }
    }

    spine.x = positionRef.current.x
    spine.y = positionRef.current.y
    spine.scale.x = Math.abs(SPINE_ASSET.scale) * facingRef.current
    spine.scale.y = SPINE_ASSET.scale

    setIsMoving(isMoving)
  })

  return null
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
