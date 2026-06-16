import { useGameSessionStore } from '../game/gameSessionStore'
import { useWorldMapBackground } from '../game/world/useWorldMapBackground'
import { resolveWorldMap } from '../game/world/resolveWorldMap'

/** 非战斗时展示当前地图全景 */
export function StageMapView() {
  const playerState = useGameSessionStore((state) => state.playerState)
  const { imageUrl } = useWorldMapBackground()

  if (!playerState) return null

  const { player } = playerState
  const chapter = resolveWorldMap(player.realm, player.stageIndex)

  return (
    <div className="stage-map" aria-label="当前地图">
      {imageUrl ? (
        <div className="stage-map__bg" style={{ backgroundImage: `url(${imageUrl})` }} />
      ) : (
        <div className="stage-map__bg stage-map__bg--fallback" />
      )}
      <div className="stage-map__shade" />
      <div className="stage-map__caption">
        <span className="stage-map__phase">{chapter.phaseName}</span>
        <span className="stage-map__name">{chapter.name}</span>
      </div>
    </div>
  )
}
