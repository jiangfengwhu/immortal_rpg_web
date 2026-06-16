import { useBattleStore } from '../../battle/battleStore'

/** 战斗中仅展示轻量状态；主操作在决策中枢 */
export function BattleHud() {
  const phase = useBattleStore((state) => state.phase)
  const rewardSyncing = useBattleStore((state) => state.rewardSyncing)

  if (phase === 'ready' || phase === 'ended') return null

  return (
    <div className="game-hud battle-hud battle-hud--minimal">
      {rewardSyncing && <span className="battle-hud__sync-dot" />}
    </div>
  )
}
