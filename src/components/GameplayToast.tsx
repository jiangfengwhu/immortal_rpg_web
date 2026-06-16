import { useEffect } from 'react'

import { useToastStore } from '../game/toast/toastStore'
import type { GameToast } from '../game/toast/toast.types'

export function GameplayToast() {
  const toasts = useToastStore((state) => state.toasts)

  return (
    <div className="gameplay-toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <GameplayToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

function GameplayToastItem({ toast }: { toast: GameToast }) {
  const dismissToast = useToastStore((state) => state.dismissToast)

  useEffect(() => {
    if (toast.persistent) return
    const timer = window.setTimeout(() => dismissToast(toast.id), 2600)
    return () => window.clearTimeout(timer)
  }, [toast.id, toast.persistent, dismissToast])

  return (
    <p
      className={`gameplay-toast gameplay-toast--${toast.tone}${toast.persistent ? ' gameplay-toast--persistent' : ''}`}
    >
      {toast.persistent && <span className="gameplay-toast__pulse" aria-hidden />}
      {toast.text}
    </p>
  )
}
