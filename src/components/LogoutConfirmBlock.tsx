import { useState } from 'react'

import { useGameSessionStore } from '../game/gameSessionStore'
import { PLAYER_COPY } from '../game/ui/playerCopy'

type LogoutConfirmBlockProps = {
  triggerClassName?: string
  triggerVariant?: 'danger' | 'ghost'
}

export function LogoutConfirmBlock({
  triggerClassName = 'logout-confirm__trigger',
  triggerVariant = 'danger',
}: LogoutConfirmBlockProps) {
  const [confirming, setConfirming] = useState(false)
  const clearSession = useGameSessionStore((state) => state.clearSession)

  if (confirming) {
    return (
      <div className="logout-confirm">
        <p className="logout-confirm__text">{PLAYER_COPY.logoutConfirmBody}</p>
        <div className="logout-confirm__actions">
          <button
            type="button"
            className="logout-confirm__btn logout-confirm__btn--danger"
            onClick={clearSession}
          >
            {PLAYER_COPY.logoutConfirm}
          </button>
          <button type="button" className="logout-confirm__btn" onClick={() => setConfirming(false)}>
            {PLAYER_COPY.cancel}
          </button>
        </div>
      </div>
    )
  }

  const triggerClasses = [
    triggerClassName,
    triggerVariant === 'ghost' ? `${triggerClassName}--ghost` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={triggerClasses} onClick={() => setConfirming(true)}>
      {PLAYER_COPY.logout}
    </button>
  )
}
