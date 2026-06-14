import { ENEMY_BATTLE_UNIT, PLAYER_BATTLE_UNIT } from '../../battle/battle.constants'
import { useBattleStore } from '../../battle/battleStore'

export function BattleHud() {
  const phase = useBattleStore((state) => state.phase)
  const playerHp = useBattleStore((state) => state.playerHp)
  const enemyHp = useBattleStore((state) => state.enemyHp)
  const turn = useBattleStore((state) => state.turn)
  const log = useBattleStore((state) => state.log)
  const winner = useBattleStore((state) => state.winner)
  const unitsReady = useBattleStore((state) => state.unitsReady)
  const loadError = useBattleStore((state) => state.loadError)
  const startBattle = useBattleStore((state) => state.startBattle)

  const canStart = unitsReady.player && unitsReady.enemy && !loadError
  const playerHpRatio = playerHp / PLAYER_BATTLE_UNIT.maxHp
  const enemyHpRatio = enemyHp / ENEMY_BATTLE_UNIT.maxHp

  return (
    <div className="game-hud battle-hud">
      <header className="game-hud__title">
        <p className="game-hud__eyebrow">自走棋 · 对战模拟</p>
        <h1>仙途演武</h1>
      </header>

      <aside className="battle-hud__log">
        <p className="battle-hud__log-title">战报</p>
        {loadError ? (
          <p className="battle-hud__log-line battle-hud__log-line--error">{loadError}</p>
        ) : log.length === 0 ? (
          <p className="battle-hud__log-line">点击「开始战斗」，观看双方自动对战。</p>
        ) : (
          log.map((line, index) => (
            <p key={`${line}-${index}`} className="battle-hud__log-line">
              {line}
            </p>
          ))
        )}
      </aside>

      <div className="battle-hud__arena">
        <div className="battle-hud__unit battle-hud__unit--player">
          <div className="battle-hud__unit-head">
            <span>{PLAYER_BATTLE_UNIT.label}</span>
            <span>{playerHp}</span>
          </div>
          <div className="battle-hud__hp-track">
            <div
              className="battle-hud__hp-fill battle-hud__hp-fill--player"
              style={{ width: `${playerHpRatio * 100}%` }}
            />
          </div>
        </div>

        <div className="battle-hud__center">
          <p className="battle-hud__turn">回合 {turn}</p>
          {phase === 'ready' && (
            <button
              type="button"
              className="battle-hud__start"
              disabled={!canStart}
              onClick={startBattle}
            >
              {canStart ? '开始战斗' : '加载角色中…'}
            </button>
          )}
          {phase === 'entering' && <p className="battle-hud__status">双方进场中…</p>}
          {phase === 'fighting' && <p className="battle-hud__status">自动交锋中</p>}
          {phase === 'ended' && winner && (
            <>
              <p className="battle-hud__status">
                胜者：{winner === 'player' ? PLAYER_BATTLE_UNIT.label : ENEMY_BATTLE_UNIT.label}
              </p>
              <button type="button" className="battle-hud__start" onClick={startBattle}>
                再来一局
              </button>
            </>
          )}
          {phase === 'entering' && (
            <button type="button" className="battle-hud__start" disabled>
              进场中…
            </button>
          )}
        </div>

        <div className="battle-hud__unit battle-hud__unit--enemy">
          <div className="battle-hud__unit-head">
            <span>{ENEMY_BATTLE_UNIT.label}</span>
            <span>{enemyHp}</span>
          </div>
          <div className="battle-hud__hp-track">
            <div
              className="battle-hud__hp-fill battle-hud__hp-fill--enemy"
              style={{ width: `${enemyHpRatio * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
