import { useGameSessionStore } from '../game/gameSessionStore'
import { PLAYER_COPY } from '../game/ui/playerCopy'
import { resolveWorldMap } from '../game/world/resolveWorldMap'

export function GameTopBar() {
  const playerState = useGameSessionStore((state) => state.playerState)
  const toggleSettings = useGameSessionStore((state) => state.toggleSettings)

  const chapter = playerState
    ? resolveWorldMap(playerState.player.realm, playerState.player.stageIndex)
    : null

  return (
    <header className="game-topbar">
      <div className="game-topbar__brand">
        <span className="game-topbar__logo" aria-hidden>梦</span>
        <span className="game-topbar__title">{PLAYER_COPY.gameTitle}</span>
      </div>

      {chapter && (
        <div className="game-topbar__location" aria-label="当前位置">
          <span className="game-topbar__phase">{chapter.phaseName}</span>
          <span className="game-topbar__sep" aria-hidden>
            ·
          </span>
          <span className="game-topbar__place">{chapter.name}</span>
        </div>
      )}

      <div className="game-topbar__actions">
        <button
          type="button"
          className="game-topbar__settings"
          onClick={toggleSettings}
          aria-label={PLAYER_COPY.settings}
        >
          ⚙
        </button>
      </div>
    </header>
  )
}
