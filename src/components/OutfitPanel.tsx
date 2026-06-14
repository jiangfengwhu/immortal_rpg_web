import { useEffect } from 'react'

import { fetchOutfitParts } from '../api/outfit'
import { useOutfitStore } from '../game/outfitStore'
import { applyOutfitPreview, clearAppliedOutfit, requestOutfitGeneration } from '../game/outfitActions'

const PRESET_OUTFITS = [
  '青色素纱仙裙，云纹刺绣，轻飘飘的修仙风格',
  '赤金剑修战袍，护腕与飘带，英气逼人',
  '月白道袍，太极纹样，清雅出尘',
  '玄黑魔修长衣，暗红纹路，神秘冷峻',
]

export function OutfitPanel() {
  const status = useOutfitStore((state) => state.status)
  const prompt = useOutfitStore((state) => state.prompt)
  const previewAtlas = useOutfitStore((state) => state.previewAtlas)
  const appliedAtlas = useOutfitStore((state) => state.appliedAtlas)
  const partInfos = useOutfitStore((state) => state.partInfos)
  const errorMessage = useOutfitStore((state) => state.errorMessage)
  const setPrompt = useOutfitStore((state) => state.setPrompt)
  const setPartInfos = useOutfitStore((state) => state.setPartInfos)

  const isGenerating = status === 'generating'

  useEffect(() => {
    void fetchOutfitParts()
      .then(setPartInfos)
      .catch(() => {
        // 后端未启动时静默失败
      })
  }, [setPartInfos])

  return (
    <aside className="outfit-panel">
      <div className="outfit-panel__header">
        <p className="outfit-panel__eyebrow">AI 仙衣</p>
        <h2>Spine 换装</h2>
      </div>

      <p className="outfit-panel__desc">
        按 atlas 分区生成，AI 输出品红底图后程序自动抠图，合成 256×256 贴图。
      </p>

      {partInfos.length > 0 && (
        <div className="outfit-panel__parts">
          {partInfos.map((part) => (
            <span key={part.name} className="outfit-panel__part-tag">
              {part.label} {part.width}×{part.height}
            </span>
          ))}
        </div>
      )}

      <label className="outfit-panel__label" htmlFor="outfit-prompt">
        描述想要的服饰
      </label>
      <textarea
        id="outfit-prompt"
        className="outfit-panel__input"
        rows={4}
        value={prompt}
        disabled={isGenerating}
        onChange={(event) => setPrompt(event.target.value)}
      />

      <div className="outfit-panel__presets">
        {PRESET_OUTFITS.map((preset) => (
          <button
            key={preset}
            type="button"
            className="outfit-panel__preset"
            disabled={isGenerating}
            onClick={() => setPrompt(preset)}
          >
            {preset.slice(0, 10)}…
          </button>
        ))}
      </div>

      <button
        type="button"
        className="outfit-panel__primary"
        disabled={isGenerating}
        onClick={() => void requestOutfitGeneration()}
      >
        {isGenerating ? '逐部位织衣中…' : '生成 Spine 贴图'}
      </button>

      {errorMessage && <p className="outfit-panel__error">{errorMessage}</p>}

      {previewAtlas && (
        <div className="outfit-panel__preview">
          <p className="outfit-panel__preview-title">Atlas 预览 (256×256)</p>
          <img src={previewAtlas} alt="Spine atlas 预览" className="outfit-panel__atlas-preview" />
          <div className="outfit-panel__actions">
            <button type="button" className="outfit-panel__primary" onClick={applyOutfitPreview}>
              应用到 Spine
            </button>
          </div>
        </div>
      )}

      {appliedAtlas && (
        <div className="outfit-panel__applied">
          <p>已应用 AI atlas 贴图</p>
          <button type="button" className="outfit-panel__ghost" onClick={clearAppliedOutfit}>
            恢复原貌
          </button>
        </div>
      )}
    </aside>
  )
}
