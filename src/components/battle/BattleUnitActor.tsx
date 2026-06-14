import { useApp, useTick } from '@pixi/react'
import { useEffect, useRef } from 'react'
import 'pixi-spine'
import { Spine } from 'pixi-spine'

import { COMBAT_ADVANCE_MS, COMBAT_RETURN_MS, ENTRANCE_DURATION_MS, FLYOUT_DURATION_MS } from '../../battle/battleTiming'
import { COMBAT_CENTER_GAP_RATIO, FIGHT_INWARD_NUDGE } from '../../battle/battle.constants'
import { resolveUnitProfile, shouldLoopBattleAnimation } from '../../battle/resolveBattleAnimation'
import type { BattleUnitConfig } from '../../battle/battle.types'
import { useBattleStore } from '../../battle/battleStore'
import { loadSpineAsset } from '../../game/loadSpineAsset'
import { isSpineAlive, queueDisposeSpine } from '../../game/spineLifecycle'

type BattleUnitActorProps = {
  config: BattleUnitConfig
  animationName: string
  worldWidth: number
  worldHeight: number
  onReady: (payload: { profile: ReturnType<typeof resolveUnitProfile> }) => void
  onError: (message: string) => void
}

type HomeTransform = {
  x: number
  y: number
}

type EntranceState = {
  active: boolean
  elapsed: number
  startX: number
  endX: number
  y: number
}

type CombatShiftState = {
  active: boolean
  elapsed: number
  startX: number
  endX: number
  duration: number
}

export function BattleUnitActor({
  config,
  animationName,
  worldWidth,
  worldHeight,
  onReady,
  onError,
}: BattleUnitActorProps) {
  const app = useApp()
  const spineRef = useRef<Spine | null>(null)
  const profileRef = useRef<ReturnType<typeof resolveUnitProfile> | null>(null)
  const homeRef = useRef<HomeTransform>({ x: 0, y: 0 })
  const flyOutRef = useRef({ active: false, elapsed: 0 })
  const entranceRef = useRef<EntranceState>({
    active: false,
    elapsed: 0,
    startX: 0,
    endX: 0,
    y: 0,
  })
  const combatShiftRef = useRef<CombatShiftState>({
    active: false,
    elapsed: 0,
    startX: 0,
    endX: 0,
    duration: COMBAT_ADVANCE_MS,
  })
  const isDeadRef = useRef(false)
  const layoutRef = useRef<{ fitScale: number; bodyWidth: number } | null>(null)
  const callbacksRef = useRef({ onReady, onError })
  callbacksRef.current = { onReady, onError }

  const phase = useBattleStore((state) => state.phase)
  const battleGeneration = useBattleStore((state) => state.battleGeneration)
  const unitDeath = useBattleStore((state) => state.unitDeath)
  const markEntranceComplete = useBattleStore((state) => state.markEntranceComplete)
  const setUnitWorldPosition = useBattleStore((state) => state.setUnitWorldPosition)

  useEffect(() => {
    layoutRef.current = null
  }, [worldHeight])

  const measureLayout = (spine: Spine) => {
    if (layoutRef.current) {
      return layoutRef.current
    }

    const savedScaleX = spine.scale.x
    const savedScaleY = spine.scale.y
    spine.scale.set(1, 1)
    spine.update(0)
    const bounds = spine.getLocalBounds()
    const maxDimension = Math.max(bounds.width, bounds.height, 1)

    layoutRef.current = {
      fitScale: (worldHeight * config.fitHeightWeight) / maxDimension,
      bodyWidth: bounds.width,
    }

    spine.scale.set(savedScaleX, savedScaleY)
    return layoutRef.current
  }

  const applyUnitScale = (spine: Spine) => {
    const layout = measureLayout(spine)
    const finalScale = layout.fitScale * config.scale
    spine.scale.set(finalScale * config.faceDirection, finalScale)
    spine.update(0)
  }

  const getUnitPosition = (spine: Spine, mode: 'spawn' | 'fight') => {
    const layout = measureLayout(spine)
    applyUnitScale(spine)

    const finalScale = layout.fitScale * config.scale
    const y = worldHeight * config.yRatio

    if (mode === 'fight') {
      const gap = worldWidth * COMBAT_CENTER_GAP_RATIO
      const centerX = worldWidth * 0.5
      const scaleX = finalScale * config.faceDirection

      const x =
        config.side === 'player'
          ? resolveFrontEdgeX(spine, centerX - gap * 0.5, scaleX, 'right')
          : resolveFrontEdgeX(spine, centerX + gap * 0.5, scaleX, 'left')

      return { x, y }
    }

    const bodyWidth = layout.bodyWidth * finalScale
    const inwardNudge = bodyWidth * FIGHT_INWARD_NUDGE
    const baseX = worldWidth * config.spawnXRatio

    return {
      x: config.side === 'player' ? baseX + inwardNudge * 0.3 : baseX - inwardNudge * 0.3,
      y,
    }
  }

  const startCombatShift = (spine: Spine, endX: number, duration: number) => {
    combatShiftRef.current = {
      active: true,
      elapsed: 0,
      startX: spine.x,
      endX,
      duration,
    }
  }

  const startCombatAdvance = (spine: Spine) => {
    const direction = config.side === 'player' ? 1 : -1
    const endX = homeRef.current.x + direction * worldWidth * config.combatAdvanceRatio
    startCombatShift(spine, endX, COMBAT_ADVANCE_MS)
  }

  const startCombatReturn = (spine: Spine) => {
    if (Math.abs(spine.x - homeRef.current.x) < 0.5) {
      spine.x = homeRef.current.x
      combatShiftRef.current.active = false
      return
    }

    startCombatShift(spine, homeRef.current.x, COMBAT_RETURN_MS)
  }

  const beginEntrance = (spine: Spine, profile: ReturnType<typeof resolveUnitProfile>) => {
    const spawn = getUnitPosition(spine, 'spawn')
    const fight = getUnitPosition(spine, 'fight')

    entranceRef.current = {
      active: true,
      elapsed: 0,
      startX: spawn.x,
      endX: fight.x,
      y: fight.y,
    }

    spine.x = spawn.x
    spine.y = spawn.y
    playAnimation(spine, profile, profile.animations.run, isDeadRef, { loop: true, homeRef })
  }

  const resetUnitForBattle = (spine: Spine, profile: ReturnType<typeof resolveUnitProfile>) => {
    isDeadRef.current = false
    flyOutRef.current = { active: false, elapsed: 0 }
    entranceRef.current.active = false
    combatShiftRef.current.active = false

    spine.alpha = 1
    spine.visible = true
    spine.rotation = 0
    applyUnitScale(spine)

    if (phase === 'entering') {
      beginEntrance(spine, profile)
      return
    }

    const fight = getUnitPosition(spine, 'fight')
    spine.x = fight.x
    spine.y = fight.y
    syncHomeFromSpine(spine, homeRef)
    playAnimation(spine, profile, profile.animations.idle, isDeadRef, { homeRef })
  }

  useEffect(() => {
    let mounted = true
    let spine: Spine | null = null

    const loadSpine = async () => {
      try {
        const resource = await loadSpineAsset(config.skeleton)

        if (!mounted) {
          return
        }

        if (!resource?.spineData) {
          throw new Error('Spine 数据解析失败')
        }

        spine = new Spine(resource.spineData)
        spine.zIndex = config.side === 'player' ? 10 : 9

        const profile = resolveUnitProfile(resource.spineData, config.animations)
        profileRef.current = profile

        applyUnitScale(spine)
        const spawn = getUnitPosition(spine, 'spawn')
        spine.x = spawn.x
        spine.y = spawn.y
        syncHomeFromSpine(spine, homeRef)
        playAnimation(spine, profile, profile.animations.idle, isDeadRef, { homeRef })

        app.stage.sortableChildren = true
        app.stage.addChild(spine)
        spineRef.current = spine

        callbacksRef.current.onReady({ profile })
      } catch (error) {
        if (!mounted) {
          return
        }

        const message = error instanceof Error ? error.message : 'Spine 加载失败'
        callbacksRef.current.onError(message)
      }
    }

    void loadSpine()

    return () => {
      mounted = false
      profileRef.current = null
      spineRef.current = null

      if (spine) {
        queueDisposeSpine(spine)
      }
    }
  }, [app, config, worldHeight, worldWidth])

  useEffect(() => {
    const spine = spineRef.current
    const profile = profileRef.current
    if (!spine || !profile || !isSpineAlive(spine) || battleGeneration === 0) {
      return
    }

    resetUnitForBattle(spine, profile)
  }, [battleGeneration, config, phase, worldHeight, worldWidth])

  useEffect(() => {
    if (!unitDeath || unitDeath.side !== config.side) {
      return
    }

    isDeadRef.current = true
    entranceRef.current.active = false
    combatShiftRef.current.active = false

    if (unitDeath.mode === 'flyout') {
      flyOutRef.current = { active: true, elapsed: 0 }

      const spine = spineRef.current
      if (spine && isSpineAlive(spine)) {
        syncHomeFromSpine(spine, homeRef)
      }
    }
  }, [config.side, unitDeath?.id])

  useEffect(() => {
    const spine = spineRef.current
    if (
      !spine ||
      !isSpineAlive(spine) ||
      entranceRef.current.active ||
      flyOutRef.current.active ||
      combatShiftRef.current.active
    ) {
      return
    }

    applyUnitScale(spine)
    const fight = getUnitPosition(spine, 'fight')
    spine.x = fight.x
    spine.y = fight.y
    syncHomeFromSpine(spine, homeRef)
  }, [config, worldHeight, worldWidth])

  useEffect(() => {
    const spine = spineRef.current
    const profile = profileRef.current
    if (
      !spine ||
      !profile ||
      !isSpineAlive(spine) ||
      entranceRef.current.active ||
      flyOutRef.current.active ||
      phase === 'entering'
    ) {
      return
    }

    const isCombat =
      animationName === profile.animations.attack ||
      animationName === profile.animations.skill

    playAnimation(spine, profile, animationName, isDeadRef, {
      homeRef,
      onReturnHome: () => startCombatReturn(spine),
    })

    if (isCombat) {
      startCombatAdvance(spine)
    } else if (animationName === profile.animations.idle) {
      startCombatReturn(spine)
    } else {
      combatShiftRef.current.active = false
      spine.x = homeRef.current.x
    }
  }, [animationName, phase, worldWidth])

  useTick((delta) => {
    const spine = spineRef.current
    const profile = profileRef.current
    if (!spine || !isSpineAlive(spine)) {
      return
    }

    const entrance = entranceRef.current
    if (entrance.active && profile) {
      entrance.elapsed += (delta / 60) * 1000
      const progress = Math.min(entrance.elapsed / ENTRANCE_DURATION_MS, 1)
      const eased = easeOutCubic(progress)

      spine.x = entrance.startX + (entrance.endX - entrance.startX) * eased
      spine.y = entrance.y

      if (progress >= 1) {
        entrance.active = false
        spine.x = entrance.endX
        syncHomeFromSpine(spine, homeRef)
        playAnimation(spine, profile, profile.animations.idle, isDeadRef, {
          homeRef,
          onReturnHome: () => startCombatReturn(spine),
        })
        markEntranceComplete(config.side)
      }
      return
    }

    const combatShift = combatShiftRef.current
    if (combatShift.active) {
      combatShift.elapsed += (delta / 60) * 1000
      const progress = Math.min(combatShift.elapsed / combatShift.duration, 1)
      const eased = easeOutCubic(progress)

      spine.x = combatShift.startX + (combatShift.endX - combatShift.startX) * eased

      if (progress >= 1) {
        combatShift.active = false
        spine.x = combatShift.endX
      }
      return
    }

    const flyOut = flyOutRef.current
    if (!flyOut.active) {
      setUnitWorldPosition(config.side, spine.x, spine.y)
      return
    }

    flyOut.elapsed += (delta / 60) * 1000
    const progress = Math.min(flyOut.elapsed / FLYOUT_DURATION_MS, 1)
    const home = homeRef.current
    const exitDirection = config.side === 'player' ? -1 : 1

    spine.x = home.x + exitDirection * progress * worldWidth * 0.42
    spine.y = home.y - Math.sin(progress * Math.PI) * 96 - progress * 28
    spine.alpha = 1 - progress * 0.95
    spine.rotation = exitDirection * progress * 0.55

    if (progress >= 1) {
      flyOut.active = false
      spine.visible = false
    }
  })

  return null
}

function syncHomeFromSpine(spine: Spine, homeRef: { current: HomeTransform }) {
  homeRef.current = {
    x: spine.x,
    y: spine.y,
  }
}

function playAnimation(
  spine: Spine,
  profile: ReturnType<typeof resolveUnitProfile>,
  animationName: string,
  isDeadRef: { current: boolean },
  options?: {
    loop?: boolean
    homeRef?: { current: HomeTransform }
    onReturnHome?: () => void
  },
) {
  const resolved = profile.animations
  if (!spine.spineData.findAnimation(animationName)) {
    return
  }

  const isIdle = animationName === resolved.idle && shouldLoopBattleAnimation('idle')
  const isDeath = animationName === resolved.death
  const loop = options?.loop ?? isIdle
  const track = spine.state.setAnimation(0, animationName, loop)

  if (!loop && track && !isDeath && !isDeadRef.current) {
    track.listener = {
      complete: () => {
        if (!isSpineAlive(spine) || isDeadRef.current) {
          return
        }

        if (options?.onReturnHome) {
          options.onReturnHome()
        } else if (options?.homeRef) {
          spine.x = options.homeRef.current.x
        }

        playAnimation(spine, profile, resolved.idle, isDeadRef, options)
      },
    }
  }
}

function resolveFrontEdgeX(
  spine: Spine,
  targetFrontX: number,
  scaleX: number,
  facing: 'left' | 'right',
) {
  spine.update(0)
  const bounds = spine.getLocalBounds()
  const magnitude = Math.abs(scaleX)

  if (facing === 'right') {
    return targetFrontX - (bounds.x + bounds.width) * magnitude
  }

  return targetFrontX - bounds.x * magnitude
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3
}
