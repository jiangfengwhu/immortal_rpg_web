export const SESSION_STORAGE_KEY = 'unboxing_player_id'

export function createPlayerId() {
  return `player_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
