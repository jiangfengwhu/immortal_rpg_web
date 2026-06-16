import { useEffect } from 'react'

import { useGameSessionStore } from '../../game/gameSessionStore'
import { RARITY_LABELS } from '../../game/equipment/equipment.constants'
import { EquipVisual } from '../inventoryBag.shared'

const LOOT_FLOAT_MS = 2800

export function BattleLootToast() {
  const lootFloat = useGameSessionStore((state) => state.lootFloat)
  const playerState = useGameSessionStore((state) => state.playerState)
  const clearLootFloat = useGameSessionStore((state) => state.clearLootFloat)
  const refreshPlayer = useGameSessionStore((state) => state.refreshPlayer)

  useEffect(() => {
    if (!lootFloat) return
    const timer = window.setTimeout(() => clearLootFloat(), LOOT_FLOAT_MS)
    return () => window.clearTimeout(timer)
  }, [lootFloat, clearLootFloat])

  useEffect(() => {
    if (!lootFloat || lootFloat.source !== 'ai') return
    const pollIcon = window.setTimeout(() => {
      void refreshPlayer()
    }, 6000)
    return () => window.clearTimeout(pollIcon)
  }, [lootFloat, refreshPlayer])

  if (!lootFloat) return null

  const item =
    lootFloat.item ??
    playerState?.inventory.find((entry) => entry.id === lootFloat.dropId)

  const rarityLabel = item?.rarity ? RARITY_LABELS[item.rarity] : null
  const sourceHint = lootFloat.source === 'ai' ? '造化' : '宝库'

  return (
    <div className="battle-loot-toast" aria-live="polite">
      <EquipVisual item={item} slot={lootFloat.slot} size="md" />
      <div className="battle-loot-toast__text">
        <span className="battle-loot-toast__tag">{sourceHint}</span>
        <span className="battle-loot-toast__name">{lootFloat.name}</span>
        {rarityLabel && <span className="battle-loot-toast__rarity">{rarityLabel}</span>}
      </div>
    </div>
  )
}
