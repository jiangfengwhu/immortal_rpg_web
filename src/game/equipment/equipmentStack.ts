import type { Equipment } from './equipment.types'

const STACK_COUNT_SUFFIX = '×'

/** 去掉名称里遗留的「×数量」后缀 */
export function materialBaseName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''
  const idx = trimmed.lastIndexOf(STACK_COUNT_SUFFIX)
  if (idx <= 0) return trimmed
  const suffix = trimmed.slice(idx + STACK_COUNT_SUFFIX.length).trim()
  if (!suffix || !/^\d+$/.test(suffix)) return trimmed
  return trimmed.slice(0, idx).trim()
}

/** 读取堆叠数量（兼容旧存档把数量写在名称里） */
export function effectiveStackCount(item: Pick<Equipment, 'name' | 'stackCount'>): number {
  if (item.stackCount && item.stackCount > 0) return item.stackCount
  const base = materialBaseName(item.name ?? '')
  const rawName = item.name ?? ''
  if (base !== rawName) {
    const suffix = rawName.slice(base.length + STACK_COUNT_SUFFIX.length).trim()
    const parsed = Number.parseInt(suffix, 10)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return 1
}

export function itemDisplayName(item: Pick<Equipment, 'name'>): string {
  return materialBaseName(item.name ?? '') || item.name || '未知物品'
}

export function isStackableItem(item: Pick<Equipment, 'slot'>): boolean {
  return item.slot === 'material'
}
