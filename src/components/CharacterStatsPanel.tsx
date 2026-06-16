import type { MagicSchool, PrimaryAttributes } from '../game/character/character.types'
import {
  DERIVED_STAT_LABELS,
  MAGIC_SCHOOL_LABELS,
  PLAYER_CLASS_LABELS,
  PRIMARY_ATTR_LABELS,
  REALM_LABELS,
} from '../game/character/character.constants'
import { useGameSessionStore } from '../game/gameSessionStore'
import { PLAYER_COPY } from '../game/ui/playerCopy'
import { isSectRecruitmentUnlocked } from '../game/world/worldMap.progression'
import { CharacterPanelTabs } from './CharacterPanelTabs'

const PRIMARY_KEYS = Object.keys(PRIMARY_ATTR_LABELS) as (keyof PrimaryAttributes)[]

const DERIVED_KEYS = [
  'maxHp',
  'stamina',
  'mp',
  'attack',
  'defense',
  'spiritPower',
  'speed',
] as const

const MAGIC_KEYS = Object.keys(MAGIC_SCHOOL_LABELS) as MagicSchool[]

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export function CharacterStatsPanel() {
  const playerState = useGameSessionStore((state) => state.playerState)
  const errorMessage = useGameSessionStore((state) => state.errorMessage)
  const isSaving = useGameSessionStore((state) => state.isSaving)
  const allocatePoint = useGameSessionStore((state) => state.allocatePoint)
  const autoAllocate = useGameSessionStore((state) => state.autoAllocate)
  const toggleInventory = useGameSessionStore((state) => state.toggleInventory)
  const toggleSettings = useGameSessionStore((state) => state.toggleSettings)
  const inventoryUnread = useGameSessionStore((state) => state.inventoryUnread)
  const inventoryCount = playerState?.inventory.length ?? 0

  if (!playerState) return null

  const { player } = playerState
  const expThreshold = player.level * 30
  const hasPotential = player.potentialPoints > 0
  const expRatio = Math.min(100, Math.round((player.exp / expThreshold) * 100))
  const soloMode = !isSectRecruitmentUnlocked(player.realm, player.stageIndex)

  return (
    <aside className="character-panel side-panel">
      <header className="character-panel__header">
        <div className="character-panel__header-row">
          <p className="side-panel__eyebrow">
            {soloMode ? PLAYER_COPY.soloTravelBadge : PLAYER_COPY.sectRecruitUnlocked}
          </p>
          <button
            type="button"
            className="character-panel__settings"
            onClick={toggleSettings}
            aria-label={PLAYER_COPY.settings}
          >
            {PLAYER_COPY.settings}
          </button>
        </div>
        <h2>{player.name}</h2>
        <p className="character-panel__realm">
          {PLAYER_CLASS_LABELS[player.class]} · Lv.{player.level} · {REALM_LABELS[player.realm] ?? player.realm}
        </p>
        <div className="character-panel__exp">
          <div className="character-panel__exp-track">
            <div className="character-panel__exp-fill" style={{ width: `${expRatio}%` }} />
          </div>
          <p className="character-panel__exp-text">
            修为 {player.exp}/{expThreshold}
          </p>
        </div>
        <div className="character-panel__resources">
          <span>金币 {player.gold}</span>
          <span>胜场 {player.battlesWon}</span>
        </div>
      </header>

      <div className="character-panel__body">
        <CharacterPanelTabs
          combat={
            <ul className="character-panel__stat-list">
              {DERIVED_KEYS.map((key) => (
                <li key={key} className="character-panel__stat-row">
                  <span>{DERIVED_STAT_LABELS[key]}</span>
                  <strong>{player.stats[key]}</strong>
                </li>
              ))}
              <li className="character-panel__stat-row">
                <span>{DERIVED_STAT_LABELS.sealRate}</span>
                <strong>{formatPercent(player.stats.sealRate)}</strong>
              </li>
              <li className="character-panel__stat-row">
                <span>{DERIVED_STAT_LABELS.sealResist}</span>
                <strong>{formatPercent(player.stats.sealResist)}</strong>
              </li>
            </ul>
          }
          talent={
            <div className="character-panel__talent">
              <div className="character-panel__section-head">
                {hasPotential && (
                  <span className="character-panel__badge">潜力 {player.potentialPoints}</span>
                )}
              </div>
              <ul className="character-panel__stat-list">
                {PRIMARY_KEYS.map((key) => (
                  <li key={key} className="character-panel__stat-row character-panel__stat-row--talent">
                    <span className="character-panel__stat-label">{PRIMARY_ATTR_LABELS[key]}</span>
                    <strong>{player.primary[key]}</strong>
                    {hasPotential && (
                      <button
                        type="button"
                        className="character-panel__plus"
                        disabled={isSaving}
                        onClick={() => void allocatePoint(key)}
                        aria-label={`${PRIMARY_ATTR_LABELS[key]} +1`}
                      >
                        +
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {hasPotential && (
                <button
                  type="button"
                  className="character-panel__auto-btn"
                  disabled={isSaving}
                  onClick={() => void autoAllocate()}
                >
                  {isSaving ? '铭刻中…' : '按流派推荐加点'}
                </button>
              )}
            </div>
          }
          resist={
            <ul className="character-panel__stat-list">
              {MAGIC_KEYS.map((key) => (
                <li key={key} className="character-panel__stat-row">
                  <span>{MAGIC_SCHOOL_LABELS[key]}</span>
                  <strong>{player.magicResist[key].toFixed(1)}</strong>
                </li>
              ))}
            </ul>
          }
        />
      </div>

      {errorMessage && <p className="character-panel__error">{errorMessage}</p>}

      <footer className="character-panel__footer">
        <button type="button" className="character-panel__bag" onClick={toggleInventory}>
          {PLAYER_COPY.bag} ({inventoryCount})
          {inventoryUnread && <span className="character-panel__bag-dot" aria-hidden />}
        </button>
      </footer>
    </aside>
  )
}
