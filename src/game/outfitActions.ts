import { generateOutfitAtlas, toAtlasDataUrl } from '../api/outfit'
import { useOutfitStore } from '../game/outfitStore'

export async function requestOutfitGeneration() {
  const { prompt, setStatus, setPreviewAtlas, setPartInfos, setErrorMessage } = useOutfitStore.getState()

  if (!prompt.trim()) {
    setErrorMessage('请先描述想要的服饰')
    setStatus('error')
    return
  }

  setStatus('generating')
  setErrorMessage(null)
  setPreviewAtlas(null)

  try {
    const response = await generateOutfitAtlas({
      prompt: prompt.trim(),
    })

    setPartInfos(response.parts)
    setPreviewAtlas(toAtlasDataUrl(response.atlasBase64))
    setStatus('preview')
  } catch (error) {
    setStatus('error')
    setErrorMessage(error instanceof Error ? error.message : 'AI 换装失败')
  }
}

export function applyOutfitPreview() {
  const { previewAtlas, setAppliedAtlas, setStatus } = useOutfitStore.getState()
  if (!previewAtlas) {
    return
  }

  setAppliedAtlas(previewAtlas)
  setStatus('applied')
}

export function clearAppliedOutfit() {
  useOutfitStore.getState().resetOutfit()
}
