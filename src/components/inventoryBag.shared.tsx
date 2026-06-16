import { SLOT_GLYPH } from '../game/equipment/equipment.constants'
import { equipmentIconDataUrl } from '../game/equipment/equipmentIcon'
import type { Equipment, EquipmentRarity, EquipmentSlot } from '../game/equipment/equipment.types'
import { effectiveStackCount, itemDisplayName } from '../game/equipment/equipmentStack'
import { normalizeEquipmentSlot } from '../game/equipment/equipment.types'

export function rarityClass(rarity?: EquipmentRarity) {
  return `inventory-item--${rarity ?? 'common'}`
}

type EquipVisualProps = {
  item?: Equipment
  slot?: EquipmentSlot
  size?: 'sm' | 'md' | 'lg'
  /** 纸娃娃/详情等场景：品级边框紧贴图标 */
  framed?: boolean
}

export function EquipVisual({ item, slot, size = 'md', framed = false }: EquipVisualProps) {
  const rarity = item?.rarity ?? 'common'
  const normalizedSlot = normalizeEquipmentSlot(item?.slot ?? slot)
  const displayName = item ? itemDisplayName(item) : ''
  const glyph = displayName.charAt(0) || (normalizedSlot ? SLOT_GLYPH[normalizedSlot] : '宝')
  const rarityCls = rarityClass(rarity)
  const framedCls = framed ? 'equip-visual--framed' : ''

  const iconUrl = equipmentIconDataUrl(item?.iconBase64)

  if (iconUrl) {
    return (
      <span
        className={`equip-visual equip-visual--${size} ${rarityCls} ${framedCls} equip-visual--has-icon`.trim()}
        style={{ backgroundImage: `url(${iconUrl})` }}
      />
    )
  }

  return (
    <span className={`equip-visual equip-visual--${size} ${rarityCls} ${framedCls}`.trim()}>
      <span className="equip-visual__shine" aria-hidden />
      <span className="equip-visual__glyph">{glyph}</span>
    </span>
  )
}
