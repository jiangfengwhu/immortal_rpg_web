import { useEffect, useRef, useState } from 'react'

import { useGameSessionStore } from '../game/gameSessionStore'
import { STORY_QUEST_IDS } from '../game/quest/story.constants'
import { isStoryBattleReady } from '../game/quest/resolveStoryInteractions'
import { useWorldMapBackground } from '../game/world/useWorldMapBackground'
import { resolveWorldMap } from '../game/world/resolveWorldMap'
import { StageHarvestFloat } from './StageHarvestFloat'
import { StageSpineScene } from './stage/StageSpineScene'

const STAGE_INITIAL_SIZE = { width: 640, height: 360 }

/** 非战斗时展示当前地图与角色 */
export function StageMapView() {
  const playerState = useGameSessionStore((state) => state.playerState)
  const { imageUrl } = useWorldMapBackground()
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(STAGE_INITIAL_SIZE)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateSize = () => {
      const { width, height } = element.getBoundingClientRect()
      if (width < 1 || height < 1) return
      setSize({ width: Math.floor(width), height: Math.floor(height) })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  if (!playerState) return null

  const { player, storyState } = playerState
  const chapter = resolveWorldMap(player.realm, player.stageIndex)
  const boarQuestStatus = storyState?.questStatuses?.[STORY_QUEST_IDS.boar]
  const showBoar =
    isStoryBattleReady(storyState) ||
    boarQuestStatus === 'active' ||
    boarQuestStatus === 'available'

  return (
    <div ref={containerRef} className="stage-map" aria-label="当前地图">
      {imageUrl ? (
        <div className="stage-map__bg" style={{ backgroundImage: `url(${imageUrl})` }} />
      ) : (
        <div className="stage-map__bg stage-map__bg--fallback" />
      )}
      <div className="stage-map__shade" />
      <div className="stage-map__spine" aria-hidden>
        <StageSpineScene width={size.width} height={size.height} showBoar={showBoar} />
      </div>
      <div className="stage-map__caption">
        <span className="stage-map__phase">{chapter.phaseName}</span>
        <span className="stage-map__name">{chapter.name}</span>
      </div>
      <StageHarvestFloat />
    </div>
  )
}
