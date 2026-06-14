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

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

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
      const role = action.kind === 'skill' ? 'skill' : 'attack'
      const attackAnimation = actorProfile?.animations[role] ?? actorConfig.animations[role]

      setUnitAnimation(action.actor, attackAnimation)

      const durationSec = actorProfile?.getDuration(role) ?? 0.6
      const hasSkillAnimation = actorProfile?.capabilities.skill ?? false
      const actionMs = getActionDurationMs(action.kind, durationSec, hasSkillAnimation)
      const strikeMs = getStrikeDelayMs(action.kind, durationSec, hasSkillAnimation)

      await sleep(strikeMs)
      if (isStale()) {
        return
      }

      const hitAnimation = targetProfile?.animations.hit ?? targetConfig.animations.hit
      setUnitAnimation(hit.target, hitAnimation)
      triggerHitEffect({ actor: action.actor, target: hit.target, kind: action.kind })
      applySnapshot()

      await sleep(Math.max(0, actionMs - strikeMs))
      if (isStale()) {
        return
      }

      if (!sim.isFinished()) {
        const actorIdle = actorProfile?.animations.idle ?? actorConfig.animations.idle
        setUnitAnimation(action.actor, actorIdle)
      }

      await sleep(BATTLE_TIMING.hitDelayMs)
      if (isStale()) {
        return
      }

      if (!sim.isFinished() && hit.remainingHp > 0) {
        const targetIdle = targetProfile?.animations.idle ?? targetConfig.animations.idle
        setUnitAnimation(hit.target, targetIdle)
      }
    }

    const processEvent = async (event: BattleEvent) => {
      const { unitProfiles } = useBattleStore.getState()

      if (event.type === 'ACTION') {
        const config = getBattleUnitConfig(event.actor)
        const profile = unitProfiles[event.actor]
        const role = event.kind === 'skill' ? 'skill' : 'attack'
        const animation = profile?.animations[role] ?? config.animations[role]

        setUnitAnimation(event.actor, animation)

        const durationSec = profile?.getDuration(role) ?? 0.6
        const hasSkillAnimation = profile?.capabilities.skill ?? false
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
        applySnapshot()
        await sleep(BATTLE_TIMING.hitDelayMs)

        if (!sim.isFinished() && event.remainingHp > 0) {
          const idle = profile?.animations.idle ?? config.animations.idle
          setUnitAnimation(event.target, idle)
        }
        return
      }

      if (event.type === 'DEATH') {
        const profile = unitProfiles[event.side]
        const hasDeathAnimation = profile?.capabilities.death ?? false

        if (hasDeathAnimation) {
          const deathAnimation = profile!.animations.death
          setUnitAnimation(event.side, deathAnimation)
          triggerUnitDeath({ side: event.side, mode: 'animation' })
          await sleep(getDeathDurationMs(true, profile!.getDuration('death')))
        } else {
          triggerUnitDeath({ side: event.side, mode: 'flyout' })
          await sleep(getDeathDurationMs(false, 0))
        }
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
          await processActionWithHit(event, nextEvent)
          index += 1
          continue
        }

        await processEvent(event)
      }
    }

    const runBattle = async () => {
      while (!isStale() && !sim.isFinished()) {
        const events = sim.advanceRound()

        if (events.length === 0) {
          await sleep(140)
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
