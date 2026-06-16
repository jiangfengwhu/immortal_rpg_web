import { useEffect, useRef } from 'react'

import {
  BATTLE_TIMING,
  getActionDurationMs,
  getDeathDurationMs,
  getStrikeDelayMs,
} from '../../battle/battleTiming'
import {
  getBattleUnitConfig,
  useBattleStore,
  type BattleEvent,
} from '../../battle/battleStore'
import type { BattleActionKind, BattleSide } from '../../battle/battle.types'
import { resolveActionAnimationRole } from '../../battle/resolveBattleAnimation'
import type { ResolvedUnitProfile } from '../../battle/resolveBattleAnimation'

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

type DeathPlayback = {
  hasDeathAnimation: boolean
  durationMs: number
}

function resolveDeathPlayback(
  side: BattleSide,
  unitProfiles: Partial<Record<BattleSide, ResolvedUnitProfile>>,
): DeathPlayback {
  const profile = unitProfiles[side]
  const hasDeathAnimation = profile?.capabilities.death ?? false
  return {
    hasDeathAnimation,
    durationMs: getDeathDurationMs(hasDeathAnimation, profile?.getDuration('death') ?? 0),
  }
}

function beginUnitDeath(
  side: BattleSide,
  unitProfiles: Partial<Record<BattleSide, ResolvedUnitProfile>>,
  setUnitAnimation: (side: BattleSide, animation: string) => void,
  triggerUnitDeath: (payload: { side: BattleSide; mode: 'animation' | 'flyout' }) => void,
) {
  const profile = unitProfiles[side]
  const playback = resolveDeathPlayback(side, unitProfiles)

  if (playback.hasDeathAnimation && profile) {
    setUnitAnimation(side, profile.animations.death)
    triggerUnitDeath({ side, mode: 'animation' })
    return
  }

  triggerUnitDeath({ side, mode: 'flyout' })
}

export function BattleDirector() {
  const phase = useBattleStore((state) => state.phase)
  const sim = useBattleStore((state) => state.sim)
  const applySnapshot = useBattleStore((state) => state.applySnapshot)
  const setPhase = useBattleStore((state) => state.setPhase)
  const setUnitAnimation = useBattleStore((state) => state.setUnitAnimation)
  const triggerUnitDeath = useBattleStore((state) => state.triggerUnitDeath)
  const triggerHitEffect = useBattleStore((state) => state.triggerHitEffect)
  const runIdRef = useRef(0)

  useEffect(() => {
    if (phase !== 'fighting') {
      return
    }

    const runId = runIdRef.current + 1
    runIdRef.current = runId
    let cancelled = false

    const isStale = () => cancelled || runIdRef.current !== runId

    const processActionWithHit = async (
      action: Extract<BattleEvent, { type: 'ACTION' }>,
      hit: Extract<BattleEvent, { type: 'HIT' }>,
    ) => {
      const { unitProfiles } = useBattleStore.getState()
      const actorConfig = getBattleUnitConfig(action.actor)
      const targetConfig = getBattleUnitConfig(hit.target)
      const actorProfile = unitProfiles[action.actor]
      const targetProfile = unitProfiles[hit.target]
      const role = resolveActionAnimationRole(action.kind)
      const attackAnimation = actorProfile?.animations[role] ?? actorConfig.animations[role]

      setUnitAnimation(action.actor, attackAnimation)

      const durationSec = actorProfile?.getDuration(role) ?? 0.6
      const hasSkillAnimation = resolveHasSkillAnimation(action.kind, actorProfile)
      const actionMs = getActionDurationMs(action.kind, durationSec, hasSkillAnimation)
      const strikeMs = getStrikeDelayMs(action.kind, durationSec, hasSkillAnimation)

      await sleep(strikeMs)
      if (isStale()) {
        return { handledDeath: false }
      }

      triggerHitEffect({ actor: action.actor, target: hit.target, kind: action.kind })
      useBattleStore.getState().pushDamagePopup({
        target: hit.target,
        damage: hit.damage,
        kind: action.kind,
      })
      applySnapshot()

      const isLethal = hit.remainingHp <= 0
      if (isLethal) {
        beginUnitDeath(hit.target, unitProfiles, setUnitAnimation, triggerUnitDeath)
        const deathMs = resolveDeathPlayback(hit.target, unitProfiles).durationMs
        const attackTailMs = Math.max(0, actionMs - strikeMs)

        await Promise.all([sleep(attackTailMs), sleep(deathMs)])
        if (isStale()) {
          return { handledDeath: true }
        }

        if (!sim.isFinished()) {
          const actorIdle = actorProfile?.animations.idle ?? actorConfig.animations.idle
          setUnitAnimation(action.actor, actorIdle)
        }

        return { handledDeath: true }
      }

      const hitAnimation = targetProfile?.animations.hit ?? targetConfig.animations.hit
      setUnitAnimation(hit.target, hitAnimation)

      await sleep(Math.max(0, actionMs - strikeMs))
      if (isStale()) {
        return { handledDeath: false }
      }

      if (!sim.isFinished()) {
        const actorIdle = actorProfile?.animations.idle ?? actorConfig.animations.idle
        setUnitAnimation(action.actor, actorIdle)
      }

      await sleep(BATTLE_TIMING.hitDelayMs)
      if (isStale()) {
        return { handledDeath: false }
      }

      const targetIdle = targetProfile?.animations.idle ?? targetConfig.animations.idle
      setUnitAnimation(hit.target, targetIdle)
      return { handledDeath: false }
    }

    const processEvent = async (event: BattleEvent) => {
      const { unitProfiles } = useBattleStore.getState()

      if (event.type === 'ACTION') {
        const config = getBattleUnitConfig(event.actor)
        const profile = unitProfiles[event.actor]
        const role = resolveActionAnimationRole(event.kind)
        const animation = profile?.animations[role] ?? config.animations[role]

        setUnitAnimation(event.actor, animation)

        const durationSec = profile?.getDuration(role) ?? 0.6
        const hasSkillAnimation = resolveHasSkillAnimation(event.kind, profile)
        await sleep(getActionDurationMs(event.kind, durationSec, hasSkillAnimation))

        if (!sim.isFinished()) {
          const idle = profile?.animations.idle ?? config.animations.idle
          setUnitAnimation(event.actor, idle)
        }
        return
      }

      if (event.type === 'HIT') {
        const config = getBattleUnitConfig(event.target)
        const profile = unitProfiles[event.target]
        const animation = profile?.animations.hit ?? config.animations.hit
        setUnitAnimation(event.target, animation)
        useBattleStore.getState().pushDamagePopup({
          target: event.target,
          damage: event.damage,
          kind: 'attack',
        })
        applySnapshot()
        await sleep(BATTLE_TIMING.hitDelayMs)

        if (!sim.isFinished() && event.remainingHp > 0) {
          const idle = profile?.animations.idle ?? config.animations.idle
          setUnitAnimation(event.target, idle)
        }
        return
      }

      if (event.type === 'DEATH') {
        const playback = resolveDeathPlayback(event.side, unitProfiles)
        beginUnitDeath(event.side, unitProfiles, setUnitAnimation, triggerUnitDeath)
        await sleep(playback.durationMs)
        return
      }

      if (event.type === 'VICTORY') {
        applySnapshot()
      }
    }

    const processRoundEvents = async (events: BattleEvent[]) => {
      for (let index = 0; index < events.length; index += 1) {
        if (isStale()) {
          return
        }

        const event = events[index]
        const nextEvent = events[index + 1]

        if (event.type === 'ACTION' && nextEvent?.type === 'HIT') {
          const { handledDeath } = await processActionWithHit(event, nextEvent)
          index += 1
          if (handledDeath && events[index + 1]?.type === 'DEATH') {
            index += 1
          }
          continue
        }

        if (event.type === 'DEATH') {
          const previousHit = events[index - 1]
          if (previousHit?.type === 'HIT' && previousHit.remainingHp <= 0) {
            continue
          }
        }

        await processEvent(event)
      }
    }

    const runBattle = async () => {
      while (!isStale() && !sim.isFinished()) {
        const events = sim.advanceRound()

        if (events.length === 0) {
          await sleep(90)
          continue
        }

        await processRoundEvents(events)
      }

      if (!isStale()) {
        applySnapshot()
        setPhase('ended')
      }
    }

    void runBattle()

    return () => {
      cancelled = true
    }
  }, [applySnapshot, phase, setPhase, setUnitAnimation, sim, triggerHitEffect, triggerUnitDeath])

  return null
}

function resolveHasSkillAnimation(
  kind: BattleActionKind,
  profile: ResolvedUnitProfile | undefined,
) {
  if (kind === 'ultimate') {
    return profile?.capabilities.ultimate ?? profile?.capabilities.skill ?? false
  }
  if (kind === 'skill') {
    return profile?.capabilities.skill ?? false
  }
  return false
}
