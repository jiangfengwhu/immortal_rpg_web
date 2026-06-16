import { useEffect } from 'react'

import { useBattleStore } from '../battle/battleStore'
import { useGameSessionStore } from '../game/gameSessionStore'

/** 进入游戏后同步后端属性到战斗单位；战后结算写入后端 */
export function PlayerBattleSync() {
  const playerState = useGameSessionStore((state) => state.playerState)
  const syncPlayerUnit = useBattleStore((state) => state.syncPlayerUnit)
  const phase = useBattleStore((state) => state.phase)
  const winner = useBattleStore((state) => state.winner)
  const rewardSyncing = useBattleStore((state) => state.rewardSyncing)
  const rewardSettled = useBattleStore((state) => state.rewardSettled)
  const syncBattleReward = useBattleStore((state) => state.syncBattleReward)

  useEffect(() => {
    if (!playerState) return
    const phase = useBattleStore.getState().phase
    if (phase !== 'ready') return
    syncPlayerUnit()
  }, [playerState, syncPlayerUnit])

  useEffect(() => {
    if (phase === 'ended' && winner === 'player' && !rewardSyncing && !rewardSettled) {
      void syncBattleReward()
    }
  }, [phase, winner, rewardSyncing, rewardSettled, syncBattleReward])

  return null
}
