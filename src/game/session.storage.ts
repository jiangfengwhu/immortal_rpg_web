import { SESSION_STORAGE_KEY } from './session.const'

const LOCAL_GAME_PREFIX = 'unboxing_'

/** 清除本设备全部江湖进度（角色 ID、引导等） */
export function clearAllLocalGameProgress() {
  const keysToRemove: string[] = []
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key?.startsWith(LOCAL_GAME_PREFIX)) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))
  localStorage.removeItem(SESSION_STORAGE_KEY)
}
