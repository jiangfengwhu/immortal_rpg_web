import { useGameSessionStore } from '../game/gameSessionStore'
import { resolveWorldMap, resolveWorldMapImageUrl } from '../game/world/resolveWorldMap'

export function WorldMapPanel() {
  const playerState = useGameSessionStore((state) => state.playerState)
  const toggleMapTravel = useGameSessionStore((state) => state.toggleMapTravel)

  if (!playerState) return null

  const { player } = playerState
  const chapter = resolveWorldMap(player.realm, player.stageIndex)
  const imageUrl = resolveWorldMapImageUrl(player.realm, player.stageIndex)

  return (
    <button
      type="button"
      className="world-map-panel"
      data-onboarding-target="world-map"
      onClick={toggleMapTravel}
      aria-label="地图传送"
    >
      <div className="world-map-panel__frame">
        {imageUrl ? (
          <img className="world-map-panel__image" src={imageUrl} alt="" loading="eager" />
        ) : (
          <div className="world-map-panel__fallback">{chapter.name}</div>
        )}
        <div className="world-map-panel__shade" />
        <div className="world-map-panel__caption">
          <span className="world-map-panel__phase">{chapter.phaseName}</span>
          <span className="world-map-panel__name">{chapter.name}</span>
        </div>
      </div>
    </button>
  )
}
