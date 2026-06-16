import { HERB_GATHER_INTERVAL_MS } from './harvest.constants'

let loopTimer: number | null = null

export function startHarvestLoop(onTick: () => void) {
  stopHarvestLoop()
  onTick()
  loopTimer = window.setInterval(onTick, HERB_GATHER_INTERVAL_MS)
}

export function stopHarvestLoop() {
  if (loopTimer === null) return
  window.clearInterval(loopTimer)
  loopTimer = null
}

export function isHarvestLoopRunning() {
  return loopTimer !== null
}
