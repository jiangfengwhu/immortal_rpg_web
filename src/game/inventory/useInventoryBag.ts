import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchInventoryPage } from '../../api/equipment'
import {
  INVENTORY_FETCH_LIMIT,
  INVENTORY_UI_INITIAL_SLOTS,
  INVENTORY_UI_SLOT_BATCH,
} from '../equipment/equipment.constants'
import type { Equipment } from '../equipment/equipment.types'

function mergeEquipmentItems(existing: Equipment[], incoming: Equipment[]) {
  const byId = new Map(existing.map((item) => [item.id, item]))
  for (const item of incoming) {
    byId.set(item.id, item)
  }
  return Array.from(byId.values())
}

type UseInventoryBagOptions = {
  playerId: string
  items: Equipment[]
  open: boolean
  onItemsChange: (items: Equipment[]) => void
}

export function useInventoryBag({ playerId, items, open, onItemsChange }: UseInventoryBagOptions) {
  const [visibleSlots, setVisibleSlots] = useState(INVENTORY_UI_INITIAL_SLOTS)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const offsetRef = useRef(0)
  const loadingRef = useRef(false)
  const itemsRef = useRef(items)
  itemsRef.current = items

  const loadMoreData = useCallback(async () => {
    if (!playerId || loadingRef.current || !hasMore) return
    loadingRef.current = true
    setLoading(true)
    try {
      const page = await fetchInventoryPage(playerId, offsetRef.current, INVENTORY_FETCH_LIMIT)
      const merged = mergeEquipmentItems(itemsRef.current, page.items)
      offsetRef.current += page.items.length
      const total = page.total ?? merged.length
      setHasMore(page.hasMore && merged.length < total)
      if (page.items.length > 0 || merged.length !== itemsRef.current.length) {
        onItemsChange(merged)
      }
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [hasMore, onItemsChange, playerId])

  useEffect(() => {
    if (!open) return
    let cancelled = false

    setVisibleSlots(INVENTORY_UI_INITIAL_SLOTS)
    offsetRef.current = itemsRef.current.length
    setHasMore(itemsRef.current.length === 0 || itemsRef.current.length % INVENTORY_FETCH_LIMIT === 0)

    void (async () => {
      try {
        const page = await fetchInventoryPage(playerId, 0, INVENTORY_FETCH_LIMIT)
        if (cancelled) return
        const merged = mergeEquipmentItems(itemsRef.current, page.items)
        offsetRef.current = page.items.length
        const total = page.total ?? merged.length
        setHasMore(page.hasMore && merged.length < total)
        if (merged.length !== itemsRef.current.length) {
          onItemsChange(merged)
        }
      } catch {
        if (!cancelled) {
          setHasMore(
            itemsRef.current.length % INVENTORY_FETCH_LIMIT === 0 && itemsRef.current.length > 0,
          )
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [onItemsChange, open, playerId])

  const expandUi = useCallback(() => {
    const bagItemCount = itemsRef.current.filter((item) => !item.equipped).length
    setVisibleSlots((count) => {
      const next = count + INVENTORY_UI_SLOT_BATCH
      if (hasMore && next >= bagItemCount - INVENTORY_UI_SLOT_BATCH / 2) {
        void loadMoreData()
      }
      return next
    })
  }, [hasMore, loadMoreData])

  const bagItems = items.filter((item) => !item.equipped)
  const slotCount = Math.max(visibleSlots, bagItems.length)
  const gridCells: Array<Equipment | null> = Array.from({ length: slotCount }, (_, index) =>
    bagItems[index] ?? null,
  )

  return { gridCells, expandUi, loading, hasMore }
}
