import { useEffect, useRef } from 'react'

import type { MovementVector } from './player.types'

const MOVEMENT_KEYS = new Set(['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'])

export function useKeyboardInput() {
  const movementRef = useRef<MovementVector>({ x: 0, y: 0 })

  useEffect(() => {
    const pressedKeys = new Set<string>()

    const syncMovement = () => {
      movementRef.current = {
        x: (pressedKeys.has('d') || pressedKeys.has('D') ? 1 : 0)
          - (pressedKeys.has('a') || pressedKeys.has('A') ? 1 : 0),
        y: (pressedKeys.has('s') || pressedKeys.has('S') ? 1 : 0)
          - (pressedKeys.has('w') || pressedKeys.has('W') ? 1 : 0),
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!MOVEMENT_KEYS.has(event.key)) {
        return
      }

      pressedKeys.add(event.key)
      syncMovement()
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (!MOVEMENT_KEYS.has(event.key)) {
        return
      }

      pressedKeys.delete(event.key)
      syncMovement()
    }

    const onBlur = () => {
      pressedKeys.clear()
      syncMovement()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  return movementRef
}
