import { useEffect, useRef, useState } from 'react'

import {
  EQUIPMENT_SLOT_LABELS,
  RARITY_COLORS,
  RARITY_LABELS,
} from '../game/equipment/equipment.constants'
import {
  equipmentBaseStats,
  formatBaseStatLine,
  hasBaseStats,
  isEquipmentRevealed,
  needsIdentify,
} from '../game/equipment/equipmentDisplay'
import type { Equipment } from '../game/equipment/equipment.types'
import { normalizeEquipmentSlot } from '../game/equipment/equipment.types'
import type { InventoryDetailAnchor } from '../game/inventory/inventoryDetailAnchor'
import { EquipVisual, rarityClass } from './inventoryBag.shared'
import type { MouseEvent } from 'react'

type InventoryItemDetailProps = {
  item: Equipment
  anchor: InventoryDetailAnchor
  isSaving: boolean
  onIdentify: (itemId: string) => void
  onMouseLeave: (event: MouseEvent<HTMLElement>) => void
}

export function InventoryItemDetail({
  item,
  anchor,
  isSaving,
  onIdentify,
  onMouseLeave,
}: InventoryItemDetailProps) {
  const revealed = isEquipmentRevealed(item)
  const baseStats = equipmentBaseStats(item)
  const prevStatus = useRef(item.status)
  const [flashReveal, setFlashReveal] = useState(false)

  useEffect(() => {
    if (prevStatus.current === 'ready' && item.status === 'identified') {
      setFlashReveal(true)
      const timer = window.setTimeout(() => setFlashReveal(false), 1200)
      prevStatus.current = item.status
      return () => window.clearTimeout(timer)
    }
    prevStatus.current = item.status
  }, [item.status])

  return (
    <div
      className="inventory-detail-overlay"
      role="presentation"
      style={{ left: anchor.x, top: anchor.y }}
      onClick={(event) => event.stopPropagation()}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="inventory-detail-bridge"
        style={{ height: anchor.bridgeHeight }}
        aria-hidden
      />
      <aside
        className={`inventory-panel__detail ${rarityClass(item.rarity)}${
          flashReveal ? ' inventory-panel__detail--revealed' : ''
        }`}
        aria-label="装备详情"
      >
        <div className="inventory-detail__preview">
          <EquipVisual item={item} size="lg" framed />
        </div>
        <p
          className="inventory-detail__rarity"
          style={{ color: RARITY_COLORS[item.rarity ?? 'common'] }}
        >
          {RARITY_LABELS[item.rarity ?? 'common']}
          {item.slot
            ? ` · ${EQUIPMENT_SLOT_LABELS[normalizeEquipmentSlot(item.slot) ?? 'weapon']}`
            : ''}
          {revealed && <span className="inventory-detail__identified-badge">已鉴定</span>}
        </p>
        <h3 className="inventory-detail__name">{item.name ?? '未知装备'}</h3>

        {revealed && item.lore && (
          <p className="inventory-detail__lore">{item.lore}</p>
        )}

        {!revealed && (
          <p className="inventory-detail__muted">尚未鉴定，词缀与说明仍被灵光遮蔽。</p>
        )}

        {revealed && hasBaseStats(baseStats) && (
          <p className="inventory-detail__base-stats">{formatBaseStatLine(baseStats)}</p>
        )}

        {revealed ? (
          <ul className="inventory-detail__affixes">
            {(item.affixes ?? []).length > 0 ? (
              (item.affixes ?? []).map((affix, index) => (
                <li key={`${affix.label}-${index}`}>{affix.value}</li>
              ))
            ) : (
              <li className="inventory-detail__empty">无额外词缀</li>
            )}
          </ul>
        ) : (
          <ul className="inventory-detail__affixes inventory-detail__affixes--hidden">
            <li>？？？</li>
            <li>？？？</li>
          </ul>
        )}

        {needsIdentify(item) && (
          <div className="inventory-detail__actions">
            <button
              type="button"
              className="inventory-detail__btn inventory-detail__btn--primary"
              disabled={isSaving}
              onClick={() => onIdentify(item.id)}
            >
              {isSaving ? '鉴定中…' : '鉴定'}
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
