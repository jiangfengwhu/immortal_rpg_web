const WUXIA_Q_PLAYERS_ROOT = '/players/wuxia_q' as const

export function wuxiaQPlayerAsset(characterId: string, fileName: string) {
  return `${WUXIA_Q_PLAYERS_ROOT}/${characterId}/${fileName}`
}
