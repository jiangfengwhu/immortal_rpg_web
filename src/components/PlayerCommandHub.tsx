import { useEffect, useRef } from 'react'

import { useBattleStore } from '../battle/battleStore'
import { CommandHubInfoFeed } from './CommandHubInfoFeed'
import { resolveCommandHubActions } from '../game/commandHub/resolveCommandHubActions'
import type { CommandHubAction } from '../game/commandHub/commandHub.types'
import { useGameSessionStore } from '../game/gameSessionStore'
import {
  BATTLE_LOSE_TEXT,
  BATTLE_STATUS_TEXT,
  BATTLE_WIN_TEXT,
  INTERACTION_ACTION_TEXT,
} from '../game/infoFeed/infoFeed.copy'
import { useInfoFeedStore } from '../game/infoFeed/infoFeedStore'
import { useToastStore } from '../game/toast/toastStore'
import { resolveActiveAfkFeature } from '../game/harvest/harvest.constants'
import { isHarvestActive } from '../game/harvest/harvestSession'
import { useHarvestSession } from '../game/harvest/useHarvestSession'
import { isStoryBattleReady } from '../game/quest/resolveStoryInteractions'
import { STORY_FEATURE_KEYS } from '../game/quest/story.constants'
import { useJourneyQuest } from '../game/quest/useJourneyQuest'
import { PLAYER_COPY } from '../game/ui/playerCopy'
import { sanitizePlayerErrorMessage } from '../game/ui/playerError'
import { resolveWorldMap } from '../game/world/resolveWorldMap'

function actionClassName(action: CommandHubAction): string {
  const classes = ['command-hub__btn']
  switch (action.variant) {
    case 'primary':
      classes.push('command-hub__btn--primary')
      break
    case 'choice':
      classes.push('command-hub__btn--choice')
      break
    case 'explore':
      classes.push('command-hub__btn--explore')
      break
    case 'battle':
      classes.push('command-hub__btn--battle')
      break
    case 'utility':
      classes.push('command-hub__btn--utility')
      break
    default:
      break
  }
  if (action.guide) classes.push('command-hub__btn--guide')
  return classes.join(' ')
}

export function PlayerCommandHub() {
  const phase = useBattleStore((state) => state.phase)
  const winner = useBattleStore((state) => state.winner)
  const turn = useBattleStore((state) => state.turn)
  const unitsReady = useBattleStore((state) => state.unitsReady)
  const loadError = useBattleStore((state) => state.loadError)
  const rewardSyncing = useBattleStore((state) => state.rewardSyncing)
  const startBattle = useBattleStore((state) => state.startBattle)
  const resetBattleArena = useBattleStore((state) => state.resetBattleArena)

  const playerState = useGameSessionStore((state) => state.playerState)
  const lastOpponentName = useGameSessionStore((state) => state.lastOpponentName)
  const lastBattleResult = useGameSessionStore((state) => state.lastBattleResult)
  const errorMessage = useGameSessionStore((state) => state.errorMessage)
  const onboardingStep = useGameSessionStore((state) => state.onboardingStep)
  const startAfkGather = useGameSessionStore((state) => state.startAfkGather)
  const stopAfkGather = useGameSessionStore((state) => state.stopAfkGather)
  const runWildBattle = useGameSessionStore((state) => state.runWildBattle)
  const resolveActiveAdventure = useGameSessionStore((state) => state.resolveActiveAdventure)

  const feedTimeline = useInfoFeedStore((state) => state.entries)
  const syncChronicle = useInfoFeedStore((state) => state.syncChronicle)
  const bindPlayer = useInfoFeedStore((state) => state.bindPlayer)
  const clearPlayer = useInfoFeedStore((state) => state.clearPlayer)
  const pushAction = useInfoFeedStore((state) => state.pushAction)
  const pushStatus = useInfoFeedStore((state) => state.pushStatus)
  const settleStatus = useInfoFeedStore((state) => state.settleStatus)
  const pushResult = useInfoFeedStore((state) => state.pushResult)
  const finalizeHarvestSession = useInfoFeedStore((state) => state.finalizeHarvestSession)

  const harvestActive = isHarvestActive(feedTimeline)

  const pushToast = useToastStore((state) => state.pushToast)

  const {
    player,
    quest,
    storyState,
    storyActive,
    choices,
    interactions,
    afkFeatures,
    busy,
    onInteraction,
    runEvent,
  } = useJourneyQuest()

  const battleStatusRef = useRef<string | null>(null)
  const prevPhaseRef = useRef(phase)
  const lastFeedErrorRef = useRef('')
  const playerId = player?.id

  useHarvestSession(playerId, storyState?.storyFlags, afkFeatures)

  useEffect(() => {
    if (!playerId) return
    bindPlayer(playerId)
    return () => clearPlayer()
  }, [bindPlayer, clearPlayer, playerId])

  useEffect(() => {
    if (!playerId || !storyState) return
    syncChronicle(storyState.storyChronicle ?? [], storyState.pendingNarratives ?? [])
  }, [playerId, storyState?.storyChronicle, storyState?.pendingNarratives, syncChronicle])

  useEffect(() => {
    if (phase === 'entering' && prevPhaseRef.current === 'ready') {
      battleStatusRef.current = pushStatus(BATTLE_STATUS_TEXT)
    }
    if (phase === 'ended' && winner && battleStatusRef.current) {
      settleStatus(
        battleStatusRef.current,
        winner === 'player' ? BATTLE_WIN_TEXT : BATTLE_LOSE_TEXT,
        winner === 'player' ? 'success' : 'warn',
      )
      battleStatusRef.current = null
    }
    if (phase === 'ready') {
      const activeStatus = feedTimeline.find((entry) => entry.kind === 'status' && entry.active)
      if (activeStatus) {
        settleStatus(activeStatus.id, '', 'success')
      }
    }
    prevPhaseRef.current = phase
  }, [phase, winner, feedTimeline, pushStatus, settleStatus])

  useEffect(() => {
    const message = loadError
      ? sanitizePlayerErrorMessage(loadError)
      : errorMessage || ''
    if (!message) {
      lastFeedErrorRef.current = ''
      return
    }
    if (message === lastFeedErrorRef.current) return
    pushResult(message, 'warn')
    lastFeedErrorRef.current = message
    if (errorMessage) useGameSessionStore.setState({ errorMessage: '' })
  }, [loadError, errorMessage, pushResult])

  if (!playerState || !player || !quest) return null

  const canStart = unitsReady.player && unitsReady.enemy && !loadError
  const opponent =
    playerState.opponentName ?? lastOpponentName ?? PLAYER_COPY.opponentFallback
  const inPerformance = phase !== 'ready'
  const objectives = quest.objectives ?? []
  const mapChapter = resolveWorldMap(player.realm, player.stageIndex)
  const mapName = quest.mapName ?? mapChapter.name
  const mapPhase = quest.mapPhaseName ?? mapChapter.phaseName
  const questGuide = onboardingStep === 1
  const battleGuide = onboardingStep === 2
  const storyBattleReady = isStoryBattleReady(player, storyState)

  const activeAfkFeature = resolveActiveAfkFeature(storyState?.storyFlags, afkFeatures)

  const actions = resolveCommandHubActions({
    questTitle: quest.title,
    objectives,
    opponent,
    choices,
    interactions,
    afkFeatures,
    activeAfkFeature,
    busy,
    storyActive,
    storyBattleReady,
    phase,
    canStartBattle: canStart,
    battleGuide,
    activeAdventure: storyState?.activeAdventure,
  })

  const handleAction = (action: CommandHubAction) => {
    switch (action.kind) {
      case 'story_choice':
        if (action.choiceId) {
          pushAction(`你选择了「${action.label}」。`)
          void runEvent({ playerId: player.id, type: 'make_choice', choiceId: action.choiceId })
        }
        break
      case 'adventure_choice':
        if (action.choiceId) {
          pushAction(`面对奇遇，你选择了「${action.label}」。`)
          void resolveActiveAdventure(action.choiceId)
        }
        break
      case 'wild_battle':
        pushAction(`你动身前往林间野地，搜寻可与切磋的妖兽。`)
        void runWildBattle()
        break
      case 'story_interaction': {
        const key = action.interactionKey
        if (key) {
          const actionText = INTERACTION_ACTION_TEXT[key]
          if (actionText) pushAction(actionText)
          onInteraction(key)
        }
        break
      }
      case 'battle':
        pushAction(`你深吸一口气，上前挑战「${opponent || '强敌'}」。`)
        startBattle()
        break
      case 'afk_claim': {
        const feature = action.afkFeature
        if (!feature) break
        pushAction(`你动身前往，开始「${action.label}」。`)
        void startAfkGather(feature).then((outcome) => {
          if (!outcome.ok) {
            pushToast(outcome.message, 'warn')
          }
        })
        break
      }
      default:
        break
    }
  }

  const handleStopHarvest = (_sessionId: string) => {
    const feature = activeAfkFeature ?? STORY_FEATURE_KEYS.afkHerb
    const label = feature === 'AFK_HERB_FIELD' ? '药田采集' : '竹林历练'
    pushAction(`你停下了「${label}」，返回院落。`)
    void stopAfkGather(feature).then((outcome) => {
      if (!outcome.ok) {
        pushToast(outcome.message, 'warn')
        return
      }
      finalizeHarvestSession('stopped')
    })
  }

  return (
    <section className="command-hub" aria-label="仙途决策">

      {inPerformance && (
        <div className="command-hub__battle-strip" aria-live="polite">
          {phase === 'entering' && <span>{PLAYER_COPY.battleEntering}</span>}
          {phase === 'fighting' && (
            <span>
              {PLAYER_COPY.battleFighting} · {PLAYER_COPY.battleTurn(turn)}
            </span>
          )}
          {phase === 'ended' && winner && (
            <>
              <span
                className={`command-hub__result-badge command-hub__result-badge--${winner === 'player' ? 'win' : 'lose'}`}
              >
                {winner === 'player' ? PLAYER_COPY.battleWinShort : PLAYER_COPY.battleLoseShort}
              </span>
              <button
                type="button"
                className="command-hub__btn command-hub__btn--ghost command-hub__btn--compact"
                disabled={rewardSyncing}
                onClick={() => {
                  if (storyActive && !storyBattleReady && winner === 'player') {
                    resetBattleArena()
                    return
                  }
                  startBattle()
                }}
              >
                {rewardSyncing
                  ? PLAYER_COPY.battleSettling
                  : storyActive && !storyBattleReady && winner === 'player'
                    ? '继续旅程'
                    : PLAYER_COPY.battleAgain}
              </button>
            </>
          )}
        </div>
      )}

      <div className="command-hub__panel">
        {storyState?.activeAdventure && (
          <div className="adventure-banner">
            <span className="adventure-banner__seal">仙缘奇遇</span>
            <div className="adventure-banner__body">
              <h4 className="adventure-banner__title">{storyState.activeAdventure.title}</h4>
              <p className="adventure-banner__desc">{storyState.activeAdventure.description}</p>
            </div>
            <span className="adventure-banner__hint">决断 →</span>
          </div>
        )}

        <CommandHubInfoFeed
          timeline={feedTimeline}
          objectives={objectives}
          onStopHarvest={harvestActive ? handleStopHarvest : undefined}
        />

        {actions.length > 0 && (
          <div className="command-hub__actions" role="group" aria-label={PLAYER_COPY.commandHubActions}>
            <p className="command-hub__actions-label">{PLAYER_COPY.commandHubActions}</p>
            <div className="command-hub__actions-deck">
              {actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className={actionClassName(action)}
                  disabled={action.disabled}
                  data-onboarding-target={action.onboardingTarget}
                  onClick={() => handleAction(action)}
                >
                  {action.variant === 'choice' ? (
                    <>
                      <span>{action.label}</span>
                      {action.hint && (
                        <>
                          <span className="command-hub__btn-sep" aria-hidden>
                            ·
                          </span>
                          <span className="command-hub__btn-sub">{action.hint}</span>
                        </>
                      )}
                    </>
                  ) : action.variant === 'battle' ? (
                    <span className="command-hub__battle-inner">
                      <span className="command-hub__battle-icon" aria-hidden>
                        ⚔
                      </span>
                      <span className="command-hub__battle-copy">
                        <span className="command-hub__battle-label">{action.label}</span>
                        {action.hint && (
                          <span className="command-hub__battle-foe">对手 · {action.hint}</span>
                        )}
                      </span>
                    </span>
                  ) : (
                    action.label
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
