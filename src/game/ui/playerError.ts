import { PLAYER_COPY } from './playerCopy'

const TECHNICAL_HINTS = [
  'fetch',
  'network',
  '服务器',
  'Failed',
  'ECONNREFUSED',
  'status',
  'Spine',
  'skeleton',
  'json',
  'http',
]

/** 将内部错误信息转为玩家可读文案 */
export function toPlayerErrorMessage(error: unknown, fallback = '出了些差错，请稍后再试') {
  const message = error instanceof Error ? error.message : String(error ?? '')
  if (!message.trim()) return fallback

  const lower = message.toLowerCase()
  if (TECHNICAL_HINTS.some((hint) => lower.includes(hint.toLowerCase()) || message.includes(hint))) {
    if (message.includes('创角') || message.includes('角色名')) return message
    if (message.includes('加点')) return message
    if (message.includes('穿戴') || message.includes('鉴定') || message.includes('背包')) return message
    return PLAYER_COPY.connectionFailed
  }

  return message
}

export function sanitizePlayerErrorMessage(message: string) {
  if (!message.trim()) return PLAYER_COPY.connectionFailed
  return toPlayerErrorMessage(new Error(message), message)
}
