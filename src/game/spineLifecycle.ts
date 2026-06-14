import type { Spine } from 'pixi-spine'

const pendingDisposals = new Set<Spine>()

export function queueDisposeSpine(spine: Spine) {
  if (spine.destroyed || pendingDisposals.has(spine)) {
    return
  }

  spine.autoUpdate = false
  pendingDisposals.add(spine)
}

export function flushSpineDisposals() {
  if (pendingDisposals.size === 0) {
    return
  }

  const spines = [...pendingDisposals]
  pendingDisposals.clear()

  for (const spine of spines) {
    if (spine.destroyed) {
      continue
    }

    spine.state.clearTracks()

    if (spine.parent) {
      spine.parent.removeChild(spine)
    }

    spine.destroy({ children: true })
  }
}

export function isSpineAlive(spine: Spine | null | undefined): spine is Spine {
  return Boolean(spine && !spine.destroyed)
}
