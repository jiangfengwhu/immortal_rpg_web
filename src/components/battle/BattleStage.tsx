import { useEffect, useRef, useState, useMemo } from 'react'
import { useBattleStore } from '../../battle/battleStore'
import { useGameSessionStore } from '../../game/gameSessionStore'
import { resolveWorldMap } from '../../game/world/resolveWorldMap'
import { useInfoFeedStore } from '../../game/infoFeed/infoFeedStore'
import { findActiveHarvestEntry } from '../../game/harvest/harvestSession'

// Funny battle description templates
const ATTACK_TEMPLATES = [
  '{actor}抡起膀子，使出了一招王八乱舞！狂扇{target}大耳刮子！',
  '{actor}深吸一口气，吐出一口浓痰，精准打击了{target}的防线！',
  '{actor}突然弯腰捡起一块板砖，以迅雷不及掩耳之势拍向{target}！',
  '{actor}使出「咸鱼突刺」，直插{target}的咯吱窝，将其笑出了眼泪！',
  '{actor}一个滑铲，试图从{target}胯下钻过，不料头撞到了对方膝盖！',
]

const SKILL_TEMPLATES = [
  '{actor}双手结印，大喊一声：“看我的螺旋丸！”结果手里只冒出了一个肥皂泡，砸向了{target}！',
  '{actor}掏出一本《修仙生存指南》，照本宣科念了一段紧箍咒，震得{target}头晕眼花！',
  '{actor}大吼：“吃我一招降龙十八摸！”伸出魔爪在{target}身上一顿乱挠，痒得对方直打滚！',
  '{actor}使出「排山倒海」，其实只是用力推了{target}一把，对方差点被路过的蚂蚁绊倒！',
  '{actor}施展「金蝉脱壳」，当场把外衣脱掉扔向{target}，自己穿着红肚兜在后面偷袭！',
]

const ULTIMATE_TEMPLATES = [
  '{actor}祭出了终极杀招「猴子偷桃」！手段卑劣至极，空气中充满了下限全无的猥琐气息！',
  '{actor}大喝一声：“系统，给他整个活！”虚空中突然落下一台电风扇，疯狂风卷袭击{target}！',
  '{actor}双眼通红，使出了绝杀「咸鱼翻身」！爆发出强烈的咸鱼之光，闪瞎了{target}的钛金狗眼！',
  '{actor}发动终极奥义「打工人怒火」！掏出大堆工作周报疯狂砸向{target}，直接对其进行精神拷问！',
  '{actor}施展「真·躺平术」，当场往地上一躺，{target}愣住了，被碰瓷的神秘气场震得狂喷鲜血！',
]

function getFunnyAttackText(actor: string, target: string, kind: string): string {
  const pool =
    kind === 'ultimate'
      ? ULTIMATE_TEMPLATES
      : kind === 'skill'
        ? SKILL_TEMPLATES
        : ATTACK_TEMPLATES
  const template = pool[Math.floor(Math.random() * pool.length)]
  return template.replace(/{actor}/g, actor).replace(/{target}/g, target)
}

export function BattleStage() {
  const phase = useBattleStore((state) => state.phase)
  const winner = useBattleStore((state) => state.winner)
  const playerHp = useBattleStore((state) => state.playerHp)
  const enemyHp = useBattleStore((state) => state.enemyHp)
  const playerMaxHp = useBattleStore((state) => state.playerMaxHp)
  const enemyMaxHp = useBattleStore((state) => state.enemyMaxHp)
  const sim = useBattleStore((state) => state.sim)
  const setPhase = useBattleStore((state) => state.setPhase)
  const applySnapshot = useBattleStore((state) => state.applySnapshot)
  const resetBattleArena = useBattleStore((state) => state.resetBattleArena)
  const rewardSyncing = useBattleStore((state) => state.rewardSyncing)

  const playerState = useGameSessionStore((state) => state.playerState)
  const lastOpponentName = useGameSessionStore((state) => state.lastOpponentName)

  const [logs, setLogs] = useState<string[]>([])
  const logEndRef = useRef<HTMLDivElement>(null)

  const showPerformance = phase !== 'ready'
  const playerName = playerState?.player.name ?? '无名侠客'
  const opponentName = playerState?.opponentName ?? lastOpponentName ?? '强敌'
  const chapter = playerState
    ? resolveWorldMap(playerState.player.realm, playerState.player.stageIndex)
    : { name: '青石村', phaseName: '凡尘俗世' }

  const feedTimeline = useInfoFeedStore((state) => state.entries)

  const activeHarvest = findActiveHarvestEntry(feedTimeline)
  const harvestActive = Boolean(activeHarvest)

  const activePet = useMemo(() => {
    return playerState?.player.pets?.find((p) => p.isActive)
  }, [playerState?.player.pets])

  // Autoscroll battle logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Logic driving text battle ticks
  useEffect(() => {
    if (phase !== 'entering') return

    // Initialize battle text
    setLogs([
      `【修仙演武】大战一触即发！`,
      `「${opponentName}」双手叉腰拦住去路，大吼道：“此路是我开，此树是我栽，要想从此过，留下辣条来！”`,
      `「${playerName}」不屑地撇了撇嘴：“别废话，看招！”`,
    ])

    const timer = setTimeout(() => {
      setPhase('fighting')
    }, 1500)
    return () => clearTimeout(timer)
  }, [phase, setPhase, playerName, opponentName])

  useEffect(() => {
    if (phase !== 'fighting') return

    const interval = setInterval(() => {
      if (sim.isFinished()) {
        const snapshot = sim.getSnapshot()
        applySnapshot()
        const finalWinner = snapshot.winner === 'player' ? playerName : opponentName
        setLogs((prev) => [
          ...prev,
          `================================`,
          `【战斗结束】「${finalWinner}」获得了最终的胜利！`,
          snapshot.winner === 'player'
            ? `「${playerName}」傲然挺立：“哼，就这点能耐也敢拦路？回去再练个几万年吧！”`
            : `「${playerName}」四脚朝天躺在地上，哼哼唧唧：“算你狠……下次看我不叫我爷爷来揍你！”`,
        ])
        setPhase('ended')
        clearInterval(interval)
        return
      }

      // Run one step of simulation
      const events = sim.advanceRound()
      applySnapshot()

      const newLogs: string[] = []
      for (const ev of events) {
        if (ev.type === 'ACTION') {
          const actorLabel = ev.actor === 'player' ? playerName : opponentName
          const targetLabel = ev.actor === 'player' ? opponentName : playerName
          newLogs.push(getFunnyAttackText(actorLabel, targetLabel, ev.kind))
        } else if (ev.type === 'HIT') {
          const targetLabel = ev.target === 'player' ? playerName : opponentName
          newLogs.push(
            `💥 击中「${targetLabel}」！爆出伤害 -${ev.damage} 点！对方疼得倒吸一口凉气，捂着伤处龇牙咧嘴（剩余HP: ${ev.remainingHp}）`,
          )
        }
      }

      if (newLogs.length > 0) {
        setLogs((prev) => [...prev, ...newLogs])
      }
    }, 800) // 800ms per combat action turn

    return () => clearInterval(interval)
  }, [phase, sim, applySnapshot, setPhase, playerName, opponentName])

  return (
    <section
      className={`battle-stage battle-stage--text${showPerformance ? ' battle-stage--live' : ''}`}
      aria-label="文字演武场"
    >
      {showPerformance ? (
        <div className="text-battle">
          {/* Header HP panels */}
          <div className="text-battle__hud">
            <div className="text-battle__unit text-battle__unit--player">
              <span className="text-battle__name glow-text--cyan">【你】{playerName}</span>
              <div className="text-battle__hp-bar">
                <div
                  className="text-battle__hp-fill text-battle__hp-fill--player"
                  style={{ width: `${Math.max(0, (playerHp / playerMaxHp) * 100)}%` }}
                />
              </div>
              <span className="text-battle__hp-text">
                HP: {playerHp} / {playerMaxHp}
              </span>
            </div>

            <div className="text-battle__vs shimmer-text">VS</div>

            <div className="text-battle__unit text-battle__unit--enemy">
              <span className="text-battle__name glow-text--purple">【敌】{opponentName}</span>
              <div className="text-battle__hp-bar">
                <div
                  className="text-battle__hp-fill text-battle__hp-fill--enemy"
                  style={{ width: `${Math.max(0, (enemyHp / enemyMaxHp) * 100)}%` }}
                />
              </div>
              <span className="text-battle__hp-text">
                HP: {enemyHp} / {enemyMaxHp}
              </span>
            </div>
          </div>

          {/* Logs scroll area */}
          <div className="text-battle__logs-container">
            <div className="text-battle__logs">
              {logs.map((log, index) => (
                <div key={index} className="text-battle__log-line">
                  {log}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* Action buttons on end */}
          {phase === 'ended' && winner && (
            <div className="text-battle__controls">
              <span className={`text-battle__outcome text-battle__outcome--${winner}`}>
                {winner === 'player' ? '🎉 捷报传来，你赢了！' : '💀 惨败受挫，你凉了！'}
              </span>
              <button
                type="button"
                className="command-hub__btn command-hub__btn--ghost command-hub__btn--compact"
                disabled={rewardSyncing}
                onClick={() => {
                  resetBattleArena()
                }}
              >
                返回
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-battle-idle">
          <div className="spirit-particle" aria-hidden />
          <div className="spirit-particle" aria-hidden />
          <div className="spirit-particle" aria-hidden />
          <div className="spirit-particle" aria-hidden />
          <div className="spirit-particle" aria-hidden />
          <div className="spirit-particle" aria-hidden />
          <div className="spirit-particle" aria-hidden />
          <div className="spirit-particle" aria-hidden />

          {harvestActive ? (
            <div className="text-battle-idle__harvest-simple">
              <span className="text-battle-idle__loc">
                📍 {chapter.phaseName} · {chapter.name}
              </span>
              <div className="text-battle-idle__harvest-icon">🌿</div>
              <h3 className="text-battle-idle__title">挂机修行中</h3>
              <p className="text-battle-idle__harvest-tip-simple">
                {activeHarvest?.text ?? '正在采集灵气机缘'}
                <br />
                收获与日志已收入右侧「信息中心」状态条
              </p>
            </div>
          ) : (
            <div className="text-battle-idle__content">
              <span className="text-battle-idle__loc">
                📍 {chapter.phaseName} · {chapter.name}
              </span>

              <h3 className="text-battle-idle__title">修仙闲暇</h3>

              <div className="text-battle-idle__vortex">
                <div className="text-battle-idle__vortex-ring text-battle-idle__vortex-ring--jade" />
                <div className="text-battle-idle__breath-ring">
                  <span className="text-battle-idle__breath-label">打坐中</span>
                  <span className="text-battle-idle__breath-sub">大周天</span>
                </div>
              </div>

              <p className="text-battle-idle__description">
                你正盘膝端坐在蒲团之上，平心静气默默运转大周天。
                周身灵气随呼吸微微吞吐，在你灵海深处汇聚成小巧的气旋。
                极目远眺，青石古朴，仙云缭绕。暂无妖兽袭扰，实乃修身养性绝佳之时。
              </p>

              {activePet && (
                <div className="text-battle-idle__pet-badge">
                  <span className="text-battle-idle__pet-icon">🐾</span>
                  <span className="text-battle-idle__pet-name">{activePet.name}</span>
                  <span className="text-battle-idle__pet-hint">出战中，正在为你护法</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
