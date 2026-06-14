import { useTick } from '@pixi/react'

import { flushSpineDisposals } from '../game/spineLifecycle'

export function SpineDisposalFlush() {
  useTick(() => {
    flushSpineDisposals()
  })

  return null
}
