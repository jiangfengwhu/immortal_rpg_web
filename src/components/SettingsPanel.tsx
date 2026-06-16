import { useEffect } from 'react'

import { useGameSessionStore } from '../game/gameSessionStore'
import { PLAYER_COPY } from '../game/ui/playerCopy'
import { LogoutConfirmBlock } from './LogoutConfirmBlock'

export function SettingsPanel() {
  const playerState = useGameSessionStore((state) => state.playerState)
  const settingsOpen = useGameSessionStore((state) => state.settingsOpen)
  const toggleSettings = useGameSessionStore((state) => state.toggleSettings)

  useEffect(() => {
    if (!settingsOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') toggleSettings()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [settingsOpen, toggleSettings])

  if (!playerState || !settingsOpen) return null

  return (
    <div
      className="settings-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          toggleSettings()
        }
      }}
    >
      <div className="settings-panel" onClick={(event) => event.stopPropagation()}>
        <header className="settings-panel__header">
          <div>
            <p className="settings-panel__eyebrow">{PLAYER_COPY.gameTitle}</p>
            <h2>{PLAYER_COPY.settingsTitle}</h2>
          </div>
          <button type="button" className="settings-panel__close" onClick={toggleSettings} aria-label="关闭">
            ✕
          </button>
        </header>

        <section className="settings-panel__section">
          <h3 className="settings-panel__section-title">{PLAYER_COPY.logoutSection}</h3>
          <p className="settings-panel__hint">{PLAYER_COPY.logoutHint}</p>
          <LogoutConfirmBlock triggerClassName="settings-panel__logout" />
        </section>
      </div>
    </div>
  )
}
