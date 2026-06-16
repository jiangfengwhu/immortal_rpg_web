import { useEffect } from 'react'

import { useGameSessionStore } from '../game/gameSessionStore'
import { ONBOARDING_COPY } from '../game/onboarding/onboarding.copy'
import { PLAYER_COPY } from '../game/ui/playerCopy'
import { resolveWorldMapImageUrl } from '../game/world/resolveWorldMap'

export function OnboardingOverlay() {
  const playerState = useGameSessionStore((state) => state.playerState)
  const onboardingStep = useGameSessionStore((state) => state.onboardingStep)
  const nextOnboardingStep = useGameSessionStore((state) => state.nextOnboardingStep)
  const finishOnboarding = useGameSessionStore((state) => state.finishOnboarding)
  const toggleMapTravel = useGameSessionStore((state) => state.toggleMapTravel)
  const mapTravelOpen = useGameSessionStore((state) => state.mapTravelOpen)

  const stageCleared = playerState?.player.stageCleared ?? false

  useEffect(() => {
    if (onboardingStep === null) {
      document.body.classList.remove('onboarding-active')
      document.body.removeAttribute('data-onboarding-step')
      return
    }
    document.body.classList.add('onboarding-active')
    document.body.dataset.onboardingStep = String(onboardingStep)
    return () => {
      document.body.classList.remove('onboarding-active')
      document.body.removeAttribute('data-onboarding-step')
    }
  }, [onboardingStep])

  useEffect(() => {
    if (onboardingStep !== 3 || !stageCleared) return
    if (!mapTravelOpen) toggleMapTravel()
  }, [mapTravelOpen, onboardingStep, stageCleared, toggleMapTravel])

  useEffect(() => {
    if (onboardingStep === 2 && stageCleared) {
      nextOnboardingStep()
    }
  }, [onboardingStep, nextOnboardingStep, stageCleared])

  if (onboardingStep === null || !playerState) return null

  const step = ONBOARDING_COPY.steps[onboardingStep]
  if (!step) return null

  const player = playerState.player
  const mapImage = resolveWorldMapImageUrl(player.realm, player.stageIndex)
  const isPrologue = onboardingStep === 0
  const isHighlightStep = onboardingStep >= 1

  return (
    <div className={`onboarding-overlay${isHighlightStep ? ' onboarding-overlay--spotlight' : ''}`}>
      {isPrologue && (
        <div className="onboarding-prologue">
          {mapImage && (
            <img className="onboarding-prologue__map" src={mapImage} alt="" aria-hidden />
          )}
          <div className="onboarding-prologue__veil" />
          <div className="onboarding-prologue__card">
            <p className="onboarding-prologue__eyebrow">{PLAYER_COPY.gameTitle}</p>
            <h2 className="onboarding-prologue__title">{step.title}</h2>
            <p className="onboarding-prologue__body">{step.body}</p>
            <div className="onboarding-prologue__actions">
              <button type="button" className="onboarding-prologue__skip" onClick={finishOnboarding}>
                {ONBOARDING_COPY.skip}
              </button>
              <button type="button" className="onboarding-prologue__next" onClick={nextOnboardingStep}>
                {ONBOARDING_COPY.begin}
              </button>
            </div>
          </div>
        </div>
      )}

      {isHighlightStep && (
        <div className="onboarding-guide">
          <div className="onboarding-guide__card">
            <h3 className="onboarding-guide__title">{step.title}</h3>
            <p className="onboarding-guide__body">{step.body}</p>
            <div className="onboarding-guide__actions">
              <button type="button" className="onboarding-guide__skip" onClick={finishOnboarding}>
                {ONBOARDING_COPY.skip}
              </button>
              {onboardingStep < 3 && (
                <button type="button" className="onboarding-guide__next" onClick={nextOnboardingStep}>
                  {ONBOARDING_COPY.next}
                </button>
              )}
              {onboardingStep === 3 && (
                <button type="button" className="onboarding-guide__next" onClick={finishOnboarding}>
                  {ONBOARDING_COPY.next}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
