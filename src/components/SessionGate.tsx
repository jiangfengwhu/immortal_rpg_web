import { useEffect } from 'react'

import { useGameSessionStore } from '../game/gameSessionStore'
import { PLAYER_COPY } from '../game/ui/playerCopy'
import { CharacterCreateScreen } from './CharacterCreateScreen'
import { SessionErrorScreen } from './SessionErrorScreen'

type SessionGateProps = {
  children: React.ReactNode
}

export function SessionGate({ children }: SessionGateProps) {
  const status = useGameSessionStore((state) => state.status)
  const initSession = useGameSessionStore((state) => state.initSession)

  useEffect(() => {
    void initSession()
  }, [initSession])

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="session-loading">
        <p className="session-loading__text">{PLAYER_COPY.loadingWorld}</p>
      </div>
    )
  }

  if (status === 'error') {
    return <SessionErrorScreen />
  }

  if (status === 'needs_create') {
    return <CharacterCreateScreen />
  }

  return children
}
