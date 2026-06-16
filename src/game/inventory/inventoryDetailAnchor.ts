import { INVENTORY_GRID_COLUMNS } from '../equipment/equipment.constants'

export const INVENTORY_DETAIL_WIDTH = 280

/** 格子与详情之间的透明悬停桥接区高度 */
export const INVENTORY_DETAIL_BRIDGE_HEIGHT = 16

export type InventoryDetailAnchor = {
  x: number
  y: number
  bridgeHeight: number
}

export function clampDetailAnchorX(
  anchor: InventoryDetailAnchor,
  containerWidth: number,
  overlayWidth = INVENTORY_DETAIL_WIDTH,
): InventoryDetailAnchor {
  const edge = 8
  const maxX = Math.max(edge, containerWidth - overlayWidth - edge)
  return {
    ...anchor,
    x: Math.min(Math.max(anchor.x, edge), maxX),
  }
}

function anchorBelowSlotRect(
  slotRect: DOMRect,
  containerRect: DOMRect,
  x: number,
): InventoryDetailAnchor {
  return {
    x,
    y: slotRect.bottom - containerRect.top,
    bridgeHeight: INVENTORY_DETAIL_BRIDGE_HEIGHT,
  }
}

export function anchorBelowSlot(
  slotElement: HTMLElement,
  containerRect: DOMRect,
): InventoryDetailAnchor {
  const slotRect = slotElement.getBoundingClientRect()
  return anchorBelowSlotRect(
    slotRect,
    containerRect,
    slotRect.left - containerRect.left,
  )
}

export function anchorBelowBagColumn(
  slotElement: HTMLElement,
  containerRect: DOMRect,
): InventoryDetailAnchor {
  const slotRect = slotElement.getBoundingClientRect()
  const grid = slotElement.closest('.inventory-panel__grid')
  if (!grid) {
    return anchorBelowSlot(slotElement, containerRect)
  }

  const cells = grid.querySelectorAll<HTMLElement>('.inventory-slot')
  const index = Array.from(cells).indexOf(slotElement)
  if (index < 0) {
    return anchorBelowSlot(slotElement, containerRect)
  }

  const column = index % INVENTORY_GRID_COLUMNS
  const gridRect = grid.getBoundingClientRect()
  const styles = getComputedStyle(grid)
  const gap = Number.parseFloat(styles.columnGap || styles.gap || '8') || 8
  const columnWidth = (gridRect.width - gap * (INVENTORY_GRID_COLUMNS - 1)) / INVENTORY_GRID_COLUMNS
  const columnLeft = gridRect.left + column * (columnWidth + gap)

  return anchorBelowSlotRect(
    slotRect,
    containerRect,
    columnLeft - containerRect.left,
  )
}
