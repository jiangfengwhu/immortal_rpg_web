import { create } from 'zustand'

import type { OutfitPartInfo, OutfitStatus } from './outfit.types'

type OutfitStore = {
  status: OutfitStatus
  prompt: string
  previewAtlas: string | null
  appliedAtlas: string | null
  partInfos: OutfitPartInfo[]
  errorMessage: string | null
  setPrompt: (prompt: string) => void
  setStatus: (status: OutfitStatus) => void
  setPreviewAtlas: (atlas: string | null) => void
  setAppliedAtlas: (atlas: string | null) => void
  setPartInfos: (parts: OutfitPartInfo[]) => void
  setErrorMessage: (message: string | null) => void
  resetOutfit: () => void
}

export const useOutfitStore = create<OutfitStore>((set) => ({
  status: 'idle',
  prompt: '青色素纱仙裙，云纹刺绣，轻飘飘的修仙风格',
  previewAtlas: null,
  appliedAtlas: null,
  partInfos: [],
  errorMessage: null,
  setPrompt: (prompt) => set({ prompt }),
  setStatus: (status) => set({ status }),
  setPreviewAtlas: (previewAtlas) => set({ previewAtlas }),
  setAppliedAtlas: (appliedAtlas) => set({ appliedAtlas }),
  setPartInfos: (partInfos) => set({ partInfos }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  resetOutfit: () =>
    set({
      status: 'idle',
      previewAtlas: null,
      appliedAtlas: null,
      errorMessage: null,
    }),
}))
