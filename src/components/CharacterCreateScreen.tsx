import { useState, type CSSProperties, type FormEvent } from 'react'

import {
  DEFAULT_PRIMARY_BY_CLASS,
  PLAYER_CLASS_LABELS,
  PRIMARY_ATTR_LABELS,
} from '../game/character/character.constants'
import type { PlayerClass } from '../game/character/character.types'
import { PLAYER_COPY } from '../game/ui/playerCopy'
import { useGameSessionStore } from '../game/gameSessionStore'

const CLASS_OPTIONS: PlayerClass[] = ['warrior', 'mage', 'warlock']

const CLASS_ICONS: Record<PlayerClass, string> = {
  warrior: '⚔',
  mage: '✦',
  warlock: '☯',
}

const CLASS_ACCENT: Record<PlayerClass, string> = {
  warrior: '#c45c4a',
  mage: '#5a8fd4',
  warlock: '#8a5ad4',
}

const PRIMARY_KEYS = Object.keys(PRIMARY_ATTR_LABELS) as (keyof typeof PRIMARY_ATTR_LABELS)[]

export function CharacterCreateScreen() {
  const createCharacter = useGameSessionStore((state) => state.createCharacter)
  const errorMessage = useGameSessionStore((state) => state.errorMessage)
  const status = useGameSessionStore((state) => state.status)

  const [name, setName] = useState('')
  const [selectedClass, setSelectedClass] = useState<PlayerClass>('warrior')

  const isSubmitting = status === 'loading'
  const primary = DEFAULT_PRIMARY_BY_CLASS[selectedClass]
  const accent = CLASS_ACCENT[selectedClass]

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    await createCharacter(trimmed, selectedClass)
  }

  return (
    <div className="create-screen">
      <div className="create-screen__card">
        <header className="create-screen__header">
          <p className="create-screen__eyebrow">{PLAYER_COPY.gameTitle}</p>
          <h1>踏入江湖</h1>
        </header>

        <div className="create-screen__layout">
          <aside
            className="create-screen__portrait"
            style={{ '--create-accent': accent } as CSSProperties}
          >
            <div className="create-screen__portrait-frame">
              <span className="create-screen__portrait-icon" aria-hidden>
                {CLASS_ICONS[selectedClass]}
              </span>
              <span className="create-screen__portrait-silhouette" aria-hidden />
            </div>
            <p className="create-screen__portrait-class">{PLAYER_CLASS_LABELS[selectedClass]}</p>
          </aside>

          <form className="create-screen__form" onSubmit={handleSubmit}>
            <div className="create-screen__field">
              <label className="create-screen__label" htmlFor="hero-name">
                侠名
              </label>
              <input
                id="hero-name"
                className="create-screen__input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="请输入角色名"
                maxLength={12}
                disabled={isSubmitting}
              />
            </div>

            <div className="create-screen__field">
              <p className="create-screen__label">流派</p>
              <div className="create-screen__classes">
                {CLASS_OPTIONS.map((playerClass) => (
                  <button
                    key={playerClass}
                    type="button"
                    className={
                      selectedClass === playerClass
                        ? 'create-screen__class create-screen__class--active'
                        : 'create-screen__class'
                    }
                    onClick={() => setSelectedClass(playerClass)}
                    disabled={isSubmitting}
                  >
                    <span className="create-screen__class-icon">{CLASS_ICONS[playerClass]}</span>
                    <span className="create-screen__class-name">{PLAYER_CLASS_LABELS[playerClass]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="create-screen__stats">
              {PRIMARY_KEYS.map((key) => (
                <div key={key} className="create-screen__stat">
                  <span>{PRIMARY_ATTR_LABELS[key]}</span>
                  <strong>{primary[key]}</strong>
                </div>
              ))}
            </div>

            {errorMessage && <p className="create-screen__error">{errorMessage}</p>}

            <button
              type="submit"
              className="create-screen__submit"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? '创建中…' : '开始修行'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
