import { useEffect, useRef, type MouseEvent } from 'react'

import type { Equipment } from '../game/equipment/equipment.types'
import { effectiveStackCount } from '../game/equipment/equipmentStack'
import { useInventoryBag } from '../game/inventory/useInventoryBag'
import { EquipVisual } from './inventoryBag.shared'

type InventoryHoverHandler = (itemId: string | null, event?: MouseEvent<HTMLElement>) => void
type InventoryHoverClearHandler = (event: MouseEvent<HTMLElement>) => void
type InventoryQuickEquipHandler = (item: Equipment, event: MouseEvent<HTMLElement>) => void

type InventoryBagGridProps = {
  playerId: string
  items: Equipment[]
  open: boolean
  hoveredItemId: string | null
  onItemsChange: (items: Equipment[]) => void
  onHoverItem: InventoryHoverHandler
  onHoverClear: InventoryHoverClearHandler
  onQuickEquip: InventoryQuickEquipHandler
}

export function InventoryBagGrid({
  playerId,
  items,
  open,
  hoveredItemId,
  onItemsChange,
  onHoverItem,
  onHoverClear,
  onQuickEquip,
}: InventoryBagGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const { gridCells, expandUi, loading } = useInventoryBag({
    playerId,
    items,
    open,
    onItemsChange,
  })

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !open) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          expandUi()
        }
      },
      { root: sentinel.parentElement, rootMargin: '120px', threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [expandUi, open])

  return (
    <>
      <div className="inventory-panel__grid">
        {gridCells.map((item, index) => {
          if (!item) {
            return <div key={`empty-${index}`} className="inventory-slot inventory-slot--empty" />
          }
          const isActive = hoveredItemId === item.id
          const stackCount = effectiveStackCount(item)
          return (
            <button
              key={item.id}
              type="button"
              data-inventory-item
              data-item-id={item.id}
              className={
                isActive
                  ? 'inventory-slot inventory-slot--filled inventory-slot--active'
                  : 'inventory-slot inventory-slot--filled'
              }
              onMouseEnter={(event) => onHoverItem(item.id, event)}
              onMouseLeave={onHoverClear}
              onFocus={(event) => onHoverItem(item.id, event)}
              onClick={(event) => onHoverItem(item.id, event)}
              onContextMenu={(event) => onQuickEquip(item, event)}
            >
              <EquipVisual item={item} size="md" />
              {item.status === 'generating' && (
                <span className="inventory-slot__badge inventory-slot__badge--pending">…</span>
              )}
              {item.status === 'ready' && (
                <span className="inventory-slot__badge inventory-slot__badge--unidentified">?</span>
              )}
              {stackCount > 1 && (
                <span className="inventory-slot__badge inventory-slot__badge--stack">×{stackCount}</span>
              )}
            </button>
          )
        })}
      </div>
      <div ref={sentinelRef} className="inventory-panel__sentinel" aria-hidden />
      {loading && <p className="inventory-panel__loading">整理中…</p>}
    </>
  )
}
