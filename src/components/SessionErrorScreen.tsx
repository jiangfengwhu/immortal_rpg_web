import { useGameSessionStore } from '../game/gameSessionStore'
import { PLAYER_COPY } from '../game/ui/playerCopy'
import { sanitizePlayerErrorMessage } from '../game/ui/playerError'
import { LogoutConfirmBlock } from './LogoutConfirmBlock'

export function SessionErrorScreen() {
  const errorMessage = useGameSessionStore((state) => state.errorMessage)
  const initSession = useGameSessionStore((state) => state.initSession)

  return (
    <div className="session-loading">
      <p className="session-loading__text">
        {sanitizePlayerErrorMessage(errorMessage || PLAYER_COPY.connectionFailed)}
      </p>
      <div className="session-loading__actions">
        <button type="button" className="session-loading__btn" onClick={() => void initSession()}>
          {PLAYER_COPY.retry}
        </button>
        <LogoutConfirmBlock triggerClassName="session-loading__btn" triggerVariant="ghost" />
      </div>
    </div>
  )
}
