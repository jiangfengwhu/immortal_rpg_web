export function shouldKeepInventoryDetailOpen(relatedTarget: EventTarget | null) {
  if (!(relatedTarget instanceof Element)) return false
  if (relatedTarget.closest('.inventory-detail-overlay')) return true
  if (relatedTarget.closest('.inventory-detail-bridge')) return true
  if (relatedTarget.closest('[data-inventory-item]')) return true
  return false
}
