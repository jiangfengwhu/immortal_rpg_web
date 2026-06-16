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
import { STORY_FEATURE_KEYS, STORY_ITEM_LABELS } from '../game/quest/story.constants'
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

  const playerState = useGameSessionStore((state) => state.playerState)
  const lastOpponentName = useGameSessionStore((state) => state.lastOpponentName)
  const lastBattleResult = useGameSessionStore((state) => state.lastBattleResult)
  const errorMessage = useGameSessionStore((state) => state.errorMessage)
  const onboardingStep = useGameSessionStore((state) => state.onboardingStep)
  const startAfkGather = useGameSessionStore((state) => state.startAfkGather)
  const stopAfkGather = useGameSessionStore((state) => state.stopAfkGather)

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
    prevPhaseRef.current = phase
  }, [phase, winner, pushStatus, settleStatus])

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
  const storyBattleReady = isStoryBattleReady(storyState)
  const storyItems = (storyState?.storyItems ?? []).map((id) => ({
    id,
    label: STORY_ITEM_LABELS[id] ?? id,
  }))
  const hasNoviceTitle = storyState?.unlockedFeatures?.includes(STORY_FEATURE_KEYS.titleNovice)

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
  })

  const handleAction = (action: CommandHubAction) => {
    switch (action.kind) {
      case 'story_choice':
        if (action.choiceId) {
          pushAction(`你选择了「${action.label}」。`)
          void runEvent({ playerId: player.id, type: 'make_choice', choiceId: action.choiceId })
        }
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
        startBattle()
        break
      case 'afk_claim': {
        const feature = action.afkFeature
        if (!feature) break
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
      {lastBattleResult?.won && phase === 'ready' && lastBattleResult.leveledUp && (
        <p className="command-hub__alert command-hub__alert--level">{PLAYER_COPY.levelUp}</p>
      )}

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
                onClick={startBattle}
              >
                {rewardSyncing ? PLAYER_COPY.battleSettling : PLAYER_COPY.battleAgain}
              </button>
            </>
          )}
        </div>
      )}

      <div className="command-hub__panel">
        <header
          className={`command-hub__status${questGuide ? ' command-hub__status--guide' : ''}`}
          data-onboarding-target="journey-quest"
        >
          {storyActive && <p className="command-hub__eyebrow">{mapPhase}</p>}
          <h2 className="command-hub__title">{quest.title}</h2>
          {mapName && <p className="command-hub__where">{mapName}</p>}

          {storyItems.length > 0 && (
            <ul className="command-hub__items" aria-label={PLAYER_COPY.storyItems}>
              {storyItems.map((item) => (
                <li key={item.id} className="command-hub__item">
                  {item.label}
                </li>
              ))}
            </ul>
          )}

          {hasNoviceTitle && (
            <p className="command-hub__title-badge">{PLAYER_COPY.titleNovice}</p>
          )}
        </header>

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
                    <>
                      <span className="command-hub__battle-label">{action.label}</span>
                      {action.hint && (
                        <>
                          <span className="command-hub__btn-sep" aria-hidden>
                            ·
                          </span>
                          <span className="command-hub__battle-foe">{action.hint}</span>
                        </>
                      )}
                    </>
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
