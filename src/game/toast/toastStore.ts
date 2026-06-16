import { create } from 'zustand'

import type { GameToast, ToastTone } from './toast.types'

const AUTO_DISMISS_MS = 2600

type ToastStore = {
  toasts: GameToast[]
  pushToast: (text: string, tone?: ToastTone, persistent?: boolean) => string
  dismissToast: (id: string) => void
}

let toastCounter = 0
const dismissTimers = new Map<string, number>()

function scheduleDismiss(id: string, get: () => ToastStore) {
  const existing = dismissTimers.get(id)
  if (existing) window.clearTimeout(existing)
  const timer = window.setTimeout(() => {
    dismissTimers.delete(id)
    get().dismissToast(id)
  }, AUTO_DISMISS_MS)
  dismissTimers.set(id, timer)
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  pushToast: (text, tone = 'info', persistent = false) => {
    const trimmed = text.trim()
    if (!trimmed) return ''
    const id = `toast_${Date.now()}_${++toastCounter}`
    const toast: GameToast = { id, text: trimmed, tone, persistent }
    set((state) => ({ toasts: [...state.toasts, toast] }))
    if (!persistent) scheduleDismiss(id, get)
    return id
  },

  dismissToast: (id) => {
    const timer = dismissTimers.get(id)
    if (timer) {
      window.clearTimeout(timer)
      dismissTimers.delete(id)
    }
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
  },
}))
