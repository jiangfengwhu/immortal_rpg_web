import { useEffect } from 'react'

import { useGameSessionStore } from '../game/gameSessionStore'
import { CHEST_TYPE_LABELS } from '../game/quest/quest.constants'
import { STORY_FEATURE_KEYS, STORY_ITEM_LABELS } from '../game/quest/story.constants'
import { PLAYER_COPY } from '../game/ui/playerCopy'
import { resolveWorldMap } from '../game/world/resolveWorldMap'

/** 任务详览弹窗：补充剧情与赏赉信息，核心交互在决策中枢内完成。 */
export function JourneyQuestModal() {
  const playerState = useGameSessionStore((state) => state.playerState)
  const lastOpponentName = useGameSessionStore((state) => state.lastOpponentName)
  const journeyModalOpen = useGameSessionStore((state) => state.journeyModalOpen)
  const toggleJourneyModal = useGameSessionStore((state) => state.toggleJourneyModal)
  const storyState = playerState?.storyState
  const quest = playerState?.quest
  const player = playerState?.player

  useEffect(() => {
    if (!journeyModalOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') toggleJourneyModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [journeyModalOpen, toggleJourneyModal])

  if (!playerState || !journeyModalOpen || !quest || !player) return null

  const mapChapter = resolveWorldMap(player.realm, player.stageIndex)
  const mapName = quest.mapName ?? mapChapter.name
  const mapPhase = quest.mapPhaseName ?? mapChapter.phaseName
  const mapKeywords = quest.mapKeywords ?? mapChapter.keywords
  const objectives = quest.objectives ?? []
  const storyItems = (storyState?.storyItems ?? []).map((id) => STORY_ITEM_LABELS[id] ?? id)
  const hasNoviceTitle = storyState?.unlockedFeatures?.includes(STORY_FEATURE_KEYS.titleNovice)
  const chestLabel = quest.rewards?.chestType
    ? CHEST_TYPE_LABELS[quest.rewards.chestType] ?? quest.rewards.chestType
    : null

  // 解析新任务系统中的特殊奖励
  const itemsRewarded = (quest.rewards?.items ?? []).map((id) => STORY_ITEM_LABELS[id] ?? id)
  const titleRewarded = quest.rewards?.title
    ? quest.rewards.title === 'TITLE_NOVICE' ? '初出茅庐' : quest.rewards.title
    : null
  const featuresRewarded = (quest.rewards?.features ?? []).map((f) => {
    if (f === 'AFK_HERB_FIELD') return '药田采集'
    if (f === 'AFK_BAMBOO_HUNT') return '竹林历练'
    if (f === 'WORLD_MAP') return '世界地图'
    return f
  })

  return (
    <div
      className="journey-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) toggleJourneyModal()
      }}
    >
      <div className="journey-modal" onClick={(event) => event.stopPropagation()}>
        <header className="journey-modal__header">
          <div>
            <p className="journey-modal__eyebrow">{PLAYER_COPY.journeySection}</p>
            <h2 className="journey-modal__title">{quest.title}</h2>
            <p className="journey-modal__meta">
              {PLAYER_COPY.questMapPhase(mapPhase, mapName)} · {PLAYER_COPY.questStage(quest.stageIndex + 1)}
            </p>
          </div>
          <button type="button" className="journey-modal__close" onClick={toggleJourneyModal} aria-label="关闭">
            ✕
          </button>
        </header>

        <div className="journey-modal__body">
          {quest.summary && (
            <section className="journey-modal__section">
              <h3>{PLAYER_COPY.questSummary}</h3>
              <p>{quest.summary}</p>
            </section>
          )}

          {quest.narrative && (
            <section className="journey-modal__section">
              <h3>{PLAYER_COPY.questStory}</h3>
              <p className="journey-modal__narrative">{quest.narrative}</p>
            </section>
          )}

          {objectives.length > 0 && (
            <section className="journey-modal__section">
              <h3>{PLAYER_COPY.questObjectives}</h3>
              <ul>
                {objectives.map((objective) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ul>
            </section>
          )}

          {mapKeywords.length > 0 && (
            <section className="journey-modal__section">
              <h3>{PLAYER_COPY.questMapLandmarks}</h3>
              <p>{mapKeywords.join(' · ')}</p>
            </section>
          )}

          {storyItems.length > 0 && (
            <section className="journey-modal__section">
              <h3>{PLAYER_COPY.storyItems}</h3>
              <p>{storyItems.join(' · ')}</p>
            </section>
          )}

          {hasNoviceTitle && (
            <p className="journey-modal__features">{PLAYER_COPY.titleNovice}</p>
          )}

          {lastOpponentName && (
            <section className="journey-modal__section">
              <h3>{PLAYER_COPY.questFoe}</h3>
              <p>{lastOpponentName}</p>
            </section>
          )}

          {quest.rewards && (
            <section className="journey-modal__section">
              <h3>{PLAYER_COPY.questReward}</h3>
              <p>
                修为 +{quest.rewards.exp} · 金币 +{quest.rewards.gold}
                {chestLabel ? ` · ${chestLabel}` : ''}
                {itemsRewarded.length > 0 ? ` · 获得物品：${itemsRewarded.join('、')}` : ''}
                {titleRewarded ? ` · 获得称号：${titleRewarded}` : ''}
                {featuresRewarded.length > 0 ? ` · 解锁功能：${featuresRewarded.join('、')}` : ''}
              </p>
            </section>
          )}

          {(storyState?.unlockedFeatures?.length ?? 0) > 0 && (
            <p className="journey-modal__features">
              已解锁功能：
              {storyState?.unlockedFeatures?.includes('AFK_HERB_FIELD') && ' 药田采集'}
              {storyState?.unlockedFeatures?.includes('AFK_BAMBOO_HUNT') && ' · 竹林历练'}
              {storyState?.unlockedFeatures?.includes('WORLD_MAP') && ' · 世界地图'}
            </p>
          )}
        </div>

        <footer className="journey-modal__footer">
          <p className="journey-modal__hint">返回决策区继续探索、战斗与推进剧情。</p>
          <div className="journey-modal__footer-actions">
            <button type="button" className="journey-modal__advance" onClick={toggleJourneyModal}>
              返回旅途
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
