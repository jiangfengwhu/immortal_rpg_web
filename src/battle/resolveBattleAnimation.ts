import type { SkeletonData } from '@pixi-spine/runtime-3.8'

import { ANIMATION_FALLBACKS } from './battle.constants'
import type { UnitAnimationSet } from './battle.types'

type AnimationRole = keyof UnitAnimationSet

export type UnitAnimationCapabilities = {
  death: boolean
  skill: boolean
  run: boolean
}

export type ResolvedUnitProfile = {
  animations: UnitAnimationSet
  capabilities: UnitAnimationCapabilities
  getDuration: (role: AnimationRole) => number
}

function findAnimation(spineData: SkeletonData, name: string) {
  return spineData.findAnimation(name)
}

function resolveRole(
  spineData: SkeletonData,
  preferred: string,
  role: AnimationRole,
  strict: boolean,
) {
  if (findAnimation(spineData, preferred)) {
    return preferred
  }

  for (const candidate of ANIMATION_FALLBACKS[role]) {
    if (findAnimation(spineData, candidate)) {
      return candidate
    }
  }

  if (strict) {
    return null
  }

  return spineData.animations[0]?.name ?? preferred
}

export function resolveUnitProfile(
  spineData: SkeletonData,
  animations: UnitAnimationSet,
): ResolvedUnitProfile {
  const idle = resolveRole(spineData, animations.idle, 'idle', false)!
  const runResolved = resolveRole(spineData, animations.run, 'run', true)
  const attack = resolveRole(spineData, animations.attack, 'attack', false)!
  const skillResolved = resolveRole(spineData, animations.skill, 'skill', true)
  const hit = resolveRole(spineData, animations.hit, 'hit', false)!
  const deathResolved = resolveRole(spineData, animations.death, 'death', true)

  const resolved: UnitAnimationSet = {
    idle,
    run: runResolved ?? idle,
    attack,
    skill: skillResolved ?? attack,
    hit,
    death: deathResolved ?? animations.death,
  }

  const getDuration = (role: AnimationRole) =>
    findAnimation(spineData, resolved[role])?.duration ?? 0.6

  return {
    animations: resolved,
    capabilities: {
      death: deathResolved !== null,
      skill: skillResolved !== null,
      run: runResolved !== null,
    },
    getDuration,
  }
}

export function resolveBattleAnimation(
  spineData: SkeletonData,
  animations: UnitAnimationSet,
  role: AnimationRole,
) {
  return resolveUnitProfile(spineData, animations).animations[role]
}

export function shouldLoopBattleAnimation(role: AnimationRole) {
  return role === 'idle'
}
