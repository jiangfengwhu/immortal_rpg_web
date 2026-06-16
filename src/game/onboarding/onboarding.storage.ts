const ONBOARDING_DONE_KEY = 'unboxing_onboarding_done'

export function isOnboardingDone(playerId: string) {
  return localStorage.getItem(`${ONBOARDING_DONE_KEY}:${playerId}`) === '1'
}

export function markOnboardingDone(playerId: string) {
  localStorage.setItem(`${ONBOARDING_DONE_KEY}:${playerId}`, '1')
}
