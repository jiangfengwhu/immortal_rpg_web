export type OutfitPartInfo = {
  name: string
  label: string
  width: number
  height: number
  aiSize: string
}

export type OutfitGenerateRequest = {
  prompt: string
  parts?: string[]
}

export type OutfitGenerateResponse = {
  atlasBase64: string
  width: number
  height: number
  parts: OutfitPartInfo[]
}

export type OutfitStatus = 'idle' | 'generating' | 'preview' | 'applied' | 'error'

import { wuxiaQPlayerAsset } from './wuxiaQ.constants'

export const ORIGINAL_ATLAS_URL = wuxiaQPlayerAsset('azhu', 'azhu.png')
