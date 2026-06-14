import { create } from 'zustand'

type BossStore = {
  availableAnimations: string[]
  currentAnimation: string
  position: { x: number; y: number }
  setAvailableAnimations: (animations: string[]) => void
  setCurrentAnimation: (animation: string) => void
  setPosition: (x: number, y: number) => void
  playAnimation: (animation: string) => void
}

export const useBossStore = create<BossStore>((set) => ({
  availableAnimations: [],
  currentAnimation: 'idle',
  position: { x: 0, y: 0 },
  setAvailableAnimations: (availableAnimations) => set({ availableAnimations }),
  setCurrentAnimation: (currentAnimation) => set({ currentAnimation }),
  setPosition: (x, y) => set({ position: { x, y } }),
  playAnimation: (animation) => set({ currentAnimation: animation }),
}))
