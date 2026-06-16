import { DERIVED_STAT_LABELS } from '../game/character/character.constants'
import {
  DISPLAY_STAT_KEYS,
  computeDisplayStats,
  projectStatsForSelectedItem,
  type DisplayStats,
} from '../game/equipment/computeDisplayStats'
import { canEquipItem } from '../game/equipment/computeEquipmentBonuses'
import type { Equipment, EquippedSummary } from '../game/equipment/equipment.types'
import type { PlayerFullState } from '../api/player'

const PERCENT_KEYS = new Set<keyof DisplayStats>(['sealRate', 'sealResist'])

const STAT_LABELS: Record<keyof DisplayStats, string> = {
  maxHp: DERIVED_STAT_LABELS.maxHp,
  attack: DERIVED_STAT_LABELS.attack,
  defense: DERIVED_STAT_LABELS.defense,
  spiritPower: DERIVED_STAT_LABELS.spiritPower,
  speed: DERIVED_STAT_LABELS.speed,
  sealRate: DERIVED_STAT_LABELS.sealRate,
  sealResist: DERIVED_STAT_LABELS.sealResist,
}

function formatStatValue(key: keyof DisplayStats, value: number) {
  if (PERCENT_KEYS.has(key)) return `${value.toFixed(1)}%`
  return String(Math.round(value))
}

function formatDelta(key: keyof DisplayStats, delta: number) {
  if (delta === 0) return ''
  const sign = delta > 0 ? '+' : ''
  if (PERCENT_KEYS.has(key)) return `${sign}${delta.toFixed(1)}`
  return `${sign}${Math.round(delta)}`
}

type InventoryEquipStatsProps = {
  player: PlayerFullState['player']
  equipped: EquippedSummary
  selectedItem?: Equipment
}

export function InventoryEquipStats({ player, equipped, selectedItem }: InventoryEquipStatsProps) {
  const current = computeDisplayStats(player, equipped)
  const hasPreview = Boolean(selectedItem && canEquipItem(selectedItem))
  const preview = hasPreview && selectedItem
    ? projectStatsForSelectedItem(player, equipped, selectedItem)
    : null
  const hasAnyChange =
    preview !== null &&
    DISPLAY_STAT_KEYS.some((key) => hasStatChange(key, current[key], preview[key]))

  return (
    <section className="inventory-stats" aria-label="角色属性">
      <h3 className="inventory-stats__title">
        {hasAnyChange ? '属性预览' : '当前属性'}
      </h3>
      <div className="inventory-stats__grid">
        {DISPLAY_STAT_KEYS.map((key) => (
          <StatCell
            key={key}
            statKey={key}
            label={STAT_LABELS[key]}
            current={current[key]}
            preview={hasPreview ? preview?.[key] : undefined}
          />
        ))}
      </div>
    </section>
  )
}

type StatCellProps = {
  statKey: keyof DisplayStats
  label: string
  current: number
  preview?: number
}

function hasStatChange(key: keyof DisplayStats, current: number, preview: number) {
  if (PERCENT_KEYS.has(key)) return Math.abs(preview - current) >= 0.05
  return Math.round(preview) !== Math.round(current)
}

function StatCell({ statKey, label, current, preview }: StatCellProps) {
  const hasChange = preview !== undefined && hasStatChange(statKey, current, preview)
  const delta = hasChange ? preview - current : 0
  const deltaText = formatDelta(statKey, delta)

  return (
    <div className="inventory-stats__cell">
      <span className="inventory-stats__label">{label}</span>
      <div className="inventory-stats__value-wrap">
        {hasChange ? (
          <div className="inventory-stats__transition">
            <span className="inventory-stats__old">{formatStatValue(statKey, current)}</span>
            <span className="inventory-stats__arrow" aria-hidden>
              →
            </span>
            <strong className="inventory-stats__value">{formatStatValue(statKey, preview)}</strong>
            <span
              className={
                delta > 0
                  ? 'inventory-stats__delta inventory-stats__delta--up'
                  : 'inventory-stats__delta inventory-stats__delta--down'
              }
            >
              {' '}
              ({deltaText})
            </span>
          </div>
        ) : (
          <strong className="inventory-stats__value">{formatStatValue(statKey, current)}</strong>
        )}
      </div>
    </div>
  )
}
