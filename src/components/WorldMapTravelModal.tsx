import { useEffect } from 'react'

import { useGameSessionStore } from '../game/gameSessionStore'
import { PLAYER_COPY } from '../game/ui/playerCopy'
import { globalStageIndex, resolveWorldMap } from '../game/world/resolveWorldMap'

export function WorldMapTravelModal() {
  const playerState = useGameSessionStore((state) => state.playerState)
  const mapTravelOpen = useGameSessionStore((state) => state.mapTravelOpen)
  const isSaving = useGameSessionStore((state) => state.isSaving)
  const toggleMapTravel = useGameSessionStore((state) => state.toggleMapTravel)
  const advanceJourney = useGameSessionStore((state) => state.advanceJourney)

  useEffect(() => {
    if (!mapTravelOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') toggleMapTravel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mapTravelOpen, toggleMapTravel])

  if (!playerState || !mapTravelOpen) return null

  const { player } = playerState
  const atMaxStage = globalStageIndex(player.realm, player.stageIndex) >= 63
  const nextDestination = atMaxStage ? null : resolveWorldMap(player.realm, player.stageIndex + 1)
  const canTeleport = Boolean(nextDestination && player.stageCleared && !isSaving)

  return (
    <div
      className="map-teleport-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) toggleMapTravel()
      }}
    >
      <div className="map-teleport-modal" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="map-teleport-modal__close"
          onClick={toggleMapTravel}
          aria-label="关闭"
        >
          ✕
        </button>

        {nextDestination && (
          <div className="map-teleport-modal__row">
            <span className="map-teleport-modal__name">{nextDestination.name}</span>
            <button
              type="button"
              className="map-teleport-modal__btn"
              data-onboarding-target="map-advance"
              disabled={!canTeleport}
              onClick={() => void advanceJourney()}
            >
              {PLAYER_COPY.mapTeleport}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
