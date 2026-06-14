import type { Application } from 'pixi.js'
import { Assets } from 'pixi.js'
import 'pixi-spine'
import { Spine } from 'pixi-spine'

import { queueDisposeSpine } from './spineLifecycle'
import { FIRE_SKILL } from './skill.constants'

type SpawnFireSkillOptions = {
  x: number
  y: number
  skillDuration: number
}

let fireSkillLoaded = false
let fireSkillLoading: Promise<void> | null = null

export function preloadFireSkill() {
  if (fireSkillLoaded) {
    return Promise.resolve()
  }

  if (!fireSkillLoading) {
    fireSkillLoading = Assets.load(FIRE_SKILL.skeleton).then(() => {
      fireSkillLoaded = true
    })
  }

  return fireSkillLoading
}

export function spawnFireSkill(_app: Application, { x, y, skillDuration }: SpawnFireSkillOptions) {
  if (!fireSkillLoaded) {
    void preloadFireSkill().then(() => {
      spawnFireSkill(_app, { x, y, skillDuration })
    })
    return null
  }

  const resource = Assets.get(FIRE_SKILL.skeleton)
  const effect = new Spine(resource.spineData)

  effect.scale.set(FIRE_SKILL.scale, FIRE_SKILL.scale)
  effect.x = x + FIRE_SKILL.offsetX
  effect.y = y + FIRE_SKILL.offsetY
  effect.zIndex = 12

  _app.stage.sortableChildren = true
  _app.stage.addChild(effect)

  const spawnDelay = skillDuration * FIRE_SKILL.spawnDelayRatio
  const fireVisibleDuration = Math.max(skillDuration - spawnDelay, 0.08)
  const timeScale = FIRE_SKILL.clipEnd / fireVisibleDuration

  effect.state.timeScale = timeScale

  let disposed = false
  const disposeEffect = () => {
    if (disposed || effect.destroyed) {
      return
    }
    disposed = true
    queueDisposeSpine(effect)
  }

  const track = effect.state.setAnimation(0, FIRE_SKILL.animation, false)
  track.delay = spawnDelay
  track.animationEnd = FIRE_SKILL.clipEnd
  track.listener = {
    complete: disposeEffect,
    end: disposeEffect,
  }

  return effect
}
