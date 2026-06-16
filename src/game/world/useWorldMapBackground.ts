import { useGameSessionStore } from '../gameSessionStore'
import { resolveWorldMap, resolveWorldMapImageUrl } from './resolveWorldMap'

export function useWorldMapBackground() {
  const player = useGameSessionStore((state) => state.playerState?.player)
  if (!player) {
    return { chapter: null, imageUrl: null as string | null }
  }

  const chapter = resolveWorldMap(player.realm, player.stageIndex)
  const imageUrl = resolveWorldMapImageUrl(player.realm, player.stageIndex)
  return { chapter, imageUrl }
}
