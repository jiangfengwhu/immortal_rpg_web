import type { OutfitGenerateRequest, OutfitGenerateResponse } from '../game/outfit.types'

const OUTFIT_PARTS_PATH = '/api/outfit/parts'
const OUTFIT_GENERATE_PATH = '/api/outfit/generate'

export async function fetchOutfitParts() {
  const response = await fetch(OUTFIT_PARTS_PATH)
  const data = (await response.json()) as { parts: OutfitGenerateResponse['parts'] } & { error?: string }

  if (!response.ok) {
    throw new Error(data.error ?? `获取部位失败 (${response.status})`)
  }

  return data.parts
}

export async function generateOutfitAtlas(payload: OutfitGenerateRequest) {
  const response = await fetch(OUTFIT_GENERATE_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json()) as OutfitGenerateResponse & { error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? `换装请求失败 (${response.status})`)
  }

  return data
}

export function toAtlasDataUrl(atlasBase64: string) {
  return `data:image/png;base64,${atlasBase64}`
}
