import { create } from 'zustand'

type PlayerStore = {
  isMoving: boolean
  availableAnimations: string[]
  currentAnimation: string
  setIsMoving: (isMoving: boolean) => void
  setAvailableAnimations: (animations: string[]) => void
  setCurrentAnimation: (animation: string) => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  isMoving: false,
  availableAnimations: [],
  currentAnimation: 'idle',
  setIsMoving: (isMoving) => set({ isMoving }),
  setAvailableAnimations: (animations) => set({ availableAnimations: animations }),
  setCurrentAnimation: (animation) => set({ currentAnimation: animation }),
}))
