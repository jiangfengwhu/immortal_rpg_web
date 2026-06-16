/** 将服务端 iconBase64 转为可用的 data URL（支持 PNG / SVG） */
export function equipmentIconDataUrl(iconBase64?: string): string | null {
  if (!iconBase64) return null
  const trimmed = iconBase64.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('data:')) return trimmed
  if (trimmed.startsWith('PHN2Zy') || trimmed.startsWith('PD94bW')) {
    return `data:image/svg+xml;base64,${trimmed}`
  }
  return `data:image/png;base64,${trimmed}`
}
