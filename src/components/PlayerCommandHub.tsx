import { useBattleStore } from '../battle/battleStore'
import { useGameSessionStore } from '../game/gameSessionStore'
import { CHEST_TYPE_LABELS } from '../game/quest/quest.constants'
import { STORY_INTERACTION_LABELS } from '../game/quest/qingshi.locations'
import { useJourneyQuest } from '../game/quest/useJourneyQuest'
import { PLAYER_COPY } from '../game/ui/playerCopy'
import { sanitizePlayerErrorMessage } from '../game/ui/playerError'
import { resolveWorldMap } from '../game/world/resolveWorldMap'

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
  const isSaving = useGameSessionStore((state) => state.isSaving)
  const toggleJourneyModal = useGameSessionStore((state) => state.toggleJourneyModal)
  const toggleMapTravel = useGameSessionStore((state) => state.toggleMapTravel)
  const advanceJourney = useGameSessionStore((state) => state.advanceJourney)

  const {
    player,
    quest,
    storyActive,
    narratives,
    choices,
    interactions,
    busy,
    dismissNarratives,
    onInteraction,
    runEvent,
  } = useJourneyQuest()

  if (!playerState || !player || !quest) return null

  const canStart = unitsReady.player && unitsReady.enemy && !loadError
  const playerFacingLoadError = loadError ? sanitizePlayerErrorMessage(loadError) : null
  const opponent = lastOpponentName ?? PLAYER_COPY.opponentFallback
  const inPerformance = phase !== 'ready'
  const objectives = quest.objectives ?? []
  const mapChapter = resolveWorldMap(player.realm, player.stageIndex)
  const mapName = quest.mapName ?? mapChapter.name
  const mapPhase = quest.mapPhaseName ?? mapChapter.phaseName
  const canAdvance = player.stageCleared && !isSaving
  const chestLabel = quest.rewards?.chestType
    ? CHEST_TYPE_LABELS[quest.rewards.chestType] ?? quest.rewards.chestType
    : null
  const questGuide = onboardingStep === 1
  const battleGuide = onboardingStep === 2

  const showStoryFeed = storyActive && narratives.length > 0
  const showStoryChoices = storyActive && choices.length > 0
  const showStoryActions =
    storyActive && narratives.length === 0 && choices.length === 0 && interactions.length > 0

  return (
    <section className="command-hub" aria-label="仙途决策">
      {(playerFacingLoadError || errorMessage) && (
        <p className="command-hub__alert command-hub__alert--error">{playerFacingLoadError ?? errorMessage}</p>
      )}

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
        <div className="command-hub__section">
          <header
            className={`command-hub__quest${questGuide ? ' command-hub__quest--guide' : ''}`}
            data-onboarding-target="journey-quest"
          >
            <p className="command-hub__eyebrow">{mapPhase}</p>
            <h2 className="command-hub__title">{quest.title}</h2>
            <p className="command-hub__meta">
              {PLAYER_COPY.questMapPhase(mapPhase, mapName)} · {PLAYER_COPY.questStage(quest.stageIndex + 1)}
            </p>
            {objectives[0] && <p className="command-hub__objective">{objectives[0]}</p>}
          </header>

          {quest.summary && <p className="command-hub__summary">{quest.summary}</p>}

          {showStoryFeed && (
            <div className="command-hub__story">
              {narratives.map((beat) => (
                <p key={beat.id} className="command-hub__story-line">
                  {beat.speaker && <strong>{beat.speaker}：</strong>}
                  {beat.text}
                </p>
              ))}
              <button type="button" className="command-hub__btn command-hub__btn--soft" onClick={dismissNarratives}>
                {PLAYER_COPY.storyContinue}
              </button>
            </div>
          )}

          {showStoryChoices && (
            <div className="command-hub__choice-row" role="group" aria-label="剧情抉择">
              {choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className="command-hub__btn command-hub__btn--choice"
                  disabled={busy}
                  onClick={() =>
                    void runEvent({ playerId: player.id, type: 'make_choice', choiceId: choice.id })
                  }
                >
                  <span>{choice.label}</span>
                  {choice.hint && <small>{choice.hint}</small>}
                </button>
              ))}
            </div>
          )}

          {showStoryActions && (
            <div className="command-hub__action-row" role="group" aria-label="自由探索">
              {interactions.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="command-hub__btn command-hub__btn--explore"
                  disabled={busy}
                  onClick={() => onInteraction(key)}
                >
                  {STORY_INTERACTION_LABELS[key] ?? key}
                </button>
              ))}
            </div>
          )}

          {!showStoryFeed && !showStoryChoices && !showStoryActions && (
            <p className="command-hub__empty">四处走走推进剧情，或挑战关底敌手。</p>
          )}

          {objectives.length > 1 && (
            <ul className="command-hub__objectives">
              {objectives.slice(1).map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          )}

          <div className="command-hub__foe-card">
            <span className="command-hub__foe-label">关底敌手</span>
            <strong className="command-hub__foe-name">{opponent}</strong>
          </div>

          {phase === 'ready' && canStart && (
            <button
              type="button"
              className={`command-hub__btn command-hub__btn--battle${battleGuide ? ' command-hub__btn--guide' : ''}`}
              data-onboarding-target="battle-start"
              onClick={startBattle}
            >
              <span className="command-hub__battle-label">{PLAYER_COPY.battleStart}</span>
            </button>
          )}

          <div className="command-hub__utility-row" role="group" aria-label="旅途操作">
            <button type="button" className="command-hub__btn command-hub__btn--utility" onClick={toggleMapTravel}>
              {PLAYER_COPY.mapTravelOpen}
            </button>
            <button type="button" className="command-hub__btn command-hub__btn--utility" onClick={toggleJourneyModal}>
              {PLAYER_COPY.journeyOpenDetail}
            </button>
            <button
              type="button"
              className="command-hub__btn command-hub__btn--utility command-hub__btn--advance"
              disabled={!canAdvance}
              onClick={() => void advanceJourney()}
            >
              {PLAYER_COPY.mapTravelAdvance}
            </button>
          </div>

          <p className="command-hub__hint">
            {canAdvance ? PLAYER_COPY.mapTravelReady : PLAYER_COPY.mapTravelNeedBoss}
            {chestLabel ? ` · ${chestLabel}` : ''}
          </p>
        </div>
      </div>
    </section>
  )
}
