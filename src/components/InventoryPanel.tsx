import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'

import {
  EQUIPMENT_SLOT_GRID_AREA,
  EQUIPMENT_SLOT_LABELS,
  SLOT_GLYPH,
} from '../game/equipment/equipment.constants'
import type { Equipment, EquipmentSlot } from '../game/equipment/equipment.types'
import { PLAYER_CLASS_LABELS } from '../game/character/character.constants'
import { canEquipItem } from '../game/equipment/computeEquipmentBonuses'
import { findEquipmentItem } from '../game/inventory/findEquipmentItem'
import {
  anchorBelowBagColumn,
  anchorBelowSlot,
  clampDetailAnchorX,
  type InventoryDetailAnchor,
} from '../game/inventory/inventoryDetailAnchor'
import { shouldKeepInventoryDetailOpen } from '../game/inventory/inventoryHover'
import { useGameSessionStore } from '../game/gameSessionStore'
import { InventoryBagGrid } from './InventoryBagGrid'
import { InventoryEquipStats } from './InventoryEquipStats'
import { InventoryItemDetail } from './InventoryItemDetail'
import { EquipVisual } from './inventoryBag.shared'

type InventoryHoverHandler = (itemId: string | null, event?: MouseEvent<HTMLElement>) => void
type InventoryHoverClearHandler = (event: MouseEvent<HTMLElement>) => void
type InventoryQuickEquipHandler = (item: Equipment, event: MouseEvent<HTMLElement>) => void

type EquipSlotButtonProps = {
  slot: EquipmentSlot
  item?: Equipment
  onHover: InventoryHoverHandler
  onHoverClear: InventoryHoverClearHandler
  onQuickEquip: InventoryQuickEquipHandler
  overlay?: boolean
}

function EquipSlotButton({ slot, item, onHover, onHoverClear, onQuickEquip, overlay }: EquipSlotButtonProps) {
  const classNames = [
    'inventory-equip-slot',
    `inventory-equip-slot--${slot}`,
    item ? 'inventory-equip-slot--filled' : '',
    overlay ? 'inventory-equip-slot--overlay' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (!item) {
    return (
      <button
        type="button"
        className={classNames}
        style={overlay ? undefined : { gridArea: EQUIPMENT_SLOT_GRID_AREA[slot] }}
        title={EQUIPMENT_SLOT_LABELS[slot]}
      >
        <span className="inventory-equip-slot__placeholder">
          <span className="inventory-equip-slot__placeholder-glyph">{SLOT_GLYPH[slot]}</span>
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      data-inventory-item
      data-item-id={item.id}
      className={classNames}
      style={overlay ? undefined : { gridArea: EQUIPMENT_SLOT_GRID_AREA[slot] }}
      onMouseEnter={(event) => onHover(item.id, event)}
      onMouseLeave={onHoverClear}
      onFocus={(event) => onHover(item.id, event)}
      onClick={(event) => onHover(item.id, event)}
      onContextMenu={(event) => onQuickEquip(item, event)}
    >
      <EquipVisual item={item} size="sm" framed />
    </button>
  )
}

const PAPERDOLL_SIDE_SLOTS: EquipmentSlot[] = ['weapon', 'bracer', 'belt', 'necklace', 'ring', 'top']
const PAPERDOLL_FEET_SLOTS: EquipmentSlot[] = ['bottom', 'shoes']

export function InventoryPanel() {
  const playerState = useGameSessionStore((state) => state.playerState)
  const inventoryOpen = useGameSessionStore((state) => state.inventoryOpen)
  const isSaving = useGameSessionStore((state) => state.isSaving)
  const toggleInventory = useGameSessionStore((state) => state.toggleInventory)
  const syncInventoryItems = useGameSessionStore((state) => state.syncInventoryItems)
  const equipItemById = useGameSessionStore((state) => state.equipItemById)
  const identifyItemById = useGameSessionStore((state) => state.identifyItemById)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null)
  const [detailAnchor, setDetailAnchor] = useState<InventoryDetailAnchor | null>(null)

  const updateDetailAnchor = useCallback((slotElement: HTMLElement) => {
    const container = overlayRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const isBagSlot = Boolean(slotElement.closest('.inventory-panel__grid'))
    const raw = isBagSlot
      ? anchorBelowBagColumn(slotElement, containerRect)
      : anchorBelowSlot(slotElement, containerRect)

    setDetailAnchor(clampDetailAnchorX(raw, containerRect.width))
  }, [])

  const handleHoverItem = useCallback<InventoryHoverHandler>((itemId, event) => {
    setHoveredItemId(itemId)
    if (!itemId || !event) {
      if (!itemId) setDetailAnchor(null)
      return
    }
    updateDetailAnchor(event.currentTarget)
  }, [updateDetailAnchor])

  const handleHoverClear = useCallback<InventoryHoverClearHandler>((event) => {
    if (shouldKeepInventoryDetailOpen(event.relatedTarget)) return
    setHoveredItemId(null)
    setDetailAnchor(null)
  }, [])

  const clearDetailHover = useCallback(() => {
    setHoveredItemId(null)
    setDetailAnchor(null)
  }, [])

  const handleQuickEquip = useCallback<InventoryQuickEquipHandler>((item, event) => {
    event.preventDefault()
    event.stopPropagation()
    if (isSaving || !canEquipItem(item)) return
    void equipItemById(item.id).then(() => clearDetailHover())
  }, [clearDetailHover, equipItemById, isSaving])

  useEffect(() => {
    if (!inventoryOpen) return
    setHoveredItemId(null)
    setDetailAnchor(null)
  }, [inventoryOpen])

  if (!playerState || !inventoryOpen) return null

  const { inventory, equipped, player } = playerState
  const hoveredItem = hoveredItemId
    ? findEquipmentItem(inventory, equipped, hoveredItemId) ?? null
    : null

  return (
    <div
      ref={overlayRef}
      className="inventory-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          toggleInventory()
        }
      }}
    >
      <div className="inventory-panel" onClick={(event) => event.stopPropagation()}>
        <header className="inventory-panel__header">
          <div>
            <p className="inventory-panel__eyebrow">行囊</p>
            <h2>装备背包</h2>
          </div>
          <button type="button" className="inventory-panel__close" onClick={toggleInventory} aria-label="关闭">
            ✕
          </button>
        </header>

        <aside className="inventory-panel__left">
          <section className="inventory-paperdoll" aria-label="已装备">
            <div className="inventory-equip-grid">
              <EquipSlotButton
                slot="hat"
                item={equipped.hat}
                onHover={handleHoverItem}
                onHoverClear={handleHoverClear}
                onQuickEquip={handleQuickEquip}
              />

              {PAPERDOLL_SIDE_SLOTS.map((slot) => {
                const item = equipped[slot]
                return (
                  <EquipSlotButton
                    key={slot}
                    slot={slot}
                    item={item}
                    onHover={handleHoverItem}
                    onHoverClear={handleHoverClear}
                    onQuickEquip={handleQuickEquip}
                  />
                )
              })}

              <div className="inventory-portrait" aria-hidden>
                <div className="inventory-portrait__frame">
                  <span className="inventory-portrait__silhouette" />
                </div>
                <p className="inventory-portrait__name">{player.name}</p>
                <p className="inventory-portrait__class">
                  {PLAYER_CLASS_LABELS[player.class]} · Lv.{player.level}
                </p>
              </div>

              <div className="inventory-equip-feet">
                {PAPERDOLL_FEET_SLOTS.map((slot) => {
                  const item = equipped[slot]
                  return (
                    <EquipSlotButton
                      key={slot}
                      slot={slot}
                      item={item}
                      onHover={handleHoverItem}
                      onHoverClear={handleHoverClear}
                      onQuickEquip={handleQuickEquip}
                    />
                  )
                })}
              </div>
            </div>
          </section>

          <InventoryEquipStats player={player} equipped={equipped} selectedItem={hoveredItem ?? undefined} />
        </aside>

        <div className="inventory-panel__right">
          <div className="inventory-panel__right-scroll">
            <section className="inventory-panel__grid-wrap" aria-label="背包">
              <InventoryBagGrid
                playerId={player.id}
                items={inventory}
                open={inventoryOpen}
                hoveredItemId={hoveredItemId}
                onHoverItem={handleHoverItem}
                onHoverClear={handleHoverClear}
                onQuickEquip={handleQuickEquip}
                onItemsChange={syncInventoryItems}
              />
            </section>
          </div>
        </div>
      </div>

      {hoveredItem && detailAnchor && (
        <InventoryItemDetail
          item={hoveredItem}
          anchor={detailAnchor}
          isSaving={isSaving}
          onIdentify={(itemId) => void identifyItemById(itemId)}
          onMouseLeave={handleHoverClear}
        />
      )}
    </div>
  )
}
